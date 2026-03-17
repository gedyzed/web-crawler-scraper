package controller

import (
	"net/http"
	"strings"
	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"

	"github.com/gin-gonic/gin"
)

type APIKeyController struct {
	apiKeyUC usecase.IApiKeyUsecase
}

func NewAPIKeyController(apiKeyUC usecase.IApiKeyUsecase) *APIKeyController {
	return &APIKeyController{apiKeyUC: apiKeyUC}
}

func (c *APIKeyController) CreateAPIKey(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	if userID == "" {
		ctx.IndentedJSON(http.StatusUnauthorized, gin.H{"message": domain.ErrUnauthorizedRequest})
		return
	}

	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		ctx.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	rawKey, key, appErr := c.apiKeyUC.CreateAPIKey(ctx.Request.Context(), userID, req.Name)
	if appErr != nil {
		ctx.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	ctx.IndentedJSON(http.StatusCreated, gin.H{
		"message": "API key created. Store it securely now; it will not be shown again.",
		"api_key": rawKey,
		"meta": gin.H{
			"key_id":      key.KeyID,
			"name":        key.Name,
			"prefix":      key.KeyPrefix,
			"last4":       key.Last4,
			"daily_limit": key.DailyLimit,
			"is_active":   key.IsActive,
			"created_at":  key.CreatedAt,
		},
	})
}

func (c *APIKeyController) ListAPIKeys(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	if userID == "" {
		ctx.IndentedJSON(http.StatusUnauthorized, gin.H{"message": domain.ErrUnauthorizedRequest})
		return
	}

	keys, appErr := c.apiKeyUC.ListAPIKeys(ctx.Request.Context(), userID)
	if appErr != nil {
		ctx.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	ctx.IndentedJSON(http.StatusOK, gin.H{"keys": keys})
}

func (c *APIKeyController) RevokeAPIKey(ctx *gin.Context) {
	userID := ctx.GetString("userID")
	if userID == "" {
		ctx.IndentedJSON(http.StatusUnauthorized, gin.H{"message": domain.ErrUnauthorizedRequest})
		return
	}

	keyID := strings.TrimSpace(ctx.Param("id"))
	if keyID == "" {
		ctx.IndentedJSON(http.StatusBadRequest, gin.H{"message": domain.ErrInvalidInputFormat})
		return
	}

	appErr := c.apiKeyUC.RevokeAPIKey(ctx.Request.Context(), userID, keyID)
	if appErr != nil {
		ctx.IndentedJSON(appErr.HttpStatus, gin.H{"message": appErr.Message})
		return
	}

	ctx.IndentedJSON(http.StatusOK, gin.H{"message": "API key revoked"})
}
