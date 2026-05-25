import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../lib/api'

// ─── Interfaces (matching backend domain structs) ────────

export interface JobConfig {
    maxPages: number;
    depth: number;
    allowedPatterns: string[];
    deniedPatterns: string[];
}

export interface Product {
    name: string;
    price: string;
    image_url: string;
    currency: string;
    description: string;
    url: string;
}

export interface LinkItem {
    URL: string;
    Type: string;
}

export interface PageResult {
    PageID: string;
    ResultID: string;
    URL: string;
    ParentURL: string;
    Depth: number;
    StatusCode: number;
    ContentType: string;
    ResponseTimeMS: number;
    FetchedAt: string;
    Title: string;
    MetaDescription: string;
    TextContent: string;
    PayloadSize: number;
    Images: string[] | null;
    Links: LinkItem[] | null;
    Products: Product[] | null;
    ID: number;
}

export interface CrawlerResult {
    CRID: string;
    UserID: string;
    TotalPages: number;
    TotalResponseTimeMS: number;
    TotalPayloadSize: number;
    Pages: PageResult[];
}

export interface HistoryItem {
    hid: string;
    user_id?: string;
    url: string;
    status: string;
    response_code: number;
    error_message: string;
    fetched_at: string;
    type?: string;
    pages_crawled?: number;
    duration?: string;
    size?: string;
    total_pages?: number;
    total_response_time_ms?: number;
    total_payload_size?: number;
    TotalPages?: number;
    TotalResponseTimeMS?: number;
    TotalPayloadSize?: number;
    result?: {
        total_pages?: number;
        total_response_time_ms?: number;
        total_payload_size?: number;
        TotalPages?: number;
        TotalResponseTimeMS?: number;
        TotalPayloadSize?: number;
    };
    ID?: number;
    CreatedAt?: string;
}

interface DashboardState {
    config: JobConfig;
    jobUrl: string;
    jobType: 'scrape' | 'crawl';
    jobLoading: boolean;
    historyLoading: boolean;
    jobError: string;
    history: HistoryItem[];
    lastResult: CrawlerResult | null;
    crawlResult: CrawlerResult | null;
    scrapeResult: CrawlerResult | null;
    searchQuery: string;
    isSearchOpen: boolean;
    newAllowedPattern: string;
    newDeniedPattern: string;
}

