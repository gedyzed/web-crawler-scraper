package usecase

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	domain "web_crawler_scraper/Domain"

	"github.com/google/uuid"
)

type IApiKeyUsecase interface {
	CreateAPIKey(ctx context.Context, userID string, name string) (string, *domain.ApiKey, *domain.AppError)
	ListAPIKeys(ctx context.Context, userID string) ([]domain.ApiKey, *domain.AppError)
	RevokeAPIKey(ctx context.Context, userID string, keyID string) *domain.AppError
	ValidateAPIKey(ctx context.Context, rawKey string) (*domain.ApiKey, *domain.AppError)
	TouchLastUsed(ctx context.Context, keyID string) *domain.AppError
}

type apiKeyUsecase struct {
	repo           domain.IApiKeyRepo
	maxKeysPerUser int64
	dailyLimit     int64
}

func NewApiKeyUsecase(repo domain.IApiKeyRepo, maxKeysPerUser int64, dailyLimit int64) IApiKeyUsecase {
	if maxKeysPerUser <= 0 {
		maxKeysPerUser = domain.MaxAPIKeysPerUser
	}
	if dailyLimit <= 0 {
		dailyLimit = domain.DefaultDailyLimit
	}

	return &apiKeyUsecase{
		repo:           repo,
		maxKeysPerUser: maxKeysPerUser,
		dailyLimit:     dailyLimit,
	}
}

func (u *apiKeyUsecase) CreateAPIKey(ctx context.Context, userID string, name string) (string, *domain.ApiKey, *domain.AppError) {
	count, appErr := u.repo.CountActiveByUserID(ctx, userID)
	if appErr != nil {
		return "", nil, appErr
	}

	if count >= u.maxKeysPerUser {
		return "", nil, &domain.AppError{Message: domain.ErrAPIKeyLimitReached, HttpStatus: 400}
	}

	rawKey, last4, genErr := generateLiveAPIKey()
	if genErr != nil {
		return "", nil, &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}

	key := &domain.ApiKey{
		KeyID:      uuid.New().String(),
		UserID:     userID,
		Name:       name,
		KeyPrefix:  domain.APIKeyPrefixLive,
		KeyHash:    hashAPIKey(rawKey),
		Last4:      last4,
		DailyLimit: u.dailyLimit,
		IsActive:   true,
	}

	if err := u.repo.Create(ctx, key); err != nil {
		return "", nil, err
	}

	return rawKey, key, nil
}

func (u *apiKeyUsecase) ListAPIKeys(ctx context.Context, userID string) ([]domain.ApiKey, *domain.AppError) {
	keys, err := u.repo.FindAllByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for i := range keys {
		keys[i].KeyHash = ""
	}

	return keys, nil
}

func (u *apiKeyUsecase) RevokeAPIKey(ctx context.Context, userID string, keyID string) *domain.AppError {
	_, err := u.repo.FindByIDAndUserID(ctx, keyID, userID)
	if err != nil {
		return err
	}
	return u.repo.Revoke(ctx, keyID, userID)
}

func (u *apiKeyUsecase) ValidateAPIKey(ctx context.Context, rawKey string) (*domain.ApiKey, *domain.AppError) {
	key, err := u.repo.FindByHash(ctx, hashAPIKey(rawKey))
	if err != nil {
		return nil, err
	}

	if !key.IsActive || key.RevokedAt != nil {
		return nil, &domain.AppError{Message: domain.ErrAPIKeyRevoked, HttpStatus: 401}
	}

	return key, nil
}

func (u *apiKeyUsecase) TouchLastUsed(ctx context.Context, keyID string) *domain.AppError {
	return u.repo.TouchLastUsed(ctx, keyID)
}

func generateLiveAPIKey() (string, string, error) {
	randomBytes := make([]byte, 24)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", err
	}
	suffix := hex.EncodeToString(randomBytes)
	full := domain.APIKeyPrefixLive + suffix
	last4 := suffix[len(suffix)-4:]
	return full, last4, nil
}

func hashAPIKey(rawKey string) string {
	sum := sha256.Sum256([]byte(rawKey))
	return hex.EncodeToString(sum[:])
}
