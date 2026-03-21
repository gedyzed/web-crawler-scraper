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

func setupCrawlerUsecaseTest(t *testing.T) (*gomock.Controller, *mocks.MockIResultRepo, *mocks.MockICrawlerServiceFactory, *mocks.MockICrawlerService, usecase.ICrawlerUsecase) {
	ctrl := gomock.NewController(t)
	mockRepo := mocks.NewMockIResultRepo(ctrl)
	mockFactory := mocks.NewMockICrawlerServiceFactory(ctrl)
	mockService := mocks.NewMockICrawlerService(ctrl)
	mockkRateLimiter := mocks.NewMockIRateLimiter(ctrl)


	uc := usecase.NewCrawlerUsecase(mockRepo, mockFactory, mockkRateLimiter)

	return ctrl, mockRepo, mockFactory, mockService, uc
}

func TestCrawl_Success(t *testing.T) {
	ctrl, mockRepo, mockFactory, mockService, uc := setupCrawlerUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	input := &domain.URLFrontier{
		URL:    "https://example.com",
		UserID: "user123",
	}

	result := &domain.CrawlerResult{}

	mockFactory.EXPECT().NewCrawlerService("user123").Return(mockService)
	mockService.EXPECT().Crawl(ctx, "https://example.com").Return(result, nil)
	mockRepo.EXPECT().SaveResult(ctx, gomock.Any()).Return(nil)
	mockRepo.EXPECT().SaveHistory(ctx, gomock.Any()).Return(nil)

	res, err := uc.Crawl(ctx, input)

	assert.Nil(t, err)
	assert.NotNil(t, res)
	assert.Equal(t, "user123", res.UserID)
	assert.NotEmpty(t, res.CRID)
}

func TestCrawl_Failure(t *testing.T) {
	ctrl, mockRepo, mockFactory, mockService, uc := setupCrawlerUsecaseTest(t)
	defer ctrl.Finish()

	ctx := context.Background()
	input := &domain.URLFrontier{
		URL:    "https://example.com",
		UserID: "user123",
	}

	appErr := &domain.AppError{Message: "crawl failed", HttpStatus: 500}

	mockFactory.EXPECT().NewCrawlerService("user123").Return(mockService)
	mockService.EXPECT().Crawl(ctx, "https://example.com").Return(nil, appErr)
	mockRepo.EXPECT().SaveHistory(ctx, gomock.Any()).Return(nil)

	res, err := uc.Crawl(ctx, input)

	assert.NotNil(t, err)
	assert.Nil(t, res)
	assert.Equal(t, "crawl failed", err.Message)
}
