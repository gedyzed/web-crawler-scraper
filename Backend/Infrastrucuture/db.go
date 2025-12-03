package infrastructure

import (
	"log"
	// domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func DBConnect(cfg *config.DBConfig) *gorm.DB {

	if cfg.DNS == "" {
		log.Fatal("DB DNS is not set")
	}
	dns := cfg.DNS
	db, err := gorm.Open(postgres.Open(dns), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to postgress database", err)
	}
	
	// db.AutoMigrate(
	// 	domain.User{}, 
	// 	domain.Profile{}, 
	// 	domain.History{}, 
	// 	domain.CrawlerResult{}, 
	// 	domain.CrawlerSetting{},
	// 	domain.Session{},
	// 	domain.RefreshToken{},
	// 	domain.AuthProvider{},
	// )
	return db
}