package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)
	
type IAuthUsecase interface {
	Register(ctx context.Context, user *domain.User, ip string) *domain.AppError
	Login(ctx context.Context, user *domain.User, ip string) (*domain.User, *domain.AppError)
}

type IRateLimiter interface {
	Allow(ctx context.Context, ip string)(bool, *domain.AppError)
}

type authUsecase struct { 
	repo domain.IUserRepo
	rateLimiter IRateLimiter
}

func NewAuthUsecase(repo domain.IUserRepo) IAuthUsecase {
	return &authUsecase{repo: repo}
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
			"user": user,
			"error": err,
		}).Error("Failed to get the rate limiter")
		return &domain.AppError{
			Message: "Something Went Wrong. Try again",
			HttpStatus: 500,
		}
	}

	if !allowed {
		return &domain.AppError{
			Message: "Too Many Request. Try again Later!",
			HttpStatus: 429,
		}
	}


	// check for duplicate email
	old_user, err := ac.repo.FindByEmail(ctx, user.Email);
	if err == nil && old_user != nil {
		return &domain.AppError{
			Message: "Email Already Registered",
			HttpStatus: 409,
		}
	}

	userID, err_ := GenerateID(16)
	if err_ != nil {
		logger.WithFields(logger.Fields{
			"user": user,
			"error": err_,
		}).Error("Failed to Create UserID")
		return &domain.AppError{
			Message: "Something went wrong. Try again!",
			HttpStatus: 500,
		}
	}
	
	hashedPassword, err_ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err_ != nil {
		logger.WithFields(logger.Fields{
			"user": user,
			"error": err_,
		}).Error("Failed to Hash user password")
		return &domain.AppError{
			Message: "Something went wrong. Try again!",
			HttpStatus: 500,
		}

	}
	user.UserID = userID
	user.Password = string(hashedPassword)

	if err := ac.repo.Create(ctx, user); err != nil {
		return err
	 }

	return nil
}

func (ac *authUsecase) Login(ctx context.Context, user *domain.User, ip string)(*domain.User, *domain.AppError){
	return nil, nil
}
