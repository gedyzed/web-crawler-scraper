package controller

import (
	"net/http"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"
	usecase "web_crawler_scraper/Usecase"

	"github.com/gin-gonic/gin"
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

	var input domain.URLFrontier
	if err := c.ShouldBindJSON(&input); err != nil {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": domain.ErrInvalidInputFormat})
		return
	}

	if input.URL == "" {
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": domain.ErrSeedURLNeeded})
		return
	}

	// Get user ID from context passdown form middelware
	userID := c.GetString("userID")
	input.Depth = cl.config.MaxDepth
	input.UserID = userID
	
	response, err := cl.CralwerUC.Crawl(ctx, &input)
	if err != nil {
		c.IndentedJSON(err.HttpStatus, gin.H{"error": err.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": response})
}
