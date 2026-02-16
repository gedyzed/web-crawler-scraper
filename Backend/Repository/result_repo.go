package repository

import (
	"context"

	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type resultRepo struct {
	db *gorm.DB
}

func NewResultRepo(db *gorm.DB) domain.IResultRepo {
	return &resultRepo{
		db: db,
	}
}

func (r *resultRepo) SaveResult(ctx context.Context, result *domain.CrawlerResult) *domain.AppError {
	err := r.db.WithContext(ctx).Create(result).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"result": result,
			"error":  err,
		}).Error(domain.LogFailedSaveCrawlerResult)

		return &domain.AppError{
			Message:    domain.ErrFailedSaveCrawlerResult,
			Err:        err.Error(),
			HttpStatus: 500,
		}
	}
	return nil
}

func (r *resultRepo) SaveHistory(ctx context.Context, history *domain.History) *domain.AppError {
	err := r.db.WithContext(ctx).Create(history).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"history": history,
			"error":   err,
		}).Error(domain.LogFailedSaveHistory)

		return &domain.AppError{
			Message:    domain.ErrFailedSaveHistory,
			Err:        err.Error(),
			HttpStatus: 500,
		}
	}
	return nil
}
