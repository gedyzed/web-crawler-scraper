-- Revert full schema bootstrap migration.
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS links;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS histories;
DROP TABLE IF EXISTS verification_codes;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS auth_providers;
DROP TABLE IF EXISTS crawler_results;
DROP TABLE IF EXISTS users;
