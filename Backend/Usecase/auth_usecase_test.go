package usecase_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"

	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"
	mocks "web_crawler_scraper/mocks"
)

type mockRateLimiter struct {
	allow bool
	err   *domain.AppError
}

func (m *mockRateLimiter) Allow(ctx context.Context, ip string) (bool, *domain.AppError) {
	return m.allow, m.err
}

func setupAuthUsecaseTest(t *testing.T) (*gomock.Controller, *mocks.MockIUserRepo, *mocks.MockIRefreshTokenRepo, *mockRateLimiter, *mocks.MockIOAuthServices, *mocks.MockIJwtService, *mocks.MockIPasswordService, *mocks.MockIEmailService, usecase.IAuthUsecase) {
	ctrl := gomock.NewController(t)
	mockUserRepo := mocks.NewMockIUserRepo(ctrl)
	mockTokenRepo := mocks.NewMockIRefreshTokenRepo(ctrl)
	mockRateLimiter := &mockRateLimiter{allow: true}
	mockOAuth := mocks.NewMockIOAuthServices(ctrl)
	mockJwt := mocks.NewMockIJwtService(ctrl)
	mockPassword := mocks.NewMockIPasswordService(ctrl)
	mockEmail := mocks.NewMockIEmailService(ctrl)

	uc := usecase.NewAuthUsecase(
		mockUserRepo, mockTokenRepo, mockRateLimiter,
		mockOAuth, mockJwt, mockPassword, mockEmail,
	)

	return ctrl, mockUserRepo, mockTokenRepo, mockRateLimiter, mockOAuth, mockJwt, mockPassword, mockEmail, uc
}

func TestRegister_Success(t *testing.T) {
	ctrl, mockUserRepo, _, _, _, _, mockPassword, _, uc := setupAuthUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	user := &domain.User{Email: "test@example.com", Password: "password123"}

	// Expectations
	mockUserRepo.EXPECT().FindByEmail(ctx, user.Email).Return(nil, nil)
	mockPassword.EXPECT().HashPassword(user.Password).Return("hashed_password", nil)
	mockUserRepo.EXPECT().Create(ctx, user).Return(nil)

	err := uc.Register(ctx, user, "127.0.0.1")
	assert.Nil(t, err)
	assert.NotEmpty(t, user.UserID)
	assert.Equal(t, "hashed_password", user.Password)
}

func TestRegister_DuplicateEmail(t *testing.T) {
	ctrl, mockUserRepo, _, _, _, _, _, _, uc := setupAuthUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	user := &domain.User{Email: "test@example.com", Password: "password123"}

	// Expectations
	existingUser := &domain.User{Email: "test@example.com"}
	mockUserRepo.EXPECT().FindByEmail(ctx, user.Email).Return(existingUser, nil)

	err := uc.Register(ctx, user, "127.0.0.1")
	assert.NotNil(t, err)
	assert.Equal(t, domain.ErrUserAlreadyRegistered, err.Message)
	assert.Equal(t, 409, err.HttpStatus)
}

func TestLogin_Success(t *testing.T) {
	ctrl, mockUserRepo, mockTokenRepo, _, _, mockJwt, mockPassword, _, uc := setupAuthUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	user := &domain.User{Email: "test@example.com", Password: "password123"}
	existingUser := &domain.User{UserID: "user123", Email: "test@example.com", Password: "hashed_password", Is_Verified: true}

	exchangeData := &domain.ExchangeData{
		RefreshToken: &domain.RefreshToken{Token: "refresh_token"},
		Session:      &domain.Session{Token: "access_token"},
	}

	// Expectations
	mockUserRepo.EXPECT().FindByEmail(ctx, user.Email).Return(existingUser, nil)
	mockPassword.EXPECT().ComparePassword("hashed_password", user.Password).Return(true)
	mockJwt.EXPECT().GenerateTokens(ctx, "user123").Return(exchangeData, nil)
	mockTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)

	res, err := uc.Login(ctx, user, "127.0.0.1")
	assert.Nil(t, err)
	assert.NotNil(t, res)
	assert.Equal(t, "user123", res.User.UserID)
}

func TestLogin_InvalidCredentials(t *testing.T) {
	ctrl, mockUserRepo, _, _, _, _, mockPassword, _, uc := setupAuthUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	user := &domain.User{Email: "test@example.com", Password: "wrongpassword"}
	existingUser := &domain.User{UserID: "user123", Email: "test@example.com", Password: "hashed_password"}

	// Expectations
	mockUserRepo.EXPECT().FindByEmail(ctx, user.Email).Return(existingUser, nil)
	mockPassword.EXPECT().ComparePassword("hashed_password", user.Password).Return(false)

	res, err := uc.Login(ctx, user, "127.0.0.1")
	assert.NotNil(t, err)
	assert.Nil(t, res)
	assert.Equal(t, domain.ErrInvalidCredentials, err.Message)
	assert.Equal(t, 401, err.HttpStatus)
}
