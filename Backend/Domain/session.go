package domain

import (
	"time"

	"gorm.io/gorm"
)

type Session struct {
	gorm.Model
	UserID 		string
	Token  		string 		`gorm:"unique;not null"`
	ExpiresAt 	time.Time
	IPAddress   string
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