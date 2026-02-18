package middleware

import (
	"net/http"
	domain "web_crawler_scraper/Domain"
	"github.com/gin-gonic/gin"
)


type IMiddleware interface {
	AuthMiddleware() gin.HandlerFunc 
}

type Middlewares struct {
	jwtHandler domain.IJwtService
}

func NewMiddleware(jwt domain.IJwtService) IMiddleware {
	return &Middlewares{jwtHandler: jwt}
} 

func (m *Middlewares) AuthMiddleware() gin.HandlerFunc {
	return func (c *gin.Context){

		token, err := c.Cookie("access_token")
		if err != nil || token == "" {
			c.IndentedJSON(
				http.StatusUnauthorized, 
				gin.H{"error": "token not found"},
			)
			c.Abort()
			return
		}

		claims, err_ := m.jwtHandler.ValidateToken(token, domain.AccessToken)
		if err_ != nil {
			c.IndentedJSON(
				http.StatusUnauthorized, 
				gin.H{"error": "Unauthorize request"},
			)
			c.Abort()
			return
		}

		userID := claims.UserID
		c.Set("userID", userID)

		c.Next()	
	}
}


