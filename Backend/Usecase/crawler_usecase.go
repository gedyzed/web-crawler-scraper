package usecase

import (
	"context"
	"time"
	domain "web_crawler_scraper/Domain"
	"github.com/google/uuid"
)

type ICrawlerUsecase interface {
	Crawl(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError)
}

type crawlerUsecase struct {
	repo              domain.IResultRepo
	cralwerSvsFactory domain.ICrawlerServiceFactory
	scraperSvsFactory domain.IScraperServiceFactory
}

func NewCrawlerUsecase(
	repo domain.IResultRepo,
	cSvsFactory domain.ICrawlerServiceFactory,

) ICrawlerUsecase {
	return &crawlerUsecase{
		repo:              repo,
		cralwerSvsFactory: cSvsFactory,
	}
}

func (c *crawlerUsecase) Crawl(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError) {
	svc := c.cralwerSvsFactory.NewCrawlerService(input.UserID)
	result, err := svc.Crawl(ctx, input.URL)
	if err != nil {
		// Save failed crawl to history
		history := &domain.History{
			HID:          uuid.New().String(),
			UserID:       input.UserID,
			URL:          input.URL,
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
	// Save successful crawl result to database
	if saveErr := c.repo.SaveResult(ctx, result); saveErr != nil {
		return nil, saveErr
	}

	// Save successful crawl to history
	history := &domain.History{
		HID:       uuid.New().String(),
		UserID:    input.UserID,
		URL:       input.URL,
		Status:    "success",
		FetchedAt: time.Now(),
	}
	c.repo.SaveHistory(ctx, history)

	return result, nil
}
