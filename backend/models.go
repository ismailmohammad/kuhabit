package main

import "time"

type User struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	CreatedAt         time.Time `json:"-"`
	Username          string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email             *string   `gorm:"type:varchar(255);uniqueIndex" json:"email,omitempty"`
	Password          string    `gorm:"type:varchar(255);not null" json:"-"`
	WelcomeSeen       bool      `gorm:"default:false" json:"-"`
	DailySparkEnabled bool      `gorm:"default:true" json:"-"`
}

type Habit struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time  `json:"createdAt"`
	UserID        uint       `gorm:"not null" json:"-"`
	Name          string     `gorm:"type:varchar(500);not null" json:"name"`
	Complete      bool       `json:"-"` // deprecated: completion now tracked via HabitLog
	Recurrence    string     `gorm:"type:varchar(100);not null" json:"recurrence"`
	PositiveType  bool       `json:"positiveType"`
	Icon          string     `gorm:"type:varchar(100);default:''" json:"icon"`
	RecurrenceEnd *time.Time `json:"recurrenceEnd,omitempty"`
	Notes         string     `gorm:"type:text;default:''" json:"notes"`
	ReminderTime  string     `gorm:"type:varchar(5);default:''" json:"reminderTime"`
}

// HabitResponse is returned by all habit API endpoints, including computed fields.
type HabitResponse struct {
	ID            uint       `json:"id"`
	CreatedAt     time.Time  `json:"createdAt"`
	Name          string     `json:"name"`
	Complete      bool       `json:"complete"`
	Recurrence    string     `json:"recurrence"`
	PositiveType  bool       `json:"positiveType"`
	Icon          string     `json:"icon"`
	RecurrenceEnd *time.Time `json:"recurrenceEnd,omitempty"`
	Notes         string     `json:"notes"`
	ReminderTime  string     `json:"reminderTime"`
	Streak        int        `json:"streak"`
	HasFreeze     bool       `json:"hasFreeze"`
}

// HabitLog records one completion of a habit on a specific calendar date.
// WasFrozen = true means a streak freeze was consumed for this day (not a real completion).
type HabitLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"-"`
	HabitID   uint      `gorm:"not null;uniqueIndex:idx_habit_log" json:"habitId"`
	UserID    uint      `gorm:"not null;index" json:"-"`
	LogDate   time.Time `gorm:"type:date;not null;uniqueIndex:idx_habit_log" json:"logDate"`
	WasFrozen bool      `gorm:"default:false" json:"wasFrozen"`
}

type PushSubscription struct {
	ID       uint   `gorm:"primaryKey" json:"-"`
	UserID   uint   `gorm:"not null;index" json:"-"`
	Endpoint string `gorm:"type:text;not null" json:"endpoint"`
	P256DH   string `gorm:"type:text;not null" json:"p256dh"`
	Auth     string `gorm:"type:text;not null" json:"auth"`
}

type StreakFreeze struct {
	ID     uint `gorm:"primaryKey" json:"-"`
	UserID uint `gorm:"not null;uniqueIndex" json:"-"`
	Count  int  `gorm:"default:0" json:"count"`
}
