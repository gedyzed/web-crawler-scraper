import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../lib/api'
import Cookies from 'js-cookie'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60

interface User {
    firstname?: string;
    lastname?: string;
    name?: string;
    email: string;
    username: string;
}

interface AuthState {
    isAuthenticated: boolean;
    authLoading: boolean;
    user: User | null;
    login: {
        email: string;
        password: string;
        loading: boolean;
        error: string;
    };
    signup: {
        name: string;
        email: string;
        password: string;
        loading: boolean;
        error: string;
    };
    forgotPassword: {
        email: string;
        step: number;
        code: string[];
        timer: number;
        loading: boolean;
        error: string;
    };
    verifyEmail: {
        code: string[];
        loading: boolean;
        verified: boolean;
        timer: number;
        error: string;
    };
    updatePassword: {
        password: string;
        confirmPassword: string;
        loading: boolean;
        success: boolean;
        error: string;
    };
    apiKeys: {
        keys: any[];
        loading: boolean;
        error: string;
    }
}

// ─── Async Thunks ─────────────────────────────────────────

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            await api.post('/auth/login', { email, password })
            // Tokens are set as HttpOnly cookies by the backend.
            // Fetch user profile using the session cookie.
            const profileRes = await api.get('/auth/me')

            return profileRes.data
        } catch (err: any) {
            console.log(err.response)
            return rejectWithValue(err.response?.data?.message || err.message || 'Login failed')
        }
    }
)

export const signupUser = createAsyncThunk(
    'auth/signupUser',
    async ({ name, email, password }: { name: string; email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', { name, email, password })
            console.log(response.data)
            return response.data
        } catch (err: any) {
            console.log(err.response)
            return rejectWithValue(err.response?.data?.message || err.message || 'Signup failed')
        }
    }
)

export const sendResetCode = createAsyncThunk(
    'auth/sendResetCode',
    async ({ email }: { email: string }, { rejectWithValue }) => {
        try {
            await api.post('/auth/forgot-password', { email })
            return { email }
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to send code')
        }
    }
)

export const verifyResetCode = createAsyncThunk(
    'auth/verifyResetCode',
    async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/verify-reset-code', { email, code })
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Verification failed')
        }
    }
)

export const resendResetCode = createAsyncThunk(
    'auth/resendResetCode',
    async ({ email }: { email: string }, { rejectWithValue }) => {
        try {
            await api.post('/auth/forgot-password', { email })
            return true
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to resend code')
        }
    }
)

export const verifyEmailCode = createAsyncThunk(
    'auth/verifyEmailCode',
    async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
        try {
            await api.post('/auth/verify-email', { email, code: parseInt(code) })
            return true
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Verification failed')
        }
    }
)

export const resendVerificationCode = createAsyncThunk(
    'auth/resendVerificationCode',
    async ({ email }: { email: string }, { rejectWithValue }) => {
        try {
            await api.post('/auth/resend-email', { email })
            return true
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to resend code')
        }
    }
)

export const updatePassword = createAsyncThunk(
    'auth/updatePassword',
    async ({ email, password, confirmPassword }: { email: string; password: string; confirmPassword: string }, { rejectWithValue }) => {
        if (password !== confirmPassword) {
            return rejectWithValue('Passwords do not match')
        }
        try {
            await api.post('/auth/reset-password', { email, password })
            return true
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update password')
        }
    }
)

export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            let response = await api.get('/auth/me')
            return response.data
        } catch (err: any) {
            if (err.response?.status === 401) {
                console.log(err.response.data)
                try {
                    await api.get('/auth/refresh', { withCredentials: true })
                    const retryRes = await api.get('/auth/me')
                    return retryRes.data
                } catch (refreshErr: any) {
                    return rejectWithValue(refreshErr.response?.data?.message || 'Session expired')
                }
            }
            return rejectWithValue(err.response?.data?.message || err.message || 'Session expired')
        }
    }
)

export const generateApiKey = createAsyncThunk(
    'auth/generateApiKey',
    async ({ name }: { name: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/api-keys', { name })
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to generate API Key')
        }
    }
)