const formatDuration = (ms?: number): string | undefined => {
    if (typeof ms !== 'number' || Number.isNaN(ms) || ms <= 0) return undefined
    if (ms < 1000) return `${ms}ms`

    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(1)}s`

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
}

const formatBytes = (bytes?: number): string | undefined => {
    if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) return undefined
    if (bytes < 1024) return `${bytes} B`

    const units = ['KB', 'MB', 'GB', 'TB']
    let size = bytes / 1024
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex += 1
    }

    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

const normalizeHistoryItem = (item: HistoryItem): HistoryItem => {
    const resultMetrics = item.result || {}

    const pages = item.pages_crawled
        ?? item.total_pages
        ?? item.TotalPages
        ?? resultMetrics.total_pages
        ?? resultMetrics.TotalPages

    const responseTimeMS = item.total_response_time_ms
        ?? item.TotalResponseTimeMS
        ?? resultMetrics.total_response_time_ms
        ?? resultMetrics.TotalResponseTimeMS

    const payloadSize = item.total_payload_size
        ?? item.TotalPayloadSize
        ?? resultMetrics.total_payload_size
        ?? resultMetrics.TotalPayloadSize

    return {
        ...item,
        pages_crawled: pages,
        duration: item.duration || formatDuration(responseTimeMS),
        size: item.size || formatBytes(payloadSize),
    }
}


// ─── Async Thunks ─────────────────────────────────────────

export const fetchHistory = createAsyncThunk(
    'dashboard/fetchHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/history')
            const history = response.data as HistoryItem[]

            const hydratedHistory = await Promise.all(history.map(async (item) => {
                const base = normalizeHistoryItem(item)
                if (base.duration && base.size && base.pages_crawled !== undefined) {
                    return base
                }

                try {
                    const resultResponse = await api.get(`/history/${item.hid}/result`)
                    return normalizeHistoryItem({
                        ...item,
                        result: resultResponse.data,
                    })
                } catch {
                    return base
                }
            }))

            return hydratedHistory
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.response?.data?.message || err.message || 'Failed to fetch history')
        }
    }
)

export const runJob = createAsyncThunk<CrawlerResult, { url: string; type: 'crawl' | 'scrape'; config: JobConfig }>(
    'dashboard/runJob',
    async ({ url, type, config }, { rejectWithValue }) => {
        try {
            const endpoint = type === 'crawl' ? '/crawl' : '/scrape'
            const body = type === 'crawl'
                ? { url, maxPages: config.maxPages, depth: config.depth, allowedPatterns: config.allowedPatterns, deniedPatterns: config.deniedPatterns }
                : { url }

            const response = await api.post(endpoint, body, { timeout: 0 })
            // Backend returns { message: CrawlerResult 
            console.log(response.data)
            return response.data.message as CrawlerResult

        } catch (err: any) {
            console.log(err.response)
            return rejectWithValue(err.response?.data?.message || err.response?.data?.message || err.message || 'Job failed')
        }
    }
)

// ─── Initial State ────────────────────────────────────────
const initialState: DashboardState = {
    // Crawler / Scraper config
    config: {
        maxPages: 50,
        depth: 3,
        allowedPatterns: [],
        deniedPatterns: [],
    },
    // Job execution
    jobUrl: '',
    jobType: 'scrape',
    jobLoading: false,
    historyLoading: false,
    jobError: '',
    // History
    history: [],
    lastResult: null,
    crawlResult: null,
    scrapeResult: null,
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
        setConfigField: (state, action: PayloadAction<{ field: keyof JobConfig; value: any }>) => {
            const { field, value } = action.payload
            state.config[field] = value as never
        },
        setFullConfig: (state, action: PayloadAction<JobConfig>) => {
            state.config = action.payload
        },
        addAllowedPattern: (state, action: PayloadAction<string>) => {
            const pattern = action.payload.trim()
            if (pattern && !state.config.allowedPatterns.includes(pattern)) {
                state.config.allowedPatterns.push(pattern)
            }
        },
        removeAllowedPattern: (state, action: PayloadAction<string>) => {
            state.config.allowedPatterns = state.config.allowedPatterns.filter(
                (p) => p !== action.payload
            )
        },
        addDeniedPattern: (state, action: PayloadAction<string>) => {
            const pattern = action.payload.trim()
            if (pattern && !state.config.deniedPatterns.includes(pattern)) {
                state.config.deniedPatterns.push(pattern)
            }
        },
        removeDeniedPattern: (state, action: PayloadAction<string>) => {
            state.config.deniedPatterns = state.config.deniedPatterns.filter(
                (p) => p !== action.payload
            )
        },
        setJobUrl: (state, action: PayloadAction<string>) => {
            state.jobUrl = action.payload
        },
        setJobType: (state, action: PayloadAction<'scrape' | 'crawl'>) => {
            state.jobType = action.payload
        },
        setNewAllowedPattern: (state, action: PayloadAction<string>) => {
            state.newAllowedPattern = action.payload
        },
        setNewDeniedPattern: (state, action: PayloadAction<string>) => {
            state.newDeniedPattern = action.payload
        },
        clearJobError: (state) => {
            state.jobError = ''
        },
        clearHistory: (state) => {
            state.history = []
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload
        },
        setIsSearchOpen: (state, action: PayloadAction<boolean>) => {
            state.isSearchOpen = action.payload
        },
        setLastResult: (state, action: PayloadAction<CrawlerResult | null>) => {
            state.lastResult = action.payload
        },
        setCrawlResult: (state, action: PayloadAction<CrawlerResult | null>) => {
            state.crawlResult = action.payload
        },
        setScrapeResult: (state, action: PayloadAction<CrawlerResult | null>) => {
            state.scrapeResult = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHistory.pending, (state) => {
                state.historyLoading = true
                state.jobError = ''
            })
            .addCase(fetchHistory.fulfilled, (state, action) => {
                state.historyLoading = false
                state.history = action.payload
            })
            .addCase(fetchHistory.rejected, (state, action) => {
                state.historyLoading = false
                state.jobError = (action.payload as string) || 'Failed to fetch history'
            })
            .addCase(runJob.pending, (state) => {
                state.jobLoading = true
                state.jobError = ''
                state.lastResult = null
                state.crawlResult = null
                state.scrapeResult = null
            })
            .addCase(runJob.fulfilled, (state, action) => {
                state.jobLoading = false
                state.lastResult = action.payload
                if (action.meta.arg.type === 'crawl') {
                    state.crawlResult = action.payload
                } else if (action.meta.arg.type === 'scrape') {
                    state.scrapeResult = action.payload
                }
            })
            .addCase(runJob.rejected, (state, action) => {
                state.jobLoading = false
                state.jobError = (action.payload as string) || 'Job failed'
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
    setLastResult,
    setCrawlResult,
    setScrapeResult,
} = dashboardSlice.actions

export default dashboardSlice.reducer
