package domain

import (
	"context"
)

type IUserRepo interface {
	Create(ctx context.Context, user *User) *AppError
	FindByUniqueField(ctx context.Context, field string)(*User, *AppError)
	Update(ctx context.Context, user *User) (*User, *AppError)
}  