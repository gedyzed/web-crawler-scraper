package usecase

import (
	"context"
	"time"
	domain "web_crawler_scraper/Domain"

	"github.com/google/uuid"
	logrus "github.com/sirupsen/logrus"
)

type IScraperUsecase interface {
	Scrape(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError)
	CheckFreeTrial (ctx context.Context, ip string) (bool, *domain.AppError)
}

type scraperUsecase struct {
	repo       domain.IResultRepo
	svsFactory domain.IScraperServiceFactory
	rateLimiter domain.IRateLimiter
}

func NewScraperUsecase(
	repo domain.IResultRepo, 
	svs domain.IScraperServiceFactory,
	rateLimiter domain.IRateLimiter,
	) IScraperUsecase {
	return &scraperUsecase{
		repo:       repo,
		svsFactory: svs,
		rateLimiter: rateLimiter,
	}
}

func (s *scraperUsecase) Scrape(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError) {


	if input.Trail {
		allowed, err := s.CheckFreeTrial(ctx, input.IP)
		if err != nil {
			return nil, err
		}
		if !allowed {
			return nil, &domain.AppError{
				Message:    domain.UserFreeTrialExpired,
				HttpStatus: 429,
			}
		}
		input.UserID = uuid.New().String() // Generate a temporary user ID for trail users
	}

	logrus.WithFields(logrus.Fields{
		"url":    input.URL,
		"userID": input.UserID,
	}).Info(domain.LogScrapeStarted)

	svc := s.svsFactory.NewScraperService()
	resultID := uuid.New().String()
	page, _, err := svc.FetchAndParse(input.URL, resultID, input.UserID)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":    input.URL,
			"userID": input.UserID,
			"error":  err.Message,
		}).Error(domain.LogScrapeFailed)
		// Save failed scrape to history
		history := &domain.History{
			HID:          uuid.New().String(),
			UserID:       input.UserID,
			URL:          input.URL,
			Type:         domain.TypeScraped,
			Status:       "failed",
			ErrorMessage: err.Message,
			FetchedAt:    time.Now(),
		}
		if !input.Trail {
			s.repo.SaveHistory(ctx, history)
		}
		return nil, err
	}

	result := &domain.CrawlerResult{
		CRID:   uuid.New().String(),
		UserID: input.UserID,
		Pages:  []domain.Page{*page},
	}

	if !input.Trail {
		// Save successful scrape result to database
		if saveErr := s.repo.SaveResult(ctx, result); saveErr != nil {
			return nil, saveErr
		}

		// Save successful scrape to history
		history := &domain.History{
			HID:       uuid.New().String(),
			UserID:    input.UserID,
			ResultID:  result.CRID,
			URL:       input.URL,
			Type:      domain.TypeScraped,
			Status:    "success",
			FetchedAt: time.Now(),
		}
		s.repo.SaveHistory(ctx, history)
	}

	return result, nil
}


func (s *scraperUsecase) CheckFreeTrial (ctx context.Context, ip string) (bool, *domain.AppError) {
	
	allowed, err := s.rateLimiter.Allow(ctx, ip)
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