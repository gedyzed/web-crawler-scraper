package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	domain "web_crawler_scraper/Domain"

	logger "github.com/sirupsen/logrus"

	"golang.org/x/oauth2"
)

type OAuthServices struct {
	providers map[string]*oauth2.Config
	UserURL   map[string]string
}

func NewOAuthServices(
	pds map[string]*oauth2.Config,
	urls map[string]string,
) domain.IOAuthServices {
	return &OAuthServices{
		providers: pds,
		UserURL:   urls,
	}
}

func (os *OAuthServices) RefreshToken(
	ctx context.Context,
	token *domain.RefreshToken,
) (*domain.RefreshToken, *domain.AppError) {

	return nil, nil
}

func (os *OAuthServices) GetAuthURL(
	providerName string,
	state string,
) (string, *domain.AppError) {

	provider, ok := os.providers[providerName]
	if !ok {
		logger.WithFields(logger.Fields{
			"provider": providerName,
		}).Error(domain.LogOAuthProviderNotFound)
		return "", &domain.AppError{
			Message:    domain.ErrProviderNotFound,
			HttpStatus: 404,
		}
	}

	return provider.AuthCodeURL(state), nil
}

func (os *OAuthServices) Exchange(
	ctx context.Context,
	providerName string,
	code string,
) (*domain.ExchangeData, *domain.AppError) {

	provider, ok := os.providers[providerName]
	if !ok {
		logger.WithFields(logger.Fields{
			"provider": providerName,
		}).Error(domain.LogOAuthProviderNotFound)
		return nil, &domain.AppError{
			Message:    domain.ErrProviderNotFound,
			HttpStatus: 404,
		}
	}

	got, err := provider.Exchange(ctx, code)
	if err != nil {
		logger.WithFields(logger.Fields{
			"provider": providerName,
			"error":    err,
		}).Error(domain.LogOAuthTokenExchangeFailed)

		return nil, &domain.AppError{
			Message:    domain.ErrAuthenticationFailed,
			HttpStatus: 401,
		}
	}

	refreshTTL := 7 * 24 * time.Hour
	now := time.Now()

	refreshToken := &domain.RefreshToken{
		Token:     got.RefreshToken,
		ExpiresAt: now.Add(refreshTTL),
	}

	session := &domain.Session{
		Token:     got.AccessToken,
		ExpiresAt: got.Expiry,
	}

	client := provider.Client(ctx, got)
	url := os.UserURL[providerName]
	resp, err := client.Get(url)
	if err != nil {
		logger.WithFields(logger.Fields{
			"client": client,
			"error":  err,
		}).Error(domain.LogOAuthClientConnectionFail)

		return nil, &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}

	}

	defer resp.Body.Close()
	var userInfo domain.OAuthUser
	if err = json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		logger.WithFields(logger.Fields{
			"userInfo": userInfo,
			"error":    err,
		}).Error(domain.LogOAuthFetchUserInfoFailed)

		return nil, &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: 500,
		}
	}

	authProvider := &domain.AuthProvider{
		Provider:   providerName,
		ProviderID: fmt.Sprintf("%d", userInfo.ID),
	}
	
	newUser := &domain.User{
		Email:       userInfo.Email,
		FirstName:   userInfo.GivenName,
		LastName:    userInfo.FamilyName,
		Is_Verified: userInfo.EmailVerified,
		Signed_In:   now,
		AvatarURL:   userInfo.AvatarURL,
	}

	exchangeData := &domain.ExchangeData{
		RefreshToken: refreshToken,
		User:         newUser,
		Provider:     authProvider,
		Session:      session,
	}

	return exchangeData, nil
}
