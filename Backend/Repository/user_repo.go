package repository

import (
	"context"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func NewUserRepo(db *gorm.DB) domain.IUserRepo {
	return &userRepo{db: db}
}

type userRepo struct {
	db *gorm.DB
}

func (r *userRepo) Create(ctx context.Context, user *domain.User) *domain.AppError {

	err := r.db.WithContext(ctx).Create(user).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error(domain.LogFailedCreateUser)

		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	return nil
}

func (r *userRepo) FindByID(ctx context.Context, id string) (*domain.User, *domain.AppError) {

	var user domain.User
	if err := r.db.WithContext(ctx).First(&user, id).Error; err != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error(domain.LogUserNotFound)

		return nil, &domain.AppError{
			Message:    domain.ErrUserNotFound,
			HttpStatus: 404,
		}
	}
	return &user, nil
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*domain.User, *domain.AppError) {

	var user domain.User
	if err := r.db.WithContext(ctx).First(&user, &domain.User{Email: email}).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			logger.WithFields(logger.Fields{
				"user":  user,
				"error": err,
			}).Error(domain.LogUserNotFound)
			return nil, &domain.AppError{
				Message:    domain.ErrUserNotFound,
				HttpStatus: 404,
			}
		}

		return nil, &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	return &user, nil
}

func (r *userRepo) Update(ctx context.Context, user *domain.User) (*domain.User, *domain.AppError) {

	err := r.db.WithContext(ctx).Model(domain.User{}).Where("user_id = ?", user.UserID).Updates(user).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"user":  user,
			"error": err,
		}).Error(domain.LogFailedUpdateUser)

		return nil, &domain.AppError{
			Message:    domain.ErrCannotUpdateUser,
			HttpStatus: 500,
		}
	}

	return user, nil
}

func (r *userRepo) SaveProvider(ctx context.Context, provider *domain.AuthProvider) *domain.AppError {

	err := r.db.WithContext(ctx).Create(provider).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"provider": provider,
			"error":    err,
		}).Error(domain.LogFailedCreateUser)

		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	return nil

}

func (r *userRepo) CreateVerificationCode(ctx context.Context, verification *domain.VerificationCode) *domain.AppError {

	if err := r.db.WithContext(ctx).Where("email = ?", verification.Email).Delete(&domain.VerificationCode{}).Error; err != nil {
		logger.WithFields(logger.Fields{
			"email": verification.Email,
			"error": err,
		}).Error("Failed to delete existing verification code")
	}

	err := r.db.WithContext(ctx).Create(verification).Error
	if err != nil {
		logger.WithFields(logger.Fields{
			"verification": verification,
			"error":        err,
		}).Error(domain.LogFailedCreateUser)

		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	return nil
}

func (r *userRepo) FindVerificationCode(ctx context.Context, email string) (*domain.VerificationCode, *domain.AppError) {
	var verification domain.VerificationCode
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			logger.WithFields(logger.Fields{
				"email": email,
				"error": err,
			}).Error(domain.LogVerificationCodeNotFound)
			return nil, &domain.AppError{
				Message:    domain.ErrInvalidVerificationCode,
				HttpStatus: 404,
			}
		}
		return nil, &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}
	return &verification, nil
}

func (r *userRepo) DeleteVerificationCode(ctx context.Context, email string) *domain.AppError {
	if err := r.db.WithContext(ctx).Where("email = ?", email).Delete(&domain.VerificationCode{}).Error; err != nil {
		logger.WithFields(logger.Fields{
			"email": email,
			"error": err,
		}).Error("Failed to delete verification code")
		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}
	return nil
}
