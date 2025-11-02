package main

import (
	route "web_crawler_scraper/Delivery/Route"
	"web_crawler_scraper/Delivery/controller"
	"web_crawler_scraper/Infrastrucuture"
	"web_crawler_scraper/Infrastrucuture/config"
	repository "web_crawler_scraper/Repository"
	usecase "web_crawler_scraper/Usecase"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	// Initialization 
	cfg := config.LoadConfig()
	db := infrastructure.DBConnect(&cfg.DB)

	userRepo := repository.NewUserRepo(db)
	authUsecase := usecase.NewAuthUsecase(userRepo)
	authController := controller.NewAuthController(authUsecase)

	router := gin.Default()
	router.Use(cors.Default())

	route.AuthRoutes(router, authController)

	router.Run(":" + cfg.App.Port)

}
