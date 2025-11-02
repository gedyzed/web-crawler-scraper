package domain

import "gorm.io/gorm"

type Profile struct {
	PID             string `gorm:"unique"`
	UserID          string
	CrawlerSettings *CrawlerSetting `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:ProfileID;references:PID"`
	Notification    bool
	gorm.Model
}

type CrawlerSetting struct {
	CID string  `gorm:"primarykey"`
	ProfileID string 
	MaxConcurrent int
	UserAgent     string
	FollowLinks   bool
}