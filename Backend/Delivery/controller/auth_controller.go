package controller

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
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
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	if user.Email == "" || !IsValidEmail(user.Email) {
		logrus.WithField("email", user.Email).Debug(domain.LogRegisterInvalidEmail)
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidEmail})
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
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": err.Error()})
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
		c.IndentedJSON(appError.HttpStatus, gin.H{"message": appError.Message})
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
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	// Normalize and validate email
	normalizeEmail := strings.ToLower(user.Email)
	user.Email = normalizeEmail
	isValid := IsValidEmail(user.Email)
	if !isValid || user.Password == "" {
		logrus.WithField("email", user.Email).Debug(domain.LogLoginInvalidEmail)
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidCredentials})
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
		c.IndentedJSON(err.HttpStatus, gin.H{"message": err.Message})
		return
	}

	c.SetSameSite(http.SameSiteNoneMode)

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
		domain.RefreshTokenCookie,
		response.RefreshToken.Token,
		int(ac.cfg.JWTConfig.RefreshTTL.Seconds()),
		"/auth/refresh",
		ac.cfg.App.Domain,
		ac.cfg.App.SecureCookies,
		true,
	)

	c.IndentedJSON(http.StatusOK, gin.H{
		"user": gin.H{
			"user_id":     response.User.UserID,
			"first_name":  response.User.FirstName,
			"last_name":   response.User.LastName,
			"email":       response.User.Email,
			"is_verified": response.User.Is_Verified,
			"avatar_url":  response.User.AvatarURL,
		},
	})

}

func (ac *AuthController) OAuthHandler(c *gin.Context) {

	providerName := c.Query("provider")

	state, err := usecase.GenerateID(16)
	if err != nil {
		c.IndentedJSON(http.StatusInternalServerError, gin.H{"message": domain.ErrInternalServer})
		return
	}

	// Use empty string for cookie domain so it defaults to current host
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("oauth_state", state, 3600, "/", "", ac.cfg.App.SecureCookies, true)

	url, appErr := ac.authUC.GetLoginURL(providerName, state)
	if appErr != nil {
		c.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

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

	state := c.Query("state")
	oauthState, err_ := c.Cookie("oauth_state")
	if err_ != nil || state == "" || state != oauthState {
		logrus.WithFields(logrus.Fields{
			"expected": oauthState,
			"got":      state,
			"error":    err_,
		}).Error("Invalid OAuth state")
		errMsg := url.QueryEscape("Invalid OAuth state")
		c.Redirect(http.StatusSeeOther, fmt.Sprintf("%s/signup?provider=%s&error=%s", ac.cfg.App.Domain, provider, errMsg))
		c.Abort()
		return
	}

	// clear oauth state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", ac.cfg.App.SecureCookies, true)

	ctx := c.Request.Context()
	code := c.Query("code")
	if code == "" {
		errMsg := url.QueryEscape("Missing authorization code")
		c.Redirect(http.StatusSeeOther, fmt.Sprintf("%s/signup?provider=%s&error=%s", ac.cfg.App.Domain, provider, errMsg))
		c.Abort()
		return
	}
	ipAddress := c.ClientIP()

	if ac.cfg.App.Debug {
		logrus.WithFields(logrus.Fields{
			"provider": provider,
			"ip":       ipAddress,
		}).Debug("OAuth callback received")
	}

	response, err := ac.authUC.RegisterOrLogin(ctx, provider, code, ipAddress)
	if err != nil {
		errMsg := url.QueryEscape(err.Message)
		c.Redirect(http.StatusSeeOther, fmt.Sprintf("%s/signup?provider=%s&error=%s", ac.cfg.App.Domain, provider, errMsg))
		c.Abort()
		return
	}

	if response == nil || response.Session == nil || response.RefreshToken == nil {
		errMsg := url.QueryEscape("Authentication failed")
		c.Redirect(http.StatusSeeOther, fmt.Sprintf("%s/signup?provider=%s&error=%s", ac.cfg.App.Domain, provider, errMsg))
		c.Abort()
		return
	}

	c.SetSameSite(http.SameSiteNoneMode)


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
		domain.RefreshTokenCookie,
		response.RefreshToken.Token,
		int(ac.cfg.JWTConfig.RefreshTTL.Seconds()),
		"/auth/refresh",
		ac.cfg.App.Domain,
		ac.cfg.App.SecureCookies,
		true,
	)

	c.Redirect(http.StatusSeeOther, fmt.Sprintf("%s/dashboard?provider=%s", ac.cfg.App.Domain, provider))

}

