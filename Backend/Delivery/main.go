package main

import (
	"time"
	route "web_crawler_scraper/Delivery/Route"
	"web_crawler_scraper/Delivery/controller"
	domain "web_crawler_scraper/Domain"
	infrastructure "web_crawler_scraper/Infrastrucuture"
	"web_crawler_scraper/Infrastrucuture/config"
	crawlerservicego "web_crawler_scraper/Infrastrucuture/crawler_service.go"
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
	cfg := config.LoadConfig()

	// Logger Initialization
	logrus.SetFormatter(&logrus.JSONFormatter{})
	if cfg.App.Debug {
		logrus.SetLevel(logrus.DebugLevel)
	} else {
		logrus.SetLevel(logrus.InfoLevel)
	}

	db := infrastructure.DBConnect(&cfg.DB)
	redis := infrastructure.NewRedisClient(&cfg.Redis)
	rateLimiter := infrastructure.NewRedisRateLimiter(redis, 5, time.Minute)

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
	sessionRepo := repository.NewSessionRepo(db)
	resultRepo := repository.NewResultRepo(db)

	// services
	oauthServices := oauth.NewOAuthServices(oauthProviders, oauthUserURL)
	passwordService := infrastructure.NewPasswordService()
	jwtService := infrastructure.NewJwtService(&cfg.JWTConfig)
	crawlerFactory := crawlerservicego.NewCrawlerServiceFactory(cfg.Crawler, *redis)
	scraperFactory := crawlerservicego.NewScraperServiceFactory(&cfg.Crawler)

	// usecases
	authUsecase := usecase.NewAuthUsecase(userRepo,
		refreshTokenRepo,
		sessionRepo,
		rateLimiter,
		oauthServices,
		jwtService,
		passwordService,
	)
	crawlUsecase := usecase.NewCrawlerUsecase(resultRepo, crawlerFactory)
	scraperUsecase := usecase.NewScraperUsecase(resultRepo, scraperFactory)

	// controllers
	authController := controller.NewAuthController(authUsecase, cfg)
	crawlController := controller.NewCrawlerController(&cfg.Crawler, crawlUsecase)
	scraperController := controller.NewScraperController(scraperUsecase)

	router := gin.Default()
	router.Use(cors.Default())

	route.AuthRoutes(router, authController)
	route.CrawlerAndScraperRoutes(router, crawlController, scraperController)

	router.Run(":" + cfg.App.Port)

}
