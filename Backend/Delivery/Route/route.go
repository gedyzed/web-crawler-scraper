package route

import (
	"web_crawler_scraper/Delivery/controller"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine, 
	authHandler *controller.AuthController,
	
	) {
		
	auth := router.Group("auth")
	{
		auth.POST("/register", authHandler.RegisterUser)
		auth.POST("/login", authHandler.LoginUser)
		auth.GET("/oauth", authHandler.OAuthHandler)
		auth.GET("/oauth/google-callback", authHandler.GoogleOAuthCallBack)
		auth.GET("oauth/github-callback", authHandler.GithubOAuthCallBack)
		auth.POST("/refresh", authHandler.RefreshToken)
	}
}

func CrawlerAndScraperRoutes(
	router 		   *gin.Engine,
	crawlerHandler *controller.CrawlerController,
	scraperHandler *controller.ScrapeController,
	) {
		// crawler routes
		crawl := router.Group("crawl")
		crawl.GET("", crawlerHandler.Crawler)


		// scraper routes
		scrape := router.Group("scrape")
		scrape.GET("", scraperHandler.Scrape)
}

