package controller

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"
	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"

	passwordvalidator "github.com/wagslane/go-password-validator"

	"github.com/gin-gonic/gin"
)


type AuthController struct {
	authUC usecase.IAuthUsecase
}

func NewAuthController(uc usecase.IAuthUsecase) *AuthController {
	return &AuthController{
		authUC: uc, 
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
	if err := c.ShouldBindJSON(&user); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error" : "Invalid Input Format"})
		return
	}

	if user.Email == "" || !IsValidEmail(user.Email) {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid or Incorrect Email"})
		return
	}

	// normalize email
	normalizeEmail := strings.ToLower(user.Email)
	user.Email = normalizeEmail

	const minEntropyBits = 30
	err := passwordvalidator.Validate(user.Password, minEntropyBits)
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return 
	}

	appError := ac.authUC.Register(ctx, &user, ip)
	if appError != nil {
		c.IndentedJSON(appError.HttpStatus, gin.H{"error": appError.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "User Registered Successfully. PLease Verify Email"})
}

func (ac *AuthController) LoginUser(c *gin.Context) {

	ctx := c.Request.Context()
	ip := c.ClientIP()

	var user domain.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid Input Format"})
		c.Abort()
		return
	}

	isValid := IsValidEmail(user.Email)
	if !isValid {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid Email"})
		c.Abort()
		return 
	} 

	response, err := ac.authUC.Login(ctx, &user, ip)
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err})
		c.Abort()
		return 
	}

	c.SetCookie (
		"accessToken",
		response.Session.Token,
		5 * 60,
		"/",
		"localhost",
		false, 
		true,
	)

	c.SetCookie(
		"refresh_token",
		response.RefreshToken.Token,
		7 * 24 * 60 * 60,
		"/",
		"localhost",
		false,
		true,
	)

	c.IndentedJSON(http.StatusOK, gin.H{"message": "welcome to homepage"})

}

func (ac *AuthController) OAuthHandler(c *gin.Context) {

	providerName := c.Query("provider")
	url, err := ac.authUC.GetLoginURL(providerName, "state")
	if err != nil {
		c.IndentedJSON(err.HttpStatus, gin.H{"error" : err.Message})
		c.Abort()
		return 
	}

	url += fmt.Sprintf("&provider=%s", providerName)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (ac *AuthController) GoogleOAuthCallBack(c *gin.Context){
	provider := "google"
	ac.OAuthCallback(c, provider)
}

func (ac *AuthController) GithubOAuthCallBack(c *gin.Context){
	provider := "github"
	ac.OAuthCallback(c, provider)
}

func (ac *AuthController) OAuthCallback(c *gin.Context, provider string){

	ctx := c.Request.Context()
	code := c.Query("code")
	ipAddress := c.ClientIP()

	response, err := ac.authUC.RegisterOrLogin(ctx, provider, code, ipAddress)
	if err != nil {
		c.IndentedJSON(err.HttpStatus, gin.H{"error" : err.Message})
		c.Abort()
		return 
	}

	c.SetCookie (
		"accessToken",
		response.Session.Token,
		5 * 60,
		"/",
		"localhost",
		false, 
		true,
	)

	refreshToken := response.RefreshToken
	c.SetCookie(
		"refresh_token",
		refreshToken.Token,
		7 * 24 * 60 * 60,
		"/",
		"localhost",
		false, 
		true,
	)


	c.IndentedJSON(http.StatusOK, response.Session)
}
