-- Bootstrap the full current schema for fresh installs.
-- This migration is idempotent so it can also run safely on existing environments.

CREATE TABLE IF NOT EXISTS users (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	user_id TEXT NOT NULL UNIQUE,
	email TEXT NOT NULL UNIQUE,
	role TEXT DEFAULT 'user',
	password TEXT,
	first_name TEXT,
	last_name TEXT,
	is_verified BOOLEAN DEFAULT FALSE,
	signed_in TIMESTAMPTZ,
	avatar_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS crawler_results (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	crid TEXT UNIQUE,
	user_id TEXT,
	total_pages INTEGER NOT NULL DEFAULT 0,
	total_response_time_ms BIGINT NOT NULL DEFAULT 0,
	total_payload_size BIGINT NOT NULL DEFAULT 0,
	CONSTRAINT fk_crawler_results_user_id
		FOREIGN KEY (user_id) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_crawler_results_deleted_at ON crawler_results (deleted_at);

CREATE TABLE IF NOT EXISTS auth_providers (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	user_id TEXT,
	provider TEXT NOT NULL,
	provider_id TEXT NOT NULL,
	CONSTRAINT provider_idx UNIQUE (provider, provider_id),
	CONSTRAINT fk_auth_providers_user_id
		FOREIGN KEY (user_id) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_providers_deleted_at ON auth_providers (deleted_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	user_id TEXT,
	token TEXT NOT NULL UNIQUE,
	expires_at TIMESTAMPTZ,
	device_info TEXT,
	CONSTRAINT fk_refresh_tokens_user_id
		FOREIGN KEY (user_id) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_deleted_at ON refresh_tokens (deleted_at);

CREATE TABLE IF NOT EXISTS verification_codes (
	email TEXT NOT NULL UNIQUE,
	code BIGINT NOT NULL UNIQUE,
	expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS histories (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	hid TEXT UNIQUE,
	user_id TEXT,
	result_id TEXT,
	url TEXT,
	type TEXT,
	status TEXT,
	response_code BIGINT,
	error_message TEXT,
	fetched_at TIMESTAMPTZ,
	CONSTRAINT fk_histories_user_id
		FOREIGN KEY (user_id) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT fk_histories_result_id
		FOREIGN KEY (result_id) REFERENCES crawler_results(crid)
);
CREATE INDEX IF NOT EXISTS idx_histories_deleted_at ON histories (deleted_at);

CREATE TABLE IF NOT EXISTS pages (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	page_id TEXT,
	result_id TEXT,
	url TEXT,
	parent_url TEXT,
	depth BIGINT,
	status_code BIGINT,
	content_type TEXT,
	response_time_ms BIGINT,
	fetched_at TIMESTAMPTZ,
	title TEXT,
	meta_description TEXT,
	text_content TEXT,
	payload_size BIGINT NOT NULL DEFAULT 0,
	CONSTRAINT fk_pages_result_id
		FOREIGN KEY (result_id) REFERENCES crawler_results(crid)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pages_deleted_at ON pages (deleted_at);

CREATE TABLE IF NOT EXISTS links (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	page_id TEXT,
	url TEXT,
	type VARCHAR(20),
	CONSTRAINT fk_links_page_id
		FOREIGN KEY (page_id) REFERENCES pages(page_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_links_deleted_at ON links (deleted_at);
CREATE INDEX IF NOT EXISTS idx_links_page_id ON links (page_id);

CREATE TABLE IF NOT EXISTS images (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	page_id TEXT,
	url TEXT,
	type VARCHAR(20),
	CONSTRAINT fk_images_page_id
		FOREIGN KEY (page_id) REFERENCES pages(page_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_images_deleted_at ON images (deleted_at);
CREATE INDEX IF NOT EXISTS idx_images_page_id ON images (page_id);

CREATE TABLE IF NOT EXISTS products (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	page_id TEXT,
	name TEXT,
	price TEXT,
	image_url TEXT,
	currency TEXT,
	description TEXT,
	url TEXT,
	CONSTRAINT fk_products_page_id
		FOREIGN KEY (page_id) REFERENCES pages(page_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products (deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_page_id ON products (page_id);

CREATE TABLE IF NOT EXISTS api_keys (
	id BIGSERIAL PRIMARY KEY,
	created_at TIMESTAMPTZ,
	updated_at TIMESTAMPTZ,
	deleted_at TIMESTAMPTZ,
	key_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	name TEXT NOT NULL,
	key_prefix TEXT NOT NULL,
	key_hash TEXT NOT NULL,
	last4 TEXT NOT NULL,
	daily_limit BIGINT NOT NULL DEFAULT 1000,
	is_active BOOLEAN DEFAULT TRUE,
	revoked_at TIMESTAMPTZ,
	last_used_at TIMESTAMPTZ,
	CONSTRAINT uq_api_keys_key_id UNIQUE (key_id),
	CONSTRAINT uq_api_keys_key_hash UNIQUE (key_hash),
	CONSTRAINT fk_api_keys_user_id
		FOREIGN KEY (user_id) REFERENCES users(user_id)
		ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_api_keys_deleted_at ON api_keys (deleted_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys (key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys (is_active);

-- Ensure key metric columns still exist if older schemas created these tables before this migration.
ALTER TABLE IF EXISTS crawler_results
	ADD COLUMN IF NOT EXISTS total_pages INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS total_response_time_ms BIGINT NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS total_payload_size BIGINT NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS pages
	ADD COLUMN IF NOT EXISTS payload_size BIGINT NOT NULL DEFAULT 0;
