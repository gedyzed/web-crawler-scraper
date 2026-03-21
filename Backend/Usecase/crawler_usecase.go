package usecase

import (
	"context"
	"time"
	domain "web_crawler_scraper/Domain"

	"github.com/google/uuid"
	logrus "github.com/sirupsen/logrus"
)

type ICrawlerUsecase interface {
	Crawl(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError)
	FetchHistory(ctx context.Context, userID string) ([]domain.History, *domain.AppError)
	CheckFreeTrial(ctx context.Context, ip string) (bool, *domain.AppError)
}

type crawlerUsecase struct {
	repo              domain.IResultRepo
	cralwerSvsFactory domain.ICrawlerServiceFactory
	scraperSvsFactory domain.IScraperServiceFactory
	rateLimiter       domain.IRateLimiter
}

func NewCrawlerUsecase(
	repo domain.IResultRepo,
	cSvsFactory domain.ICrawlerServiceFactory,
	rateLimiter domain.IRateLimiter,

) ICrawlerUsecase {
	return &crawlerUsecase{
		repo:              repo,
		cralwerSvsFactory: cSvsFactory,
		rateLimiter:       rateLimiter,
	}
}

func (c *crawlerUsecase) Crawl(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError) {
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

func (c *crawlerUsecase) CheckFreeTrial (ctx context.Context, ip string) (bool, *domain.AppError) {
	
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
			HttpStatus: 401,
		}
	}

	return true, nil
}
