package crawlerservicego

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	domain "web_crawler_scraper/Domain"
	"web_crawler_scraper/Infrastrucuture/config"

	"github.com/PuerkitoBio/goquery"
	"github.com/go-shiori/go-readability"
	colly "github.com/gocolly/colly"

	"github.com/google/uuid"
	logrus "github.com/sirupsen/logrus"
)

const (
	defaultMaxLinksPerPage    = 100
	defaultMaxImagesPerPage   = 50
	defaultMaxProductsPerPage = 20
)

type ScraperServiceFactory struct {
	scraperConfig config.ScraperConfig
}

func NewScraperServiceFactory(cfg config.ScraperConfig) domain.IScraperServiceFactory {
	return &ScraperServiceFactory{scraperConfig: cfg}
}

func (s *ScraperServiceFactory) NewScraperService() domain.IScrapeService {

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
	return NewScraper(collector, s.scraperConfig)
}

// Scraper handles fetching and parsing pages.
// It is stateless — all mutable state lives inside FetchAndParse.
type Scraper struct {
	collector          *colly.Collector
	maxLinksPerPage    int
	maxImagesPerPage   int
	maxProductsPerPage int
}

func NewScraper(collector *colly.Collector, cfg config.ScraperConfig) domain.IScrapeService {
	maxLinks := cfg.MaxLinksPerPage
	if maxLinks <= 0 {
		maxLinks = defaultMaxLinksPerPage
	}

	maxImages := cfg.MaxImagesPerPage
	if maxImages <= 0 {
		maxImages = defaultMaxImagesPerPage
	}

	maxProducts := cfg.MaxProductsPerPage
	if maxProducts <= 0 {
		maxProducts = defaultMaxProductsPerPage
	}

	return &Scraper{
		collector:          collector,
		maxLinksPerPage:    maxLinks,
		maxImagesPerPage:   maxImages,
		maxProductsPerPage: maxProducts,
	}
}

// FetchAndParse visits a single URL and returns the parsed Page
// along with all discovered links found on that page.
// A fresh colly.Collector is created per call so there is no
// shared mutable state and no revisit blocking.
func (s *Scraper) FetchAndParse(targetURL string, resultID string, userID string) (*domain.Page, []string, *domain.AppError) {

	page := &domain.Page{
		PageID:    uuid.New().String(),
		ResultID:  resultID,
		URL:       targetURL,
		FetchedAt: time.Now(),
		Links:     make([]domain.Link, 0),
		Products:  make([]domain.Product, 0),
		Images:    make([]domain.Image, 0),
	}
	var pageMu sync.Mutex
	discoveredLinks := make([]string, 0)
	seenDiscovered := make(map[string]bool)

	collector := s.collector.Clone()

	collector.OnRequest(func(e *colly.Request) {
		e.Ctx.Put("start_time", time.Now())
	})

	collector.OnResponse(func(e *colly.Response) {
		startTime := e.Ctx.GetAny("start_time").(time.Time)
		pageMu.Lock()
		defer pageMu.Unlock()
		page.StatusCode = e.StatusCode
		page.ResponseTimeMS = time.Since(startTime).Milliseconds()
		page.ContentType = e.Headers.Get("Content-Type")
		page.PayloadSize = int64(len(e.Body))
	})

	collector.OnHTML("a[href]", func(e *colly.HTMLElement) {
		link := normalizeURL(e.Request.AbsoluteURL(e.Attr("href")))
		if link == "" {
			return
		}
		if len(discoveredLinks) >= s.maxLinksPerPage {
			return
		}

		if seenDiscovered[link] {
			return
		}
		seenDiscovered[link] = true

		discoveredLinks = append(discoveredLinks, link)
		pageMu.Lock()
		page.Links = append(page.Links, domain.Link{
			PageID: page.PageID,
			URL:    link,
			Type:   linkType(link, targetURL),
		})
		pageMu.Unlock()
	})

	collector.OnHTML("html", func(e *colly.HTMLElement) {
		rawHTML, err := e.DOM.Html()
		if err != nil {
			logrus.WithError(err).Warn(domain.LogHTMLExtractError)
			return
		}

		var wg sync.WaitGroup

		var articleTitle string
		var articleExcerpt string
		var articleContent string

		var extractedProducts []domain.Product
		var extractedImages []domain.Image

		wg.Add(1)
		go func() {
			defer wg.Done()
			article, parseErr := ParseRawHTML(rawHTML, e.Request.URL)
			if parseErr != nil {
				logrus.WithField("error", parseErr.Message).Warn(domain.LogHTMLParseError)
				return
			}
			articleTitle = article.Title
			articleExcerpt = article.Excerpt
			articleContent = article.TextContent
		}()

		wg.Add(1)
		go func() {
			defer wg.Done()
			extractedProducts = s.extractProducts(e, targetURL)
		}()

		wg.Add(1)
		go func() {
			defer wg.Done()
			extractedImages = extractImageLinks(e.DOM, targetURL, s.maxImagesPerPage)
		}()

		wg.Wait()

		pageMu.Lock()
		page.Title = articleTitle
		page.MetaDescription = articleExcerpt
		page.TextContent = articleContent
		page.Products = extractedProducts
		page.Images = extractedImages
		pageMu.Unlock()
	})

	collector.OnError(func(e *colly.Response, err error) {
		pageMu.Lock()
		defer pageMu.Unlock()
		page.StatusCode = e.StatusCode
		logrus.WithFields(logrus.Fields{
			"url":         targetURL,
			"status_code": e.StatusCode,
			"error":       err.Error(),
		}).Warn(domain.LogCrawlPageError)
	})

	if err := collector.Visit(targetURL); err != nil {
		logrus.WithFields(logrus.Fields{
			"url":   targetURL,
			"error": err.Error(),
		}).Warn(domain.LogScrapeFailed)
		return page, nil, classifyFetchError(err)
	}

	return page, discoveredLinks, nil
}

