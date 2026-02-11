package crawlerservicego

import (
	"fmt"
	"time"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"
	

	"encoding/csv"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

	colly "github.com/gocolly/colly"
	"github.com/go-shiori/go-readability"
)

type Product struct {
	Name  string
	Price string
	Image string
}

type QueueItem struct {
	URL   string
	Depth int
}

// Initialize Crawler services
type CrawlerServices struct {
	collector      *colly.Collector
	mu             *sync.Mutex
	Queue          []QueueItem
	LinkMap        map[string]bool
	PaginationUrls []string
	OtherUrls      []string
	visitedUrls    map[string]bool
	Products       []Product
	CrawlerConfig  config.CrawlerConfig
	Result		   *domain.CrawlerResult
}

func NewCrawlerServices(CrawlerConfig config.CrawlerConfig) domain.ICrawlerService {

	collector := colly.NewCollector(
		colly.AllowedDomains(CrawlerConfig.AllowedDomains...),
		colly.MaxDepth(CrawlerConfig.MaxDepth),
	)
	
	result := &domain.CrawlerResult{}

	cs := &CrawlerServices{
		collector:      collector,
		mu:             &sync.Mutex{},
		Queue:          make([]QueueItem, 0),
		LinkMap:        make(map[string]bool),
		PaginationUrls: make([]string, 0),
		OtherUrls:      make([]string, 0),
		visitedUrls:    make(map[string]bool),
		Products:       make([]Product, 0),
		CrawlerConfig:  CrawlerConfig,
		Result: result,
	}
	cs.RegisterCallbacks()
	return cs
}

// Crawling
func (cr *CrawlerServices) Crawl(seedURL string) (*domain.CrawlerResult, *domain.AppError) {
	
	depth := 1
	cr.visitedUrls[seedURL] = true
	cr.Queue = append(cr.Queue, QueueItem{
		URL:   seedURL,
		Depth: depth,
	})

	for len(cr.Queue) > 0 {
		item := cr.Queue[0]
		cr.Queue = cr.Queue[1:]
		

		if !cr.AllowedByConfig(item.URL, item.Depth) {
			continue
		}

		// Clear LinkMap for current page visit
		cr.mu.Lock()
		cr.LinkMap = make(map[string]bool)
		cr.mu.Unlock()

		if err := cr.collector.Visit(item.URL); err != nil {
			fmt.Printf("Error visiting %s: %v\n", item.URL, err)
			continue
		}

		cr.mu.Lock()
		for link := range cr.LinkMap {
			if !cr.visitedUrls[link] {
				cr.visitedUrls[link] = true
				cr.Queue = append(cr.Queue, QueueItem{
					URL:   link,
					Depth: depth + 1,
				})
                depth += 1
			}
		}
		cr.mu.Unlock()
	}

	return cr.Result, nil
}

func (cr *CrawlerServices) RegisterCallbacks() {

	cr.collector.OnRequest(func(e *colly.Request){
		
		page := &domain.Page{
			URL: e.URL.String(),
			ParentURL: e.Ctx.Get("parent_url"),
			Depth: e.Depth,
			FetchedAt: time.Now(),	
		}

		// track the start time of the scraper
		e.Ctx.Put("start_time", time.Now())

		// Store the pointer to page for subsquent callbacks
		e.Ctx.Put("page", page)

	})

	cr.collector.OnResponse(func(e *colly.Response){

		if p, ok := e.Ctx.GetAny("page").(*domain.Page); ok {
			startTime := e.Ctx.GetAny("start_time").(time.Time)

			p.StatusCode = e.StatusCode
			p.ResponseTimeMS = time.Since(startTime).Milliseconds()
			p.ContentType = e.Headers.Get("Content-Type")
		}
	})

	cr.collector.OnHTML("a[href]", func(e *colly.HTMLElement) {

		link := cr.NormalizeURL(e.Request.AbsoluteURL(e.Attr("href")))
		if link != "" {
			cr.mu.Lock()
			cr.LinkMap[link] = true
			cr.mu.Unlock()

			if page, ok := e.Request.Ctx.GetAny("page").(*domain.Page); ok {
				if e.Request.URL.Host == e.Response.Request.URL.Host{
					page.InternalLinks = append(page.InternalLinks, link)
				} else {
					page.ExternalLinks = append(page.ExternalLinks, link)
				}
			}
		}

	})

	cr.collector.OnHTML("html", func(e *colly.HTMLElement) {
		targetURL := e.Request.URL
		rawHtml, err := e.DOM.Html()
		if err != nil {
			fmt.Printf("Error on-html :%s", err)
		}

		article, err_ := cr.ParseRawHtml(rawHtml, targetURL)
		if err != nil {
			fmt.Printf("Error on-html :%s", err_)
		}

		if p, ok := e.Request.Ctx.GetAny("page").(*domain.Page); ok {
			p.Title = article.Title
			p.MetaDescription = article.Excerpt
			p.TextContent = article.TextContent
		}
	})

	cr.collector.OnError(func(e *colly.Response, err error) {
		if page, ok := e.Ctx.GetAny("page").(*domain.Page); ok {
			page.Error = err.Error()
			page.StatusCode = e.StatusCode

			cr.mu.Lock()
			cr.Result.Pages = append(cr.Result.Pages, *page)
			cr.mu.Unlock()
		}
	})

	cr.collector.OnScraped(func(e *colly.Response){
		if page, ok := e.Ctx.GetAny("page").(*domain.Page); ok {
			cr.mu.Lock()
			cr.Result.Pages = append(cr.Result.Pages, *page)
			cr.mu.Unlock()
		}
	})
}

func (cr *CrawlerServices) ExportToCSV(filename string) *domain.AppError {

	file, err := os.Create(filename)
	if err != nil {
		fmt.Println("Error creating CSV file:", err)
		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: http.StatusInternalServerError,
			Err:        fmt.Sprintf("Error creating CSV file: %s", err),
		}
	}

	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	if err := writer.Write([]string{"Name", "Price", "Image"}); err != nil {
		return &domain.AppError{
			Message:    domain.ErrInternalServer,
			HttpStatus: http.StatusInternalServerError,
			Err:        fmt.Sprintf("Error writing CSV file: %s", err),
		}
	}

	for _, product := range cr.Products {
		if err := writer.Write([]string{product.Name, product.Price, product.Image}); err != nil {
			return &domain.AppError{
				Message:    domain.ErrInternalServer,
				HttpStatus: http.StatusInternalServerError,
				Err:        fmt.Sprintf("Error writing CSV file: %s", err),
			}
		}
	}

	fmt.Println("product details exported to", filename)
	return nil
}

func (cr *CrawlerServices) NormalizeURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}

	u.Fragment = ""
	u.RawQuery = ""

	return u.String()
}

func (cr *CrawlerServices) AllowedByConfig(url string, depth int) bool {

	if depth > cr.CrawlerConfig.MaxDepth {
		return false
	}

	for _, pattern := range cr.CrawlerConfig.DeniedPatterns {
		if strings.Contains(url, pattern) {
			return false
		}
	}

	return true
}

func(cr *CrawlerServices) ParseRawHtml(htmlContent string, baseURL *url.URL)(
	*readability.Article,
	*domain.AppError,
){

	reader := strings.NewReader(htmlContent)
	article, err := readability.FromReader(reader, baseURL)
	if err != nil {
		return &readability.Article{}, &domain.AppError{
			Message: err.Error(),
		}
	}

	return &article, nil
}
	
