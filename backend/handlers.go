package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// ── Helpers ───────────────────────────────────────────────────────────────────

func dayCode(t time.Time) string {
	switch t.UTC().Weekday() {
	case time.Sunday:
		return "Su"
	case time.Monday:
		return "Mo"
	case time.Tuesday:
		return "Tu"
	case time.Wednesday:
		return "We"
	case time.Thursday:
		return "Th"
	case time.Friday:
		return "Fr"
	case time.Saturday:
		return "Sa"
	default:
		return ""
	}
}

func containsDay(recurrence, dayKey string) bool {
	for _, p := range strings.Split(recurrence, "-") {
		if p == dayKey {
			return true
		}
	}
	return false
}

func parseDateOrToday(dateStr string) (time.Time, error) {
	if dateStr == "" {
		return time.Now().UTC().Truncate(24 * time.Hour), nil
	}
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return time.Time{}, err
	}
	return t.UTC(), nil
}

// computeStreak counts consecutive completed (or frozen) scheduled days, ending at referenceDate.
// If today is a scheduled day but not yet logged, it is skipped without breaking the streak.
func computeStreak(habit Habit, userID uint, referenceDate time.Time) (streak int, hasFreeze bool) {
	var freeze StreakFreeze
	db.Where("user_id = ?", userID).First(&freeze)
	hasFreeze = freeze.Count > 0

	today := referenceDate.UTC().Truncate(24 * time.Hour)
	windowStart := today.AddDate(0, 0, -90)

	var logs []HabitLog
	db.Where("habit_id = ? AND log_date >= ?", habit.ID, windowStart).Find(&logs)

	loggedDates := map[string]bool{}
	for _, l := range logs {
		loggedDates[l.LogDate.UTC().Truncate(24*time.Hour).Format("2006-01-02")] = true
	}

	streak = 0
	for d := today; !d.Before(windowStart); d = d.AddDate(0, 0, -1) {
		if !containsDay(habit.Recurrence, dayCode(d)) {
			continue
		}
		if habit.RecurrenceEnd != nil && d.After(habit.RecurrenceEnd.UTC().Truncate(24*time.Hour)) {
			continue
		}
		dateStr := d.Format("2006-01-02")
		if loggedDates[dateStr] {
			streak++
		} else if d.Equal(today) {
			// Today not yet completed — skip without breaking streak
			continue
		} else {
			break
		}
	}
	return streak, hasFreeze
}

func habitToResponse(h Habit, complete bool, streak int, hasFreeze bool) HabitResponse {
	return HabitResponse{
		ID:            h.ID,
		CreatedAt:     h.CreatedAt,
		Name:          h.Name,
		Complete:      complete,
		Recurrence:    h.Recurrence,
		PositiveType:  h.PositiveType,
		Icon:          h.Icon,
		RecurrenceEnd: h.RecurrenceEnd,
		Notes:         h.Notes,
		ReminderTime:  h.ReminderTime,
		Streak:        streak,
		HasFreeze:     hasFreeze,
	}
}

// awardFreezeIfMilestone grants the user one streak freeze at every 7-day streak milestone.
func awardFreezeIfMilestone(userID uint, habit Habit, logDate time.Time) {
	streak, _ := computeStreak(habit, userID, logDate)
	if streak > 0 && streak%7 == 0 {
		var freeze StreakFreeze
		db.Where(StreakFreeze{UserID: userID}).FirstOrCreate(&freeze)
		freeze.Count++
		db.Save(&freeze)
	}
}

// todayComplete checks whether a non-frozen HabitLog exists for today.
func todayComplete(habitID, userID uint) bool {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	var count int64
	db.Model(&HabitLog{}).
		Where("habit_id = ? AND user_id = ? AND log_date = ? AND was_frozen = false", habitID, userID, today).
		Count(&count)
	return count > 0
}

// ── Auth ──────────────────────────────────────────────────────────────────────

