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
    Links: LinkItem[] | null;
    Products: Product[] | null;
    ID: number;
}

export interface CrawlerResult {
    CRID: string;
    UserID: string;
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
    ID?: number;
    CreatedAt?: string;
}

interface DashboardState {
    config: JobConfig;
    jobUrl: string;
    jobType: 'scrape' | 'crawl';
    jobLoading: boolean;
    jobError: string;
    history: HistoryItem[];
    lastResult: CrawlerResult | null;
    sampleScrapeResult: CrawlerResult;
    sampleCrawlResult: CrawlerResult;
    searchQuery: string;
    isSearchOpen: boolean;
    newAllowedPattern: string;
    newDeniedPattern: string;
}


// ─── Async Thunks ─────────────────────────────────────────

export const fetchHistory = createAsyncThunk(
    'dashboard/fetchHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/history')
            return response.data as HistoryItem[]
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

            console.log(body)
            const response = await api.post(endpoint, body)
            // Backend returns { message: CrawlerResult }
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
    jobError: '',
    // History
    history: [],
    lastResult: null,
    // Sample data matching real API response shape for landing page demo
    sampleScrapeResult: {
        CRID: 'demo-scrape-001',
        UserID: 'demo-user',
        Pages: [
            {
                PageID: 'page-001',
                ResultID: 'demo-scrape-001',
                URL: 'https://woocommerce.com',
                ParentURL: '',
                Depth: 0,
                StatusCode: 200,
                ContentType: 'text/html; charset=UTF-8',
                ResponseTimeMS: 4949,
                FetchedAt: new Date().toISOString(),
                Title: 'WooCommerce - Open Source ecommerce Platform',
                MetaDescription: 'WooCommerce is a customizable, open-source ecommerce platform built on WordPress.',
                TextContent: 'Forget cookie-cutter ecommerce. Every business is unique, and every store should be too. WooCommerce empowers you to build, sell, and grow on your terms.',
                Links: [
                    { URL: 'https://woocommerce.com/features', Type: 'internal' },
                    { URL: 'https://woocommerce.com/pricing', Type: 'internal' },
                ],
                Products: null,
                ID: 1,
            },
        ],
    },
    sampleCrawlResult: {
        CRID: 'demo-crawl-001',
        UserID: 'demo-user',
        Pages: [
            {
                PageID: 'page-001',
                ResultID: 'demo-crawl-001',
                URL: 'https://example.com',
                ParentURL: '',
                Depth: 0,
                StatusCode: 200,
                ContentType: 'text/html; charset=UTF-8',
                ResponseTimeMS: 320,
                FetchedAt: new Date().toISOString(),
                Title: 'Example Domain',
                MetaDescription: 'Example domain for documentation.',
                TextContent: 'This domain is for use in illustrative examples in documents.',
                Links: [
                    { URL: 'https://example.com/about', Type: 'internal' },
                    { URL: 'https://example.com/contact', Type: 'internal' },
                ],
                Products: null,
                ID: 1,
            },
            {
                PageID: 'page-002',
                ResultID: 'demo-crawl-001',
                URL: 'https://example.com/about',
                ParentURL: 'https://example.com',
                Depth: 1,
                StatusCode: 200,
                ContentType: 'text/html; charset=UTF-8',
                ResponseTimeMS: 210,
                FetchedAt: new Date().toISOString(),
                Title: 'About Us - Example',
                MetaDescription: 'Learn more about Example.',
                TextContent: 'We are a sample company used for demonstrations.',
                Links: null,
                Products: null,
                ID: 2,
            },
            {
                PageID: 'page-003',
                ResultID: 'demo-crawl-001',
                URL: 'https://example.com/contact',
                ParentURL: 'https://example.com',
                Depth: 1,
                StatusCode: 404,
                ContentType: 'text/html',
                ResponseTimeMS: 85,
                FetchedAt: new Date().toISOString(),
                Title: 'Not Found',
                MetaDescription: '',
                TextContent: 'Page not found.',
                Links: null,
                Products: null,
                ID: 3,
            },
        ],
    },
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
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchHistory.pending, (state) => {
                state.jobLoading = true
                state.jobError = ''
            })
            .addCase(fetchHistory.fulfilled, (state, action) => {
                state.jobLoading = false
                state.history = action.payload
            })
            .addCase(fetchHistory.rejected, (state, action) => {
                state.jobLoading = false
                state.jobError = (action.payload as string) || 'Failed to fetch history'
            })
            .addCase(runJob.pending, (state) => {
                state.jobLoading = true
                state.jobError = ''
            })
            .addCase(runJob.fulfilled, (state, action) => {
                state.jobLoading = false
                state.lastResult = action.payload
                state.jobUrl = ''
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
} = dashboardSlice.actions

export default dashboardSlice.reducer
