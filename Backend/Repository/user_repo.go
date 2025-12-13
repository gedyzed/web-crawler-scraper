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

	logger.SetFormatter(&logger.JSONFormatter{})
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

	logger.SetFormatter(&logger.JSONFormatter{})

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

	logger.SetFormatter(&logger.JSONFormatter{})

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

	logger.SetFormatter(&logger.JSONFormatter{})
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
	logger.SetFormatter(&logger.JSONFormatter{})
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
