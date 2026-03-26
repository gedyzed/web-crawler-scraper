package domain

import "gorm.io/gorm"

type Profile struct {
	PID             string `gorm:"unique"`
	UserID          string
	gorm.Model
}
