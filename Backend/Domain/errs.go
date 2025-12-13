package domain

// codes
var (
	CodeDBError = "DB_Error"
)

// Errors
var (
	ErrInternalServer = "Internal Server Error"
)

// Register Endpoint - User-facing error messages
var (
	ErrInvalidInputFormat    = "Invalid Input Format"
	ErrInvalidEmail          = "Invalid or Incorrect Email"
	MsgUserRegisteredSuccess = "User Registered Successfully. PLease Verify Email"
)

// Register Endpoint - Internal log messages
var (
	LogRegisterRequestDump  = "RegisterUser Request Dump"
	LogRegisterBindingError = "RegisterUser Binding Error"
	LogRegisterInvalidEmail = "RegisterUser Invalid Email Error"
	LogRegisterWeakPassword = "RegisterUser Weak Password Error"
	LogRegisterSystemError  = "RegisterUser System Error"
	LogRegisterClientError  = "RegisterUser Client Error"
)

// Repository - Error Messages
var (
	ErrUserNotFound     = "User Not Found"
	ErrTokenNotFound    = "Token Not Found"
	ErrCannotUpdateUser = "Cannot Update User"
)

// Repository - Log Messages
var (
	LogFailedCreateUser         = "Failed to Create User"
	LogUserNotFound             = "User Not Found"
	LogFailedUpdateUser         = "Failed to Update User"
	LogFailedCreateRefreshToken = "Failed to Create Refresh Token"
	LogFailedDeleteRefreshToken = "Failed to Delete Refresh Token"
)

// Usecase - Error Messages
var (
	ErrSomethingWentWrong    = "Something Went Wrong. Try again"
	ErrSomethingWentWrongAlt = "Something Went Wrong. Try again!"
	ErrTooManyRequests       = "Too Many Request. Try again Later!"
	ErrTooManyRequestsAlt    = "Too Many Requests. Try again Later"
	ErrUserAlreadyRegistered = "User Already Registered"
	ErrInvalidCredentials    = "Invalid Email or Password"
)

// Usecase - Log Messages
var (
	LogFailedRateLimiter  = "Failed to get the rate limiter"
	LogFailedCreateUserID = "Failed to Create UserID"
	LogFailedCreateTokens = "Failed to Create Tokens"
)

type AppError struct {
	Message    string
	Err        string
	HttpStatus int
}
