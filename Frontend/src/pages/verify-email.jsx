import { useState, useRef, useEffect } from "react"
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
import { ShieldCheck, Loader2, CheckCircle2, RotateCcw } from "lucide-react"

const CODE_LENGTH = 6

export default function VerifyEmailPage() {
    const [code, setCode] = useState(Array(CODE_LENGTH).fill(""))
    const [loading, setLoading] = useState(false)
    const [verified, setVerified] = useState(false)
    const [error, setError] = useState("")
    const inputRefs = useRef([])

    useEffect(() => {
        inputRefs.current[0]?.focus()
    }, [])

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return // digits only

        const newCode = [...code]
        newCode[index] = value.slice(-1) // take only last digit
        setCode(newCode)
        setError("")

        // Auto-advance to next input
        if (value && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all digits entered
        if (newCode.every((d) => d !== "") && newCode.join("").length === CODE_LENGTH) {
            handleVerify(newCode.join(""))
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
        if (pasted.length === 0) return

        const newCode = [...code]
        for (let i = 0; i < CODE_LENGTH; i++) {
            newCode[i] = pasted[i] || ""
        }
        setCode(newCode)

        const nextEmpty = newCode.findIndex((d) => d === "")
        if (nextEmpty === -1) {
            inputRefs.current[CODE_LENGTH - 1]?.focus()
            handleVerify(newCode.join(""))
        } else {
            inputRefs.current[nextEmpty]?.focus()
        }
    }

    const handleVerify = (codeStr) => {
        setLoading(true)
        setError("")
        // Simulate verification
        setTimeout(() => {
            setLoading(false)
            // Accept any 6-digit code for demo
            if (codeStr.length === CODE_LENGTH) {
                setVerified(true)
            } else {
                setError("Invalid verification code. Please try again.")
            }
        }, 1500)
    }

    const handleResend = () => {
        setCode(Array(CODE_LENGTH).fill(""))
        setError("")
        inputRefs.current[0]?.focus()
    }

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            {/* Simulated landing page background */}
            <div className="absolute inset-0 bg-white">
                <div className="absolute inset-0 grid-bg" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,white_70%)]" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-gradient-to-r from-cyan-200/40 to-sky-200/40 rounded-full blur-3xl" />
            </div>
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-white/40" />

            {/* Content */}
            <div className="relative flex w-full max-w-sm flex-col gap-6">
                <Link to="/" className="flex items-center gap-2 self-center font-medium">
                    <img src="/spidergo-logo.svg" alt="SpiderGo" className="h-7 w-7" />
                    <span className="text-lg font-bold tracking-tight text-neutral-900">
                        Spider<span className="text-cyan-600">Go</span>
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
                                            ref={(el) => (inputRefs.current[i] = el)}
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

                                {/* Error message */}
                                {error && (
                                    <p className="text-sm text-red-500 text-center">{error}</p>
                                )}

                                {/* Loading indicator */}
                                {loading && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Verifying...
                                    </div>
                                )}

                                {/* Resend */}
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-sm text-neutral-500">
                                        Didn't receive the code?
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResend}
                                        className="text-sm text-neutral-700 hover:text-neutral-900"
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
