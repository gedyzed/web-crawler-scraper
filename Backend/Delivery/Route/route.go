package route

import (
	"web_crawler_scraper/Delivery/controller"
	middleware "web_crawler_scraper/Infrastrucuture/middle_ware"

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
	middleware    middleware.IMiddleware,
	) {

		// crawler routes
		crawl := router.Group("crawl")
		crawl.Use(middleware.AuthMiddleware())
		crawl.GET("", crawlerHandler.Crawler)


		// scraper routes
		scrape := router.Group("scrape")
		scrape.Use(middleware.AuthMiddleware())
		scrape.GET("", scraperHandler.Scrape)
}
