package main

import (
	"crypto/elliptic"
	"encoding/base64"
	"testing"
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

type assertErr string

func (e assertErr) Error() string { return string(e) }
