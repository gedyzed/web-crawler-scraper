package repository

import (
	"context"
	"time"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type apiKeyRepo struct {
	db *gorm.DB
}

func NewApiKeyRepo(db *gorm.DB) domain.IApiKeyRepo {
	return &apiKeyRepo{db: db}
}

func (r *apiKeyRepo) Create(ctx context.Context, key *domain.ApiKey) *domain.AppError {
	if err := r.db.WithContext(ctx).Create(key).Error; err != nil {
		logger.WithFields(logger.Fields{"error": err, "user_id": key.UserID}).Error(domain.LogFailedCreateAPIKey)
		return &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}
	return nil
}

func (r *apiKeyRepo) CountActiveByUserID(ctx context.Context, userID string) (int64, *domain.AppError) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&domain.ApiKey{}).
		Where("user_id = ? AND is_active = ? AND revoked_at IS NULL", userID, true).
		Count(&count).Error
	if err != nil {
		logger.WithFields(logger.Fields{"error": err, "user_id": userID}).Error("Failed to count active API keys")
		return 0, &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}
	return count, nil
}

func (r *apiKeyRepo) FindAllByUserID(ctx context.Context, userID string) ([]domain.ApiKey, *domain.AppError) {
	var keys []domain.ApiKey
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&keys).Error
	if err != nil {
		logger.WithFields(logger.Fields{"error": err, "user_id": userID}).Error("Failed to fetch API keys")
		return nil, &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}
	return keys, nil
}

func (r *apiKeyRepo) FindByHash(ctx context.Context, hash string) (*domain.ApiKey, *domain.AppError) {
	var key domain.ApiKey
	err := r.db.WithContext(ctx).
		Where("key_hash = ?", hash).
		First(&key).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, &domain.AppError{Message: domain.ErrInvalidAPIKey, HttpStatus: 401}
		}
		logger.WithFields(logger.Fields{"error": err}).Error("Failed to fetch API key by hash")
		return nil, &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}
	return &key, nil
}

func (r *apiKeyRepo) FindByIDAndUserID(ctx context.Context, keyID string, userID string) (*domain.ApiKey, *domain.AppError) {
	var key domain.ApiKey
	err := r.db.WithContext(ctx).
		Where("key_id = ? AND user_id = ?", keyID, userID).
		First(&key).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, &domain.AppError{Message: domain.ErrInvalidAPIKey, HttpStatus: 404}
		}
		logger.WithFields(logger.Fields{"error": err, "key_id": keyID, "user_id": userID}).Error("Failed to fetch API key by id and user")
		return nil, &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}
	return &key, nil
}

func (r *apiKeyRepo) Revoke(ctx context.Context, keyID string, userID string) *domain.AppError {
	now := time.Now()
	err := r.db.WithContext(ctx).
		Model(&domain.ApiKey{}).
		Where("key_id = ? AND user_id = ? AND is_active = ?", keyID, userID, true).
		Updates(map[string]any{"is_active": false, "revoked_at": &now}).Error
	if err != nil {
		logger.WithFields(logger.Fields{"error": err, "key_id": keyID, "user_id": userID}).Error("Failed to revoke API key")
		return &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}
	return nil
}

func (r *apiKeyRepo) TouchLastUsed(ctx context.Context, keyID string) *domain.AppError {
	now := time.Now()
	err := r.db.WithContext(ctx).
		Model(&domain.ApiKey{}).
		Where("key_id = ?", keyID).
		Update("last_used_at", &now).Error
	if err != nil {
		logger.WithFields(logger.Fields{"error": err, "key_id": keyID}).Error("Failed to update API key last_used_at")
		return &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}
	return nil
}
