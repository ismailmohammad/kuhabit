package main

import (
	"crypto/tls"
	"fmt"
	"html"
	"net"
	"net/smtp"
	"strings"
)

func appURL() string {
	u := strings.TrimRight(getEnv("APP_URL", ""), "/")
	if u != "" {
		return u
	}
	// Fall back to first origin in FRONTEND_ORIGIN
	origins := strings.Split(getEnv("FRONTEND_ORIGIN", ""), ",")
	return strings.TrimRight(strings.TrimSpace(origins[0]), "/")
}

func smtpConfigured() bool {
	return getEnv("SMTP_HOST", "") != "" &&
		getEnv("SMTP_USER", "") != "" &&
		getEnv("SMTP_PASS", "") != ""
}

func sendEmail(to, subject, htmlBody string) error {
	host := getEnv("SMTP_HOST", "")
	port := getEnv("SMTP_PORT", "587")
	user := getEnv("SMTP_USER", "")
	pass := getEnv("SMTP_PASS", "")
	from := getEnv("SMTP_FROM", "Stokely <"+user+">")
	if host == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)")
	}

	msg := "MIME-Version: 1.0\r\n" +
		"From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		htmlBody

	addr := net.JoinHostPort(host, port)
	auth := smtp.PlainAuth("", user, pass, host)

	if port == "465" {
		// Implicit TLS
		conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: host})
		if err != nil {
			return err
		}
		c, err := smtp.NewClient(conn, host)
		if err != nil {
			return err
		}
		defer c.Close()
		if err := c.Auth(auth); err != nil {
			return err
		}
		if err := c.Mail(user); err != nil {
			return err
		}
		if err := c.Rcpt(to); err != nil {
			return err
		}
		wc, err := c.Data()
		if err != nil {
			return err
		}
		if _, err = fmt.Fprint(wc, msg); err != nil {
			return err
		}
		return wc.Close()
	}

	// STARTTLS (port 587 / 25)
	return smtp.SendMail(addr, auth, user, []string{to}, []byte(msg))
}

// ── HTML Email Templates ───────────────────────────────────────────────────────

func emailWrapper(preheader, bodyContent string) string {
	base := appURL()
	logoURL := base + "/icon-192.png"
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Stokely</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<span style="display:none;max-height:0;overflow:hidden;color:#0f0f0f;">` + html.EscapeString(preheader) + `</span>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:48px 16px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;">

        <!-- Logo row -->
        <tr>
          <td align="center" style="padding-bottom:28px;">
            <img src="` + logoURL + `" alt="Stokely" width="72" height="72"
                 style="display:block;border-radius:18px;border:0;">
            <p style="margin:10px 0 0;font-size:1.15rem;font-weight:700;letter-spacing:-0.02em;color:#2dca8e;">Stokely</p>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:36px 32px;">
` + bodyContent + `
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-size:0.72rem;color:#444;line-height:1.6;">
              You received this email because an action was taken on your Stokely account.<br>
              If you didn't request this, you can safely ignore it.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

func verifyEmailHTML(username, verifyURL string) string {
	body := `
            <p style="margin:0 0 8px;font-size:1rem;font-weight:700;color:#f0f0f0;">Hey ` + html.EscapeString(username) + ` 👋</p>
            <p style="margin:0 0 24px;font-size:0.9rem;color:#999;line-height:1.6;">
              Kindling here! 🔥 Tap the button below to verify your email address and unlock
              account recovery in case you ever forget your password.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <a href="` + verifyURL + `"
                     style="display:inline-block;background:#2dca8e;color:#111;font-size:0.95rem;font-weight:700;
                            text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:-0.01em;">
                    Verify Email Address
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:0.78rem;color:#666;line-height:1.5;">
              This link expires in <strong style="color:#aaa;">24 hours</strong>.
              If the button doesn't work, paste this URL into your browser:
            </p>
            <p style="margin:0;font-size:0.72rem;word-break:break-all;">
              <a href="` + verifyURL + `" style="color:#2dca8e;text-decoration:none;">` + html.EscapeString(verifyURL) + `</a>
            </p>`

	return emailWrapper("Verify your Stokely email address — one click and you're set.", body)
}

func resetPasswordHTML(username, resetURL string) string {
	body := `
            <p style="margin:0 0 8px;font-size:1rem;font-weight:700;color:#f0f0f0;">Password reset for ` + html.EscapeString(username) + `</p>
            <p style="margin:0 0 24px;font-size:0.9rem;color:#999;line-height:1.6;">
              We received a request to reset your Stokely password. Click the button below to choose a new one.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <a href="` + resetURL + `"
                     style="display:inline-block;background:#2dca8e;color:#111;font-size:0.95rem;font-weight:700;
                            text-decoration:none;padding:13px 32px;border-radius:10px;letter-spacing:-0.01em;">
                    Reset My Password
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:0.78rem;color:#666;line-height:1.5;">
              This link expires in <strong style="color:#f0a66a;">10 minutes</strong>.
              If the button doesn't work, paste this URL into your browser:
            </p>
            <p style="margin:0 0 20px;font-size:0.72rem;word-break:break-all;">
              <a href="` + resetURL + `" style="color:#2dca8e;text-decoration:none;">` + html.EscapeString(resetURL) + `</a>
            </p>
            <p style="margin:0;font-size:0.78rem;color:#555;border-top:1px solid #2a2a2a;padding-top:16px;">
              If you didn't request a password reset, ignore this email — your password won't change.
            </p>`

	return emailWrapper("Reset your Stokely password — link expires in 10 minutes.", body)
}
