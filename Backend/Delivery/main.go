package main

import (
	"time"
	route "web_crawler_scraper/Delivery/Route"
	"web_crawler_scraper/Delivery/controller"
	domain "web_crawler_scraper/Domain"
	infrastructure "web_crawler_scraper/Infrastrucuture"
	"web_crawler_scraper/Infrastrucuture/config"
	crawlerservicego "web_crawler_scraper/Infrastrucuture/crawler_service.go"
	emailService "web_crawler_scraper/Infrastrucuture/email_service"
	middleware "web_crawler_scraper/Infrastrucuture/middleware"
	"web_crawler_scraper/Infrastrucuture/oauth"
	repository "web_crawler_scraper/Repository"
	usecase "web_crawler_scraper/Usecase"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
)

func main() {

	// Initialization
	cfg := config.LoadConfig(".")

	// Logger Initialization
	logrus.SetFormatter(&logrus.JSONFormatter{})
	if cfg.App.Debug {
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		logrus.SetLevel(logrus.InfoLevel)
	}

	db := infrastructure.DBConnect(&cfg.DB)
	redis := infrastructure.NewRedisClient(&cfg.Redis)
	rateLimiter := infrastructure.NewRedisRateLimiter(redis, cfg.RateLimit.Auth.Limit, cfg.RateLimit.Auth.Window)
	apiKeyRateLimiter := infrastructure.NewAPIKeyRedisRateLimiter(redis)

	if err := db.AutoMigrate(&domain.ApiKey{}); err != nil {
		logrus.WithError(err).Fatal("failed to migrate api_keys table")
	}

	// OAuth Initialization
	googleOAuth := oauth.NewGoogleOAuthConfig(&cfg.GoogleCfg)
	githubOAUth := oauth.NewGithubOAuthConfig(&cfg.GithubCfg)
	oauthProviders := map[string]*oauth2.Config{
		domain.Google: googleOAuth,
		domain.Github: githubOAUth,
	}

	oauthUserURL := map[string]string{
		domain.Google: cfg.GoogleCfg.UserURL,
		domain.Github: cfg.GithubCfg.UserURL,
	}

	// repos
	userRepo := repository.NewUserRepo(db)
	refreshTokenRepo := repository.NewRefreshTokenRepo(db)
	resultRepo := repository.NewResultRepo(db)
	apiKeyRepo := repository.NewApiKeyRepo(db)

	// services
	oauthServices := oauth.NewOAuthServices(oauthProviders, oauthUserURL)
	passwordService := infrastructure.NewPasswordService()
	emailService := emailService.NewEmailService(&cfg.Email)
	jwtService := infrastructure.NewJwtService(&cfg.JWTConfig)
	crawlerFactory := crawlerservicego.NewCrawlerServiceFactory(cfg.Crawler, *redis)
	scraperFactory := crawlerservicego.NewScraperServiceFactory()

	// usecases
	authUsecase := usecase.NewAuthUsecase(userRepo,
		refreshTokenRepo,
		rateLimiter,
		oauthServices,
		jwtService,
		passwordService,
		emailService,
	)
	crawlUsecase := usecase.NewCrawlerUsecase(resultRepo, crawlerFactory, rateLimiter)
	scraperUsecase := usecase.NewScraperUsecase(resultRepo, scraperFactory, rateLimiter)
	apiKeyUsecase := usecase.NewApiKeyUsecase(
		apiKeyRepo,
		cfg.RateLimit.APIKey.MaxKeysPerUser,
		cfg.RateLimit.APIKey.DailyLimit,
	)

	// controllers
	authController := controller.NewAuthController(authUsecase, cfg)
	apiKeyController := controller.NewAPIKeyController(apiKeyUsecase)
	crawlController := controller.NewCrawlerController(&cfg.Crawler, crawlUsecase)
	scraperController := controller.NewScraperController(scraperUsecase)

	// Middlewares
	middlewares := middleware.NewMiddleware(jwtService, apiKeyUsecase, apiKeyRateLimiter)

	if cfg.App.Debug {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			cfg.App.Domain,
			"https://web-crawler-scraper.vercel.app",
			"https://www.spidergo.app",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.Use(middlewares.RequestLogger())

	route.AuthRoutes(router, authController, apiKeyController, middlewares)
	route.CrawlerAndScraperRoutes(router, crawlController, scraperController, middlewares)

	router.Run(":" + cfg.App.Port)

}
