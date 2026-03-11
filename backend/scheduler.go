package main

import (
	"crypto/elliptic"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/url"
	"strings"
	"sync"
	"time"

	webpush "github.com/SherClockHolmes/webpush-go"
)

var (
	vapidConfigOnce sync.Once
	vapidConfigErr  error
)

func startScheduler() {
	go runReminderLoop()
	go runNightlyFreezeLoop()
}

// runReminderLoop fires every minute (aligned to clock boundaries) and sends
// push notifications for habits whose reminder time matches the current UTC time.
func runReminderLoop() {
	for {
		now := time.Now().UTC()
		next := now.Truncate(time.Minute).Add(time.Minute)
		time.Sleep(time.Until(next))
		runReminderCheck(next.Truncate(time.Minute))
	}
}

func runReminderCheck(now time.Time) {
	currentTime := fmt.Sprintf("%02d:%02d", now.Hour(), now.Minute())
	todayKey := dayCode(now)
	today := now.Truncate(24 * time.Hour)

	var habits []Habit
	db.Where("reminder_time = ?", currentTime).Find(&habits)

	for _, h := range habits {
		if !containsDay(h.Recurrence, todayKey) {
			continue
		}
		if h.RecurrenceEnd != nil && now.After(*h.RecurrenceEnd) {
			continue
		}

		// Skip if already completed today
		var count int64
		db.Model(&HabitLog{}).
			Where("habit_id = ? AND log_date = ? AND was_frozen = false", h.ID, today).
			Count(&count)
		if count > 0 {
			continue
		}

		var subs []PushSubscription
		db.Where("user_id = ? AND enabled = true", h.UserID).Find(&subs)
		for _, sub := range subs {
			if _, err := sendPushAndRecord(sub, "Habit Reminder", fmt.Sprintf("Time to: %s", h.Name)); err != nil {
				log.Printf("Push failed for sub %d: %v", sub.ID, err)
			}
		}
	}
}

func sendPushAndRecord(sub PushSubscription, title, body string) (int, error) {
	statusCode, err := sendPush(sub, title, body)
	if err != nil {
		now := time.Now().UTC()
		db.Model(&PushSubscription{}).
			Where("id = ?", sub.ID).
			Updates(map[string]any{
				"last_failure_at":   &now,
				"last_failure_code": statusCode,
				"failure_count":     sub.FailureCount + 1,
			})
		// Remove subscriptions that are no longer valid (410 Gone)
		if isGoneError(err) {
			db.Delete(&sub)
		}
		return statusCode, err
	}

	now := time.Now().UTC()
	db.Model(&PushSubscription{}).
		Where("id = ?", sub.ID).
		Updates(map[string]any{
			"last_success_at":   &now,
			"last_failure_code": 0,
			"failure_count":     0,
		})
	return statusCode, nil
}

// runNightlyFreezeLoop fires once per day just after UTC midnight to auto-consume
// streak freezes for any habits that had a missed scheduled day yesterday.
func runNightlyFreezeLoop() {
	for {
		now := time.Now().UTC()
		// Next midnight UTC
		nextMidnight := now.Truncate(24 * time.Hour).Add(24 * time.Hour)
		time.Sleep(time.Until(nextMidnight))
		runNightlyFreezeCheck(nextMidnight)
	}
}

func runNightlyFreezeCheck(now time.Time) {
	yesterday := now.AddDate(0, 0, -1)
	yesterdayKey := dayCode(yesterday)

	var habits []Habit
	db.Find(&habits)

	for _, h := range habits {
		if !containsDay(h.Recurrence, yesterdayKey) {
			continue
		}
		if h.RecurrenceEnd != nil && yesterday.After(h.RecurrenceEnd.UTC().Truncate(24*time.Hour)) {
			continue
		}

		// Already logged yesterday (real or frozen)?
		var count int64
		db.Model(&HabitLog{}).
			Where("habit_id = ? AND log_date = ?", h.ID, yesterday).
			Count(&count)
		if count > 0 {
			continue
		}

		// Try to consume a freeze
		var freeze StreakFreeze
		if result := db.Where("user_id = ? AND count > 0", h.UserID).First(&freeze); result.Error != nil {
			continue
		}

		// Create a frozen log entry for yesterday
		db.Create(&HabitLog{HabitID: h.ID, UserID: h.UserID, LogDate: yesterday, WasFrozen: true})
		freeze.Count--
		db.Save(&freeze)
	}
}

