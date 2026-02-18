package repository

import (
	"context"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type sessionRepo struct {
	db *gorm.DB
}

func NewSessionRepo(db *gorm.DB) domain.ISessionRepo {
	return &sessionRepo{db: db}
}

func (r *sessionRepo) Create(ctx context.Context, session *domain.Session) *domain.AppError {

	// Overwrite existing session for the same UserID
	if err := r.db.WithContext(ctx).Where("user_id = ?", session.UserID).Delete(&domain.Session{}).Error; err != nil {
		logger.WithFields(logger.Fields{
			"userID": session.UserID,
			"error":  err,
		}).Error("Failed to delete existing session")
	}

	err := r.db.WithContext(ctx).Create(session).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"session": session,
			"error":   err,
		}).Error("Failed to create session")

		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}
	return nil
}

func (r *sessionRepo) FindByID(ctx context.Context, id uint) (*domain.Session, *domain.AppError) {
	var session domain.Session
	if err := r.db.WithContext(ctx).First(&session, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, &domain.AppError{
				Message:    "Session not found",
				HttpStatus: 404,
			}
		}
		return nil, &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}
	return &session, nil
}

func (r *sessionRepo) Delete(ctx context.Context, id uint) *domain.AppError {
	if err := r.db.WithContext(ctx).Delete(&domain.Session{}, id).Error; err != nil {
		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}
	return nil
}
