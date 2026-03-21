package usecase_test

import (
	"context"
	"testing"
	"time"
	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"

	"github.com/stretchr/testify/require"
)

type memAPIKeyRepo struct{ keys map[string]*domain.ApiKey }

func (m *memAPIKeyRepo) Create(_ context.Context, key *domain.ApiKey) *domain.AppError {
	if m.keys == nil {
		m.keys = map[string]*domain.ApiKey{}
	}
	c := *key
	m.keys[key.KeyID] = &c
	return nil
}
func (m *memAPIKeyRepo) CountActiveByUserID(_ context.Context, userID string) (int64, *domain.AppError) {
	var n int64
	for _, k := range m.keys {
		if k.UserID == userID && k.IsActive && k.RevokedAt == nil {
			n++
		}
	}
	return n, nil
}
func (m *memAPIKeyRepo) FindAllByUserID(_ context.Context, userID string) ([]domain.ApiKey, *domain.AppError) {
	out := []domain.ApiKey{}
	for _, k := range m.keys {
		if k.UserID == userID {
			out = append(out, *k)
		}
	}
	return out, nil
}
func (m *memAPIKeyRepo) FindByHash(_ context.Context, hash string) (*domain.ApiKey, *domain.AppError) {
	for _, k := range m.keys {
		if k.KeyHash == hash {
			c := *k
			return &c, nil
		}
	}
	return nil, &domain.AppError{Message: domain.ErrInvalidAPIKey, HttpStatus: 401}
}
func (m *memAPIKeyRepo) FindByIDAndUserID(_ context.Context, keyID string, userID string) (*domain.ApiKey, *domain.AppError) {
	k, ok := m.keys[keyID]
	if !ok || k.UserID != userID {
		return nil, &domain.AppError{Message: domain.ErrInvalidAPIKey, HttpStatus: 404}
	}
	c := *k
	return &c, nil
}
func (m *memAPIKeyRepo) Revoke(_ context.Context, keyID string, userID string) *domain.AppError {
	k, ok := m.keys[keyID]
	if !ok || k.UserID != userID {
		return &domain.AppError{Message: domain.ErrInvalidAPIKey, HttpStatus: 404}
	}
	now := time.Now()
	k.IsActive = false
	k.RevokedAt = &now
	return nil
}
func (m *memAPIKeyRepo) TouchLastUsed(_ context.Context, keyID string) *domain.AppError { return nil }

func TestAPIKey_CreateAndValidate(t *testing.T) {
	repo := &memAPIKeyRepo{}
	uc := usecase.NewApiKeyUsecase(repo, 3, 1000)

	rawKey, key, err := uc.CreateAPIKey(context.Background(), "u-1", "service-a")
	require.Nil(t, err)
	require.NotEmpty(t, rawKey)
	require.NotNil(t, key)
	require.Equal(t, domain.APIKeyPrefixLive, rawKey[:len(domain.APIKeyPrefixLive)])
	require.Equal(t, int64(1000), key.DailyLimit)

	v, appErr := uc.ValidateAPIKey(context.Background(), rawKey)
	require.Nil(t, appErr)
	require.Equal(t, key.KeyID, v.KeyID)
}
