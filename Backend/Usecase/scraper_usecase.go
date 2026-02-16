package usecase

import (
	"context"
	"time"
	domain "web_crawler_scraper/Domain"

	"github.com/google/uuid"
)

type IScraperUsecase interface {
	Scrape(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError)
}

type scraperUsecase struct {
	repo       domain.IResultRepo
	svsFactory domain.IScraperServiceFactory
}

func NewScraperUsecase(repo domain.IResultRepo, svs domain.IScraperServiceFactory) IScraperUsecase {
	return &scraperUsecase{
		repo:       repo,
		svsFactory: svs,
	}
}

func (s *scraperUsecase) Scrape(ctx context.Context, input *domain.URLFrontier) (*domain.CrawlerResult, *domain.AppError) {

	svc := s.svsFactory.NewScraperService()
	page, _, err := svc.FetchAndParse(input.URL, input.Depth)
	if err != nil {
		// Save failed scrape to history
		history := &domain.History{
			HID:          uuid.New().String(),
			UserID:       input.UserID,
			URL:          input.URL,
			Status:       "failed",
			ErrorMessage: err.Message,
			FetchedAt:    time.Now(),
		}
		s.repo.SaveHistory(ctx, history)
		return nil, err
	}

	result := &domain.CrawlerResult{
		CRID:   uuid.New().String(),
		UserID: input.UserID,
		Pages:  []domain.Page{*page},
	}

	// Save successful scrape result to database
	if saveErr := s.repo.SaveResult(ctx, result); saveErr != nil {
		return nil, saveErr
	}

	// Save successful scrape to history
	history := &domain.History{
		HID:       uuid.New().String(),
		UserID:    input.UserID,
		URL:       input.URL,
		Status:    "success",
		FetchedAt: time.Now(),
	}
	s.repo.SaveHistory(ctx, history)

	return result, nil
}
