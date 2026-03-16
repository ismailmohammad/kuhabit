package main

import (
	"crypto/elliptic"
	"encoding/base64"
	"testing"
	"time"
)

func TestDecodeBase64URLNoPad(t *testing.T) {
	t.Parallel()

	raw := []byte("hello-world")
	enc := base64.RawURLEncoding.EncodeToString(raw)

	got, err := decodeBase64URLNoPad(enc)
	if err != nil {
		t.Fatalf("decodeBase64URLNoPad returned error: %v", err)
	}
	if string(got) != string(raw) {
		t.Fatalf("decoded value mismatch: got %q, want %q", string(got), string(raw))
	}
}

func TestEqualBytes(t *testing.T) {
	t.Parallel()

	if !equalBytes([]byte{1, 2, 3}, []byte{1, 2, 3}) {
		t.Fatal("equalBytes should return true for equal values")
	}
	if equalBytes([]byte{1, 2, 3}, []byte{1, 2, 4}) {
		t.Fatal("equalBytes should return false for differing values")
	}
}

func TestIsGoneError(t *testing.T) {
	t.Parallel()

	if !isGoneError(assertErr("410 Gone")) {
		t.Fatal("isGoneError should match 410")
	}
	if !isGoneError(assertErr("subscription is Gone")) {
		t.Fatal("isGoneError should match Gone")
	}
	if isGoneError(assertErr("400 Bad Request")) {
		t.Fatal("isGoneError should not match non-gone errors")
	}
}

func TestValidateVAPIDKeyPair(t *testing.T) {
	t.Parallel()

	priv := make([]byte, 32)
	priv[31] = 1

	curve := elliptic.P256()
	x, y := curve.ScalarBaseMult(priv)
	pub := elliptic.Marshal(curve, x, y)

	pubB64 := base64.RawURLEncoding.EncodeToString(pub)
	privB64 := base64.RawURLEncoding.EncodeToString(priv)

	if err := validateVAPIDKeyPair(pubB64, privB64); err != nil {
		t.Fatalf("validateVAPIDKeyPair returned unexpected error: %v", err)
	}

	// Tamper the public key so mismatch path is exercised.
	badPub := make([]byte, len(pub))
	copy(badPub, pub)
	badPub[len(badPub)-1] ^= 0x01
	if err := validateVAPIDKeyPair(base64.RawURLEncoding.EncodeToString(badPub), privB64); err == nil {
		t.Fatal("validateVAPIDKeyPair should fail for mismatched public key")
	}
}

func TestReminderBody(t *testing.T) {
	t.Parallel()

	if got := reminderBody(true, "Drink Water"); got != "Time for your Habit Check-In" {
		t.Fatalf("reminderBody for e2ee user = %q, want generic copy", got)
	}
	if got := reminderBody(false, "Drink Water"); got != "Drink Water" {
		t.Fatalf("reminderBody for non-e2ee user = %q, want habit name", got)
	}
	if got := reminderBody(false, "e2ee:v1:abcdef"); got != "your habit" {
		t.Fatalf("reminderBody for encrypted habit name = %q, want fallback", got)
	}
}

func TestReminderDueNowLegacyUTC(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 3, 13, 14, 30, 0, 0, time.UTC)
	h := Habit{ID: 1, ReminderTime: "14:30", ReminderTZ: ""}
	due, dayKey, logDate, _ := reminderDueNow(h, now)
	if !due {
		t.Fatal("expected reminder to be due")
	}
	if dayKey != "Fr" {
		t.Fatalf("dayKey = %q, want %q", dayKey, "Fr")
	}
	if got := logDate.Format("2006-01-02"); got != "2026-03-13" {
		t.Fatalf("logDate = %q, want %q", got, "2026-03-13")
	}
}

