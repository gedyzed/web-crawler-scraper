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
	gorm.Model
	
	// relationships
	Profile *Profile `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	History	[]*History `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Jobs 	[]*Jobs  `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Result 	[]*CrawlerResult `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	Session []*Session `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`
	RefreshToken []*RefreshToken `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:UserID;references:UserID"`

}

