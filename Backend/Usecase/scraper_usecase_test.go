package usecase_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"

	domain "web_crawler_scraper/Domain"
	usecase "web_crawler_scraper/Usecase"
	mocks "web_crawler_scraper/mocks"
)

func setupScraperUsecaseTest(t *testing.T) (*gomock.Controller, *mocks.MockIResultRepo, *mocks.MockIScraperServiceFactory, *mocks.MockIScrapeService, usecase.IScraperUsecase) {
	ctrl := gomock.NewController(t)
	mockRepo := mocks.NewMockIResultRepo(ctrl)
	mockFactory := mocks.NewMockIScraperServiceFactory(ctrl)
	mockService := mocks.NewMockIScrapeService(ctrl)

	uc := usecase.NewScraperUsecase(mockRepo, mockFactory)

	return ctrl, mockRepo, mockFactory, mockService, uc
}

func TestScrape_Success(t *testing.T) {
	ctrl, mockRepo, mockFactory, mockService, uc := setupScraperUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	input := &domain.URLFrontier{
		URL:    "https://example.com",
		UserID: "user123",
	}

	mockFactory.EXPECT().NewScraperService().Return(mockService)
	page := &domain.Page{URL: "https://example.com"}

	// gomock.Any() for resultID because it's generated dynamically
	mockService.EXPECT().FetchAndParse("https://example.com", gomock.Any(), "user123").Return(page, []string{}, nil)

	mockRepo.EXPECT().SaveResult(ctx, gomock.Any()).Return(nil)
	mockRepo.EXPECT().SaveHistory(ctx, gomock.Any()).Return(nil)

	res, err := uc.Scrape(ctx, input)

	assert.Nil(t, err)
	assert.NotNil(t, res)
	assert.Equal(t, "user123", res.UserID)
	assert.NotEmpty(t, res.CRID)
	assert.Len(t, res.Pages, 1)
}

func TestScrape_Failure(t *testing.T) {
	ctrl, mockRepo, mockFactory, mockService, uc := setupScraperUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	input := &domain.URLFrontier{
		URL:    "https://example.com",
		UserID: "user123",
	}

	appErr := &domain.AppError{Message: "scrape failed", HttpStatus: 500}

	mockFactory.EXPECT().NewScraperService().Return(mockService)
	mockService.EXPECT().FetchAndParse("https://example.com", gomock.Any(), "user123").Return(nil, nil, appErr)
	mockRepo.EXPECT().SaveHistory(ctx, gomock.Any()).Return(nil)

	res, err := uc.Scrape(ctx, input)

	assert.NotNil(t, err)
	assert.Nil(t, res)
	assert.Equal(t, "scrape failed", err.Message)
}
