package crawlerservicego

import (
	"context"
	"encoding/json"
	"fmt"

	// "net/http"
	"strings"
	"sync"
	"time"
	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"github.com/redis/go-redis/v9"
)

type QueueItem struct {
	URL   string
	Depth int
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
	config      config.CrawlerConfig
	redisClient redis.Client
}

func NewCrawlerServiceFactory(cfg config.CrawlerConfig, rdb redis.Client) domain.ICrawlerServiceFactory {
	return &CrawlerServiceFactory{
		config:      cfg,
		redisClient: rdb,
	}
}

func (f *CrawlerServiceFactory) NewCrawlerService() domain.ICrawlerService {
	return &CrawlerServices{
		Scraper:       NewScraper(&f.config),
		mu:            &sync.Mutex{},
		Visited:       make(map[string]bool),
		CrawlerConfig: f.config,
		Result:        &domain.CrawlerResult{},
		redisClient:   f.redisClient,
		PageCount:     0,
	}
}

// Crawling — BFS level-order traversal
func (cr *CrawlerServices) Crawl(ctx context.Context, seedURL string) (*domain.CrawlerResult, *domain.AppError) {

	// ── Check Redis cache ──
	// if cr.redisClient.Exists(ctx, seedURL).Val() > 0 {
	// 	data, err := cr.redisClient.Get(ctx, seedURL).Result()
	// 	if err != nil {
	// 		return nil, &domain.AppError{
	// 			Message:    domain.ErrInternalServer,
	// 			Err:        err.Error(),
	// 			HttpStatus: http.StatusInternalServerError,
	// 		}
	// 	}

	// 	var result domain.CrawlerResult
	// 	if err := json.Unmarshal([]byte(data), &result); err != nil {
	// 		return nil, &domain.AppError{
	// 			Message:    domain.ErrInternalServer,
	// 			Err:        err.Error(),
	// 			HttpStatus: http.StatusInternalServerError,
	// 		}
	// 	}
	// 	return &result, nil
	// }

	// ── BFS crawl ──
	currentLevel := []QueueItem{{URL: seedURL, Depth: 0}}
	cr.Visited[seedURL] = true
	cr.PageCount = 0

	for len(currentLevel) > 0 {
		// Check if we've already hit the page limit before processing this level
		if cr.PageCount >= cr.CrawlerConfig.MaxPages {
			break
		}

		var nextLevel []QueueItem
		var wg sync.WaitGroup

		for _, item := range currentLevel {
			// Check page limit before launching each goroutine
			cr.mu.Lock()
			limitReached := cr.PageCount >= cr.CrawlerConfig.MaxPages
			cr.mu.Unlock()
			if limitReached {
				break
			}

			if !cr.AllowedByConfig(item.URL, item.Depth) {
				continue
			}

			wg.Add(1)
			go func(item QueueItem) {
				defer wg.Done()

				// Each goroutine calls FetchAndParse which creates its own
				// colly.Collector internally — no shared state.
				page, links, err := cr.Scraper.FetchAndParse(item.URL, item.Depth)
				if err != nil {
					fmt.Printf("Error visiting %s: %v\n", item.URL, err.Message)
					return
				}

				cr.mu.Lock()
				if cr.PageCount < cr.CrawlerConfig.MaxPages {
					cr.PageCount++ 
					cr.Result.Pages = append(cr.Result.Pages, *page)
					for _, link := range links {
						if !cr.Visited[link] {
							cr.Visited[link] = true
							nextLevel = append(nextLevel, QueueItem{
								URL:   link,
								Depth: item.Depth + 1,
							})
						}
					}
				}
				cr.mu.Unlock()

			}(item)
		}

		// Wait for all goroutines at this depth level to finish
		wg.Wait()

		currentLevel = nextLevel
	}

	// Cache result in Redis ─
	jsonBytes, err := json.Marshal(cr.Result)
	if err == nil {
		cr.redisClient.Set(ctx, seedURL, string(jsonBytes), time.Hour*4)
	}

	fmt.Println("pages: ", cr.PageCount)

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
