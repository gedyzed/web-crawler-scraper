package domain

import (
	"time"

	"gorm.io/gorm"
)

type ApiKey struct {
	gorm.Model
	KeyID      string     `gorm:"uniqueIndex;not null" json:"key_id"`
	UserID     string     `gorm:"index;not null" json:"user_id"`
	Name       string     `gorm:"not null" json:"name"`
	KeyPrefix  string     `gorm:"index;not null" json:"key_prefix"`
	KeyHash    string     `gorm:"uniqueIndex;not null" json:"-"`
	Last4      string     `gorm:"not null" json:"last4"`
	DailyLimit int64      `gorm:"not null;default:1000" json:"daily_limit"`
	IsActive   bool       `gorm:"index;default:true" json:"is_active"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
}
