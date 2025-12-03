package oauth

import (
	"web_crawler_scraper/Infrastrucuture/config"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func NewGoogleOAuthConfig(cfg *config.OAuthConfig) *oauth2.Config {
	return &oauth2.Config{
		ClientID: cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		Endpoint: google.Endpoint,
		RedirectURL: cfg.RedirectURL,
		Scopes: cfg.Scopes,
	}
}

