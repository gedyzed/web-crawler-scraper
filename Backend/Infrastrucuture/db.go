package infrastructure

import (
	// "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	logrus "github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func DBConnect(cfg *config.DBConfig) *gorm.DB {

	if cfg.DNS == "" {
		logrus.Fatal("DB DNS is not set")
	}
	dns := cfg.DNS
	db, err := gorm.Open(postgres.Open(dns), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		logrus.WithError(err).Fatal("Failed to connect to postgres database")
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
	//  	domain.VerificationCode{},
	// )

	
	return db
}
