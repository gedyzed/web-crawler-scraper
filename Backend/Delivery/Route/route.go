package route

import (
	"web_crawler_scraper/Delivery/controller"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine, handler *controller.AuthController) {

	auth := router.Group("auth")
	{
		auth.POST("/register", handler.RegisterUser)
		auth.POST("/login", handler.LoginUser)
		auth.GET("/oauth", handler.OAuthHandler)
		auth.GET("/oauth/google-callback", handler.GoogleOAuthCallBack)
		auth.GET("oauth/github-callback", handler.GithubOAuthCallBack)
	}

}

