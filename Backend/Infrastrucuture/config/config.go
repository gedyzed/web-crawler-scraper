package config

import (
	"log"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
	"golang.org/x/oauth2"
)
	
type Config struct {
	App 		AppConfig 	`mapstructure:"app"`
	DB 			DBConfig 	`mapstructure:"db"`	
	Redis 		RedisConfig `mapstructure:"redis"`
	GoogleCfg   OAuthConfig `mapstructure:"google_oauth"`
	GithubCfg   OAuthConfig `mapstructure:"github_oauth"`
	JWTConfig   JWTConfig 	`mapstructure:"jwt_config"`  
}

type DBConfig struct {
	DNS string `mapstructure:"dns" validate:"required"`
}

type AppConfig struct {
	Name  string `mapstructure:"name"`
	Port  string `mapstructure:"port" validate:"required"`
	Env   string `mapstructure:"env"`
	Debug bool	 `mapstructure:"debug"` 		
}

type RedisConfig struct{
	Address string`mapstructure:"address"`
	Password string`mapstructure:"password"`
	DB int `mapstructure:"db"`
}

type OAuthConfig struct {
	ClientID 		string 			`mapstructure:"client_id"`
	ClientSecret 	string 			`mapstructure:"client_secret"`
	RedirectURL 	string 			`mapstructure:"redirect_url"`
	Scopes 			[]string 		`mapstructure:"scopes"`
	Endpoint 		oauth2.Endpoint `mapstructure:"endpoint"`
	UserURL 		string 			`mapstructure:"user_url"`
}

type JWTConfig struct{
	AccessKey 	string 		  `mapstructure:"access_key"`
	RefreshKey 	string 		  `mapstructure:"refresh_key"`
	AccessTTL 	time.Duration `mapstructure:"access_ttl"`
	RefreshTTL 	time.Duration `mapstructure:"refresh_ttl"`
}


func ValidateConfig(cfg *Config) error {
	validate := validator.New()
	return validate.Struct(cfg)
}

func LoadConfig() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("../Infrastrucuture/config")

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Error in loading config file: %v", err)
	}

	viper.AutomaticEnv()
	viper.BindEnv("db.dns", "DB_DNS")
	viper.BindEnv("app.port", "PORT")
	viper.SetDefault("google_oauth.scopes", []string{"openid", "email", "profile"})
	viper.SetDefault("github.scopes", []string{"read:user", "users:email"})


	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatal("Error in loading config files: ", err)
	}

	if err := ValidateConfig(&cfg); err != nil {
		log.Fatal("Error in validating config files: ", err)
	}

	return &cfg
}

