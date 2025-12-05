package domain

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	UserID      string `gorm:"unique;not null"` 
	Email       string `gorm:"unique;not null"`
	Role 		string `gorm:"default:user"`
	Password    string 
	FirstName   string
	LastName    string
	Is_Verified bool   `gorm:"default:false"`
	Signed_In   time.Time 
	AvatarURL 	string `json:"avatar_url"`
	gorm.Model
	
	// relationships
	AuthProvider *AuthProvider `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Profile *Profile `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	History	[]*History `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Jobs 	[]*Jobs  `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Result 	[]*CrawlerResult `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Session []*Session `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	RefreshToken []*RefreshToken `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Provider	[]*AuthProvider `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
}

type ExchangeData struct{
	User 		 *User
	Session 	 *Session
	RefreshToken *RefreshToken
	Provider 	 *AuthProvider
}

