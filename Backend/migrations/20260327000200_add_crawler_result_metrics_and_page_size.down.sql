-- Revert aggregate crawl metrics and page payload size columns.
ALTER TABLE IF EXISTS pages
	DROP COLUMN IF EXISTS payload_size;

ALTER TABLE IF EXISTS crawler_results
	DROP COLUMN IF EXISTS total_payload_size,
	DROP COLUMN IF EXISTS total_response_time_ms,
	DROP COLUMN IF EXISTS total_pages;