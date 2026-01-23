package crawlerservicego

import domain "web_crawler_scraper/Domain"

type Fetch struct{
	Body string
	Urls []string
}


func (f *Fetch) Fetcher(url string)(*Fetch, *domain.AppError){

	return nil, nil
}

