package domain

import (
	"time"

	"gorm.io/gorm"
)

type History struct {
	HID          string         `gorm:"unique" json:"hid"`
	UserID       string         `json:"user_id"`
	ResultID     string         `json:"result_id"`
	URL          string         `json:"url"`
	Type         string         `json:"type"`
	Status       string         `json:"status"`
	ResponseCode int            `json:"response_code"`
	ErrorMessage string         `json:"error_message"`
	FetchedAt    time.Time      `json:"fetched_at"`
	Result       *CrawlerResult `gorm:"foreignKey:ResultID;references:CRID" json:"result,omitempty"`
	gorm.Model   `json:"-"`
}
