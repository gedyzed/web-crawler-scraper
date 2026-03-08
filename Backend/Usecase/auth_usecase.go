package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"time"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
)

type IAuthUsecase interface {
	Register(ctx context.Context, user *domain.User, ip string) *domain.AppError
	Login(ctx context.Context, user *domain.User, ip string) (*domain.ExchangeData, *domain.AppError)
	GetLoginURL(providerName string, state string) (string, *domain.AppError)
	RegisterOrLogin(ctx context.Context, providerName string, code string, ip string) (*domain.ExchangeData, *domain.AppError)
	RefreshToken(ctx context.Context, accessToken string) (string, string, *domain.AppError)
	SendVerificationEmail(ctx context.Context, email string) *domain.AppError
	VerifyEmail(ctx context.Context, email string, code int64) *domain.AppError
	ForgotPassword(ctx context.Context, email string) *domain.AppError
	SendForgotPasswordEmail(ctx context.Context, email string) *domain.AppError
	VerifyResetCode(ctx context.Context, email string, code string) *domain.AppError
	ResetPassword(ctx context.Context, email string, password string) *domain.AppError
	GetUserByID(ctx context.Context, id string) (*domain.User, *domain.AppError)
}

type IRateLimiter interface {
	Allow(ctx context.Context, ip string) (bool, *domain.AppError)
}

type authUsecase struct {
	repo            domain.IUserRepo
	tokenRepo       domain.IRefreshTokenRepo
	rateLimiter     IRateLimiter
	oauthServices   domain.IOAuthServices
	jwtService      domain.IJwtService
	passwordService domain.IPasswordService
	emailServcie    domain.IEmailService
}

func NewAuthUsecase(
	repo domain.IUserRepo,
	tokenRepo domain.IRefreshTokenRepo,
	rateLimiter IRateLimiter,
	oauthServices domain.IOAuthServices,
	jwtService domain.IJwtService,
	passwordService domain.IPasswordService,
	emailService domain.IEmailService,
) IAuthUsecase {
	return &authUsecase{
		repo:            repo,
		tokenRepo:       tokenRepo,
		rateLimiter:     rateLimiter,
		oauthServices:   oauthServices,
		jwtService:      jwtService,
		passwordService: passwordService,
		emailServcie:    emailService,
	}
}

func GenerateID(n int) (string, error) {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (ac *authUsecase) Register(ctx context.Context, user *domain.User, ip string) *domain.AppError {

	allowed, err := ac.rateLimiter.Allow(ctx, ip)
	if err != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error(domain.LogFailedRateLimiter)
		return &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	if !allowed {
		return &domain.AppError{
			Message:    domain.ErrTooManyRequests,
			HttpStatus: 429,
		}
	}

	// check for duplicate email
	old_user, err := ac.repo.FindByEmail(ctx, user.Email)
	if err != nil && err.HttpStatus == http.StatusInternalServerError {
		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	if old_user != nil {
		return &domain.AppError{
			Message:    domain.ErrUserAlreadyRegistered,
			HttpStatus: 409,
		}
	}

	userID, err_ := GenerateID(16)
	if err_ != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err_,
		}).Error(domain.LogFailedCreateUserID)
		return &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	hashedPassword, err := ac.passwordService.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.UserID = userID
	user.Password = string(hashedPassword)

	if err := ac.SendVerificationEmail(ctx, user.Email); err != nil {
		return err
	}

	if err := ac.repo.Create(ctx, user); err != nil {
		return err
	}

	return nil
}

