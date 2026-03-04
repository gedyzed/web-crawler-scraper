package emailService

import (
	"bytes"
	"text/template"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"github.com/resend/resend-go/v3"
	logrus "github.com/sirupsen/logrus"
)

type OTPData struct {
	Name   string
	OTP    string
	Expiry int
}

type emailService struct {
	config *config.EmailConfig
}

func NewEmailService(cfg *config.EmailConfig) domain.IEmailService {
	return &emailService{config: cfg}
}

func (s *emailService) SendEmail(name, subject, otp string, to []string) *domain.AppError {

	apiKey := s.config.ApiKey

	client := resend.NewClient(apiKey)

	templatePath := "Infrastrucuture/email_service/templates/otp.html"
	if subject == domain.EmailForgotPassword {
		templatePath = "Infrastrucuture/email_service/templates/forgot_password.html"
	}

	htmlBody, err := renderTemplate(name, otp, templatePath)
	if err != nil {
		return err
	}

	params := &resend.SendEmailRequest{
		From:    s.config.Username,
		To:      to,
		Subject: subject,
		Html:    htmlBody,
	}

	_, err_ := client.Emails.Send(params)
	if err_ != nil {
		logrus.WithFields(logrus.Fields{
			"to":    to,
			"error": err_,
		}).Error(domain.LogFailedSendEmail)
		return &domain.AppError{
			Message:    "Error in sending email",
			HttpStatus: 500,
		}
	}

	return nil
}

func renderTemplate(name, otp, templatePath string) (string, *domain.AppError) {

	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		logrus.WithError(err).Error(domain.LogFailedParseTemplate)
		return "", &domain.AppError{
			Message:    "Error in parsing template",
			HttpStatus: 500,
		}
	}

	data := &OTPData{
		Name:   name,
		OTP:    otp,
		Expiry: 10,
	}

	var body bytes.Buffer
	err = tmpl.Execute(&body, data)
	if err != nil {
		logrus.WithError(err).Error(domain.LogFailedExecTemplate)
		return "", &domain.AppError{
			Message:    "Error in executing template",
			HttpStatus: 500,
		}
	}

	return body.String(), nil
}
