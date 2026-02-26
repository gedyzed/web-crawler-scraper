package infrastructure

import (
	"log"
	// domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func DBConnect(cfg *config.DBConfig) *gorm.DB {

	if cfg.DNS == "" {
		log.Fatal("DB DNS is not set")
	}
	dns := cfg.DNS
	db, err := gorm.Open(postgres.Open(dns), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
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
	//  domain.VerificationCode{},
	// )


	return db
}
