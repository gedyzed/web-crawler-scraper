package domain

import (
	"net"
	"net/url"
	"strings"
)

// NormalizeAndValidateURL ensures a usable absolute URL for crawl/scrape inputs.
func NormalizeAndValidateURL(rawURL string) (string, *AppError) {
	normalized := strings.TrimSpace(rawURL)
	if normalized == "" {
		return "", &AppError{Message: ErrSeedURLNeeded, HttpStatus: 400}
	}

	if !strings.Contains(normalized, "://") {
		normalized = "https://" + normalized
	}

	parsed, err := url.Parse(normalized)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", &AppError{Message: ErrInvalidURLFormat, HttpStatus: 400}
	}

	scheme := strings.ToLower(parsed.Scheme)
	if scheme != "http" && scheme != "https" {
		return "", &AppError{Message: ErrInvalidURLFormat, HttpStatus: 400}
	}

	if strings.ContainsAny(parsed.Host, " \t\n\r") {
		return "", &AppError{Message: ErrInvalidURLFormat, HttpStatus: 400}
	}

	hostname := parsed.Hostname()
	if hostname == "" || strings.ContainsAny(hostname, " \t\n\r") {
		return "", &AppError{Message: ErrInvalidURLFormat, HttpStatus: 400}
	}

	// Allow localhost and IPs; for regular hostnames require at least one dot.
	if hostname != "localhost" && net.ParseIP(hostname) == nil && !strings.Contains(hostname, ".") {
		return "", &AppError{Message: ErrInvalidURLFormat, HttpStatus: 400}
	}

	parsed.Fragment = ""

	return parsed.String(), nil
}
