package infrastructure

import (
	"bytes"
	"html/template"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"github.com/go-gomail/gomail"
	"github.com/sirupsen/logrus"
)


type emailService struct {
	config *config.EmailConfig
}

func NewEmailService(cfg *config.EmailConfig) domain.IEmailService {
	return &emailService{config: cfg}
}

func (s *emailService) SendEmail(subject, msg, to string) *domain.AppError { 

	tpl :=  `
		<h1>Hello, {{.User} </h1>
		<p>{{.Msg}}</p>`
	
	user := "user"
	data := struct {
		User string
		Msg  string
	}{
		User: user,
		Msg: msg,
	}

	var body bytes.Buffer
	template.Must(template.New("body").Parse(tpl)).Execute(&body, data)
	html := body.String()

	message := gomail.NewMessage()
	message.SetHeader("From", s.config.Username)
	message.SetHeader("To", to)
	message.SetHeader("Subjet", subject)
	message.SetBody("text/html",html)

	dailer := gomail.NewDialer(
			s.config.StmpHost, 
			s.config.StmpPort, 
			s.config.Username, 
			s.config.AppPassword,
		)
	
	if err := dailer.DialAndSend(message); err != nil {
		logrus.WithError(err).Error(domain.ErrInternalServer)
		return &domain.AppError{
			Message: domain.ErrInternalServer,
		}
	}

	return nil
}

