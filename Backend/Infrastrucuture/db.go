package infrastructure

import (
	"web_crawler_scraper/Infrastrucuture/config"

	logrus "github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func DBConnect(cfg *config.DBConfig, debug bool) *gorm.DB {

	if cfg.DNS == "" {
		logrus.Fatal("DB DNS is not set")
	}

	logLevel := logger.Silent
	if debug {
		logLevel = logger.Info
	}

	dns := cfg.DNS
	db, err := gorm.Open(postgres.Open(dns), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		logrus.WithError(err).Fatal("Failed to connect to postgres database")
	}

	return db
}
