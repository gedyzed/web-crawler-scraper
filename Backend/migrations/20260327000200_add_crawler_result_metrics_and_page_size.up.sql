-- Add aggregate crawl metrics and page payload size columns.
ALTER TABLE IF EXISTS crawler_results
	ADD COLUMN IF NOT EXISTS total_pages INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS total_response_time_ms BIGINT NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS total_payload_size BIGINT NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS pages
	ADD COLUMN IF NOT EXISTS payload_size BIGINT NOT NULL DEFAULT 0;