package config

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"
	"golang.org/x/oauth2"
	// "github.com/joho/godotenv"
)

type Config struct {
	App       AppConfig      `mapstructure:"app"`
	DB        DBConfig       `mapstructure:"db"`
	Redis     RedisConfig    `mapstructure:"redis"`
	GoogleCfg OAuthConfig    `mapstructure:"google_oauth"`
	GithubCfg OAuthConfig    `mapstructure:"github_oauth"`
	JWTConfig JWTConfig      `mapstructure:"jwt_config"`
	Security  SecurityConfig `mapstructure:"security"`
	Email     EmailConfig    `mapstructure:"email"`
	Crawler   CrawlerConfig  `mapstructure:"crawler"`
}

type SecurityConfig struct {
	MinEntropyBits float64 `mapstructure:"min_entropy_bits"`
}

type DBConfig struct {
	DNS string `mapstructure:"dns" validate:"required"`
}

type AppConfig struct {
	Name          string `mapstructure:"name"`
	Port          string `mapstructure:"port"`
	Env           string `mapstructure:"env"`
	Debug         bool   `mapstructure:"debug"`
	Domain        string `mapstructure:"domain" validate:"required"`
	SecureCookies bool   `mapstructure:"secure_cookies"`
}

type RedisConfig struct {
	Address  string `mapstructure:"address"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type OAuthConfig struct {
	ClientID     string          `mapstructure:"client_id"`
	ClientSecret string          `mapstructure:"client_secret"`
	RedirectURL  string          `mapstructure:"redirect_url"`
	Scopes       []string        `mapstructure:"scopes"`
	Endpoint     oauth2.Endpoint `mapstructure:"endpoint"`
	UserURL      string          `mapstructure:"user_url"`
}

type JWTConfig struct {
	AccessKey  string        `mapstructure:"access_key"`
	RefreshKey string        `mapstructure:"refresh_key"`
	AccessTTL  time.Duration `mapstructure:"access_ttl"`
	RefreshTTL time.Duration `mapstructure:"refresh_ttl"`
}

type EmailConfig struct {
	Username string `mapstructure:"username" validate:"required"`
	ApiKey   string `mapstructure:"api_key" validate:"required"`
}

type CrawlerConfig struct {
	AllowedDomains []string `mapstructure:"allowed_domains"`
	MaxDepth       int      `mapstructure:"max_depth" validate:"required"`
	MaxPages       int      `mapstructure:"max_pages"`
	AllowedPaths   []string `mapstructure:"allowed_paths"`
	DeniedPatterns []string `mapstructure:"denied_patterns"`
}

func ValidateConfig(cfg *Config) error {
	validate := validator.New()
	return validate.Struct(cfg)
}

func LoadConfig(path string) *Config {

	_ = godotenv.Load()
	
	// Read from config.yaml as fallback or primary
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(path)

	if err := viper.MergeInConfig(); err != nil {
		log.Printf("Warning: config.yaml not found or error reading it: %v", err)
	}


	// Environment variables
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.SetDefault("google_oauth.scopes", []string{"openid", "email", "profile"})
	viper.SetDefault("github.scopes", []string{"read:user", "users:email"})
	viper.SetDefault("security.min_entropy_bits", 30)

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		fmt.Println(cfg)
		log.Fatal("Error in loading config files: ", err)
	}


	if err := ValidateConfig(&cfg); err != nil {
		fmt.Println(cfg)
		log.Fatal("Error in validating config files: ", err)
	}

	return &cfg
}
