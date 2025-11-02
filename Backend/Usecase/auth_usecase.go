package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	domain "web_crawler_scraper/Domain"
	logger "github.com/sirupsen/logrus"
)
	
type IAuthUsecase interface {
	Register(ctx context.Context, user *domain.User) *domain.AppError
	Login(ctx context.Context, user *domain.User) (*domain.User, *domain.AppError)
}


type authUsecase struct { 
	repo domain.IUserRepo
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

func (ac *authUsecase) Register(ctx context.Context, user *domain.User) *domain.AppError {
	logger.SetFormatter(&logger.JSONFormatter{})

	// check for duplicate email
	user, err := ac.repo.FindByUniqueField(ctx, user.Email);
	if err != nil {
		return err
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

	user.UserID = userID
	if err := ac.repo.Create(ctx, user); err != nil {
		return err
	}

	return nil
}

func (ac *authUsecase) Login(ctx context.Context, user *domain.User)(*domain.User, *domain.AppError){
	return nil, nil
}
