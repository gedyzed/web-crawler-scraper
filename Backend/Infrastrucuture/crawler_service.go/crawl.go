package crawlerservicego

import (
	"context"
	"encoding/json"

	"net/http"
	"strings"
	"sync"
	"time"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	colly "github.com/gocolly/colly"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	logrus "github.com/sirupsen/logrus"
)

type QueueItem struct {
	URL   string
	Depth int
}

type crawlWorkerResult struct {
	item  QueueItem
	page  *domain.Page
	links []string
	err   *domain.AppError
}

// Initialize Crawler services
type CrawlerServices struct {
	mu            *sync.Mutex
	Scraper       domain.IScrapeService
	Visited       map[string]bool
	CrawlerConfig config.CrawlerConfig
	Result        *domain.CrawlerResult
	redisClient   redis.Client
	PageCount     int
}

// CrawlerServiceFactory — holds immutable config, safe as singleton
type CrawlerServiceFactory struct {
	crawlerConfig config.CrawlerConfig
	scraperConfig config.ScraperConfig
	redisClient   redis.Client
}

func NewCrawlerServiceFactory(crawlerCfg config.CrawlerConfig, scraperCfg config.ScraperConfig, rdb redis.Client) domain.ICrawlerServiceFactory {
	return &CrawlerServiceFactory{
		crawlerConfig: crawlerCfg,
		scraperConfig: scraperCfg,
		redisClient:   rdb,
	}
}

func (f *CrawlerServiceFactory) NewCrawlerService(userID string) domain.ICrawlerService {

	result := &domain.CrawlerResult{
		CRID:   uuid.New().String(),
		UserID: userID,
	}

	collector := colly.NewCollector(
		colly.Async(false),
	)

	collector.WithTransport(&http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 100,
		IdleConnTimeout:     60 * time.Second,
	})

	collector.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Delay:       50 * time.Millisecond,
		RandomDelay: 100 * time.Millisecond,
	})

	return &CrawlerServices{
		Scraper:       NewScraper(collector, f.scraperConfig),
		mu:            &sync.Mutex{},
		Visited:       make(map[string]bool),
		CrawlerConfig: f.crawlerConfig,
		Result:        result,
		redisClient:   f.redisClient,
		PageCount:     0,
	}
}

// Crawling — BFS level-order traversal
func (cr *CrawlerServices) Crawl(ctx context.Context, seedURL string) (*domain.CrawlerResult, *domain.AppError) {

	// ── Check Redis cache ──
	if cr.redisClient.Exists(ctx, seedURL).Val() > 0 {
		data, err := cr.redisClient.Get(ctx, seedURL).Result()
		if err != nil {
			return nil, &domain.AppError{
				Message:    domain.ErrInternalServer,
				Err:        err.Error(),
				HttpStatus: http.StatusInternalServerError,
			}
		}

		var result domain.CrawlerResult
		if err := json.Unmarshal([]byte(data), &result); err != nil {
			return nil, &domain.AppError{
				Message:    domain.ErrInternalServer,
				Err:        err.Error(),
				HttpStatus: http.StatusInternalServerError,
			}
		}
		result.Cached = true
		return &result, nil
	}

	// ── BFS crawl ──
	currentLevel := []QueueItem{{URL: seedURL, Depth: 0}}
	cr.Visited[seedURL] = true
	cr.PageCount = 0

	maxConcurrency := cr.CrawlerConfig.MaxConcurrency
	if maxConcurrency <= 0 {
		maxConcurrency = 10
	}
	sem := make(chan struct{}, maxConcurrency)

	for len(currentLevel) > 0 {
		// Check if we've already hit the page limit before processing this level
		if cr.PageCount >= cr.CrawlerConfig.MaxPages {
			break
		}

		var nextLevel []QueueItem
		resultsCh := make(chan crawlWorkerResult, maxConcurrency)
		nextIndex := 0
		inFlight := 0

		dispatchNext := func() bool {
			for nextIndex < len(currentLevel) {
				if cr.PageCount >= cr.CrawlerConfig.MaxPages {
					return false
				}

				item := currentLevel[nextIndex]
				nextIndex++

				if !cr.AllowedByConfig(item.URL, item.Depth) {
					continue
				}

				select {
				case sem <- struct{}{}:
					inFlight++
					go func(item QueueItem) {
						defer func() { <-sem }()

						// Each goroutine calls FetchAndParse which creates its own
						// colly.Collector internally — no shared state.
						page, links, err := cr.Scraper.FetchAndParse(item.URL, cr.Result.CRID, cr.Result.UserID)
						if err != nil {
							resultsCh <- crawlWorkerResult{item: item, err: err}
							return
						}

						resultsCh <- crawlWorkerResult{
							item:  item,
							page:  page,
							links: links,
						}
					}(item)
					return true
				default:
					return false
				}
			}

			return false
		}

		for inFlight < maxConcurrency && dispatchNext() {
		}

		for inFlight > 0 {
			result := <-resultsCh
			inFlight--

			if result.err != nil {
				logrus.WithFields(logrus.Fields{
					"url":   result.item.URL,
					"error": result.err.Message,
				}).Warn(domain.LogCrawlPageError)
			} else if result.page != nil && cr.PageCount < cr.CrawlerConfig.MaxPages {
				cr.PageCount++
				cr.Result.Pages = append(cr.Result.Pages, *result.page)
				cr.Result.TotalPages++
				cr.Result.TotalResponseTimeMS += result.page.ResponseTimeMS
				cr.Result.TotalPayloadSize += result.page.PayloadSize
				for _, link := range result.links {
					if !cr.Visited[link] {
						cr.Visited[link] = true
						nextLevel = append(nextLevel, QueueItem{
							URL:   link,
							Depth: result.item.Depth + 1,
						})
					}
				}
			}

			for inFlight < maxConcurrency && dispatchNext() {
			}
		}

		currentLevel = nextLevel
	}

	// Cache result in Redis ─
	cr.Result.Cached = false
	jsonBytes, err := json.Marshal(cr.Result)
	if err == nil {
		cr.redisClient.Set(ctx, seedURL, string(jsonBytes), time.Hour*4)
	}

	logrus.WithField("pages", cr.PageCount).Info(domain.LogCrawlCompleted)

	return cr.Result, nil
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
