package main

import (
	"context"
	"log"
	"net"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	gormpg "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func main() {
	var err error

	dsn := getEnv("DB_DSN", "")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is required")
	}

	pgxCfg, err := pgx.ParseConfig(sanitizeDSN(dsn))
	if err != nil {
		log.Fatal("Failed to parse DB_DSN:", err)
	}
	// Force IPv4 — avoids unreachable IPv6 routes in Docker/WSL2 environments.
	// Both LookupFunc and DialFunc must be overridden: pgx resolves the hostname
	// before calling DialFunc, so we filter AAAA records at the lookup stage.
	pgxCfg.LookupFunc = func(ctx context.Context, host string) ([]string, error) {
		addrs, err := net.DefaultResolver.LookupHost(ctx, host)
		if err != nil {
			return nil, err
		}
		var ipv4 []string
		for _, addr := range addrs {
			if ip := net.ParseIP(addr); ip != nil && ip.To4() != nil {
				ipv4 = append(ipv4, addr)
			}
		}
		if len(ipv4) > 0 {
			return ipv4, nil
		}
		return addrs, nil // fallback if no IPv4 found
	}
	pgxCfg.DialFunc = func(ctx context.Context, network, addr string) (net.Conn, error) {
		return (&net.Dialer{Timeout: 10 * time.Second}).DialContext(ctx, "tcp4", addr)
	}
	sqlDB := stdlib.OpenDB(*pgxCfg)

	db, err = gorm.Open(gormpg.New(gormpg.Config{Conn: sqlDB}), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	db.AutoMigrate(&User{}, &Habit{}, &HabitLog{}, &PushSubscription{}, &StreakFreeze{})

	router := gin.Default()

	allowedOrigins := []string{
		getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
		"http://localhost:80",
		"http://localhost",
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	secret := getEnv("SESSION_SECRET", "")
	if secret == "" {
		log.Fatal("SESSION_SECRET environment variable is required")
	}
	store := cookie.NewStore([]byte(secret))
	store.Options(sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
	})
	router.Use(sessions.Sessions("stokely-session", store))

	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", handleRegister)
			auth.POST("/login", handleLogin)
			auth.POST("/logout", handleLogout)
			auth.GET("/me", requireAuth, handleMe)
			auth.PUT("/password", requireAuth, handleChangePassword)
		}

		habits := api.Group("/habits")
		habits.Use(requireAuth)
		{
			habits.GET("", getHabits)
			habits.POST("", createHabit)
			habits.PUT("/:id", updateHabit)
			habits.DELETE("/:id", deleteHabit)
			habits.POST("/:id/log", createHabitLog)
			habits.DELETE("/:id/log", deleteHabitLog)
			habits.GET("/:id/streak", getHabitStreak)
		}

		user := api.Group("/user")
		user.Use(requireAuth)
		{
			user.GET("/export", handleExportData)
			user.DELETE("/account", handleDeleteAccount)
		}

		push := api.Group("/push")
		{
			push.GET("/vapid-public", handleVapidPublic)
			push.POST("/subscribe", requireAuth, handlePushSubscribe)
			push.DELETE("/unsubscribe", requireAuth, handlePushUnsubscribe)
		}
	}

	startScheduler()

	port := getEnv("PORT", "9090")
	log.Printf("Starting server on :%s", port)
	router.Run(":" + port)
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// sanitizeDSN percent-encodes the password in a postgresql:// URI so that
// special characters (e.g. [ ] from Supabase-generated passwords) are valid.
// Key=value format DSNs are returned unchanged.
func sanitizeDSN(dsn string) string {
	schemeEnd := strings.Index(dsn, "://")
	if schemeEnd == -1 {
		return dsn // key=value format — no encoding needed
	}
	scheme := dsn[:schemeEnd+3]
	rest := dsn[schemeEnd+3:]

	atIdx := strings.LastIndex(rest, "@")
	if atIdx == -1 {
		return dsn
	}
	userinfo := rest[:atIdx]
	hostPart := rest[atIdx:] // includes the leading @

	colonIdx := strings.Index(userinfo, ":")
	if colonIdx == -1 {
		return dsn
	}
	user := userinfo[:colonIdx]
	password := userinfo[colonIdx+1:]

	return scheme + user + ":" + url.PathEscape(password) + hostPart
}
