package middleware

import (
	"net/http"
	domain "web_crawler_scraper/Domain"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtHandler domain.IJwtService) gin.HandlerFunc {
	return func (c *gin.Context){

		token, err := c.Cookie("access_token")
		if err != nil || token == "" {
			c.IndentedJSON(
				http.StatusUnauthorized, 
				gin.H{"error": "token not found"},
			)
			return
		}

		claims, err_ := jwtHandler.ValidateToken(token, domain.AccessToken)
		if err_ != nil {
			c.IndentedJSON(
				http.StatusUnauthorized, 
				gin.H{"error": "Unauthorize request"},
			)
			return
		}


		userID := claims.UserID
		c.Set("userID", userID)

		c.Next()	
	}
}

