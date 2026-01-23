package crawlerservicego

import (
	"fmt"
	domain "web_crawler_scraper/Domain"

	colly "github.com/gocolly/colly"
)

//  Initialize Crawler services
type CrawlerServices struct {}
func NewCrawlerServices() domain.ICrawlerService {
	return &CrawlerServices{}
}

// Crawling 
var visitedUrls = make(map[string]bool)
func(cr *CrawlerServices) Crawl(currentURL string, maxDepth int)(string, *domain.AppError) {

	c := colly.NewCollector(
		colly.AllowedDomains("www.scrapingcourse.com"),
		colly.MaxDepth(maxDepth),
	)

	c.OnHTML("title", func(e *colly.HTMLElement){
		fmt.Println("Page Title: ", e.Text)
	})

	// find all links in a current website
	// select the href attribute of all tags
	c.OnHTML("a[href]", func(e *colly.HTMLElement){
		link := e.Request.AbsoluteURL(e.Attr("a[href]"))
		if link != "" && !visitedUrls[link] {
			visitedUrls[link] = true
			fmt.Printf("link found: %s", link)
			e.Request.Visit(link)
		}
	})

	c.OnRequest(func(r *colly.Request){
		fmt.Println("Crawling", r.URL)
	})

	c.OnError(func(e *colly.Response, err error){
		fmt.Println("Request URL:", e.Request.URL, "failed with response:", e, "\nError:", err)
	})

	// visit the seed URL
	err := c.Visit(currentURL)
	if err != nil {
		fmt.Println("Error in visiting page:", err)
	}

	return "", nil
}

