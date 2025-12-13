package main

import (
	"time"
	route "web_crawler_scraper/Delivery/Route"
	"web_crawler_scraper/Delivery/controller"
	infrastructure "web_crawler_scraper/Infrastrucuture"
	"web_crawler_scraper/Infrastrucuture/config"
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
		"google": googleOAuth,
		"github": githubOAUth,
	}

	oauthUserURL := map[string]string{
		"google": cfg.GoogleCfg.UserURL,
		"github": cfg.GithubCfg.UserURL,
	}

	userRepo := repository.NewUserRepo(db)
	refreshTokenRepo := repository.NewRefreshTokenRepo(db)
	oauthServices := oauth.NewOAuthServices(oauthProviders, oauthUserURL)
	passwordService := infrastructure.NewPasswordService()
	jwtService := infrastructure.NewJwtService(&cfg.JWTConfig)
	authUsecase := usecase.NewAuthUsecase(userRepo,
		refreshTokenRepo,
		rateLimiter,
		oauthServices,
		jwtService,
		passwordService,
	)
	authController := controller.NewAuthController(authUsecase, cfg)

	router := gin.Default()
	router.Use(cors.Default())

	route.AuthRoutes(router, authController)

	router.Run(":" + cfg.App.Port)

}

