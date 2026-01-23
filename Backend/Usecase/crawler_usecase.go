package usecase

import (
	domain "web_crawler_scraper/Domain"
)

type ICrawlerUsecase interface {
	Crawl(input *domain.URLFrontier)(any, *domain.AppError)
}

type crawlerUsecase struct {
	repo 		domain.ICrawlerRepo
	services 	domain.ICrawlerService
}

func NewCrawlerUsecase(
	repo domain.ICrawlerRepo, 
	svs domain.ICrawlerService,
	) ICrawlerUsecase {
		return &crawlerUsecase{
			repo: repo,
			services: svs,
		}
	}


func (c *crawlerUsecase) Crawl(input *domain.URLFrontier)(any, *domain.AppError) {
	c.services.Crawl(input.URL, input.Depth)
	return nil, nil
}
