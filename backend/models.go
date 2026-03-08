package main

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"-"`
	Username  string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email     *string   `gorm:"type:varchar(255);uniqueIndex" json:"email,omitempty"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"`
}

type Habit struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time `json:"createdAt"`
	UserID       uint      `gorm:"not null" json:"-"`
	Name         string    `gorm:"type:varchar(500);not null" json:"name"`
	Complete     bool      `json:"complete"`
	Recurrence   string    `gorm:"type:varchar(100);not null" json:"recurrence"`
	PositiveType bool      `json:"positiveType"`
}
