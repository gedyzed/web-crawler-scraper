package infrastructure

import (
	"context"
	"fmt"
	"time"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"github.com/redis/go-redis/v9"
	logrus "github.com/sirupsen/logrus"
)

func NewRedisRateLimiter(cl *redis.Client, limit int64, window time.Duration) domain.IRateLimiter {
	return &RedisRateLimiter{
		client: cl,
		limit:  limit,
		window: window,
	}
}

func NewAPIKeyRedisRateLimiter(cl *redis.Client) domain.IApiKeyRateLimiter {
	return &APIKeyRedisRateLimiter{client: cl}
}

type RedisRateLimiter struct {
	client *redis.Client
	limit  int64
	window time.Duration
}

type APIKeyRedisRateLimiter struct {
	client *redis.Client
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

func (rl *APIKeyRedisRateLimiter) AllowByKey(ctx context.Context, keyID string, limit int64) (bool, *domain.AppError) {
	now := time.Now().UTC()
	day := now.Format("20060102")
	redisKey := fmt.Sprintf("rate:apikey:%s:%s", keyID, day)

	count, err := rl.client.Incr(ctx, redisKey).Result()
	if err != nil {
		logrus.WithFields(logrus.Fields{"key_id": keyID, "error": err}).Error(domain.LogRateLimiterError)
		return false, &domain.AppError{Message: domain.ErrInternalServer, HttpStatus: 500}
	}

	if count == 1 {
		nextUTC := now.Truncate(24 * time.Hour).Add(24 * time.Hour)
		ttl := nextUTC.Sub(now)
		rl.client.Expire(ctx, redisKey, ttl)
	}

	if count > limit {
		return false, nil
	}

	return true, nil
}

func NewRedisClient(cfg *config.RedisConfig) *redis.Client {

	rdb := redis.NewClient(&redis.Options{
		Addr:         cfg.Address,
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     cfg.PoolSize,
		MinIdleConns: cfg.MinIdleConns,
		DialTimeout:  cfg.DialTimeout,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		PoolTimeout:  cfg.PoolTimeout,
		MaxRetries:   cfg.MaxRetries,
	})

	return rdb
}
