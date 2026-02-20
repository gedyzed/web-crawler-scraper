import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ─── Mock History Data ────────────────────────────────────
const mockHistory = [
    {
        id: 1,
        url: 'https://example.com',
        type: 'crawl',
        status: 'completed',
        timestamp: '2026-02-20T08:30:00Z',
        pagesFound: 12,
        depth: 2,
        duration: '3.2s',
        request: {
            method: 'POST',
            endpoint: '/api/v1/crawl',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-••••••' },
            body: { url: 'https://example.com', maxPages: 50, depth: 2, allowedPatterns: [], deniedPatterns: [] },
        },
        response: {
            statusCode: 200,
            pages: [
                { url: 'https://example.com', title: 'Example Domain', statusCode: 200, links: 3 },
                { url: 'https://example.com/about', title: 'About Us', statusCode: 200, links: 5 },
                { url: 'https://example.com/contact', title: 'Contact', statusCode: 200, links: 2 },
            ],
            metadata: { totalLinks: 47, avgResponseTime: '124ms', crawlDuration: '3.2s' },
        },
    },
    {
        id: 2,
        url: 'https://news.ycombinator.com',
        type: 'scrape',
        status: 'completed',
        timestamp: '2026-02-20T07:15:00Z',
        pagesFound: 1,
        depth: 0,
        duration: '0.8s',
        request: {
            method: 'POST',
            endpoint: '/api/v1/scrape',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-••••••' },
            body: { url: 'https://news.ycombinator.com' },
        },
        response: {
            statusCode: 200,
            data: {
                title: 'Hacker News',
                description: 'Links for the intellectually curious',
                content: 'Hacker News - Links for the intellectually curious, curated by Y Combinator...',
                links: ['https://news.ycombinator.com/newest', 'https://news.ycombinator.com/ask'],
            },
            metadata: { language: 'en', responseTime: '0.8s', contentLength: '42.3 KB' },
        },
    },
    {
        id: 3,
        url: 'https://github.com/trending',
        type: 'scrape',
        status: 'completed',
        timestamp: '2026-02-19T22:45:00Z',
        pagesFound: 1,
        depth: 0,
        duration: '1.1s',
        request: {
            method: 'POST',
            endpoint: '/api/v1/scrape',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-••••••' },
            body: { url: 'https://github.com/trending' },
        },
        response: {
            statusCode: 200,
            data: {
                title: 'Trending repositories on GitHub today',
                description: 'See what the GitHub community is most excited about today.',
                content: 'Trending repositories, developers and organizations...',
                links: ['https://github.com/trending/javascript', 'https://github.com/trending/python'],
            },
            metadata: { language: 'en', responseTime: '1.1s', contentLength: '68.1 KB' },
        },
    },
    {
        id: 4,
        url: 'https://blog.golang.org',
        type: 'crawl',
        status: 'completed',
        timestamp: '2026-02-19T18:00:00Z',
        pagesFound: 24,
        depth: 3,
        duration: '8.7s',
        request: {
            method: 'POST',
            endpoint: '/api/v1/crawl',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-••••••' },
            body: { url: 'https://blog.golang.org', maxPages: 50, depth: 3, allowedPatterns: ['/blog/*'], deniedPatterns: [] },
        },
        response: {
            statusCode: 200,
            pages: [
                { url: 'https://blog.golang.org', title: 'The Go Blog', statusCode: 200, links: 15 },
                { url: 'https://blog.golang.org/go1.22', title: 'Go 1.22 Release Notes', statusCode: 200, links: 8 },
                { url: 'https://blog.golang.org/modules', title: 'Using Go Modules', statusCode: 200, links: 12 },
            ],
            metadata: { totalLinks: 186, avgResponseTime: '362ms', crawlDuration: '8.7s' },
        },
    },
    {
        id: 5,
        url: 'https://docs.python.org',
        type: 'crawl',
        status: 'failed',
        timestamp: '2026-02-19T15:30:00Z',
        pagesFound: 0,
        depth: 2,
        duration: '12.0s',
        request: {
            method: 'POST',
            endpoint: '/api/v1/crawl',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-••••••' },
            body: { url: 'https://docs.python.org', maxPages: 50, depth: 2, allowedPatterns: [], deniedPatterns: [] },
        },
        response: {
            statusCode: 408,
            error: 'Request Timeout',
            message: 'Crawl exceeded maximum duration of 10s. The target site may be too large or unresponsive.',
        },
    },
]