export const getApiKeys = createAsyncThunk(
    'auth/getApiKeys',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/auth/api-keys')
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch API Keys')
        }
    }
)

export const deleteApiKey = createAsyncThunk(
    'auth/deleteApiKey',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/auth/api-keys/${id}`)
            return response.data
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete API Key')
        }
    }
)

// ─── Types ────────────────────────────────────────────────            


// ─── Initial State ────────────────────────────────────────
const initialState: AuthState = {
    isAuthenticated: false,
    authLoading: true,
    user: null,
    apiKeys: {
        keys: [],
        loading: false,
        error: '',
    },
    login: {
        email: '',
        password: '',
        loading: false,
        error: '',
    },
    signup: {
        name: '',
        email: '',
        password: '',
        loading: false,
        error: '',
    },
    forgotPassword: {
        email: '',
        step: 1,
        code: Array(CODE_LENGTH).fill(''),
        timer: 0,
        loading: false,
        error: '',
    },
    verifyEmail: {
        code: Array(CODE_LENGTH).fill(''),
        loading: false,
        verified: false,
        timer: 0,
        error: '',
    },
    updatePassword: {
        password: '',
        confirmPassword: '',
        loading: false,
        success: false,
        error: '',
    },
}

// ─── Slice ────────────────────────────────────────────────
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // ── API Keys ──
        addApiKeyLocally: (state, action: PayloadAction<any>) => {
            state.apiKeys.keys.push(action.payload)
        },
        removeApiKeyLocally: (state, action: PayloadAction<string>) => {
            state.apiKeys.keys = state.apiKeys.keys.filter((k: any) => k.id !== action.payload)
        },
        // ── Login ──
        setLoginField: (state, action: PayloadAction<{ field: keyof AuthState['login']; value: any }>) => {
            const { field, value } = action.payload
            state.login[field] = value as never
        },
        resetLogin: (state) => {
            state.login = { ...initialState.login }
        },
        logout: (state) => {
            state.isAuthenticated = false
            state.user = null
            state.login = { ...initialState.login }
            state.apiKeys = { ...initialState.apiKeys }
            Cookies.remove('accessToken')
        },

        // ── Signup ──
        setSignupField: (state, action: PayloadAction<{ field: keyof AuthState['signup']; value: any }>) => {
            const { field, value } = action.payload
            state.signup[field] = value as never
        },
        resetSignup: (state) => {
            state.signup = { ...initialState.signup }
        },

        // ── Forgot Password ──
        setForgotPasswordField: (state, action: PayloadAction<{ field: keyof AuthState['forgotPassword']; value: any }>) => {
            const { field, value } = action.payload
            state.forgotPassword[field] = value as never
        },
        setForgotPasswordCode: (state, action: PayloadAction<{ index: number; value: string }>) => {
            const { index, value } = action.payload
            state.forgotPassword.code[index] = value
        },
        resetForgotPasswordCode: (state) => {
            state.forgotPassword.code = Array(CODE_LENGTH).fill('')
        },
        decrementForgotPasswordTimer: (state) => {
            if (state.forgotPassword.timer > 0) {
                state.forgotPassword.timer -= 1
            }
        },
        resetForgotPassword: (state) => {
            state.forgotPassword = { ...initialState.forgotPassword, code: Array(CODE_LENGTH).fill('') }
        },

        // ── Verify Email ──
        setVerifyEmailCode: (state, action: PayloadAction<{ index: number; value: string }>) => {
            const { index, value } = action.payload
            state.verifyEmail.code[index] = value
        },
        clearVerifyEmailError: (state) => {
            state.verifyEmail.error = ''
        },
        decrementVerifyEmailTimer: (state) => {
            if (state.verifyEmail.timer > 0) {
                state.verifyEmail.timer -= 1
            }
        },
        resetVerifyEmail: (state) => {
            state.verifyEmail = { ...initialState.verifyEmail, code: Array(CODE_LENGTH).fill('') }
        },

        // ── Update Password ──
        setUpdatePasswordField: (state, action: PayloadAction<{ field: keyof AuthState['updatePassword']; value: any }>) => {
            const { field, value } = action.payload
            state.updatePassword[field] = value as never
        },
        clearUpdatePasswordError: (state) => {
            state.updatePassword.error = ''
        },
        resetUpdatePassword: (state) => {
            state.updatePassword = { ...initialState.updatePassword }
        },
    },
    extraReducers: (builder) => {

        // ─── Get API Keys ──
        builder
            .addCase(deleteApiKey.pending, (state) => {
                state.apiKeys.loading = true
                state.apiKeys.error = ''
            })
            .addCase(deleteApiKey.fulfilled, (state, action) => {
                state.apiKeys.loading = false
                // action.meta.arg is the keyId string passed to deleteApiKey(id)
                state.apiKeys.keys = state.apiKeys.keys.filter((k: any) => k.key_id !== action.meta.arg)
            })

            .addCase(deleteApiKey.rejected, (state, action) => {
                state.apiKeys.loading = false
                state.apiKeys.error = (action.payload as string) || 'Failed to delete API Key'
            })

        // ─── Get API Keys ──
        builder
            .addCase(getApiKeys.pending, (state) => {
                state.apiKeys.loading = true
                state.apiKeys.error = ''
            })
            .addCase(getApiKeys.fulfilled, (state, action) => {
                state.apiKeys.loading = false
                state.apiKeys.keys = action.payload.keys || []
            })
            .addCase(getApiKeys.rejected, (state, action) => {
                state.apiKeys.loading = false
                state.apiKeys.error = (action.payload as string) || 'Failed to fetch API Keys';
            })
        // ── Generate API Key ──
        builder
            .addCase(generateApiKey.pending, (state) => {
                state.apiKeys.loading = true
                state.apiKeys.error = ''
            })
            .addCase(generateApiKey.fulfilled, (state, action) => {
                state.apiKeys.loading = false
                const meta = action.payload.meta
                state.apiKeys.keys.push({
                    key_id: meta.key_id,
                    name: meta.name,
                    key_prefix: meta.prefix,
                    last4: meta.last4,
                    daily_limit: meta.daily_limit,
                    is_active: meta.is_active,
                    created_at: meta.created_at,
                    // raw key only available once after creation
                    rawKey: action.payload.api_key,
                })
            })
            .addCase(generateApiKey.rejected, (state, action) => {
                state.apiKeys.loading = false
                state.apiKeys.error = (action.payload as string) || 'Failed to generate API Key'
            })


        // ── Login ──
        builder
            .addCase(loginUser.pending, (state) => {
                state.login.loading = true
                state.login.error = ''
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.login.loading = false
                state.isAuthenticated = true
                const email = action.payload?.Email || action.payload?.email || ''
                state.user = {
                    firstname: action.payload.firstname,
                    lastname: action.payload.lastname,
                    name: action.payload.name || action.payload.Name,
                    username: action.payload.username || email.split('@')[0] || 'User', email
                }
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.login.loading = false
                state.login.error = (action.payload as string) || 'Login failed'
            })

        // ── Signup ──
        builder
            .addCase(signupUser.pending, (state) => {
                state.signup.loading = true
                state.signup.error = ''
            })
            .addCase(signupUser.fulfilled, (state) => {
                state.signup.loading = false
                state.verifyEmail.timer = RESEND_COOLDOWN
            })
            .addCase(signupUser.rejected, (state, action) => {
                state.signup.loading = false
                console.log(action.payload)
                state.signup.error = (action.payload as string) || 'Signup failed'
            })

        // ── Send Reset Code ──
        builder
            .addCase(sendResetCode.pending, (state) => {
                state.forgotPassword.loading = true
                state.forgotPassword.error = ''
            })
            .addCase(sendResetCode.fulfilled, (state) => {
                state.forgotPassword.loading = false
                state.forgotPassword.step = 2
                state.forgotPassword.timer = RESEND_COOLDOWN
            })
            .addCase(sendResetCode.rejected, (state, action) => {
                state.forgotPassword.loading = false
                state.forgotPassword.error = (action.payload as string) || 'Failed to send code'
            })

        // ── Verify Reset Code ──
        builder
            .addCase(verifyResetCode.pending, (state) => {
                state.forgotPassword.loading = true
                state.forgotPassword.error = ''
            })
            .addCase(verifyResetCode.fulfilled, (state) => {
                state.forgotPassword.loading = false
            })
            .addCase(verifyResetCode.rejected, (state, action) => {
                state.forgotPassword.loading = false
                state.forgotPassword.error = (action.payload as string) || 'Invalid code'
            })

        // ── Resend Reset Code ──
        builder
            .addCase(resendResetCode.pending, (state) => {
                state.forgotPassword.loading = true
            })
            .addCase(resendResetCode.fulfilled, (state) => {
                state.forgotPassword.loading = false
                state.forgotPassword.timer = RESEND_COOLDOWN
                state.forgotPassword.code = Array(CODE_LENGTH).fill('')
            })
            .addCase(resendResetCode.rejected, (state, action) => {
                state.forgotPassword.loading = false
                state.forgotPassword.error = (action.payload as string) || 'Failed to resend'
            })

        // ── Verify Email Code ──
        builder
            .addCase(verifyEmailCode.pending, (state) => {
                state.verifyEmail.loading = true
                state.verifyEmail.error = ''
            })
            .addCase(verifyEmailCode.fulfilled, (state) => {
                state.verifyEmail.loading = false
                state.verifyEmail.verified = true
            })
            .addCase(verifyEmailCode.rejected, (state, action) => {
                state.verifyEmail.loading = false
                state.verifyEmail.error = (action.payload as string) || 'Verification failed'
            })

        // ── Update Password ──
        builder
            .addCase(updatePassword.pending, (state) => {
                state.updatePassword.loading = true
                state.updatePassword.error = ''
            })
            .addCase(updatePassword.fulfilled, (state) => {
                state.updatePassword.loading = false
                state.updatePassword.success = true
            })
            .addCase(updatePassword.rejected, (state, action) => {
                state.updatePassword.loading = false
                state.updatePassword.error = (action.payload as string) || 'Update failed'
            })

        // ── Check Auth ──
        builder
            .addCase(checkAuth.pending, (state) => {
                state.authLoading = true
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.authLoading = false
                state.isAuthenticated = true
                const email = action.payload?.Email || action.payload?.email || ''
                state.user = {
                    firstname: action.payload.firstname,
                    lastname: action.payload.lastname,
                    name: action.payload.name || action.payload.Name,
                    username: action.payload.username || email.split('@')[0] || 'User', email
                }
            })
            .addCase(checkAuth.rejected, (state) => {
                state.authLoading = false
                state.isAuthenticated = false
                state.user = null
            })

        // ── Resend Verification Code ──
        builder
            .addCase(resendVerificationCode.pending, (state) => {
                state.verifyEmail.loading = true
            })
            .addCase(resendVerificationCode.fulfilled, (state) => {
                state.verifyEmail.loading = false
                state.verifyEmail.timer = RESEND_COOLDOWN
                state.verifyEmail.code = Array(CODE_LENGTH).fill('')
            })
            .addCase(resendVerificationCode.rejected, (state, action) => {
                state.verifyEmail.loading = false
                state.verifyEmail.error = (action.payload as string) || 'Failed to resend'
            })
    },
})

export const {
    addApiKeyLocally,
    removeApiKeyLocally,
    setLoginField,
    resetLogin,
    logout,
    setSignupField,
    resetSignup,
    setForgotPasswordField,
    setForgotPasswordCode,
    resetForgotPasswordCode,
    decrementForgotPasswordTimer,
    resetForgotPassword,
    setVerifyEmailCode,
    clearVerifyEmailError,
    decrementVerifyEmailTimer,
    resetVerifyEmail,
    setUpdatePasswordField,
    clearUpdatePasswordError,
    resetUpdatePassword,
} = authSlice.actions

export default authSlice.reducer