// E-commerce Product Extraction
// extractProducts runs all three extraction strategies and returns
// a deduplicated slice of products.
func (s *Scraper) extractProducts(e *colly.HTMLElement, pageURL string) []domain.Product {
	var products []domain.Product

	// Strategy 1 — JSON-LD schema.org
	products = append(products, extractFromJSONLD(e, pageURL)...)

	// Strategy 2 — Common CSS selectors for product cards
	products = append(products, extractFromCSS(e, pageURL)...)

	// Strategy 3 — Open Graph meta tags (single product page)
	if ogProduct := extractFromOpenGraph(e, pageURL); ogProduct != nil {
		products = append(products, *ogProduct)
	}

	deduplicated := deduplicateProducts(products)
	if len(deduplicated) > s.maxProductsPerPage {
		return deduplicated[:s.maxProductsPerPage]
	}

	return deduplicated
}

// schemaProduct mirrors the relevant fields of a schema.org Product.
type schemaProduct struct {
	Type        string      `json:"@type"`
	Name        string      `json:"name"`
	Image       interface{} `json:"image"` // can be string or []string
	Description string      `json:"description"`
	URL         string      `json:"url"`
	Offers      interface{} `json:"offers"` // object or array
}

type schemaOffer struct {
	Price         interface{} `json:"price"` // can be string or number
	PriceCurrency string      `json:"priceCurrency"`
}

// schemaGraph represents a JSON-LD @graph array wrapper.
type schemaGraph struct {
	Graph []json.RawMessage `json:"@graph"`
}

func extractFromJSONLD(e *colly.HTMLElement, pageURL string) []domain.Product {
	var products []domain.Product

	e.ForEach(`script[type="application/ld+json"]`, func(_ int, el *colly.HTMLElement) {
		raw := strings.TrimSpace(el.Text)
		if raw == "" {
			return
		}

		// Try to parse products from this JSON-LD block
		parsed := parseJSONLDBlock([]byte(raw), pageURL)
		products = append(products, parsed...)
	})

	return products
}

