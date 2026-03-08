package domain

import (
	"time"

	"gorm.io/gorm"
)

// Session holds access token and expiry. Not persisted to DB - used as DTO throughout the program.
type Session struct {
	Token     string
	ExpiresAt time.Time
}

type RefreshToken struct {
	gorm.Model
	UserID 		string
	Token  		string 		`gorm:"unique;not null"`
	ExpiresAt 	time.Time
	DeviceInfo  string
}

type VerificationCode struct {
	Email 		string 		`gorm:"unique;not null"`
	Code  		int64 		`gorm:"unique;not null"`
	ExpiresAt 	time.Time
}