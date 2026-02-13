package usecase

import (
	"context"
	domain "web_crawler_scraper/Domain"
)

type ICrawlerUsecase interface {
	Crawl(ctx context.Context,input *domain.URLFrontier) (any, *domain.AppError)
}

type crawlerUsecase struct {
	repo       domain.ICrawlerRepo
	svsFactory domain.ICrawlerServiceFactory
}

func NewCrawlerUsecase(
	repo domain.ICrawlerRepo,
	svsFactory domain.ICrawlerServiceFactory,
) ICrawlerUsecase {
	return &crawlerUsecase{
		repo:       repo,
		svsFactory: svsFactory,
	}
}

func (c *crawlerUsecase) Crawl(ctx context.Context, input *domain.URLFrontier) (any, *domain.AppError) {
	svc := c.svsFactory.NewCrawlerService()
	result, err := svc.Crawl(ctx, input.URL)
	return result, err
}
