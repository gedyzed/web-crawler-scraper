import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!email.trim()) return
        setLoading(true)
        // Simulate sending reset email
        setTimeout(() => {
            setLoading(false)
            setSent(true)
        }, 1500)
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

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="text-center">
                            {sent ? (
                                <>
                                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 border border-cyan-100">
                                        <CheckCircle2 className="h-6 w-6 text-cyan-600" />
                                    </div>
                                    <CardTitle className="text-xl">Check your email</CardTitle>
                                    <CardDescription>
                                        We sent a password reset link to{" "}
                                        <span className="font-medium text-neutral-900">{email}</span>
                                    </CardDescription>
                                </>
                            ) : (
                                <>
                                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200">
                                        <Mail className="h-6 w-6 text-neutral-600" />
                                    </div>
                                    <CardTitle className="text-xl">Forgot password?</CardTitle>
                                    <CardDescription>
                                        Enter your email address and we'll send you a link to reset your password
                                    </CardDescription>
                                </>
                            )}
                        </CardHeader>
                        <CardContent>
                            {sent ? (
                                <div className="flex flex-col gap-4">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setSent(false)
                                            setEmail("")
                                        }}
                                    >
                                        Didn't receive the email? Try again
                                    </Button>
                                    <Button className="w-full" asChild>
                                        <Link to="/login">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back to login
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor="email">Email</FieldLabel>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="m@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </Field>
                                        <Field>
                                            <Button type="submit" className="w-full" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    "Send reset link"
                                                )}
                                            </Button>
                                        </Field>
                                    </FieldGroup>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {!sent && (
                        <FieldDescription className="text-center">
                            Remember your password?{" "}
                            <Link to="/login" className="underline underline-offset-4 hover:text-neutral-900">
                                Back to login
                            </Link>
                        </FieldDescription>
                    )}
                </div>
            </div>
        </div>
    )
}