// ─── Async Thunks ─────────────────────────────────────────
export const runJob = createAsyncThunk(
    'dashboard/runJob',
    async ({ url, type, config }, { rejectWithValue }) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const pagesFound = type === 'crawl' ? Math.floor(Math.random() * 30) + 1 : 1
            const duration = `${(Math.random() * 10 + 0.5).toFixed(1)}s`
            return {
                id: Date.now(),
                url,
                type,
                status: 'completed',
                timestamp: new Date().toISOString(),
                pagesFound,
                depth: config.depth,
                duration,
                request: {
                    method: 'POST',
                    endpoint: type === 'crawl' ? '/api/v1/crawl' : '/api/v1/scrape',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer sk-••••••' },
                    body: type === 'crawl'
                        ? { url, maxPages: config.maxPages, depth: config.depth, allowedPatterns: config.allowedPatterns, deniedPatterns: config.deniedPatterns }
                        : { url },
                },
                response: type === 'crawl'
                    ? {
                        statusCode: 200,
                        pages: [{ url, title: new URL(url).hostname, statusCode: 200, links: pagesFound }],
                        metadata: { totalLinks: pagesFound * 5, avgResponseTime: `${Math.floor(Math.random() * 500)}ms`, crawlDuration: duration },
                    }
                    : {
                        statusCode: 200,
                        data: { title: new URL(url).hostname, description: `Scraped content from ${url}`, content: `Content extracted from ${url}...`, links: [`${url}/page1`, `${url}/page2`] },
                        metadata: { language: 'en', responseTime: duration, contentLength: `${(Math.random() * 100).toFixed(1)} KB` },
                    },
            }
        } catch (err) {
            return rejectWithValue(err.message || 'Job failed')
        }
    }
)

// ─── Initial State ────────────────────────────────────────
const initialState = {
    // Crawler / Scraper config
    config: {
        maxPages: 50,
        depth: 3,
        allowedPatterns: [],
        deniedPatterns: [],
    },
    // Job execution
    jobUrl: '',
    jobType: 'scrape', // 'scrape' | 'crawl'
    jobLoading: false,
    jobError: '',
    // History
    history: mockHistory,
    // Search
    searchQuery: '',
    isSearchOpen: false,
    newAllowedPattern: '',
    newDeniedPattern: '',
}

// ─── Slice ────────────────────────────────────────────────
const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setConfigField: (state, action) => {
            const { field, value } = action.payload
            state.config[field] = value
        },
        setFullConfig: (state, action) => {
            state.config = action.payload
        },
        addAllowedPattern: (state, action) => {
            const pattern = action.payload.trim()
            if (pattern && !state.config.allowedPatterns.includes(pattern)) {
                state.config.allowedPatterns.push(pattern)
            }
        },
        removeAllowedPattern: (state, action) => {
            state.config.allowedPatterns = state.config.allowedPatterns.filter(
                (p) => p !== action.payload
            )
        },
        addDeniedPattern: (state, action) => {
            const pattern = action.payload.trim()
            if (pattern && !state.config.deniedPatterns.includes(pattern)) {
                state.config.deniedPatterns.push(pattern)
            }
        },
        removeDeniedPattern: (state, action) => {
            state.config.deniedPatterns = state.config.deniedPatterns.filter(
                (p) => p !== action.payload
            )
        },
        setJobUrl: (state, action) => {
            state.jobUrl = action.payload
        },
        setJobType: (state, action) => {
            state.jobType = action.payload
        },
        setNewAllowedPattern: (state, action) => {
            state.newAllowedPattern = action.payload
        },
        setNewDeniedPattern: (state, action) => {
            state.newDeniedPattern = action.payload
        },
        clearJobError: (state) => {
            state.jobError = ''
        },
        clearHistory: (state) => {
            state.history = []
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload
        },
        setIsSearchOpen: (state, action) => {
            state.isSearchOpen = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(runJob.pending, (state) => {
                state.jobLoading = true
                state.jobError = ''
            })
            .addCase(runJob.fulfilled, (state, action) => {
                state.jobLoading = false
                state.history.unshift(action.payload)
                state.jobUrl = ''
            })
            .addCase(runJob.rejected, (state, action) => {
                state.jobLoading = false
                state.jobError = action.payload || 'Job failed'
            })
    },
})

export const {
    setConfigField,
    setFullConfig,
    addAllowedPattern,
    removeAllowedPattern,
    addDeniedPattern,
    removeDeniedPattern,
    setJobUrl,
    setJobType,
    setNewAllowedPattern,
    setNewDeniedPattern,
    clearJobError,
    clearHistory,
    setSearchQuery,
    setIsSearchOpen,
} = dashboardSlice.actions

export default dashboardSlice.reducer
