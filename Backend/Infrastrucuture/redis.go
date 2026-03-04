package infrastructure

import (
	"context"
	"fmt"
	"time"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"
	usecase "web_crawler_scraper/Usecase"

	"github.com/redis/go-redis/v9"
	logrus "github.com/sirupsen/logrus"
)

func NewRedisRateLimiter(cl *redis.Client, limit int64, window time.Duration) usecase.IRateLimiter {
	return &RedisRateLimiter{
		client: cl,
		limit:  limit,
		window: window,
	}
}

type RedisRateLimiter struct {
	client *redis.Client
	limit  int64
	window time.Duration
}

func (rl *RedisRateLimiter) Allow(ctx context.Context, ip string) (bool, *domain.AppError) {

	key := fmt.Sprintf("rate:%s", ip)
	count, err := rl.client.Incr(ctx, key).Result()
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"ip":    ip,
			"error": err,
		}).Error(domain.LogRateLimiterError)
		return false, &domain.AppError{
			Message:    "Internal Server Error",
			HttpStatus: 500,
		}
	}

	if count == 1 {
		rl.client.Expire(ctx, key, rl.window)
	}

	if count > rl.limit {
		return false, nil
	}

	return true, nil
}

func NewRedisClient(cfg *config.RedisConfig) *redis.Client {

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Address,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	return rdb
}
