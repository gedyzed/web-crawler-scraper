package config

import (
	"log"

	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
)
	
type Config struct {
	App AppConfig `mapstructure:"app"`
	DB 	DBConfig `mapstructure:"db"`	
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

func ValidateConfig(cfg *Config) error {
	validate := validator.New()
	return validate.Struct(cfg)
}

func LoadConfig() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("Infrastrucuture/config")

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Error in loading config file: %v", err)
	}

	viper.AutomaticEnv()
	viper.BindEnv("db.dns", "DB_DNS")
	viper.BindEnv("app.port", "PORT")



	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatal("Error in loading config files: ", err)
	}

	if err := ValidateConfig(&cfg); err != nil {
		log.Fatal("Error in validating config files: ", err)
	}

	return &cfg
}

