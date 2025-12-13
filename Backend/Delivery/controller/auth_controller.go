package controller

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"

	"web_crawler_scraper/Infrastrucuture/config"

	passwordvalidator "github.com/wagslane/go-password-validator"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type AuthController struct {
	authUC usecase.IAuthUsecase
	cfg    *config.Config
}

func NewAuthController(uc usecase.IAuthUsecase, cfg *config.Config) *AuthController {
	return &AuthController{
		authUC: uc,
		cfg:    cfg,
	}
}

func IsValidEmail(email string) bool {
	regex := `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`
	re := regexp.MustCompile(regex)
	return re.MatchString(email)
}

func (ac *AuthController) RegisterUser(c *gin.Context) {

	ctx := c.Request.Context()
	ip := c.ClientIP()

	var user domain.User
	// Conditional Debug Logging
	if ac.cfg.App.Debug {
		bodyBytes, _ := io.ReadAll(c.Request.Body)
		// Restore the io.ReadCloser to its original state
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		logrus.WithFields(logrus.Fields{
			"headers": c.Request.Header,
			"body":    string(bodyBytes),
		}).Debug(domain.LogRegisterRequestDump)
	}

	if err := c.ShouldBindJSON(&user); err != nil {
		logrus.WithError(err).Debug(domain.LogRegisterBindingError)
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": domain.ErrInvalidInputFormat})
		return
	}

	if user.Email == "" || !IsValidEmail(user.Email) {
		logrus.WithField("email", user.Email).Debug(domain.LogRegisterInvalidEmail)
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": domain.ErrInvalidEmail})
		return
	}

	// normalize email
	normalizeEmail := strings.ToLower(user.Email)
	user.Email = normalizeEmail

	// validate password and strength
	minEntropyBits := ac.cfg.Security.MinEntropyBits
	err := passwordvalidator.Validate(user.Password, minEntropyBits)
	if err != nil {
		logrus.WithError(err).Debug(domain.LogRegisterWeakPassword)
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appError := ac.authUC.Register(ctx, &user, ip)
	if appError != nil {
		// Log system errors at Error level
		if appError.HttpStatus >= 500 {
			logrus.WithFields(logrus.Fields{
				"error":       appError.Message,
				"http_status": appError.HttpStatus,
				"email":       user.Email,
				"ip":          ip,
			}).Error(domain.LogRegisterSystemError)
		} else {
			// Log client errors at Debug level
			logrus.WithFields(logrus.Fields{
				"error":       appError.Message,
				"http_status": appError.HttpStatus,
			}).Debug(domain.LogRegisterClientError)
		}
		c.IndentedJSON(appError.HttpStatus, gin.H{"error": appError.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": domain.MsgUserRegisteredSuccess})
}

func (ac *AuthController) LoginUser(c *gin.Context) {

	ctx := c.Request.Context()
	ip := c.ClientIP()

	var user domain.User
	if ac.cfg.App.Debug {
		bodyBytes, _ := io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		logrus.WithFields(logrus.Fields{
			"headers": c.Request.Header,
			"body":    string(bodyBytes),
		}).Debug(domain.LogLoginRequestDump)
	}
	if err := c.ShouldBindJSON(&user); err != nil {
		logrus.WithError(err).Debug(domain.LogLoginBindingError)
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": domain.ErrInvalidInputFormat})
		return
	}

	// Normalize and validate email
	normalizeEmail := strings.ToLower(user.Email)
	user.Email = normalizeEmail
	isValid := IsValidEmail(user.Email)
	if !isValid || user.Password == "" {
		logrus.WithField("email", user.Email).Debug(domain.LogLoginInvalidEmail)
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": domain.ErrInvalidCredentials})
		return
	}

	response, err := ac.authUC.Login(ctx, &user, ip)
	if err != nil {
		if err.HttpStatus >= 500 {
			logrus.WithFields(logrus.Fields{
				"error":       err.Message,
				"http_status": err.HttpStatus,
				"email":       user.Email,
				"ip":          ip,
			}).Error(domain.LogLoginSystemError)
		} else {
			logrus.WithFields(logrus.Fields{
				"error":       err.Message,
				"http_status": err.HttpStatus,
				"email":       user.Email,
				"ip":          ip,
			}).Debug(domain.LogLoginClientError)
		}
		c.IndentedJSON(err.HttpStatus, gin.H{"error": err.Message})
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)

	c.SetCookie(
		domain.AccessToken,
		response.Session.Token,
		int(ac.cfg.JWTConfig.AccessTTL.Seconds()),
		"/",
		ac.cfg.App.Domain,
		ac.cfg.App.SecureCookies,
		true,
	)

	c.SetCookie(
		domain.RefreshToken_,
		response.RefreshToken.Token,
		int(ac.cfg.JWTConfig.RefreshTTL.Seconds()),
		"/",
		ac.cfg.App.Domain,
		ac.cfg.App.SecureCookies,
		true,
	)

	c.IndentedJSON(http.StatusOK, gin.H{"message": "welcome to homepage"})

}

func (ac *AuthController) OAuthHandler(c *gin.Context) {

	providerName := c.Query("provider")
	url, err := ac.authUC.GetLoginURL(providerName, "state")
	if err != nil {
		c.IndentedJSON(err.HttpStatus, gin.H{"error": err.Message})
		return
	}

	url += fmt.Sprintf("&provider=%s", providerName)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (ac *AuthController) GoogleOAuthCallBack(c *gin.Context) {
	provider := "google"
	ac.OAuthCallback(c, provider)
}

func (ac *AuthController) GithubOAuthCallBack(c *gin.Context) {
	provider := "github"
	ac.OAuthCallback(c, provider)
}

func (ac *AuthController) OAuthCallback(c *gin.Context, provider string) {

	ctx := c.Request.Context()
	code := c.Query("code")
	ipAddress := c.ClientIP()

	response, err := ac.authUC.RegisterOrLogin(ctx, provider, code, ipAddress)
	if err != nil {
		c.IndentedJSON(err.HttpStatus, gin.H{"error": err.Message})
		return
	}

	c.SetCookie(
		domain.AccessToken,
		response.Session.Token,
		int(ac.cfg.JWTConfig.AccessTTL.Seconds()),
		"/",
		ac.cfg.App.Domain,
		false,
		true,
	)

	refreshToken := response.RefreshToken
	c.SetCookie(
		domain.RefreshToken_,
		refreshToken.Token,
		int(ac.cfg.JWTConfig.RefreshTTL.Seconds()),
		"/",
		ac.cfg.App.Domain,
		ac.cfg.App.SecureCookies,
		true,
	)

	c.IndentedJSON(http.StatusOK, response.Session)
}
