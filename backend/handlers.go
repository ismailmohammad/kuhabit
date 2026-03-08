package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

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

	// Normalize email: treat empty string as no email
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
		// Surface the most helpful error message
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

// requireAuth validates the session and sets "user" in the context.
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
	var habits []Habit
	db.Where("user_id = ?", user.ID).Order("created_at asc").Find(&habits)
	if habits == nil {
		habits = []Habit{}
	}
	c.JSON(http.StatusOK, habits)
}

func createHabit(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		Name         string `json:"name" binding:"required"`
		Recurrence   string `json:"recurrence" binding:"required"`
		PositiveType bool   `json:"positiveType"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	habit := Habit{
		UserID:       user.ID,
		Name:         input.Name,
		Recurrence:   input.Recurrence,
		PositiveType: input.PositiveType,
		Complete:     false,
	}
	db.Create(&habit)
	c.JSON(http.StatusCreated, habit)
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
		Name         *string `json:"name"`
		Complete     *bool   `json:"complete"`
		Recurrence   *string `json:"recurrence"`
		PositiveType *bool   `json:"positiveType"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Name != nil {
		habit.Name = *input.Name
	}
	if input.Complete != nil {
		habit.Complete = *input.Complete
	}
	if input.Recurrence != nil {
		habit.Recurrence = *input.Recurrence
	}
	if input.PositiveType != nil {
		habit.PositiveType = *input.PositiveType
	}

	db.Save(&habit)
	c.JSON(http.StatusOK, habit)
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

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
