package domain

import (
	"gorm.io/gorm"
	"time"
)

type CrawlerResult struct {
	CRID        string `gorm:"unique"`
	UserID   	string
	Pages       []Page
	gorm.Model
}


type Page struct {
	URL             string
	ParentURL       string
	Depth           int

	StatusCode      int
	ContentType     string
	ResponseTimeMS  int64
	FetchedAt       time.Time

	Title           string
	MetaDescription string
	TextContent     string

	InternalLinks   []string
	ExternalLinks   []string

	ExtractedData   map[string]interface{}

	Error           string
}
