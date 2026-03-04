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

// Login Endpoint - Internal log messages
var (
	LogLoginRequestDump  = "LoginUser Request Dump"
	LogLoginBindingError = "LoginUser Binding Error"
	LogLoginInvalidEmail = "LoginUser Invalid Email Error"
	LogLoginSystemError  = "LoginUser System Error"
	LogLoginClientError  = "LoginUser Client Error"
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
	LogFailedSaveCrawlerResult  = "Failed to Save Crawler Result"
	LogFailedSaveHistory        = "Failed to Save Crawler History"
	LogVerificationCodeNotFound = "Verification Code Not Found"
	LogFailedFetchHistory       = "Failed to Fetch Crawler History"
)

// Repository - Error Messages
var (
	ErrFailedSaveCrawlerResult = "Failed to Save Crawler Result"
	ErrFailedSaveHistory       = "Failed to Save Crawler History"
	ErrFailedFetchHistory      = "Failed to Fetch Crawler History"
)

// Usecase - Error Messages
var (
	ErrSomethingWentWrong      = "Something Went Wrong. Try again"
	ErrTooManyRequests         = "Too Many Request. Try again Later!"
	ErrUserAlreadyRegistered   = "User Already Registered"
	ErrInvalidCredentials      = "Invalid Email or Password"
	ErrInvalidVerificationCode = "Invalid Verification Code"
	ErrVerificationCodeExpired = "Verification Code Has Expired"
	MsgEmailVerifiedSuccess    = "Email Verified Successfully"
)

// Usecase - Log Messages
var (
	LogFailedRateLimiter  = "Failed to get the rate limiter"
	LogFailedCreateUserID = "Failed to Create UserID"
	LogFailedCreateTokens = "Failed to Create Tokens"
	LogFailedSaveProvider = "Failed to Save OAuth Provider"
)

// OAuth Service - Error Messages
var (
	ErrProviderNotFound     = "Provider Not Found"
	ErrAuthenticationFailed = "Authentication failed"
)

// OAuth Service - Log Messages
var (
	LogOAuthProviderNotFound     = "OAuth provider not found"
	LogOAuthTokenExchangeFailed  = "OAuth token exchange failed"
	LogOAuthClientConnectionFail = "OAuth client connection failed"
	LogOAuthFetchUserInfoFailed  = "OAuth fetch user info failed"
)

var (
	RefreshTokenLocal  = "refresh_token_local"
	RefreshTokenGoogle = "refresh_token_google"
	RefreshTokenGithub = "refresh_token_github"
	AccessToken        = "access_token"

	Google = "google"
	Github = "github"
)

// For Crawler
var (
	ErrSeedURLNeeded = "Seed URL is not provided"
)

// For Email
var (
	EmailVerification      = "Email Verification"
	EmailVerificationMsg   = "Please verify your email to continue. Your verification code is: %d"
	EmailForgotPassword    = "Reset Your Password"
	EmailForgotPasswordMsg = "Please use the code below to reset your password. Your reset code is: %d"
)

// Session - Log Messages
var (
	LogFailedCreateSession = "Failed to Create Session"
	LogFailedDeleteSession = "Failed to Delete Existing Session"
)

// Provider/Verification - Log Messages
var (
	LogFailedCreateProvider         = "Failed to Create OAuth Provider"
	LogFailedCreateVerificationCode = "Failed to Create Verification Code"
	LogFailedDeleteVerificationCode = "Failed to Delete Verification Code"
)

// Crawler - Log Messages
var (
	LogCrawlStarted     = "Crawl started"
	LogCrawlCompleted   = "Crawl completed"
	LogCrawlPageError   = "Error visiting page during crawl"
	LogCrawlFailed      = "Crawl failed"
	LogScrapeStarted    = "Scrape started"
	LogScrapeCompleted  = "Scrape completed"
	LogScrapeFailed     = "Scrape failed"
	LogHTMLExtractError = "Error extracting HTML"
	LogHTMLParseError   = "Error parsing HTML"
)

// History - Types
var (
	TypeScraped = "scraped"
	TypeCrawled = "crawled"
)

// Email - Log Messages
var (
	LogFailedSendEmail     = "Failed to Send Email"
	LogFailedParseTemplate = "Failed to Parse Email Template"
	LogFailedExecTemplate  = "Failed to Execute Email Template"
)

// JWT - Log Messages
var (
	LogFailedGenerateToken = "Failed to Generate JWT Token"
	LogFailedValidateToken = "Failed to Validate JWT Token"
	LogFailedRefreshToken  = "Failed to Refresh JWT Token"
)

// Middleware - Log Messages
var (
	LogTokenNotFound       = "Access token not found in request"
	LogUnauthorizedRequest = "Unauthorized request - token validation failed"
)

// Redis - Log Messages
var (
	LogRateLimiterError = "Rate limiter Redis error"
)

// Request - Log Messages
var (
	LogIncomingRequest = "Incoming HTTP request"
)

type AppError struct {
	Message    string
	Err        string
	HttpStatus int
}
