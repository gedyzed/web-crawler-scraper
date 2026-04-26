package controller

import (
	"errors"
	"net/http"
	domain "web_crawler_scraper/Domain"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HealthController struct {
	db *gorm.DB
}

func NewHealthController(db *gorm.DB) *HealthController {
	return &HealthController{db: db}
}

func (hc *HealthController) Health(c *gin.Context) {
	ctx := c.Request.Context()

	var user domain.User
	err := hc.db.WithContext(ctx).Model(&domain.User{}).Select("user_id").Take(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.IndentedJSON(http.StatusOK, gin.H{
				"status":  "healthy",
				"message": "database reachable; no user records found",
			})
			return
		}

		c.IndentedJSON(http.StatusServiceUnavailable, gin.H{
			"status":  "unhealthy",
			"message": "database query failed",
			"error":   err.Error(),
		})
		return
	}

	c.IndentedJSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"message": "database reachable",
	})
}
