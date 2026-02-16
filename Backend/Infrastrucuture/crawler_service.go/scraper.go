package crawlerservicego

import (
	"fmt"
	"net/url"
	"strings"
	"time"

	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"github.com/go-shiori/go-readability"
	colly "github.com/gocolly/colly"
)



type ScraperServiceFactory struct{
	config *config.CrawlerConfig
}

func NewScraperServiceFactory(cfg *config.CrawlerConfig) domain.IScraperServiceFactory {
	return &ScraperServiceFactory{config: cfg}
}

func (s *ScraperServiceFactory) NewScraperService () domain.IScrapeService {
	return &Scraper{config: s.config}
}

// Scraper handles fetching and parsing pages.
// It is stateless — all mutable state lives inside FetchAndParse.
type Scraper struct {
	config *config.CrawlerConfig
}

func NewScraper(cfg *config.CrawlerConfig) domain.IScrapeService {
	return &Scraper{config: cfg}
}

// FetchAndParse visits a single URL and returns the parsed Page
// along with all discovered links found on that page.
// A fresh colly.Collector is created per call so there is no
// shared mutable state and no revisit blocking.
func (s *Scraper) FetchAndParse(targetURL string, depth int) (*domain.Page, []string, *domain.AppError) {

	// Local state — safe for concurrent use since each goroutine
	// gets its own FetchAndParse call with its own locals.
	page := &domain.Page{
		URL:       targetURL,
		Depth:     depth,
		FetchedAt: time.Now(),
	}
	discoveredLinks := make([]string, 0)

	// Fresh collector per call — avoids Colly's internal visited-URL set
	// blocking subsequent pages, and eliminates all shared-state races.
	collector := colly.NewCollector(
		colly.Async(false),
	)

	collector.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Delay:       2 * time.Second,
		RandomDelay: 1 * time.Second,
	})

	collector.OnRequest(func(e *colly.Request) {
		e.Ctx.Put("start_time", time.Now())
	})

	collector.OnResponse(func(e *colly.Response) {
		startTime := e.Ctx.GetAny("start_time").(time.Time)
		page.StatusCode = e.StatusCode
		page.ResponseTimeMS = time.Since(startTime).Milliseconds()
		page.ContentType = e.Headers.Get("Content-Type")
	})

	collector.OnHTML("a[href]", func(e *colly.HTMLElement) {
		link := normalizeURL(e.Request.AbsoluteURL(e.Attr("href")))
		if link == "" {
			return
		}

		discoveredLinks = append(discoveredLinks, link)

		// Classify as internal or external
		if e.Request.URL.Host == e.Response.Request.URL.Host {
			page.InternalLinks = append(page.InternalLinks, link)
		} else {
			page.ExternalLinks = append(page.ExternalLinks, link)
		}
	})

	collector.OnHTML("html", func(e *colly.HTMLElement) {
		rawHTML, err := e.DOM.Html()
		if err != nil {
			fmt.Printf("Error extracting html: %s\n", err)
			return
		}

		article, parseErr := ParseRawHTML(rawHTML, e.Request.URL)
		if parseErr != nil {
			fmt.Printf("Error parsing html: %s\n", parseErr.Message)
			return
		}

		page.Title = article.Title
		page.MetaDescription = article.Excerpt
		page.TextContent = article.TextContent
	})

	collector.OnError(func(e *colly.Response, err error) {
		page.Error = err.Error()
		page.StatusCode = e.StatusCode
	})

	if err := collector.Visit(targetURL); err != nil {
		page.Error = err.Error()
		return page, nil, &domain.AppError{
			Message: fmt.Sprintf("Error visiting %s: %v", targetURL, err),
		}
	}

	return page, discoveredLinks, nil
}

func normalizeURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}

	u.Fragment = ""
	u.RawQuery = ""
	return u.String()
}

func ParseRawHTML(htmlContent string, baseURL *url.URL) (*readability.Article, *domain.AppError) {
	reader := strings.NewReader(htmlContent)
	article, err := readability.FromReader(reader, baseURL)
	if err != nil {
		return &readability.Article{}, &domain.AppError{
			Message: err.Error(),
		}
	}
	return &article, nil
}