func parseJSONLDBlock(data []byte, pageURL string) []domain.Product {
	var products []domain.Product

	// Try as a single object first
	var single schemaProduct
	if err := json.Unmarshal(data, &single); err == nil {
		if strings.EqualFold(single.Type, "Product") {
			if p := schemaToProduct(single, pageURL); p != nil {
				products = append(products, *p)
			}
			return products
		}
	}

	// Try as an array of objects
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err == nil {
		for _, item := range arr {
			products = append(products, parseJSONLDBlock(item, pageURL)...)
		}
		return products
	}

	// Try as @graph wrapper
	var graph schemaGraph
	if err := json.Unmarshal(data, &graph); err == nil && len(graph.Graph) > 0 {
		for _, item := range graph.Graph {
			products = append(products, parseJSONLDBlock(item, pageURL)...)
		}
	}

	return products
}

func schemaToProduct(sp schemaProduct, pageURL string) *domain.Product {
	if sp.Name == "" {
		return nil
	}

	p := &domain.Product{
		Name:        sp.Name,
		Description: sp.Description,
		URL:         sp.URL,
	}

	if p.URL == "" {
		p.URL = pageURL
	}

	// Extract image (can be string, []string, or object with url)
	switch img := sp.Image.(type) {
	case string:
		p.ImageURL = img
	case []interface{}:
		if len(img) > 0 {
			if s, ok := img[0].(string); ok {
				p.ImageURL = s
			}
		}
	case map[string]interface{}:
		if u, ok := img["url"].(string); ok {
			p.ImageURL = u
		}
	}

	// Extract price from offers
	switch offers := sp.Offers.(type) {
	case map[string]interface{}:
		extractOfferPrice(offers, p)
	case []interface{}:
		if len(offers) > 0 {
			if offerMap, ok := offers[0].(map[string]interface{}); ok {
				extractOfferPrice(offerMap, p)
			}
		}
	}

	return p
}

func extractOfferPrice(offer map[string]interface{}, p *domain.Product) {
	if price, ok := offer["price"]; ok {
		p.Price = fmt.Sprintf("%v", price)
	}
	if currency, ok := offer["priceCurrency"].(string); ok {
		p.Currency = currency
	}
}

// Strategy 2: Common CSS Selectors
// productSelectors defines common e-commerce CSS patterns to look for.
var productSelectors = []string{
	".product",
	".product-card",
	".product-item",
	".product-grid-item",
	"[data-product]",
	".woocommerce-loop-product__link",
	"li.product",
	".s-result-item[data-asin]", // Amazon
	".product-tile",             // Shopify-like
	".grid__item .product-card",
}

// nameSelectors are tried in order within each product element.
var nameSelectors = []string{
	".product-title",
	".product-name",
	".woocommerce-loop-product__title",
	"[data-product-name]",
	"h2",
	"h3",
	"h4",
	".title",
	"a",
}

// priceSelectors are tried in order within each product element.
var priceSelectors = []string{
	".price",
	".product-price",
	".woocommerce-Price-amount",
	"[data-price]",
	".sale-price",
	".regular-price",
	".amount",
	"span.money",
	".price-item",
}

// imageSelectors are tried in order within each product element.
var imageSelectors = []string{
	"img.product-image",
	"img.attachment-woocommerce_thumbnail",
	"img[data-src]",
	"img",
}

func extractFromCSS(e *colly.HTMLElement, pageURL string) []domain.Product {
	var products []domain.Product

	for _, selector := range productSelectors {
		e.ForEach(selector, func(_ int, el *colly.HTMLElement) {
			product := extractSingleProductFromCard(el, pageURL)
			if product != nil && product.Name != "" {
				products = append(products, *product)
			}
		})

		// If we found products with this selector, stop trying others
		// to avoid duplicates from overlapping selectors
		if len(products) > 0 {
			break
		}
	}

	return products
}