func (ac *authUsecase) Login(ctx context.Context, user *domain.User, ip string) (*domain.ExchangeData, *domain.AppError) {

	allowed, err := ac.rateLimiter.Allow(ctx, ip)
	if err != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error(domain.LogFailedRateLimiter)
		return nil, &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	if !allowed {
		return nil, &domain.AppError{
			Message:    domain.ErrTooManyRequests,
			HttpStatus: 429,
		}
	}

	dummyHash := "$2a$10$6.8LO2dQfP6rkY6/u.2mJOjEt5AdKRu98HEG6UWHQbliU/jhKJjLo"
	old_user, err := ac.repo.FindByEmail(ctx, user.Email)
	if err != nil && err.HttpStatus != http.StatusNotFound {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error(domain.LogUserNotFound)

		return nil, err
	}

	hashToCompare := dummyHash
	if old_user != nil {
		hashToCompare = old_user.Password
	}

	isMatched := ac.passwordService.ComparePassword(hashToCompare, user.Password)
	if !isMatched || old_user == nil {
		return nil, &domain.AppError{
			Message:    domain.ErrInvalidCredentials,
			HttpStatus: 401,
		}
	}

	// generate tokens
	exchangeData, err := ac.jwtService.GenerateTokens(ctx, old_user.UserID)
	if err != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error(domain.LogFailedCreateTokens)
		return nil, &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	// save refresh token
	refreshToken := exchangeData.RefreshToken
	refreshToken.UserID = old_user.UserID
	if err := ac.tokenRepo.Create(ctx, refreshToken); err != nil {
		logger.WithFields(logger.Fields{
			"refreshToken": refreshToken,
			"error":        err,
		}).Error(domain.LogFailedCreateRefreshToken)
		return nil, &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	exchangeData.User = old_user
	return exchangeData, nil
}

func (ac *authUsecase) GetLoginURL(providerName string, state string) (string, *domain.AppError) {

	url, err := ac.oauthServices.GetAuthURL(providerName, state)
	if err != nil {
		return "", &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	return url, nil
}

func (ac *authUsecase) RegisterOrLogin(
	ctx context.Context,
	providerName string,
	code string,
	ipAddress string,
) (*domain.ExchangeData, *domain.AppError) {

	allowed, err := ac.rateLimiter.Allow(ctx, ipAddress)
	if err != nil {
		return nil, err
	}

	if !allowed {
		return nil, &domain.AppError{
			Message:    domain.ErrTooManyRequests,
			HttpStatus: 429,
		}
	}
	userData, err := ac.oauthServices.Exchange(ctx, providerName, code)
	if err != nil {
		return nil, &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	if userData == nil || userData.User == nil {
		return nil, &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	user := userData.User
	old_user, err := ac.repo.FindByEmail(ctx, user.Email)
	if err != nil && err.HttpStatus != http.StatusNotFound {
		return nil, err
	}

	// login - existing user
	if old_user != nil {
		userData.User = old_user
		userData.Provider.UserID = old_user.UserID
		err := ac.repo.SaveProvider(ctx, userData.Provider)
		if err != nil {
			logger.WithFields(logger.Fields{
				"provider": userData.Provider,
				"error":    err,
			}).Error(domain.LogFailedSaveProvider)
		}

		// Save refresh token for existing user
		userData.RefreshToken.UserID = old_user.UserID
		err = ac.tokenRepo.Update(ctx, userData.RefreshToken)
		if err != nil {
			logger.WithFields(logger.Fields{
				"refreshToken": userData.RefreshToken,
				"error":        err,
			}).Error(domain.LogFailedCreateRefreshToken)
			return nil, &domain.AppError{
				Message:    domain.ErrSomethingWentWrong,
				HttpStatus: 500,
			}
		}
	} else {
		// register - new user
		UserID, err_ := GenerateID(10)
		if err_ != nil {
			return nil, &domain.AppError{
				Message:    domain.ErrSomethingWentWrong,
				HttpStatus: 500,
			}
		}

		user.UserID = UserID
		err = ac.repo.Create(ctx, user)
		if err != nil {
			return nil, err
		}

		refreshToken := userData.RefreshToken
		refreshToken.UserID = UserID
		err = ac.tokenRepo.Create(ctx, refreshToken)
		if err != nil {
			return nil, err
		}
	}

	return userData, nil
}

func (ac *authUsecase) RefreshToken(ctx context.Context, refreshToken string) (string, string, *domain.AppError) {

	var newAccessToken string
	var newRefreshToken string

	data, err := ac.jwtService.RefreshToken(ctx, refreshToken)
	if err != nil || data == nil {
		return "", "", err
	}

	session := data.Session
	if session != nil {
		newAccessToken = session.Token
	}

	// save the refresh token
	if data.RefreshToken != nil {
		newRefreshToken = data.RefreshToken.Token
		if err := ac.tokenRepo.Update(ctx, data.RefreshToken); err != nil {
			return "", "", err
		}
	}

	return newAccessToken, newRefreshToken, nil
}

func (ac *authUsecase) SendVerificationEmail(ctx context.Context, email string) *domain.AppError {
	uniqueCode, err := generateSecureNumber(100000, 999999)
	if err != nil {
		return &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	verfication := &domain.VerificationCode{
		Email:     email,
		Code:      uniqueCode,
		ExpiresAt: time.Now().Add(time.Minute * 10),
	}

	if err := ac.repo.CreateVerificationCode(ctx, verfication); err != nil {
		return err
	}

	return ac.emailServcie.SendEmail(
		"user",
		domain.EmailVerification,
		fmt.Sprintf("%d", uniqueCode),
		[]string{email},
	)
}

func (ac *authUsecase) SendForgotPasswordEmail(ctx context.Context, email string) *domain.AppError {
	uniqueCode, err := generateSecureNumber(100000, 999999)
	if err != nil {
		return &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	verfication := &domain.VerificationCode{
		Email:     email,
		Code:      uniqueCode,
		ExpiresAt: time.Now().Add(time.Minute * 10),
	}

	if err := ac.repo.CreateVerificationCode(ctx, verfication); err != nil {
		return err
	}

	return ac.emailServcie.SendEmail(
		"user",
		domain.EmailForgotPassword,
		fmt.Sprintf("%d", uniqueCode),
		[]string{email},
	)
}

func generateSecureNumber(min, max int64) (int64, error) {
	nBig, err := rand.Int(rand.Reader, big.NewInt(max-min+1))
	if err != nil {
		return 0, err
	}
	return nBig.Int64() + min, nil
}

func (ac *authUsecase) VerifyEmail(ctx context.Context, email string, code int64) *domain.AppError {
	// Find the verification code
	verification, err := ac.repo.FindVerificationCode(ctx, email)
	if err != nil {
		return err
	}

	// Check if the code has expired
	if time.Now().After(verification.ExpiresAt) {
		ac.repo.DeleteVerificationCode(ctx, email)
		return &domain.AppError{
			Message:    domain.ErrVerificationCodeExpired,
			HttpStatus: 400,
		}
	}

	// Compare codes
	if verification.Code != code {
		return &domain.AppError{
			Message:    domain.ErrInvalidVerificationCode,
			HttpStatus: 400,
		}
	}

	// Mark user as verified
	user, err := ac.repo.FindByEmail(ctx, email)
	if err != nil {
		return err
	}

	user.Is_Verified = true
	_, err = ac.repo.Update(ctx, user)
	if err != nil {
		return err
	}

	// Delete the used verification code
	ac.repo.DeleteVerificationCode(ctx, email)
	return nil
}

func (ac *authUsecase) GetUserByID(ctx context.Context, id string) (*domain.User, *domain.AppError) {
	return ac.repo.FindByID(ctx, id)
}

func (ac *authUsecase) ForgotPassword(ctx context.Context, email string) *domain.AppError {
	// check if user exists
	user, err := ac.repo.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	if user == nil {
		return &domain.AppError{Message: domain.ErrUserNotFound, HttpStatus: 404}
	}

	// Generate and send reset code
	return ac.SendForgotPasswordEmail(ctx, email)
}

func (ac *authUsecase) VerifyResetCode(ctx context.Context, email string, code string) *domain.AppError {
	// Convert code to int64
	var codeInt int64
	_, err_ := fmt.Sscanf(code, "%d", &codeInt)
	if err_ != nil {
		return &domain.AppError{Message: domain.ErrInvalidInputFormat, HttpStatus: 400}
	}

	return ac.VerifyEmail(ctx, email, codeInt) // Reusing VerifyEmail logic as it checks code existence and validity
}

func (ac *authUsecase) ResetPassword(ctx context.Context, email string, password string) *domain.AppError {
	user, err := ac.repo.FindByEmail(ctx, email)
	if err != nil {
		return err
	}

	hashedPassword, err := ac.passwordService.HashPassword(password)
	if err != nil {
		return err
	}

	user.Password = hashedPassword
	_, err = ac.repo.Update(ctx, user)
	return err
}
