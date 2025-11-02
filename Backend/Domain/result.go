package domain

import "gorm.io/gorm"

type CrawlerResult struct {
	CRID        string `gorm:"unique"`
	UserID   	string
	HtmlContent string
	TextContent string
	gorm.Model

}