func sendPush(sub PushSubscription, title, body string) (int, error) {
	vapidPublic := strings.TrimSpace(getEnv("VAPID_PUBLIC_KEY", ""))
	vapidPrivate := strings.TrimSpace(getEnv("VAPID_PRIVATE_KEY", ""))
	if vapidPublic == "" || vapidPrivate == "" {
		return 0, fmt.Errorf("VAPID keys missing: both VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required")
	}
	vapidConfigOnce.Do(func() {
		vapidConfigErr = validateVAPIDKeyPair(vapidPublic, vapidPrivate)
	})
	if vapidConfigErr != nil {
		return 0, vapidConfigErr
	}

	subscriber := strings.TrimSpace(getEnv("VAPID_EMAIL", ""))
	if subscriber == "" {
		subscriber = strings.TrimSpace(getEnv("FRONTEND_ORIGIN", ""))
	}
	if subscriber == "" || !(strings.HasPrefix(subscriber, "mailto:") || strings.HasPrefix(subscriber, "https://")) {
		return 0, fmt.Errorf("invalid VAPID subscriber; set VAPID_EMAIL to mailto:you@domain or https://your-domain")
	}
	// webpush-go adds "mailto:" itself for any subscriber that doesn't start with "https:".
	// Strip our prefix so we don't end up with "mailto:mailto:you@domain" in the JWT sub claim.
	subscriber = strings.TrimPrefix(subscriber, "mailto:")
	endpointHost := ""
	if u, err := url.Parse(sub.Endpoint); err == nil {
		endpointHost = u.Host
	}

	s := &webpush.Subscription{
		Endpoint: sub.Endpoint,
		Keys: webpush.Keys{
			P256dh: sub.P256DH,
			Auth:   sub.Auth,
		},
	}
	payload := fmt.Sprintf(`{"title":%q,"body":%q}`, title, body)
	resp, err := webpush.SendNotification([]byte(payload), s, &webpush.Options{
		VAPIDPublicKey:  vapidPublic,
		VAPIDPrivateKey: vapidPrivate,
		Subscriber:      subscriber,
		TTL:             21600, // 6h improves delivery when device is briefly offline/asleep
		Urgency:         webpush.UrgencyHigh,
	})
	statusCode := 0
	var responseBody string
	if resp != nil {
		statusCode = resp.StatusCode
		if resp.Body != nil {
			if b, readErr := io.ReadAll(resp.Body); readErr == nil && len(b) > 0 {
				responseBody = string(b)
			}
		}
		resp.Body.Close()
	}
	if err == nil && (statusCode < 200 || statusCode >= 300) {
		err = fmt.Errorf("push service returned non-2xx status: %d (endpoint_host=%s, subscriber=%s)", statusCode, endpointHost, subscriber)
		if responseBody != "" {
			err = fmt.Errorf("push service returned non-2xx status: %d (endpoint_host=%s, subscriber=%s) body=%s", statusCode, endpointHost, subscriber, responseBody)
		}
	}
	return statusCode, err
}

func validateVAPIDKeyPair(publicKey, privateKey string) error {
	pubRaw, err := decodeBase64URLNoPad(publicKey)
	if err != nil {
		return fmt.Errorf("invalid VAPID_PUBLIC_KEY encoding: %w", err)
	}
	privRaw, err := decodeBase64URLNoPad(privateKey)
	if err != nil {
		return fmt.Errorf("invalid VAPID_PRIVATE_KEY encoding: %w", err)
	}
	if len(privRaw) != 32 {
		return fmt.Errorf("invalid VAPID_PRIVATE_KEY length: got %d bytes, expected 32", len(privRaw))
	}
	curve := elliptic.P256()
	x, y := curve.ScalarBaseMult(privRaw)
	derivedPub := elliptic.Marshal(curve, x, y)
	if len(pubRaw) != len(derivedPub) {
		return fmt.Errorf("invalid VAPID_PUBLIC_KEY length: got %d bytes, expected %d", len(pubRaw), len(derivedPub))
	}
	if !equalBytes(pubRaw, derivedPub) {
		return fmt.Errorf("VAPID key mismatch: VAPID_PUBLIC_KEY does not match VAPID_PRIVATE_KEY")
	}
	return nil
}

func decodeBase64URLNoPad(in string) ([]byte, error) {
	s := strings.TrimSpace(in)
	if s == "" {
		return nil, fmt.Errorf("empty value")
	}
	s = strings.TrimRight(s, "=")
	return base64.RawURLEncoding.DecodeString(s)
}

func equalBytes(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func isGoneError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "410") || strings.Contains(msg, "Gone")
}
