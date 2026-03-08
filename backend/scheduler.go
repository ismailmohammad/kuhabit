package main

import (
	"fmt"
	"log"
	"strings"
	"time"

	webpush "github.com/SherClockHolmes/webpush-go"
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
		db.Where("user_id = ?", h.UserID).Find(&subs)
		for _, sub := range subs {
			if err := sendPush(sub, "Habit Reminder", fmt.Sprintf("Time to: %s", h.Name)); err != nil {
				log.Printf("Push failed for sub %d: %v", sub.ID, err)
				// Remove subscriptions that are no longer valid (410 Gone)
				if isGoneError(err) {
					db.Delete(&sub)
				}
			}
		}
	}
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

func sendPush(sub PushSubscription, title, body string) error {
	vapidPublic := getEnv("VAPID_PUBLIC_KEY", "")
	vapidPrivate := getEnv("VAPID_PRIVATE_KEY", "")
	if vapidPublic == "" || vapidPrivate == "" {
		return nil // VAPID not configured, skip silently
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
		Subscriber:      getEnv("VAPID_EMAIL", ""),
		TTL:             60,
	})
	if resp != nil {
		resp.Body.Close()
	}
	return err
}

func isGoneError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "410") || strings.Contains(msg, "Gone")
}
