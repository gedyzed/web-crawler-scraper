-- Drops legacy tables no longer used by the backend.
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS crawler_settings;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS profiles;

-- Ensure images table exists for scraper page assets.
CREATE TABLE IF NOT EXISTS images (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	page_id TEXT,
	url TEXT,
	type VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_images_deleted_at ON images (deleted_at);
CREATE INDEX IF NOT EXISTS idx_images_page_id ON images (page_id);
