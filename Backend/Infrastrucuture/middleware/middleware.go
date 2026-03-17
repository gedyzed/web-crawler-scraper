package middleware

import (
	"net/http"
	"strings"
	"time"
	domain "web_crawler_scraper/Domain"

	"github.com/gin-gonic/gin"
	logrus "github.com/sirupsen/logrus"
)

type IMiddleware interface {
	AuthMiddleware() gin.HandlerFunc
	APIKeyMiddleware() gin.HandlerFunc
	RequestLogger() gin.HandlerFunc
}

type Middlewares struct {
	jwtHandler      domain.IJwtService
	apiKeyValidator domain.IApiKeyAuthService
	apiKeyLimiter   domain.IApiKeyRateLimiter
}

func NewMiddleware(
	jwt domain.IJwtService,
	apiKeyValidator domain.IApiKeyAuthService,
	apiKeyLimiter domain.IApiKeyRateLimiter,
) IMiddleware {
	return &Middlewares{
		jwtHandler:      jwt,
		apiKeyValidator: apiKeyValidator,
		apiKeyLimiter:   apiKeyLimiter,
	}
}

func (m *Middlewares) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		token, err := c.Cookie(domain.AccessToken)
		if err != nil || token == "" {
			logrus.WithFields(logrus.Fields{
				"ip":   c.ClientIP(),
				"path": c.Request.URL.Path,
			}).Debug(domain.LogTokenNotFound)
			c.IndentedJSON(
				http.StatusUnauthorized,
				gin.H{"message": "token not found"},
			)
			c.Abort()
			return
		}

		claims, err_ := m.jwtHandler.ValidateToken(token, domain.AccessToken)
		if err_ != nil {
			logrus.WithFields(logrus.Fields{
				"ip":   c.ClientIP(),
				"path": c.Request.URL.Path,
			}).Debug(domain.LogUnauthorizedRequest)
			c.IndentedJSON(
				http.StatusUnauthorized,
				gin.H{"message": "Unauthorized request"},
			)
			c.Abort()
			return
		}

		userID := claims.UserID
		c.Set("userID", userID)

		c.Next()
	}
}

func (m *Middlewares) APIKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.IndentedJSON(http.StatusUnauthorized, gin.H{"message": domain.ErrInvalidAPIKey})
			c.Abort()
			return
		}

		rawKey := strings.TrimPrefix(authHeader, "Bearer ")
		rawKey = strings.TrimSpace(rawKey)
		if rawKey == "" || !strings.HasPrefix(rawKey, domain.APIKeyPrefixLive) {
			c.IndentedJSON(http.StatusUnauthorized, gin.H{"message": domain.ErrInvalidAPIKey})
			c.Abort()
			return
		}

		apiKey, err := m.apiKeyValidator.ValidateAPIKey(c.Request.Context(), rawKey)
		if err != nil {
			c.IndentedJSON(err.HttpStatus, gin.H{"message": err.Message})
			c.Abort()
			return
		}

		allowed, rateErr := m.apiKeyLimiter.AllowByKey(c.Request.Context(), apiKey.KeyID, apiKey.DailyLimit)
		if rateErr != nil {
			c.IndentedJSON(rateErr.HttpStatus, gin.H{"message": rateErr.Message})
			c.Abort()
			return
		}

		if !allowed {
			c.IndentedJSON(http.StatusTooManyRequests, gin.H{"message": domain.ErrAPIKeyQuotaExceeded})
			c.Abort()
			return
		}

		_ = m.apiKeyValidator.TouchLastUsed(c.Request.Context(), apiKey.KeyID)
		c.Set("userID", apiKey.UserID)
		c.Set("apiKeyID", apiKey.KeyID)
		c.Next()
	}
}

func (m *Middlewares) RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		entry := logrus.WithFields(logrus.Fields{
			"method":  c.Request.Method,
			"path":    c.Request.URL.Path,
			"status":  status,
			"latency": latency.String(),
			"ip":      c.ClientIP(),
			"agent":   c.Request.UserAgent(),
		})

		if status >= 500 {
			entry.Error(domain.LogIncomingRequest)
		} else if status >= 400 {
			entry.Warn(domain.LogIncomingRequest)
		} else {
			entry.Info(domain.LogIncomingRequest)
		}
	}
}
