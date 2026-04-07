package route

import (
	"web_crawler_scraper/Delivery/controller"
	middleware "web_crawler_scraper/Infrastrucuture/middleware"

	"github.com/gin-gonic/gin"
)

func AuthRoutes(router *gin.Engine,
	authHandler *controller.AuthController,
	apiKeyHandler *controller.APIKeyController,
	middlewares middleware.IMiddleware,
) {

	auth := router.Group("auth")
	{
		auth.POST("/register", authHandler.RegisterUser)
		auth.POST("/login", authHandler.LoginUser)
		auth.POST("/logout", authHandler.LogoutUser)
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
		profile.DELETE("", authHandler.DeleteUser)

	}

	apiKey := router.Group("auth/api-keys")
	apiKey.Use(middlewares.AuthMiddleware())
	{
		apiKey.POST("", apiKeyHandler.CreateAPIKey)
		apiKey.GET("", apiKeyHandler.ListAPIKeys)
		apiKey.DELETE("/:id", apiKeyHandler.RevokeAPIKey)
	}

}

func CrawlerAndScraperRoutes(
	router *gin.Engine,
	crawlerHandler *controller.CrawlerController,
	scraperHandler *controller.ScrapeController,
	middlewares middleware.IMiddleware,
) {

	// crawler routes

	v1 := router.Group("v1")
	v1.Use(middlewares.APIKeyMiddleware())
	{
		v1.POST("/crawl", crawlerHandler.Crawler)
		v1.POST("/scrape", scraperHandler.Scrape)
		v1.GET("history", crawlerHandler.GetHistory)
	}

	// crawler and scraper trial
	trial := router.Group("trial")
	trial.POST("/crawl", crawlerHandler.Crawler)
	trial.POST("/scrape", scraperHandler.Scrape)

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
	history.GET("/:id/result", crawlerHandler.GetResult)
	history.DELETE("/:id", crawlerHandler.DeleteHistory)

}
