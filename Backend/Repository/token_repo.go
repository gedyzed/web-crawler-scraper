package repository

import (
	"context"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type tokenRepo struct {
	db *gorm.DB
}

func NewRefreshTokenRepo(db *gorm.DB) domain.IRefreshTokenRepo {
	return &tokenRepo{db: db}
}

func (r *tokenRepo) Create(ctx context.Context, token *domain.RefreshToken) *domain.AppError {

	// Overwrite existing token for the same UserID
	if err := r.db.WithContext(ctx).Where("user_id = ?", token.UserID).Delete(&domain.RefreshToken{}).Error; err != nil {
		logger.WithFields(logger.Fields{
			"userID": token.UserID,
			"error":  err,
		}).Error("Failed to delete existing refresh token")
	}

	err := r.db.WithContext(ctx).Create(token).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"refresh_token": token,
			"error":         err,
		}).Error(domain.LogFailedCreateRefreshToken)

		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	return nil

}

func (r *tokenRepo) Update(ctx context.Context, token *domain.RefreshToken) *domain.AppError {
	err := r.db.WithContext(ctx).Model(&domain.RefreshToken{}).Where("user_id = ?", token.UserID).Updates(token).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"refresh_token": token,
			"error":         err,
		}).Error(domain.LogFailedUpdateUser)

		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}
	return nil
}

func (r *tokenRepo) FindByID(ctx context.Context, UserID string) (*domain.RefreshToken, *domain.AppError) {

	logger.SetFormatter(&logger.JSONFormatter{})

	var token domain.RefreshToken
	if err := r.db.WithContext(ctx).First(&token, UserID).Error; err != nil {
		logger.WithFields(logger.Fields{
			"refresh_token": token,
			"error":         err,
		}).Error(domain.LogUserNotFound)

		return nil, &domain.AppError{
			Message:    domain.ErrTokenNotFound,
			HttpStatus: 404,
		}
	}
	return &token, nil
}

func (r *tokenRepo) DeleteToken(ctx context.Context, UserID string) *domain.AppError {

	err := r.db.WithContext(ctx).Where("user_id = ?", UserID).Delete(&domain.RefreshToken{}).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"userID": UserID,
			"error":  err,
		}).Error(domain.LogFailedDeleteRefreshToken)

		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	return nil
}
