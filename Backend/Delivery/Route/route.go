package route

import (
	"web_crawler_scraper/Delivery/controller"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine, 
	authHandler *controller.AuthController,
	crawlerHandler *controller.CrawlerController,
	) {
		
	auth := router.Group("auth")
	{
		auth.POST("/register", authHandler.RegisterUser)
		auth.POST("/login", authHandler.LoginUser)
		auth.GET("/oauth", authHandler.OAuthHandler)
		auth.GET("/oauth/google-callback", authHandler.GoogleOAuthCallBack)
		auth.GET("oauth/github-callback", authHandler.GithubOAuthCallBack)
	}

	crawl := router.Group("crawl")
	{
		crawl.GET("", crawlerHandler.Crawler)
	}

}

