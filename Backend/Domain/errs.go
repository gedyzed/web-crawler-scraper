package domain


// codes 
var (
	CodeDBError = "DB_Error"

)

// Errors 
var (
	ErrInternalServer = "Internal Server Error"
)

type AppError struct {
	Message string
	Err string
	HttpStatus int
}








                                                   



