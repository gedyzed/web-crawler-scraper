package infrastructure

import (
	"context"
	"time"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"
	usecase "web_crawler_scraper/Usecase"

	"github.com/redis/go-redis/v9"
)


func NewRedisRateLimiter(cl *redis.Client, limit int, window time.Duration) usecase.IRateLimiter {
	return &RedisRateLimiter{
		client: cl,
		limit: limit,
		window: window,
	}
}

type RedisRateLimiter struct {
	client *redis.Client
	limit int
	window time.Duration
}


func(rl *RedisRateLimiter) Allow(ctx context.Context, ip string)(bool, *domain.AppError){
	return true, nil
}

func NewRedisClient(cfg config.RedisConfig) *redis.Client{

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.Address,
		Password: cfg.Password,
		DB: cfg.DB,
	})

	return rdb
}