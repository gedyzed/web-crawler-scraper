import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { ShieldCheck, Loader2, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton"
import {
    setVerifyEmailCode,
    clearVerifyEmailError,
    resetVerifyEmail,
    verifyEmailCode,
    decrementVerifyEmailTimer,
    resendVerificationCode,
} from "@/store/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

const CODE_LENGTH = 6

export default function VerifyEmailPage() {
    const dispatch = useAppDispatch()
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const { code, loading, verified, timer, error } = useAppSelector(
        (state) => state.auth.verifyEmail
    )
    const signupEmail = useAppSelector((state) => state.auth.signup.email)

    // Focus first input on mount, cleanup on unmount
    useEffect(() => {
        inputRefs.current[0]?.focus()
        return () => {
            dispatch(resetVerifyEmail())
        }
    }, [dispatch])

    // Timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (timer > 0) {
            interval = setInterval(() => {
                dispatch(decrementVerifyEmailTimer())
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [timer, dispatch])

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return // digits only

        const digit = value.slice(-1)
        dispatch(setVerifyEmailCode({ index, value: digit }))
        dispatch(clearVerifyEmailError())

        // Auto-advance to next input
        if (value && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all digits entered
        const newCode = [...code]
        newCode[index] = digit
        if (newCode.every((d) => d !== "") && newCode.join("").length === CODE_LENGTH) {
            dispatch(verifyEmailCode({ email: signupEmail, code: newCode.join("") }))
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
        if (pasted.length === 0) return

        for (let i = 0; i < CODE_LENGTH; i++) {
            dispatch(setVerifyEmailCode({ index: i, value: pasted[i] || "" }))
        }

        const newCode = Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] || "")
        const nextEmpty = newCode.findIndex((d) => d === "")
        if (nextEmpty === -1) {
            inputRefs.current[CODE_LENGTH - 1]?.focus()
            dispatch(verifyEmailCode({ email: signupEmail, code: newCode.join("") }))
        } else {
            inputRefs.current[nextEmpty]?.focus()
        }
    }

    const handleResend = () => {
        if (timer > 0) return
        dispatch(resendVerificationCode({ email: signupEmail })).then(() => {
            inputRefs.current[0]?.focus()
        })
    }

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 bg-white dark:bg-[#0a0e14]">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 grid-bg dark:opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,white_70%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_20%,#0a0e14_70%)]" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-gradient-to-r from-cyan-200/40 to-sky-200/40 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-full blur-3xl" />
            </div>
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-white/40 dark:bg-[#0a0e14]/40" />

            {/* Content */}
            <div className="relative flex w-full max-w-sm flex-col gap-6">
                <Link to="/" className="flex items-center gap-2 self-center font-medium">
                    <ImageWithSkeleton
                        src="/spidergo-logo.png"
                        alt="SpiderGo"
                        className="h-7 w-7"
                        containerClassName="h-7 w-7"
                    />
                    <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        Spider<span className="text-cyan-600 dark:text-cyan-400">Go</span>
                    </span>
                </Link>

                <Card>
                    <CardHeader className="text-center">
                        {verified ? (
                            <>
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 border border-cyan-100">
                                    <CheckCircle2 className="h-6 w-6 text-cyan-600" />
                                </div>
                                <CardTitle className="text-xl">Email verified!</CardTitle>
                                <CardDescription>
                                    Your email has been successfully verified. You can now access all features.
                                </CardDescription>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200">
                                    <ShieldCheck className="h-6 w-6 text-neutral-600" />
                                </div>
                                <CardTitle className="text-xl">Verify your email</CardTitle>
                                <CardDescription>
                                    We sent a {CODE_LENGTH}-digit verification code to your email address. Enter it below to verify.
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent>
                        {verified ? (
                            <Button className="w-full" asChild>
                                <Link to="/login">Continue to login</Link>
                            </Button>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {/* OTP Code Input */}
                                <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
                                    {code.map((digit, i) => (
                                        <Input
                                            key={i}
                                            ref={(el) => { inputRefs.current[i] = el }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            className={`h-13 w-11 text-center text-lg font-semibold rounded-xl border-neutral-200 bg-neutral-50 focus-visible:ring-cyan-500 ${error ? "border-red-300 bg-red-50/50" : ""
                                                } ${digit ? "border-cyan-300 bg-cyan-50/30" : ""}`}
                                            disabled={loading}
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {loading && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying...
                                    </div>
                                )}

                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-sm text-neutral-500">
                                        Didn't receive the code? {timer > 0 && <span>Resend in {timer}s</span>}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResend}
                                        disabled={timer > 0 || loading}
                                        className="text-cyan-600 hover:text-cyan-700 font-medium"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                        Resend code
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