func extractSingleProductFromCard(el *colly.HTMLElement, pageURL string) *domain.Product {
	p := &domain.Product{URL: pageURL}

	// Extract product name
	for _, sel := range nameSelectors {
		name := strings.TrimSpace(el.DOM.Find(sel).First().Text())
		if name != "" {
			p.Name = name
			break
		}
	}

	// Extract price
	for _, sel := range priceSelectors {
		priceEl := el.DOM.Find(sel).First()
		// Check data-price attribute first
		if dataPrice, exists := priceEl.Attr("data-price"); exists && dataPrice != "" {
			p.Price = dataPrice
			break
		}
		price := strings.TrimSpace(priceEl.Text())
		if price != "" {
			p.Price = price
			break
		}
	}

	// Extract image
	for _, sel := range imageSelectors {
		imgEl := el.DOM.Find(sel).First()
		if imgEl.Length() == 0 {
			continue
		}
		// Try data-src first (lazy loaded), then src
		if src, exists := imgEl.Attr("data-src"); exists && src != "" {
			p.ImageURL = resolveURL(src, pageURL)
			break
		}
		if src, exists := imgEl.Attr("src"); exists && src != "" {
			p.ImageURL = resolveURL(src, pageURL)
			break
		}
	}

	// Extract product link
	linkEl := el.DOM.Find("a[href]").First()
	if linkEl.Length() > 0 {
		if href, exists := linkEl.Attr("href"); exists && href != "" {
			p.URL = resolveURL(href, pageURL)
		}
	}

	// Extract description from data attribute or a short text block
	if desc, exists := el.DOM.Attr("data-product-description"); exists {
		p.Description = desc
	} else {
		descEl := el.DOM.Find(".product-description, .short-description, .description, p").First()
		if descEl.Length() > 0 {
			p.Description = strings.TrimSpace(descEl.Text())
		}
	}

	return p
}

// Strategy 3: Open Graph Meta Tags

func extractFromOpenGraph(e *colly.HTMLElement, pageURL string) *domain.Product {
	var ogTitle, ogImage, ogPrice, ogCurrency, ogDescription, ogURL string

	e.DOM.Find("meta").Each(func(_ int, s *goquery.Selection) {
		prop, _ := s.Attr("property")
		name, _ := s.Attr("name")
		content, _ := s.Attr("content")

		key := prop
		if key == "" {
			key = name
		}

		switch key {
		case "og:title":
			ogTitle = content
		case "og:image":
			ogImage = content
		case "og:description":
			ogDescription = content
		case "og:url":
			ogURL = content
		case "product:price:amount":
			ogPrice = content
		case "product:price:currency":
			ogCurrency = content
		}
	})

	// Only return an OG product if we have a price indicator (product page)
	if ogPrice == "" || ogTitle == "" {
		return nil
	}

	return &domain.Product{
		Name:        ogTitle,
		Price:       ogPrice,
		Currency:    ogCurrency,
		ImageURL:    ogImage,
		Description: ogDescription,
		URL:         firstNonEmpty(ogURL, pageURL),
	}
}

// ── Helpers ──

func resolveURL(rawURL string, baseURL string) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return ""
	}

	lower := strings.ToLower(rawURL)
	if strings.HasPrefix(lower, "javascript:") || strings.HasPrefix(lower, "mailto:") || strings.HasPrefix(lower, "tel:") {
		return ""
	}

	if strings.HasPrefix(rawURL, "http://") || strings.HasPrefix(rawURL, "https://") {
		return rawURL
	}
	base, err := url.Parse(baseURL)
	if err != nil {
		return rawURL
	}
	ref, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	return base.ResolveReference(ref).String()
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}

func deduplicateProducts(products []domain.Product) []domain.Product {
	if len(products) == 0 {
		return make([]domain.Product, 0)
	}
	seen := make(map[string]bool)
	var result []domain.Product
	for _, p := range products {
		key := strings.ToLower(strings.TrimSpace(p.Name))
		if key == "" || seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, p)
	}
	return result
}

func normalizeURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}

	if u.Scheme != "" && u.Scheme != "http" && u.Scheme != "https" {
		return ""
	}

	u.Fragment = ""
	u.RawQuery = ""
	return u.String()
}

func linkType(link string, baseURL string) string {
	linkURL, err := url.Parse(link)
	if err != nil {
		return "Internal"
	}

	baseParsed, err := url.Parse(baseURL)
	if err != nil {
		return "Internal"
	}

	linkHost := normalizeHost(linkURL.Hostname())
	baseHost := normalizeHost(baseParsed.Hostname())
	if linkHost == "" || baseHost == "" {
		return "Internal"
	}

	if linkHost == baseHost || strings.HasSuffix(linkHost, "."+baseHost) || strings.HasSuffix(baseHost, "."+linkHost) {
		return "Internal"
	}

	return "External"
}

