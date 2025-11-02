package domain

import (
	"time"

	"gorm.io/gorm"
)

type Jobs struct {
	JID string `gorm:"unique"`
	Priority int
	ScheduledAt time.Time
	Status string
	UserID string
	gorm.Model
}