func TestReminderDueNowTimezoneAware(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 3, 13, 14, 30, 0, 0, time.UTC)
	loc, err := time.LoadLocation("America/Toronto")
	if err != nil {
		t.Fatalf("failed to load timezone: %v", err)
	}
	localMatch := now.In(loc).Format("15:04")
	h := Habit{ID: 2, ReminderTime: localMatch, ReminderTZ: "America/Toronto"}
	due, dayKey, logDate, localNow := reminderDueNow(h, now)
	if !due {
		t.Fatal("expected timezone reminder to be due")
	}
	if dayKey == "" {
		t.Fatal("expected non-empty day key")
	}
	if logDate.IsZero() {
		t.Fatal("expected non-zero logDate")
	}
	if localNow.Location().String() != "America/Toronto" {
		t.Fatalf("localNow location = %q, want America/Toronto", localNow.Location().String())
	}
}

func TestReminderDueNowTimezoneMissingMatch(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 3, 13, 14, 30, 0, 0, time.UTC)
	loc, err := time.LoadLocation("America/Toronto")
	if err != nil {
		t.Fatalf("failed to load timezone: %v", err)
	}
	nonMatch := now.In(loc).Add(time.Hour).Format("15:04")
	h := Habit{ID: 3, ReminderTime: nonMatch, ReminderTZ: "America/Toronto"}
	due, _, _, _ := reminderDueNow(h, now)
	if due {
		t.Fatal("expected reminder not to be due")
	}
}

func TestReminderDueNowTimezoneUsesLocalDayKey(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 3, 16, 0, 30, 0, 0, time.UTC) // Sunday evening in Toronto.
	loc, err := time.LoadLocation("America/Toronto")
	if err != nil {
		t.Fatalf("failed to load timezone: %v", err)
	}
	h := Habit{
		ID:           4,
		ReminderTime: now.In(loc).Format("15:04"),
		ReminderTZ:   "America/Toronto",
	}
	due, dayKey, logDate, _ := reminderDueNow(h, now)
	if !due {
		t.Fatal("expected reminder to be due")
	}
	if dayKey != "Su" {
		t.Fatalf("dayKey = %q, want %q", dayKey, "Su")
	}
	if got := logDate.Format("2006-01-02"); got != "2026-03-15" {
		t.Fatalf("logDate = %q, want %q", got, "2026-03-15")
	}
}

func TestFreezeDueNowTimezoneMidnight(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 3, 16, 4, 0, 0, 0, time.UTC) // 00:00 in America/Toronto.
	h := Habit{ID: 1, ReminderTZ: "America/Toronto"}
	due, dayKey, logDate := freezeDueNow(h, now)
	if !due {
		t.Fatal("expected freeze check to run at local midnight")
	}
	if dayKey != "Su" {
		t.Fatalf("dayKey = %q, want %q", dayKey, "Su")
	}
	if got := logDate.Format("2006-01-02"); got != "2026-03-15" {
		t.Fatalf("logDate = %q, want %q", got, "2026-03-15")
	}
}

func TestFreezeDueNowTimezoneNotMidnight(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 3, 16, 4, 1, 0, 0, time.UTC) // 00:01 in America/Toronto.
	h := Habit{ID: 1, ReminderTZ: "America/Toronto"}
	due, _, _ := freezeDueNow(h, now)
	if due {
		t.Fatal("expected freeze check not to run outside local midnight minute")
	}
}

func TestFreezeDueNowLegacyUTC(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 3, 16, 0, 0, 0, 0, time.UTC)
	h := Habit{ID: 1, ReminderTZ: ""}
	due, dayKey, logDate := freezeDueNow(h, now)
	if !due {
		t.Fatal("expected legacy UTC freeze check at UTC midnight")
	}
	if dayKey != "Su" {
		t.Fatalf("dayKey = %q, want %q", dayKey, "Su")
	}
	if got := logDate.Format("2006-01-02"); got != "2026-03-15" {
		t.Fatalf("logDate = %q, want %q", got, "2026-03-15")
	}
}

type assertErr string

func (e assertErr) Error() string { return string(e) }