func normalizeHost(host string) string {
	host = strings.ToLower(strings.TrimSpace(host))
	host = strings.TrimPrefix(host, "www.")
	return host
}

func extractImageLinks(doc *goquery.Selection, baseURL string, maxImages int) []domain.Image {
	seen := make(map[string]bool)
	var links []domain.Image
	if maxImages <= 0 {
		maxImages = defaultMaxImagesPerPage
	}

	add := func(raw string) {
		if len(links) >= maxImages {
			return
		}

		resolved := resolveURL(raw, baseURL)
		if resolved == "" || seen[resolved] {
			return
		}
		seen[resolved] = true
		links = append(links, domain.Image{
			Link: domain.Link{
				URL: resolved,
			},
		})
	}

	doc.Find("img").Each(func(_ int, s *goquery.Selection) {
		if src, ok := s.Attr("src"); ok {
			add(src)
		}
		if src, ok := s.Attr("data-src"); ok {
			add(src)
		}
		if src, ok := s.Attr("data-original"); ok {
			add(src)
		}
		if srcset, ok := s.Attr("srcset"); ok {
			for _, candidate := range splitSrcSet(srcset) {
				add(candidate)
			}
		}
		if srcset, ok := s.Attr("data-srcset"); ok {
			for _, candidate := range splitSrcSet(srcset) {
				add(candidate)
			}
		}
	})

	doc.Find("source").Each(func(_ int, s *goquery.Selection) {
		if srcset, ok := s.Attr("srcset"); ok {
			for _, candidate := range splitSrcSet(srcset) {
				add(candidate)
			}
		}
	})

	doc.Find(`meta[property="og:image"], meta[name="twitter:image"], link[rel="image_src"]`).Each(func(_ int, s *goquery.Selection) {
		if content, ok := s.Attr("content"); ok {
			add(content)
		}
		if href, ok := s.Attr("href"); ok {
			add(href)
		}
	})

	return links
}

func splitSrcSet(srcset string) []string {
	parts := strings.Split(srcset, ",")
	urls := make([]string, 0, len(parts))
	for _, part := range parts {
		fields := strings.Fields(strings.TrimSpace(part))
		if len(fields) == 0 {
			continue
		}
		urls = append(urls, fields[0])
	}
	return urls
}

func ParseRawHTML(htmlContent string, baseURL *url.URL) (*readability.Article, *domain.AppError) {
	reader := strings.NewReader(htmlContent)
	article, err := readability.FromReader(reader, baseURL)
	if err != nil {
		logrus.WithFields(logrus.Fields{
			"url":   baseURL.String(),
			"error": err.Error(),
		}).Warn(domain.LogHTMLParseError)
		return &readability.Article{}, &domain.AppError{
			Message:    domain.ErrHTMLParseFailed,
			HttpStatus: 422,
		}
	}
	return &article, nil
}

func classifyFetchError(err error) *domain.AppError {
	msg := err.Error()
	switch {
	case strings.Contains(msg, "no such host") || strings.Contains(msg, "connection refused"):
		return &domain.AppError{Message: domain.ErrURLBadGateway, HttpStatus: 502}
	case strings.Contains(msg, "timeout") || strings.Contains(msg, "deadline exceeded"):
		return &domain.AppError{Message: domain.ErrURLTimeout, HttpStatus: 504}
	case strings.Contains(msg, "403") || strings.Contains(msg, "forbidden"):
		return &domain.AppError{Message: domain.ErrURLForbidden, HttpStatus: 403}
	case strings.Contains(msg, "404") || strings.Contains(msg, "not found"):
		return &domain.AppError{Message: domain.ErrURLNotFound, HttpStatus: 404}
	default:
		return &domain.AppError{Message: domain.ErrURLUnreachable, HttpStatus: 502}
	}
}
