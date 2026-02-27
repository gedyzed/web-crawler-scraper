import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../lib/api'
import Cookies from 'js-cookie'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60

interface User {
    name: string;
    email: string;
}

interface AuthState {
    isAuthenticated: boolean;
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
        error: string;
    };
    updatePassword: {
        password: string;
        confirmPassword: string;
        loading: boolean;
        success: boolean;
        error: string;
    };
}

// ─── Async Thunks ─────────────────────────────────────────

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const { token, user } = response.data
            Cookies.set('accessToken', token, { expires: 1 / 24 }) // Set access token in cookie for 1 hour
            return user
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || 'Login failed')
        }
    }
)

export const signupUser = createAsyncThunk(
    'auth/signupUser',
    async ({ name, email, password }: { name: string; email: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', { name, email, password })
            return response.data
        } catch (err: any) {
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
            const token = Cookies.get('accessToken')
            if (!token) return rejectWithValue('No token found')
            const response = await api.get('/auth/me')
            return response.data
        } catch (err: any) {
            Cookies.remove('accessToken')
            return rejectWithValue(err.response?.data?.message || err.message || 'Session expired')
        }
    }
)

// ─── Initial State ────────────────────────────────────────
const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
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
        // ── Login ──
        builder
            .addCase(loginUser.pending, (state) => {
                state.login.loading = true
                state.login.error = ''
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.login.loading = false
                state.isAuthenticated = true
                state.user = { name: action.payload.email.split('@')[0], email: action.payload.email }
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
            })
            .addCase(signupUser.rejected, (state, action) => {
                state.signup.loading = false
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
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isAuthenticated = true
                state.user = action.payload
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isAuthenticated = false
                state.user = null
            })
    },
})

export const {
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
    resetVerifyEmail,
    setUpdatePasswordField,
    clearUpdatePasswordError,
    resetUpdatePassword,
} = authSlice.actions

export default authSlice.reducer
