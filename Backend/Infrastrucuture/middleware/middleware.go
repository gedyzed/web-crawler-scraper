package middleware

import (
	"net/http"
	"time"
	domain "web_crawler_scraper/Domain"

	"github.com/gin-gonic/gin"
	logrus "github.com/sirupsen/logrus"
)

type IMiddleware interface {
	AuthMiddleware() gin.HandlerFunc
	RequestLogger() gin.HandlerFunc
}

type Middlewares struct {
	jwtHandler domain.IJwtService
}

func NewMiddleware(jwt domain.IJwtService) IMiddleware {
	return &Middlewares{jwtHandler: jwt}
}

func (m *Middlewares) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		token, err := c.Cookie("access_token")
		if err != nil || token == "" {
			logrus.WithFields(logrus.Fields{
				"ip":   c.ClientIP(),
				"path": c.Request.URL.Path,
			}).Debug(domain.LogTokenNotFound)
			c.IndentedJSON(
				http.StatusUnauthorized,
				gin.H{"error": "token not found"},
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
				gin.H{"error": "Unauthorized request"},
			)
			c.Abort()
			return
		}

		userID := claims.UserID
		c.Set("userID", userID)

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
