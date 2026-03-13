package main

import (
	"net/http"
	"strings"
	"testing"
)

func TestSanitizeDSNEncodesPassword(t *testing.T) {
	t.Parallel()

	in := "postgresql://user:p[a]ss@db.example.com:5432/postgres?sslmode=require"
	out := sanitizeDSN(in)

	if !strings.Contains(out, "p%5Ba%5Dss") {
		t.Fatalf("sanitizeDSN did not encode password as expected: %s", out)
	}
	if !strings.Contains(out, "@db.example.com:5432/postgres?sslmode=require") {
		t.Fatalf("sanitizeDSN changed host/query unexpectedly: %s", out)
	}
}

func TestSanitizeDSNNoURISchemeUnchanged(t *testing.T) {
	t.Parallel()

	in := "host=localhost user=postgres password=secret dbname=app"
	out := sanitizeDSN(in)
	if out != in {
		t.Fatalf("sanitizeDSN should leave key=value DSN unchanged, got: %s", out)
	}
}

func TestParseSameSite(t *testing.T) {
	t.Parallel()

	cases := []struct {
		in   string
		want http.SameSite
	}{
		{in: "strict", want: http.SameSiteStrictMode},
		{in: "none", want: http.SameSiteNoneMode},
		{in: "lax", want: http.SameSiteLaxMode},
		{in: "unexpected", want: http.SameSiteLaxMode},
	}

	for _, tc := range cases {
		if got := parseSameSite(tc.in); got != tc.want {
			t.Fatalf("parseSameSite(%q) = %v, want %v", tc.in, got, tc.want)
		}
	}
}