func handleRegister(c *gin.Context) {
	var input struct {
		Username string  `json:"username" binding:"required,min=3,max=50"`
		Password string  `json:"password" binding:"required,min=8"`
		Email    *string `json:"email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Email != nil && strings.TrimSpace(*input.Email) == "" {
		input.Email = nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	user := User{Username: input.Username, Email: input.Email, Password: string(hash)}
	if result := db.Create(&user); result.Error != nil {
		errMsg := result.Error.Error()
		if strings.Contains(errMsg, "username") || strings.Contains(errMsg, "unique") {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
		} else if strings.Contains(errMsg, "email") {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already in use"})
		} else {
			c.JSON(http.StatusConflict, gin.H{"error": "Registration failed"})
		}
		return
	}

	session := sessions.Default(c)
	session.Set("userID", fmt.Sprintf("%d", user.ID))
	session.Save()

	c.JSON(http.StatusCreated, gin.H{"id": user.ID, "username": user.Username, "email": user.Email})
}

func handleLogin(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	if result := db.Where("username = ?", input.Username).First(&user); result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	session := sessions.Default(c)
	session.Set("userID", fmt.Sprintf("%d", user.ID))
	session.Save()

	c.JSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username, "email": user.Email})
}

func handleLogout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	session.Save()
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func handleMe(c *gin.Context) {
	user := c.MustGet("user").(User)
	c.JSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username, "email": user.Email})
}

func requireAuth(c *gin.Context) {
	session := sessions.Default(c)
	raw := session.Get("userID")
	if raw == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		c.Abort()
		return
	}

	id, err := strconv.ParseUint(raw.(string), 10, 64)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		c.Abort()
		return
	}

	var user User
	if result := db.First(&user, id); result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		c.Abort()
		return
	}

	c.Set("user", user)
	c.Next()
}

// ── Habits ────────────────────────────────────────────────────────────────────

func getHabits(c *gin.Context) {
	user := c.MustGet("user").(User)

	dateStr := c.Query("date")
	targetDate, err := parseDateOrToday(dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	view := c.Query("view")
	if view == "" {
		view = "daily"
	}

	var habits []Habit
	db.Where("user_id = ?", user.ID).Order("created_at asc").Find(&habits)

	// Load all non-frozen logs for this user on targetDate in one query
	var logs []HabitLog
	db.Where("user_id = ? AND log_date = ? AND was_frozen = false", user.ID, targetDate).Find(&logs)
	completedIDs := map[uint]bool{}
	for _, l := range logs {
		completedIDs[l.HabitID] = true
	}

	todayKey := dayCode(targetDate)

	result := make([]HabitResponse, 0, len(habits))
	for _, h := range habits {
		if view == "daily" || view == "calendar" {
			if !containsDay(h.Recurrence, todayKey) {
				continue
			}
			if h.RecurrenceEnd != nil && targetDate.After(h.RecurrenceEnd.UTC().Truncate(24*time.Hour)) {
				continue
			}
		}
		streak, hasFreeze := computeStreak(h, user.ID, targetDate)
		result = append(result, habitToResponse(h, completedIDs[h.ID], streak, hasFreeze))
	}

	c.JSON(http.StatusOK, result)
}

func createHabit(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		Name          string     `json:"name" binding:"required"`
		Recurrence    string     `json:"recurrence" binding:"required"`
		PositiveType  bool       `json:"positiveType"`
		Icon          string     `json:"icon"`
		RecurrenceEnd *time.Time `json:"recurrenceEnd"`
		Notes         string     `json:"notes"`
		ReminderTime  string     `json:"reminderTime"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	habit := Habit{
		UserID:        user.ID,
		Name:          input.Name,
		Recurrence:    input.Recurrence,
		PositiveType:  input.PositiveType,
		Icon:          input.Icon,
		RecurrenceEnd: input.RecurrenceEnd,
		Notes:         input.Notes,
		ReminderTime:  input.ReminderTime,
	}
	db.Create(&habit)
	c.JSON(http.StatusCreated, habitToResponse(habit, false, 0, false))
}

func updateHabit(c *gin.Context) {
	user := c.MustGet("user").(User)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var habit Habit
	if result := db.Where("id = ? AND user_id = ?", id, user.ID).First(&habit); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	var input struct {
		Name          *string    `json:"name"`
		Complete      *bool      `json:"complete"` // kept for backward compat; syncs HabitLog
		Recurrence    *string    `json:"recurrence"`
		PositiveType  *bool      `json:"positiveType"`
		Icon          *string    `json:"icon"`
		RecurrenceEnd *time.Time `json:"recurrenceEnd"`
		Notes         *string    `json:"notes"`
		ReminderTime  *string    `json:"reminderTime"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != nil {
		habit.Name = *input.Name
	}
	if input.Recurrence != nil {
		habit.Recurrence = *input.Recurrence
	}
	if input.PositiveType != nil {
		habit.PositiveType = *input.PositiveType
	}
	if input.Icon != nil {
		habit.Icon = *input.Icon
	}
	if input.RecurrenceEnd != nil {
		habit.RecurrenceEnd = input.RecurrenceEnd
	}
	if input.Notes != nil {
		habit.Notes = *input.Notes
	}
	if input.ReminderTime != nil {
		habit.ReminderTime = *input.ReminderTime
	}

	// Backward compat: sync HabitLog when complete flag is toggled
	if input.Complete != nil {
		today := time.Now().UTC().Truncate(24 * time.Hour)
		if *input.Complete {
			logEntry := HabitLog{HabitID: habit.ID, UserID: user.ID, LogDate: today}
			db.Where(HabitLog{HabitID: habit.ID, UserID: user.ID, LogDate: today}).FirstOrCreate(&logEntry)
			awardFreezeIfMilestone(user.ID, habit, today)
		} else {
			db.Where("habit_id = ? AND user_id = ? AND log_date = ? AND was_frozen = false",
				habit.ID, user.ID, today).Delete(&HabitLog{})
		}
	}

	db.Save(&habit)

	complete := todayComplete(habit.ID, user.ID)
	today := time.Now().UTC().Truncate(24 * time.Hour)
	streak, hasFreeze := computeStreak(habit, user.ID, today)
	c.JSON(http.StatusOK, habitToResponse(habit, complete, streak, hasFreeze))
}

func deleteHabit(c *gin.Context) {
	user := c.MustGet("user").(User)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	result := db.Where("id = ? AND user_id = ?", id, user.ID).Delete(&Habit{})
	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	// Clean up associated logs
	db.Where("habit_id = ?", id).Delete(&HabitLog{})

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// ── HabitLog (toggle completion by date) ──────────────────────────────────────

func createHabitLog(c *gin.Context) {
	user := c.MustGet("user").(User)
	habitID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var habit Habit
	if result := db.Where("id = ? AND user_id = ?", habitID, user.ID).First(&habit); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	var input struct {
		Date string `json:"date"`
	}
	c.ShouldBindJSON(&input)

	logDate, err := parseDateOrToday(input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	logEntry := HabitLog{HabitID: habit.ID, UserID: user.ID, LogDate: logDate}
	if result := db.Create(&logEntry); result.Error != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already logged for this date"})
		return
	}

	awardFreezeIfMilestone(user.ID, habit, logDate)
	c.JSON(http.StatusCreated, gin.H{"message": "Logged"})
}

func deleteHabitLog(c *gin.Context) {
	user := c.MustGet("user").(User)
	habitID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var habit Habit
	if result := db.Where("id = ? AND user_id = ?", habitID, user.ID).First(&habit); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	var input struct {
		Date string `json:"date"`
	}
	c.ShouldBindJSON(&input)

	logDate, err := parseDateOrToday(input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	db.Where("habit_id = ? AND user_id = ? AND log_date = ? AND was_frozen = false",
		habitID, user.ID, logDate).Delete(&HabitLog{})
	c.JSON(http.StatusOK, gin.H{"message": "Unlogged"})
}

// ── Streak ────────────────────────────────────────────────────────────────────

type DayStatus struct {
	Date      string `json:"date"`
	Scheduled bool   `json:"scheduled"`
	Completed bool   `json:"completed"`
	Frozen    bool   `json:"frozen"`
}

type StreakDetail struct {
	CurrentStreak int         `json:"currentStreak"`
	LongestStreak int         `json:"longestStreak"`
	FreezeCount   int         `json:"freezeCount"`
	History       []DayStatus `json:"history"`
}

func getHabitStreak(c *gin.Context) {
	user := c.MustGet("user").(User)
	habitID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var habit Habit
	if result := db.Where("id = ? AND user_id = ?", habitID, user.ID).First(&habit); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
		return
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	windowStart := today.AddDate(0, 0, -29) // 30 days

	var logs []HabitLog
	db.Where("habit_id = ? AND log_date >= ?", habit.ID, windowStart).Find(&logs)

	logMap := map[string]HabitLog{}
	for _, l := range logs {
		logMap[l.LogDate.UTC().Truncate(24*time.Hour).Format("2006-01-02")] = l
	}

	history := make([]DayStatus, 0, 30)
	for d := windowStart; !d.After(today); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		scheduled := containsDay(habit.Recurrence, dayCode(d))
		if habit.RecurrenceEnd != nil && d.After(habit.RecurrenceEnd.UTC().Truncate(24*time.Hour)) {
			scheduled = false
		}
		l, logged := logMap[dateStr]
		history = append(history, DayStatus{
			Date:      dateStr,
			Scheduled: scheduled,
			Completed: logged && !l.WasFrozen,
			Frozen:    logged && l.WasFrozen,
		})
	}

	currentStreak, _ := computeStreak(habit, user.ID, today)

	longestStreak, running := 0, 0
	for _, day := range history {
		if day.Scheduled && (day.Completed || day.Frozen) {
			running++
			if running > longestStreak {
				longestStreak = running
			}
		} else if day.Scheduled {
			running = 0
		}
	}

	var freeze StreakFreeze
	db.Where("user_id = ?", user.ID).First(&freeze)

	c.JSON(http.StatusOK, StreakDetail{
		CurrentStreak: currentStreak,
		LongestStreak: longestStreak,
		FreezeCount:   freeze.Count,
		History:       history,
	})
}

// ── User Settings ─────────────────────────────────────────────────────────────

func handleChangePassword(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}
	db.Model(&user).UpdateColumn("password", string(hash))
	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}

func handleExportData(c *gin.Context) {
	user := c.MustGet("user").(User)
	var habits []Habit
	db.Where("user_id = ?", user.ID).Find(&habits)
	var logs []HabitLog
	db.Where("user_id = ?", user.ID).Find(&logs)
	c.JSON(http.StatusOK, gin.H{
		"user":   gin.H{"id": user.ID, "username": user.Username, "email": user.Email},
		"habits": habits,
		"logs":   logs,
	})
}

func handleDeleteAccount(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect password"})
		return
	}

	db.Where("user_id = ?", user.ID).Delete(&HabitLog{})
	db.Where("user_id = ?", user.ID).Delete(&PushSubscription{})
	db.Where("user_id = ?", user.ID).Delete(&StreakFreeze{})
	db.Where("user_id = ?", user.ID).Delete(&Habit{})
	db.Delete(&user)

	session := sessions.Default(c)
	session.Clear()
	session.Save()

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted"})
}

// ── Push Notifications ────────────────────────────────────────────────────────

func handleVapidPublic(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"publicKey": getEnv("VAPID_PUBLIC_KEY", "")})
}

func handlePushSubscribe(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		Endpoint string `json:"endpoint" binding:"required"`
		P256DH   string `json:"p256dh" binding:"required"`
		Auth     string `json:"auth" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sub := PushSubscription{UserID: user.ID, Endpoint: input.Endpoint, P256DH: input.P256DH, Auth: input.Auth}
	db.Where(PushSubscription{UserID: user.ID, Endpoint: input.Endpoint}).FirstOrCreate(&sub)
	c.JSON(http.StatusCreated, gin.H{"message": "Subscribed"})
}

func handlePushUnsubscribe(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		Endpoint string `json:"endpoint"`
	}
	c.ShouldBindJSON(&input)
	db.Where("user_id = ? AND endpoint = ?", user.ID, input.Endpoint).Delete(&PushSubscription{})
	c.JSON(http.StatusOK, gin.H{"message": "Unsubscribed"})
}
