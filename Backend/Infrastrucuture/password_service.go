package infrastructure

import (
	domain "web_crawler_scraper/Domain"
	"golang.org/x/crypto/bcrypt"

	logger "github.com/sirupsen/logrus"
)

type passwordService struct {}

func NewPasswordService() domain.IPasswordService {
	return &passwordService{}
}

func (ps *passwordService) HashPassword(newPassword string) (string, *domain.AppError){

	logger.SetFormatter(&logger.JSONFormatter{})
	hashedPassword, err_ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err_ != nil {
		logger.WithFields(logger.Fields{
			"error": err_,
		}).Error("Failed to Hash user password")
		return "", &domain.AppError{
			Message: "Something went wrong. Try again!",
			HttpStatus: 500,
		}

	}

	return string(hashedPassword), nil
}

func (ps *passwordService) ComparePassword(oldPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(oldPassword), []byte(password))
	if err != nil {
		logger.SetFormatter(&logger.JSONFormatter{})
		logger.WithFields(logger.Fields{
			"error": err,
		}).Error("Password does not match")
		return false
	}
	
	return true
}


