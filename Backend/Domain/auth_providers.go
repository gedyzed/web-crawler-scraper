package domain

import (
	"gorm.io/gorm"
)

type AuthProvider struct {
	gorm.Model
	UserID string 
	Provider string `gorm:"not null;uniqueIndex:provider_idx"`
	ProviderID string `gorm:"not null;uniqueIndex:provider_idx"`
}






