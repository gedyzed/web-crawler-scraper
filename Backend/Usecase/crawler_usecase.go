package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	domain "web_crawler_scraper/Domain"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	logrus "github.com/sirupsen/logrus"
)

type ICrawlerUsecase interface {
	Crawl(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError)
	FetchHistory(ctx context.Context, userID string) ([]domain.History, *domain.AppError)
	GetResultByHistoryID(ctx context.Context, historyID string, userID string) (*domain.CrawlerResult, *domain.AppError)
	DeleteHistory(ctx context.Context, historyID string, userID string) *domain.AppError
	CheckFreeTrial(ctx context.Context, ip string) (bool, *domain.AppError)
}

type crawlerUsecase struct {
	repo              domain.IResultRepo
	cralwerSvsFactory domain.ICrawlerServiceFactory
	scraperSvsFactory domain.IScraperServiceFactory
	rateLimiter       domain.IRateLimiter
	redisClient       *redis.Client
}

func NewCrawlerUsecase(
	repo domain.IResultRepo,
	cSvsFactory domain.ICrawlerServiceFactory,
	rateLimiter domain.IRateLimiter,
	redisClient *redis.Client,

) ICrawlerUsecase {
	return &crawlerUsecase{
		repo:              repo,
		cralwerSvsFactory: cSvsFactory,
		rateLimiter:       rateLimiter,
		redisClient:       redisClient,
	}
}

func (c *crawlerUsecase) cacheKey(url string) string {
	return fmt.Sprintf("crawl:%s", url)
}

func (c *crawlerUsecase) getCachedResult(ctx context.Context, normalizedURL string) *domain.CrawlerResult {
	if c.redisClient == nil {
		return nil
	}

	data, err := c.redisClient.Get(ctx, c.cacheKey(normalizedURL)).Result()
	if err != nil {
		if err != redis.Nil {
			logrus.WithFields(logrus.Fields{
				"url":   normalizedURL,
				"error": err.Error(),
			}).Warn("Failed to read crawler cache")
		}
		return nil
	}

	var cached domain.CrawlerResult
	if err := json.Unmarshal([]byte(data), &cached); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":   normalizedURL,
			"error": err.Error(),
		}).Warn("Failed to decode crawler cache")
		return nil
	}

	cached.Cached = true
	return &cached
}

func (c *crawlerUsecase) setCachedResult(ctx context.Context, normalizedURL string, result *domain.CrawlerResult) {
	if c.redisClient == nil || result == nil {
		return
	}

	jsonBytes, err := json.Marshal(result)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":   normalizedURL,
			"error": err.Error(),
		}).Warn("Failed to encode crawler cache")
		return
	}

	if err := c.redisClient.Set(ctx, c.cacheKey(normalizedURL), string(jsonBytes), 4*time.Hour).Err(); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":   normalizedURL,
			"error": err.Error(),
		}).Warn("Failed to write crawler cache")
	}
}

func (c *crawlerUsecase) Crawl(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError) {
	normalizedURL, validationErr := domain.NormalizeAndValidateURL(input.URL)
	if validationErr != nil {
		return nil, validationErr
	}
	input.URL = normalizedURL

	logrus.WithFields(logrus.Fields{
		"url":    input.URL,
		"userID": input.UserID,
	}).Info(domain.LogCrawlStarted)

	if input.Trail {
		if allowed, err := c.CheckFreeTrial(ctx, input.IP); err != nil {
			return nil, err
		} else if !allowed {
			return nil, &domain.AppError{
				Message:    domain.UserFreeTrialExpired,
				HttpStatus: 429,
			}
		}

		input.UserID = uuid.New().String() // Generate a temporary user ID for trail users
	}

	if cachedResult := c.getCachedResult(ctx, input.URL); cachedResult != nil {
		cachedResult.UserID = input.UserID
		return cachedResult, nil
	}

	svc := c.cralwerSvsFactory.NewCrawlerService(input.UserID)
	result, err := svc.Crawl(ctx, input.URL)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":    input.URL,
			"userID": input.UserID,
			"error":  err.Message,
		}).Error(domain.LogCrawlFailed)
		// Save failed crawl to history
		history := &domain.History{
			HID:          uuid.New().String(),
			UserID:       input.UserID,
			URL:          input.URL,
			Type:         domain.TypeCrawled,
			Status:       "failed",
			ErrorMessage: err.Message,
			FetchedAt:    time.Now(),
		}
		c.repo.SaveHistory(ctx, history)
		return nil, err
	}

	// Generate unique ID for the result
	result.CRID = uuid.New().String()
	result.UserID = input.UserID
	result.Cached = false
	c.setCachedResult(ctx, input.URL, result)

	if !input.Trail {
		// Save successful crawl result to database
		if saveErr := c.repo.SaveResult(ctx, result); saveErr != nil {
			return nil, saveErr
		}

		// Save successful crawl to history
		history := &domain.History{
			HID:       uuid.New().String(),
			UserID:    input.UserID,
			ResultID:  result.CRID,
			URL:       input.URL,
			Type:      domain.TypeCrawled,
			Status:    "success",
			FetchedAt: time.Now(),
		}
		c.repo.SaveHistory(ctx, history)
	}

	return result, nil
}

func (c *crawlerUsecase) FetchHistory(ctx context.Context, userID string) ([]domain.History, *domain.AppError) {
	return c.repo.FindAllHistory(ctx, userID)
}

func (c *crawlerUsecase) CheckFreeTrial(ctx context.Context, ip string) (bool, *domain.AppError) {

	allowed, err := c.rateLimiter.Allow(ctx, ip)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"error": err,
		}).Error(domain.LogFailedRateLimiter)
		return false, &domain.AppError{
			Message:    domain.ErrSomethingWentWrong,
			HttpStatus: 500,
		}
	}

	if !allowed {
		return false, &domain.AppError{
			Message:    domain.UserFreeTrialExpired,
			HttpStatus: 429,
		}
	}

	return true, nil
}

func (c *crawlerUsecase) GetResultByHistoryID(ctx context.Context, historyID string, userID string) (*domain.CrawlerResult, *domain.AppError) {
	history, err := c.repo.FindHistoryByID(ctx, historyID, userID)
	if err != nil {
		return nil, err
	}

	if history.ResultID == "" {
		return nil, &domain.AppError{Message: domain.ErrNoResultForHistory, HttpStatus: 404}
	}

	result, err := c.repo.FindResultByID(ctx, history.ResultID, userID)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (c *crawlerUsecase) DeleteHistory(ctx context.Context, historyID string, userID string) *domain.AppError {
	if historyID == "" {
		return &domain.AppError{Message: domain.ErrHistoryIDRequired, HttpStatus: 400}
	}

	return c.repo.DeleteHistoryByID(ctx, historyID, userID)
}
