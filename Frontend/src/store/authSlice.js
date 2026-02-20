import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60

// ─── Async Thunks ─────────────────────────────────────────
// These simulate API calls with setTimeout. Replace the inner
// logic with real fetch/axios calls when the backend is ready.

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500))
            return { email }
        } catch (err) {
            return rejectWithValue(err.message || 'Login failed')
        }
    }
)

export const signupUser = createAsyncThunk(
    'auth/signupUser',
    async ({ name, email, password }, { rejectWithValue }) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500))
            return { name, email }
        } catch (err) {
            return rejectWithValue(err.message || 'Signup failed')
        }
    }
)

export const sendResetCode = createAsyncThunk(
    'auth/sendResetCode',
    async ({ email }, { rejectWithValue }) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500))
            return { email }
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to send code')
        }
    }
)

export const verifyResetCode = createAsyncThunk(
    'auth/verifyResetCode',
    async ({ email, code }, { rejectWithValue }) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500))
            if (code.length === CODE_LENGTH) {
                return { email, code }
            }
            return rejectWithValue('Invalid code. Please try again.')
        } catch (err) {
            return rejectWithValue(err.message || 'Verification failed')
        }
    }
)

export const resendResetCode = createAsyncThunk(
    'auth/resendResetCode',
    async (_, { rejectWithValue }) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return true
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to resend code')
        }
    }
)

export const verifyEmailCode = createAsyncThunk(
    'auth/verifyEmailCode',
    async ({ code }, { rejectWithValue }) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500))
            if (code.length === CODE_LENGTH) {
                return true
            }
            return rejectWithValue('Invalid verification code. Please try again.')
        } catch (err) {
            return rejectWithValue(err.message || 'Verification failed')
        }
    }
)

export const updatePassword = createAsyncThunk(
    'auth/updatePassword',
    async ({ password, confirmPassword }, { rejectWithValue }) => {
        if (password !== confirmPassword) {
            return rejectWithValue('Passwords do not match')
        }
        if (password.length < 8) {
            return rejectWithValue('Password must be at least 8 characters')
        }
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500))
            return true
        } catch (err) {
            return rejectWithValue(err.message || 'Failed to update password')
        }
    }
)

// ─── Initial State ────────────────────────────────────────
const initialState = {
    isAuthenticated: false,
    user: null, // { name, email }
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
        step: 1,    // 1: Email input, 2: OTP code
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
        setLoginField: (state, action) => {
            const { field, value } = action.payload
            state.login[field] = value
        },
        resetLogin: (state) => {
            state.login = { ...initialState.login }
        },
        logout: (state) => {
            state.isAuthenticated = false
            state.user = null
            state.login = { ...initialState.login }
        },

        // ── Signup ──
        setSignupField: (state, action) => {
            const { field, value } = action.payload
            state.signup[field] = value
        },
        resetSignup: (state) => {
            state.signup = { ...initialState.signup }
        },

        // ── Forgot Password ──
        setForgotPasswordField: (state, action) => {
            const { field, value } = action.payload
            state.forgotPassword[field] = value
        },
        setForgotPasswordCode: (state, action) => {
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
        setVerifyEmailCode: (state, action) => {
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
        setUpdatePasswordField: (state, action) => {
            const { field, value } = action.payload
            state.updatePassword[field] = value
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
                state.login.error = action.payload || 'Login failed'
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
                state.signup.error = action.payload || 'Signup failed'
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
                state.forgotPassword.error = action.payload || 'Failed to send code'
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
                state.forgotPassword.error = action.payload || 'Invalid code'
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
                state.forgotPassword.error = action.payload || 'Failed to resend'
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
                state.verifyEmail.error = action.payload || 'Verification failed'
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
                state.updatePassword.error = action.payload || 'Update failed'
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
