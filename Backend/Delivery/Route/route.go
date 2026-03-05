package route

import (
	"web_crawler_scraper/Delivery/controller"
	middleware "web_crawler_scraper/Infrastrucuture/middleware"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine,
	authHandler *controller.AuthController,
	middlewares middleware.IMiddleware,
) {

	auth := router.Group("auth")
	{
		auth.POST("/register", authHandler.RegisterUser)
		auth.POST("/login", authHandler.LoginUser)
		auth.GET("/oauth", authHandler.OAuthHandler)
		auth.GET("/oauth/google", authHandler.GoogleOAuthCallBack)
		auth.GET("/oauth/github", authHandler.GithubOAuthCallBack)
		auth.POST("/resend-email", authHandler.ResendVerificationEmail)
		auth.POST("/verify-email", authHandler.VerifyEmail)
		auth.GET("/refresh", authHandler.RefreshToken)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/verify-reset-code", authHandler.VerifyResetCode)
		auth.POST("/reset-password", authHandler.ResetPassword)
	}

	// Profile route
	profile := router.Group("auth/me")
	profile.Use(middlewares.AuthMiddleware())
	{
		profile.GET("", authHandler.GetProfile)
	}
}

func CrawlerAndScraperRoutes(
	router *gin.Engine,
	crawlerHandler *controller.CrawlerController,
	scraperHandler *controller.ScrapeController,
	middlewares middleware.IMiddleware,
) {

	// crawler routes
	crawl := router.Group("crawl")
	crawl.Use(middlewares.AuthMiddleware())
	crawl.POST("", crawlerHandler.Crawler)

	// scraper routes
	scrape := router.Group("scrape")
	scrape.Use(middlewares.AuthMiddleware())
	scrape.POST("", scraperHandler.Scrape)

	// history routes
	history := router.Group("history")
	history.Use(middlewares.AuthMiddleware())
	history.GET("", crawlerHandler.GetHistory)

}
