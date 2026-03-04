package domain

import (
	"context"
)

// USER

type IUserRepo interface {
	Create(ctx context.Context, user *User) *AppError
	FindByID(ctx context.Context, field string) (*User, *AppError)
	FindByEmail(ctx context.Context, field string) (*User, *AppError)
	Update(ctx context.Context, user *User) (*User, *AppError)
	SaveProvider(ctx context.Context, provider *AuthProvider) *AppError
	CreateVerificationCode(ctx context.Context, verification *VerificationCode) *AppError
	FindVerificationCode(ctx context.Context, email string) (*VerificationCode, *AppError)
	DeleteVerificationCode(ctx context.Context, email string) *AppError
}

type IRefreshTokenRepo interface {
	Create(ctx context.Context, token *RefreshToken) *AppError
	FindByID(ctx context.Context, UserID string) (*RefreshToken, *AppError)
	DeleteToken(ctx context.Context, token string) *AppError
}

type ISessionRepo interface {
	Create(ctx context.Context, session *Session) *AppError
	FindByID(ctx context.Context, id uint) (*Session, *AppError)
	Delete(ctx context.Context, id uint) *AppError
}

// AUTH
type IOAuthServices interface {
	RefreshToken(ctx context.Context, token *RefreshToken) (*RefreshToken, *AppError)
	GetAuthURL(string, state string) (string, *AppError)
	Exchange(context.Context, string, string) (*ExchangeData, *AppError)
}

type IJwtService interface {
	GenerateTokens(ctx context.Context, userID string) (*ExchangeData, *AppError)
	ValidateToken(tokenString string, tokenName string) (*Claims, *AppError)
	RefreshToken(ctx context.Context, refreshToken string) (*ExchangeData, *AppError)
}

type IPasswordService interface {
	HashPassword(password string) (string, *AppError)
	ComparePassword(hashedPassword string, password string) bool
}

type IEmailService interface {
	SendEmail(name, subject, otp string, to []string) *AppError
}

// Crawler & Scraper Results

type IResultRepo interface {
	SaveResult(ctx context.Context, result *CrawlerResult) *AppError
	SaveHistory(ctx context.Context, history *History) *AppError
	FindAllHistory(ctx context.Context, userID string) ([]History, *AppError)
}
type ICrawlerService interface {
	Crawl(ctx context.Context, seedURL string) (*CrawlerResult, *AppError)
}

type IScrapeService interface {
	FetchAndParse(targetURL string, resultID string, userID string) (*Page, []string, *AppError)
}

// ICrawlerServiceFactory creates a fresh ICrawlerService per crawl request
type ICrawlerServiceFactory interface {
	NewCrawlerService(userID string) ICrawlerService
}

type IScraperServiceFactory interface {
	NewScraperService() IScrapeService
}
