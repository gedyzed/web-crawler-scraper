package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
)

type IAuthUsecase interface {
	Register(ctx context.Context, user *domain.User, ip string) *domain.AppError
	Login(ctx context.Context, user *domain.User, ip string) (*domain.ExchangeData, *domain.AppError)
	GetLoginURL(providerName string, state string) (string, *domain.AppError)
	RegisterOrLogin(ctx context.Context, providerName string, code string, ip string) (*domain.ExchangeData, *domain.AppError)
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
}

func NewAuthUsecase(
		repo 			domain.IUserRepo, 
		tokenRepo		domain.IRefreshTokenRepo,
		rateLimiter 	IRateLimiter, 
		oauthServices 	domain.IOAuthServices,
		jwtService      domain.IJwtService,
	passwordService domain.IPasswordService,
) IAuthUsecase {
	return &authUsecase{
		repo:            repo,
		tokenRepo:       tokenRepo,
		rateLimiter:     rateLimiter,
		oauthServices:   oauthServices,
		jwtService:      jwtService,
		passwordService: passwordService,
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
	logger.SetFormatter(&logger.JSONFormatter{})

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
	if err != nil && err.HttpStatus != http.StatusInternalServerError {
		return &domain.AppError{
			Message:    "Internal Server Error",
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
			Message:    domain.ErrSomethingWentWrongAlt,
			HttpStatus: 500,
		}
	}

	hashedPassword, err := ac.passwordService.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.UserID = userID
	user.Password = string(hashedPassword)

	if err := ac.repo.Create(ctx, user); err != nil {
		return err
	}

	return nil
}

func (ac *authUsecase) Login(ctx context.Context, user *domain.User, ip string) (*domain.ExchangeData, *domain.AppError) {

	logger.SetFormatter(&logger.JSONFormatter{})
	allowed, err := ac.rateLimiter.Allow(ctx, ip)
	if err != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error("Failed to get the rate limiter")
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

	old_user, err := ac.repo.FindByEmail(ctx, user.Email)
	if err != nil {
		return nil, err
	}

	if old_user == nil {
		return nil, &domain.AppError{
			Message:    domain.ErrInvalidCredentials,
			HttpStatus: 401,
		}
	}

	isMatched := ac.passwordService.ComparePassword(old_user.Password, user.Password)
	if !isMatched {
		return nil, &domain.AppError{
			Message:    "Invalid Email or Password",
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
			Message:    domain.ErrSomethingWentWrongAlt,
			HttpStatus: 500,
		}
	}

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

	logger.SetFormatter(&logger.JSONFormatter{})

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

	user := userData.User
	old_user, err := ac.repo.FindByEmail(ctx, user.Email)
	if err != nil && err.HttpStatus != http.StatusNotFound {
		return nil, err
	}

	// login
	if old_user != nil {
		userData.Provider.UserID = old_user.UserID
		err := ac.repo.SaveProvider(ctx, userData.Provider)
		if err != nil {
			logger.WithFields(logger.Fields{
				"provider": userData.Provider,
				"error":    err,
			}).Error(domain.LogFailedCreateRefreshToken)
		}
	} else {
		UserID, err_ := GenerateID(10)
		if err_ != nil {
			return nil, &domain.AppError{
				Message:    domain.ErrSomethingWentWrongAlt,
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
