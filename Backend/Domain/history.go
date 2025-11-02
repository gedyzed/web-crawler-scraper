package domain

import (
	"time"

	"gorm.io/gorm"
)

type History struct {
	HID string `gorm:"unique"`
	UserID string
	URL string
	Status string
	ResponseCode int
	ErrorMessage string
	FetchedAt time.Time
	gorm.Model
    
}