package domain

type URLFrontier struct {
	URL    string `json:"url"`
	Depth  int    `json:"depth"`
	UserID string `json:"user_id"`
}
