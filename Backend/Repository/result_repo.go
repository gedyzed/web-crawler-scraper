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

func (r *resultRepo) FindAllHistory(ctx context.Context, userID string) ([]domain.History, *domain.AppError) {
	var history []domain.History
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("fetched_at desc").Find(&history).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"userID": userID,
			"error":  err,
		}).Error(domain.LogFailedFetchHistory)

		return nil, &domain.AppError{
			Message:    domain.ErrFailedFetchHistory,
			Err:        err.Error(),
			HttpStatus: 500,
		}
	}
	return history, nil
}

func (r *resultRepo) FindResultByID(ctx context.Context, resultID string, userID string) (*domain.CrawlerResult, *domain.AppError) {
	var result domain.CrawlerResult
	err := r.db.WithContext(ctx).Preload("Pages").Preload("Pages.Links").Preload("Pages.Products").Where(&domain.CrawlerResult{CRID: resultID, UserID: userID}).First(&result).Error
	if err != nil {
		return nil, &domain.AppError{
			Message:    "Failed to find result",
			Err:        err.Error(),
			HttpStatus: 500,
		}
	}
	return &result, nil
}

func (r *resultRepo) FindHistoryByID(ctx context.Context, historyID string, userID string) (*domain.History, *domain.AppError) {
	var history domain.History
	err := r.db.WithContext(ctx).Where(&domain.History{HID: historyID, UserID: userID}).First(&history).Error
	if err != nil {
		return nil, &domain.AppError{
			Message:    "Failed to find history",
			Err:        err.Error(),
			HttpStatus: 404,
		}
	}
	return &history, nil
}
