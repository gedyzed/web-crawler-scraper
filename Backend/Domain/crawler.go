package domain

type URLFrontier struct {
	URL    string `json:"url"`
	Depth  int    `json:"depth"`
	UserID string `json:"user_id"`
	Trail  bool   `json:"Trail"` 
	IP     string `json:"ip"`
}
