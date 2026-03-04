package infrastructure

import (
	"context"
	"time"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"github.com/golang-jwt/jwt/v5"
	logrus "github.com/sirupsen/logrus"
)

type jwtService struct {
	config *config.JWTConfig
}

func NewJwtService(cfg *config.JWTConfig) domain.IJwtService {
	return &jwtService{config: cfg}
}

func (js *jwtService) GenerateTokens(ctx context.Context, userID string) (*domain.ExchangeData, *domain.AppError) {

	accessToken, err := js.GenerateToken(userID, js.config.AccessKey, js.config.AccessTTL)
	if err != nil {
		logrus.WithError(err).Error(domain.LogFailedGenerateToken)
		return nil, &domain.AppError{
			Message:    "Something Went Wrong.",
			HttpStatus: 500,
		}
	}
	session := &domain.Session{
		Token:     accessToken,
		ExpiresAt: time.Now().Add(js.config.AccessTTL),
	}

	refreshToken, err := js.GenerateToken(userID, js.config.RefreshKey, js.config.RefreshTTL)
	if err != nil {
		logrus.WithError(err).Error(domain.LogFailedGenerateToken)
		return nil, &domain.AppError{
			Message:    "Something Went Wrong.",
			HttpStatus: 500,
		}
	}

	refresh := &domain.RefreshToken{
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(js.config.RefreshTTL),
	}

	userData := &domain.ExchangeData{
		Session:      session,
		RefreshToken: refresh,
	}

	return userData, nil
}

func (js *jwtService) GenerateToken(userID, secret string, ttl time.Duration) (string, error) {

	now := time.Now()
	expirationTime := now.Add(ttl)
	claims := &domain.Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    "SpiderGO",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (js *jwtService) ValidateToken(tokenString string, tokenName string) (*domain.Claims, *domain.AppError) {

	key := []byte(js.config.AccessKey)
	if tokenName != domain.AccessToken {
		key = []byte(js.config.RefreshKey)
	}

	claims := &domain.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return key, nil
	})

	if err != nil {
		logrus.WithError(err).Debug(domain.LogFailedValidateToken)
		return nil, &domain.AppError{
			Message:    "Unauthorized Request",
			HttpStatus: 401,
		}
	}

	if !token.Valid {
		logrus.Debug(domain.LogFailedValidateToken)
		return nil, &domain.AppError{
			Message:    "Unauthorized Request",
			HttpStatus: 401,
		}
	}

	return claims, nil
}

func (js *jwtService) RefreshToken(ctx context.Context, refreshToken string) (*domain.ExchangeData, *domain.AppError) {

	claims, err := js.ValidateToken(refreshToken, "RefreshToken")
	if err != nil {
		return nil, err
	}

	UserID := claims.UserID
	accessToken, err_ := js.GenerateToken(UserID, js.config.AccessKey, js.config.AccessTTL)
	if err_ != nil {
		logrus.WithError(err_).Error(domain.LogFailedRefreshToken)
		return nil, &domain.AppError{
			Message:    "Internal Server Error",
			HttpStatus: 500,
		}
	}

	newRefreshToken := ""
	if time.Until(claims.ExpiresAt.Time) <= 30*time.Second {
		newRefreshToken, err_ = js.GenerateToken(UserID, js.config.RefreshKey, js.config.RefreshTTL)
		if err_ != nil {
			logrus.WithError(err_).Error(domain.LogFailedRefreshToken)
			return nil, &domain.AppError{
				Message:    "Internal Server Error",
				HttpStatus: 500,
			}
		}
	}

	var refresh *domain.RefreshToken
	if newRefreshToken != "" {
		refresh = &domain.RefreshToken{
			UserID:    UserID,
			Token:     newRefreshToken,
			ExpiresAt: time.Now().Add(js.config.RefreshTTL),
		}
	}

	userData := &domain.ExchangeData{
		Session: &domain.Session{
			UserID:    UserID,
			Token:     accessToken,
			ExpiresAt: time.Now().Add(time.Duration(js.config.AccessTTL)),
		},

		RefreshToken: refresh,
	}

	return userData, nil
}
