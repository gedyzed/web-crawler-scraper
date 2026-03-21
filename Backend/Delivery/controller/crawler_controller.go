package controller

import (
	"net/http"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"
	usecase "web_crawler_scraper/Usecase"

	"github.com/gin-gonic/gin"
	logrus "github.com/sirupsen/logrus"
)

type CrawlerController struct {
	CralwerUC usecase.ICrawlerUsecase
	config    *config.CrawlerConfig
}

func NewCrawlerController(cfg *config.CrawlerConfig, cu usecase.ICrawlerUsecase) *CrawlerController {
	return &CrawlerController{CralwerUC: cu, config: cfg}
}

func (cl *CrawlerController) Crawler(c *gin.Context) {

	ctx := c.Request.Context()
	c.Request.URL.Path = c.FullPath() // Ensure the full path is set for logging


	var input domain.URLFrontier
	if err := c.ShouldBindJSON(&input); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	if input.URL == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrSeedURLNeeded})
		return
	}
	
	input.Depth = cl.config.MaxDepth
	userID := ""
	// Get user ID from context passdown form middelware
	if _, exists := c.Get("userID"); exists {
		userID = c.GetString("userID")
		input.UserID = userID
		input.Trail = false
	} else {
		input.Trail = true
	}

	response, err := cl.CralwerUC.Crawl(ctx, &input)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":         input.URL,
			"userID":      userID,
			"error":       err.Message,
			"http_status": err.HttpStatus,
		}).Error(domain.LogCrawlFailed)
		c.IndentedJSON(err.HttpStatus, gin.H{"message": err.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": response})
}

func (cl *CrawlerController) GetHistory(c *gin.Context) {
	ctx := c.Request.Context()
	userID := c.GetString("userID")

	history, err := cl.CralwerUC.FetchHistory(ctx, userID)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"userID": userID,
			"error":  err.Message,
		}).Error(domain.LogFailedFetchHistory)
		c.IndentedJSON(err.HttpStatus, gin.H{"message": err.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, history)
}


