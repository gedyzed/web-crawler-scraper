import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../lib/api'

// ─── Interfaces ──────────────────────────────────────────

export interface JobConfig {
    maxPages: number;
    depth: number;
    allowedPatterns: string[];
    deniedPatterns: string[];
}

export interface CrawlPage {
    url: string;
    title: string;
    statusCode: number;
    links: number;
}

export interface ScrapeData {
    title: string;
    description: string;
    content: string | { text: string; html: string };
    links: string[];
}

export interface JobMetadata {
    totalLinks?: number;
    avgResponseTime?: string;
    crawlDuration?: string;
    language?: string;
    responseTime?: string;
    contentLength?: string;
}

export interface Job {
    id: number;
    url: string;
    type: 'crawl' | 'scrape';
    status: 'completed' | 'failed';
    timestamp: string;
    pagesFound: number;
    depth: number;
    duration: string;
    request: {
        method: string;
        endpoint: string;
        headers: Record<string, string>;
        body: any;
    };
    response: {
        statusCode: number;
        pages?: CrawlPage[];
        data?: ScrapeData;
        metadata?: JobMetadata;
        error?: string;
        message?: string;
    };
}

interface DashboardState {
    config: JobConfig;
    jobUrl: string;
    jobType: 'scrape' | 'crawl';
    jobLoading: boolean;
    jobError: string;
    history: Job[];
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
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch history')
        }
    }
)

export const runJob = createAsyncThunk<Job, { url: string; type: 'crawl' | 'scrape'; config: JobConfig }>(
    'dashboard/runJob',
    async ({ url, type, config }, { rejectWithValue }) => {
        try {
            const endpoint = type === 'crawl' ? '/crawl' : '/scrape'
            const body = type === 'crawl'
                ? { url, maxPages: config.maxPages, depth: config.depth, allowedPatterns: config.allowedPatterns, deniedPatterns: config.deniedPatterns }
                : { url }

            const response = await api.post(endpoint, body)
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Job failed')
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
    jobType: 'scrape', // 'scrape' | 'crawl'
    jobLoading: false,
    jobError: '',
    // History
    history: [],
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
                state.history.unshift(action.payload)
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
