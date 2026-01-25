package crawlerservicego

import (
	"fmt"
	domain "web_crawler_scraper/Domain"

	colly "github.com/gocolly/colly"
	"encoding/csv"
	"os"
	"net/http"
	"net/url"
	"path"
)

type Product struct {
	Name string
	Price string
	Image string
}


//  Initialize Crawler services
type CrawlerServices struct {
	PaginationUrls []string
	OtherUrls []string
	visitedUrls map[string]bool
	Products []Product
}
func NewCrawlerServices() domain.ICrawlerService {
	return &CrawlerServices{
		PaginationUrls: make([]string, 0),
		OtherUrls: make([]string, 0),
		visitedUrls: make(map[string]bool),
		Products: make([]Product, 0),
	}
}

// Crawling 
func(cr *CrawlerServices) Crawl(currentURL string, maxDepth int)(string, *domain.AppError) {

	c := colly.NewCollector(
		colly.AllowedDomains("www.scrapingcourse.com"),
		colly.MaxDepth(maxDepth),
	)

	c.OnHTML("title", func(e *colly.HTMLElement){
		fmt.Println("Page Title: ", e.Text)
	})

	c.OnHTML("li.product", func(e *colly.HTMLElement){
		productName := e.ChildText(".product-name")
		productPrice := e.ChildText(".price")
		productImage := e.ChildAttr(".product-image", "src")

		product := Product {
			Name: productName,
			Price: productPrice,
			Image: productImage,
		}
		cr.Products = append(cr.Products, product)
		fmt.Printf("ProductName: %s\nProductPrice: %s\nProductImage: %s", 
			productName, productPrice, productImage,
		)
	})

	// find all links in a current website
	// select the href attribute of all tags
	c.OnHTML("a[href]", func(e *colly.HTMLElement){
		link := cr.URLNormalization(e.Request.AbsoluteURL(e.Attr("href")))
		if link != "" && !cr.visitedUrls[link] {
			cr.visitedUrls[link] = true
			if e.Attr("class") == "page-numbers" {
				cr.PaginationUrls = append(cr.PaginationUrls, link)
			} else {
				cr.OtherUrls = append(cr.OtherUrls, link)
			}
		}
	})

	c.OnScraped(func(r *colly.Response){
		fmt.Println("Finished scraping", r.Request.URL)
		cr.ExportToCSV("products.csv")
	})


	c.OnRequest(func(r *colly.Request){
		fmt.Println("Crawling", r.URL)
	})

	c.OnError(func(e *colly.Response, err error){
		fmt.Println("Request URL:", e.Request.URL, "failed with response:", e, "\nError:", err)
	})

	if len(cr.PaginationUrls) > 0 {
		nextUrl := cr.PaginationUrls[0]
		cr.PaginationUrls = cr.PaginationUrls[1:]
		cr.visitedUrls[nextUrl] = true
		err := c.Visit(nextUrl)
		if err != nil {
			fmt.Println("Error in visiting page:", err)
			return "", &domain.AppError{
				Message: domain.ErrInternalServer,
				HttpStatus: http.StatusInternalServerError,
				Err: fmt.Sprintf("Error in visiting page: %s", err),
			}
		}

	}

	if len(cr.OtherUrls) > 0 {
		nextUrl := cr.OtherUrls[0]
		cr.OtherUrls = cr.OtherUrls[1:]
		cr.visitedUrls[nextUrl] = true
		err := c.Visit(nextUrl)
		if err != nil {
			fmt.Println("Error in visiting page:", err)
			return "", &domain.AppError{
				Message: domain.ErrInternalServer,
				HttpStatus: http.StatusInternalServerError,
				Err: fmt.Sprintf("Error in visiting page: %s", err),
			}
		}
	}
	
	return "", nil
}


func(cr *CrawlerServices) ExportToCSV(filename string) *domain.AppError {

	file, err := os.Create(filename)
	if err != nil {
		fmt.Println("Error creating CSV file:", err)
		return &domain.AppError{
			Message: domain.ErrInternalServer,
			HttpStatus: http.StatusInternalServerError,
			Err: fmt.Sprintf("Error creating CSV file: %s", err),
		}
	}

	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	if err := writer.Write([]string{"Name", "Price", "Image"}); err != nil {
		return &domain.AppError{
			Message: domain.ErrInternalServer,
			HttpStatus: http.StatusInternalServerError,
			Err: fmt.Sprintf("Error writing CSV file: %s", err),
		}
	}

	for _, product := range cr.Products {
		if err := writer.Write([]string{product.Name, product.Price, product.Image}); err != nil {
			return &domain.AppError{
				Message: domain.ErrInternalServer,
				HttpStatus: http.StatusInternalServerError,
				Err: fmt.Sprintf("Error writing CSV file: %s", err),
			}
		}
	}

	fmt.Println("product details exported to", filename)
	return nil
}

func(cr *CrawlerServices) URLNormalization(rawURL string) string {
	cleanedURL := path.Clean(rawURL)
	parsedURL, err := url.Parse(cleanedURL)
	if err != nil {
		return ""
	}

	parsedURL.RawQuery = ""
	parsedURL.Fragment = ""
	
	return parsedURL.String()
}


