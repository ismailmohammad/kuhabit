package main

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
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

	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS pgcrypto").Error; err != nil {
		log.Fatal("Failed to ensure pgcrypto extension:", err)
	}

	migrateLegacyUserIDSchemaIfNeeded()

	db.AutoMigrate(&User{}, &Habit{}, &HabitLog{}, &PushSubscription{}, &StreakFreeze{})
	seedInitialStreakFreezes()

	router := gin.Default()

	allowedOrigins := []string{}
	for _, origin := range strings.Split(getEnv("FRONTEND_ORIGIN", ""), ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed == "" {
			continue
		}
		allowedOrigins = append(allowedOrigins, trimmed)
	}
	if len(allowedOrigins) == 0 {
		log.Fatal("FRONTEND_ORIGIN environment variable is required")
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
		Secure:   getEnv("COOKIE_SECURE", "") == "true",
		SameSite: http.SameSiteLaxMode,
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
			auth.POST("/welcome-seen", requireAuth, handleWelcomeSeen)
			auth.PUT("/daily-spark", requireAuth, handleDailySparkPreference)
		}

		habits := api.Group("/habits")
		habits.Use(requireAuth)
		{
			habits.GET("", getHabits)
			habits.GET("/achievements", getAchievements)
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

// seedInitialStreakFreezes ensures older accounts also start with 3 freezes.
func seedInitialStreakFreezes() {
	var users []User
	if err := db.Select("id").Find(&users).Error; err != nil {
		log.Printf("freeze seed skipped: failed to list users: %v", err)
		return
	}
	for _, user := range users {
		var freeze StreakFreeze
		err := db.Where("user_id = ?", user.ID).First(&freeze).Error
		if err == nil {
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("freeze seed skipped for user %s: %v", user.ID, err)
			continue
		}
		if createErr := db.Create(&StreakFreeze{UserID: user.ID, Count: 3}).Error; createErr != nil {
			log.Printf("freeze seed create failed for user %s: %v", user.ID, createErr)
		}
	}
}

func migrateLegacyUserIDSchemaIfNeeded() {
	if !db.Migrator().HasTable(&User{}) {
		return
	}

	isUUID, err := usersIDIsUUID()
	if err != nil {
		log.Fatal("Failed to inspect users.id column:", err)
	}
	if isUUID {
		return
	}

	log.Println("Detected legacy numeric users.id schema.")
	if hasAnyAppData() {
		log.Fatal("Cannot auto-migrate users.id to UUID because app tables contain data. Empty app tables first, then restart backend.")
	}

	log.Println("App tables are empty. Recreating schema for UUID user IDs.")
	if err := db.Migrator().DropTable(&HabitLog{}, &PushSubscription{}, &StreakFreeze{}, &Habit{}, &User{}); err != nil {
		log.Fatal("Failed to drop legacy tables:", err)
	}
}

func usersIDIsUUID() (bool, error) {
	type result struct {
		DataType string `gorm:"column:data_type"`
	}
	var r result
	err := db.Raw(`
		SELECT data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'users'
		  AND column_name = 'id'
		LIMIT 1
	`).Scan(&r).Error
	if err != nil {
		return false, err
	}
	return r.DataType == "uuid", nil
}

func hasAnyAppData() bool {
	tables := []string{"users", "habits", "habit_logs", "push_subscriptions", "streak_freezes"}
	for _, table := range tables {
		if !db.Migrator().HasTable(table) {
			continue
		}
		var count int64
		if err := db.Table(table).Count(&count).Error; err != nil {
			log.Fatalf("Failed to count rows in %s: %v", table, err)
		}
		if count > 0 {
			return true
		}
	}
	return false
}
