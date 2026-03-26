package domain

import (
	"time"

	"gorm.io/gorm"
)

type CrawlerResult struct {
	CRID                string `gorm:"unique"`
	UserID              string
	TotalPages          int
	TotalResponseTimeMS int64
	TotalPayloadSize    int64
	Pages               []Page `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:ResultID;references:CRID"`
	gorm.Model          `json:"-"`
}

type Product struct {
	gorm.Model  `json:"-"`
	PageID      string `gorm:"index" json:"-"`
	Name        string `json:"name"`
	Price       string `json:"price"`
	ImageURL    string `json:"image_url"`
	Currency    string `json:"currency"`
	Description string `json:"description"`
	URL         string `json:"url"`
}

type Link struct {
	gorm.Model `json:"-"`
	PageID     string `gorm:"index" json:"-"`
	URL        string `gorm:"type:text"`
	Type       string `gorm:"size:20"`
}

type Image struct {
	Link
	Type   string `gorm:"-"`
}

type Page struct {
	PageID    string
	ResultID  string
	URL       string
	ParentURL string
	Depth     int

	StatusCode     int
	ContentType    string
	ResponseTimeMS int64
	FetchedAt      time.Time

	Title           string
	MetaDescription string
	TextContent     string
	PayloadSize     int64
	Images          []Image `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:PageID;references:PageID"`

	Links    []Link    `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:PageID;references:PageID"`
	Products []Product `gorm:"constraint:OnUpdate:CASCADE, OnDelete:CASCADE;foreignKey:PageID;references:PageID"`
	gorm.Model
}
