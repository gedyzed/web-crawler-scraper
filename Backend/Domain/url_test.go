package domain

import "testing"

func TestNormalizeAndValidateURL_AppendsHTTPSForDomainOnly(t *testing.T) {
	normalized, err := NormalizeAndValidateURL("google.com")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if normalized != "https://google.com" {
		t.Fatalf("expected https://google.com, got %s", normalized)
	}
}

func TestNormalizeAndValidateURL_RejectsMalformedURL(t *testing.T) {
	_, err := NormalizeAndValidateURL("https://http://bad")
	if err == nil {
		t.Fatal("expected validation error for malformed URL")
	}
	if err.HttpStatus != 400 {
		t.Fatalf("expected status 400, got %d", err.HttpStatus)
	}
}

func TestNormalizeAndValidateURL_AllowsHTTPSAndHTTP(t *testing.T) {
	cases := []string{"https://example.com/path", "http://example.com"}
	for _, c := range cases {
		if _, err := NormalizeAndValidateURL(c); err != nil {
			t.Fatalf("expected %s to be valid, got %v", c, err)
		}
	}
}

func TestNormalizeAndValidateURL_RejectsHostWithoutDot(t *testing.T) {
	_, err := NormalizeAndValidateURL("justtext")
	if err == nil {
		t.Fatal("expected validation error for host without dot")
	}
}
