package config

import (
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	logrus "github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/oauth2"
)

type Config struct {
	App       AppConfig       `mapstructure:"app"`
	DB        DBConfig        `mapstructure:"db"`
	Redis     RedisConfig     `mapstructure:"redis"`
	RateLimit RateLimitConfig `mapstructure:"rate_limiter"`
	GoogleCfg OAuthConfig     `mapstructure:"google_oauth"`
	GithubCfg OAuthConfig     `mapstructure:"github_oauth"`
	JWTConfig JWTConfig       `mapstructure:"jwt_config"`
	Security  SecurityConfig  `mapstructure:"security"`
	Email     EmailConfig     `mapstructure:"email"`
	Crawler   CrawlerConfig   `mapstructure:"crawler"`
	Scraper   ScraperConfig   `mapstructure:"scraper"`
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
	Address      string        `mapstructure:"address"`
	Password     string        `mapstructure:"password"`
	DB           int           `mapstructure:"db"`
	PoolSize     int           `mapstructure:"pool_size"`
	MinIdleConns int           `mapstructure:"min_idle_conns"`
	DialTimeout  time.Duration `mapstructure:"dial_timeout"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
	PoolTimeout  time.Duration `mapstructure:"pool_timeout"`
	MaxRetries   int           `mapstructure:"max_retries"`
}

type RateLimitConfig struct {
	Auth   AuthRateLimiterConfig   `mapstructure:"auth"`
	Trial  AuthRateLimiterConfig   `mapstructure:"trial"`
	APIKey APIKeyRateLimiterConfig `mapstructure:"api_key"`
}

type AuthRateLimiterConfig struct {
	Limit  int64         `mapstructure:"limit"`
	Window time.Duration `mapstructure:"window"`
}

type APIKeyRateLimiterConfig struct {
	MaxKeysPerUser int64 `mapstructure:"max_keys_per_user"`
	DailyLimit     int64 `mapstructure:"daily_limit"`
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
	MaxConcurrency int      `mapstructure:"max_concurrency"`
	AllowedPaths   []string `mapstructure:"allowed_paths"`
	DeniedPatterns []string `mapstructure:"denied_patterns"`
}

type ScraperConfig struct {
	MaxLinksPerPage    int `mapstructure:"max_links_per_page"`
	MaxImagesPerPage   int `mapstructure:"max_images_per_page"`
	MaxProductsPerPage int `mapstructure:"max_products_per_page"`
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
		logrus.WithError(err).Warn("config.yaml not found or error reading it")
	}

	// Environment variables
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.SetDefault("google_oauth.scopes", []string{"openid", "email", "profile"})
	viper.SetDefault("github_oauth.scopes", []string{"read:user", "user:email"})
	viper.SetDefault("security.min_entropy_bits", 30)
	viper.SetDefault("redis.pool_size", 10)
	viper.SetDefault("redis.min_idle_conns", 2)
	viper.SetDefault("redis.dial_timeout", "5s")
	viper.SetDefault("redis.read_timeout", "3s")
	viper.SetDefault("redis.write_timeout", "3s")
	viper.SetDefault("redis.pool_timeout", "4s")
	viper.SetDefault("redis.max_retries", 2)
	viper.SetDefault("rate_limiter.auth.limit", 5)
	viper.SetDefault("rate_limiter.auth.window", "1m")
	viper.SetDefault("rate_limiter.trial.limit", 3)
	viper.SetDefault("rate_limiter.trial.window", "24h")
	viper.SetDefault("rate_limiter.api_key.max_keys_per_user", 3)
	viper.SetDefault("rate_limiter.api_key.daily_limit", 1000)
	viper.SetDefault("scraper.max_links_per_page", 100)
	viper.SetDefault("scraper.max_images_per_page", 50)
	viper.SetDefault("scraper.max_products_per_page", 20)

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		logrus.WithError(err).Fatal("Error in loading config files")
	}

	if err := ValidateConfig(&cfg); err != nil {
		logrus.WithError(err).Fatal("Error in validating config files")
	}

	return &cfg
}
