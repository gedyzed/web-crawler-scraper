package domain

import (
	"context"
)

type IUserRepo interface {
	Create(ctx context.Context, user *User) *AppError
	FindByID(ctx context.Context, field string)(*User, *AppError)
	FindByEmail(ctx context.Context, field string)(*User, *AppError)
	Update(ctx context.Context, user *User) (*User, *AppError)
	SaveProvider(ctx context.Context, provider *AuthProvider) *AppError 
}

type IRefreshTokenRepo interface {
	Create(ctx context.Context, token *RefreshToken) *AppError
	FindByID(ctx context.Context, UserID string) (*RefreshToken, *AppError)
	DeleteToken(ctx context.Context, token string) (*AppError)
}

type IOAuthServices interface {
	RefreshToken(ctx context.Context, token *RefreshToken)(*RefreshToken, *AppError)
	GetAuthURL(string, state string)(string, *AppError)
	Exchange(context.Context, string, string)(*ExchangeData, *AppError)
}