func (ac *AuthController) RefreshToken(c *gin.Context) {

	ctx := c.Request.Context()

	refreshToken, err := c.Cookie(domain.RefreshTokenCookie)
	if refreshToken == "" || err != nil {
		c.IndentedJSON(
			http.StatusBadRequest,
			gin.H{"message": "Invalid refresh token"},
		)
		return
	}

	newAccessToken, newRefreshToken, err_ := ac.authUC.RefreshToken(ctx, refreshToken)
	if err_ != nil {
		c.IndentedJSON(
			err_.HttpStatus,
			gin.H{"message": err_.Message},
		)
		return
	}

	c.SetSameSite(http.SameSiteNoneMode)

	c.SetCookie(
		domain.AccessToken,
		newAccessToken,
		int(ac.cfg.JWTConfig.AccessTTL.Seconds()),
		"/",
		ac.cfg.App.Domain,
		ac.cfg.App.SecureCookies,
		true,
	)

	if newRefreshToken != "" {
		c.SetCookie(
			domain.RefreshTokenCookie,
			newRefreshToken,
			int(ac.cfg.JWTConfig.RefreshTTL.Seconds()),
			"/auth/refresh",
			ac.cfg.App.Domain,
			ac.cfg.App.SecureCookies,
			true,
		)
	}
}

func (ac *AuthController) GetProfile(c *gin.Context) {
	ctx := c.Request.Context()
	userID := c.GetString("userID")

	user, err := ac.authUC.GetUserByID(ctx, userID)
	if err != nil {
		c.IndentedJSON(err.HttpStatus, gin.H{"message": err.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{
		"user_id":     user.UserID,
		"first_name":  user.FirstName,
		"last_name":   user.LastName,
		"email":       user.Email,
		"is_verified": user.Is_Verified,
		"avatar_url":  user.AvatarURL,
	})
}

func (ac *AuthController) ForgotPassword(c *gin.Context) {
	ctx := c.Request.Context()
	var request struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	appErr := ac.authUC.ForgotPassword(ctx, request.Email)
	if appErr != nil {
		c.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Reset code sent to your email"})
}

func (ac *AuthController) VerifyResetCode(c *gin.Context) {
	ctx := c.Request.Context()
	var request struct {
		Email string `json:"email" binding:"required"`
		Code  string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	appErr := ac.authUC.VerifyResetCode(ctx, request.Email, request.Code)
	if appErr != nil {
		c.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Code verified successfully"})
}

func (ac *AuthController) ResetPassword(c *gin.Context) {
	ctx := c.Request.Context()
	var request struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	appErr := ac.authUC.ResetPassword(ctx, request.Email, request.Password)
	if appErr != nil {
		c.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (ac *AuthController) ResendVerificationEmail(c *gin.Context) {
	ctx := c.Request.Context()
	var request struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	if !IsValidEmail(request.Email) {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidEmail})
		return
	}

	appErr := ac.authUC.SendVerificationEmail(ctx, strings.ToLower(request.Email))
	if appErr != nil {
		c.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "Verification email sent successfully"})
}

func (ac *AuthController) VerifyEmail(c *gin.Context) {
	ctx := c.Request.Context()
	var request struct {
		Email string `json:"email" binding:"required"`
		Code  int64  `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	if !IsValidEmail(request.Email) {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidEmail})
		return
	}

	appErr := ac.authUC.VerifyEmail(ctx, strings.ToLower(request.Email), request.Code)
	if appErr != nil {
		c.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": domain.MsgEmailVerifiedSuccess})
}
