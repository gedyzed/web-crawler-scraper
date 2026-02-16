package controller

import (
	"net/http"
	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"

	"github.com/gin-gonic/gin"
)



type ScrapeController struct {
	scrapeUC usecase.IScraperUsecase
}

func NewScraperController(su usecase.IScraperUsecase) *ScrapeController {
	return &ScrapeController{scrapeUC: su}
}

func (sc *ScrapeController) Scrape(c *gin.Context){

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

	input.Depth = 1
	response, err := sc.scrapeUC.Scrape(ctx, &input)
	if err != nil {
		c.IndentedJSON(err.HttpStatus, gin.H{"error": err.Message})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{"message": response})
}