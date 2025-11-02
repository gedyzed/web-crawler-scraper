package controller

import (
	"net/http"
	"regexp"
	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"
	passwordvalidator "github.com/wagslane/go-password-validator"

	"github.com/gin-gonic/gin"

)

type AuthController struct {
	authUC usecase.IAuthUsecase
}

func NewAuthController(uc usecase.IAuthUsecase) *AuthController {
	return &AuthController{authUC: uc}
}

func IsValidEmail(email string) bool {
		regex := `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`
		re := regexp.MustCompile(regex)
		return re.MatchString(email)
	}

func (ac *AuthController) RegisterUser(c *gin.Context) {

	ctx := c.Request.Context()

	var user domain.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error" : "Invalid Input Format"})
		return
	}

	if user.Email == "" || !IsValidEmail(user.Email) {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid or Incorrect Email"})
		return
	}

	const minEntropyBits = 50
	err := passwordvalidator.Validate(user.Password, minEntropyBits)
	if err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": err})
		return 
	}

	appError := ac.authUC.Register(ctx, &user)
	if appError != nil {
		c.IndentedJSON(appError.HttpStatus, gin.H{"error": appError.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": "User Registered Successfully!"})
}

func (ac *AuthController) LoginUser(c *gin.Context) {

}
