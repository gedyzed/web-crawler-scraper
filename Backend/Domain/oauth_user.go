package domain

type OAuthUser struct {
	ID			  int    `json:"id"`
    Sub           string `json:"sub"`
    Name          string `json:"name"`
    GivenName     string `json:"given_name"`
    FamilyName    string `json:"family_name"`
    Picture       string `json:"picture"`
    Email         string `json:"email"`
    EmailVerified bool   `json:"email_verified"`
    Locale        string `json:"locale"`
	AvatarURL 	  string `json:"avatar_url"`
} 