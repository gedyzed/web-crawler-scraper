import { useEffect } from "react"
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
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeft, LockKeyhole, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    setUpdatePasswordField,
    resetUpdatePassword,
    updatePassword,
} from "@/store/authSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function UpdatePasswordPage() {
    const dispatch = useAppDispatch()
    const location = useLocation()
    const email = location.state?.email || ""

    const { password, confirmPassword, loading, success, error } = useAppSelector(
        (state) => state.auth.updatePassword
    )

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(resetUpdatePassword())
        }
    }, [dispatch])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        dispatch(updatePassword({ email, password, confirmPassword }))
    }

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 bg-white dark:bg-[#0a0e14]">
            {/* Background elements */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 grid-bg dark:opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,white_70%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_20%,#0a0e14_70%)]" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-gradient-to-r from-cyan-200/40 to-sky-200/40 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-full blur-3xl" />
            </div>
            <div className="absolute inset-0 backdrop-blur-sm bg-white/40 dark:bg-[#0a0e14]/40" />

            {/* Content */}
            <div className="relative flex w-full max-w-sm flex-col gap-6">
                <Link to="/" className="flex items-center gap-2 self-center font-medium">
                    <img src="/spidergo-logo.png" alt="SpiderGo" className="h-7 w-7" />
                    <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        Spider<span className="text-cyan-600 dark:text-cyan-400">Go</span>
                    </span>
                </Link>

                <Card>
                    <CardHeader className="text-center">
                        {success ? (
                            <>
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 border border-cyan-100">
                                    <CheckCircle2 className="h-6 w-6 text-cyan-600" />
                                </div>
                                <CardTitle className="text-xl">Password updated!</CardTitle>
                                <CardDescription>
                                    Your password has been reset successfully. You can now log in with your new password.
                                </CardDescription>
                            </>
                        ) : (
                            <>
                                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200">
                                    <LockKeyhole className="h-6 w-6 text-neutral-600" />
                                </div>
                                <CardTitle className="text-xl">Set new password</CardTitle>
                                <CardDescription>
                                    Please enter a new password for your account
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <Button className="w-full bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200/50" asChild>
                                <Link to="/login">Go to login</Link>
                            </Button>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="password">New Password</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => dispatch(setUpdatePasswordField({ field: 'password', value: e.target.value }))}
                                            required
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => dispatch(setUpdatePasswordField({ field: 'confirmPassword', value: e.target.value }))}
                                            required
                                        />
                                    </Field>
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200/50" disabled={loading}>
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                                    </Button>
                                </FieldGroup>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {!success && (
                    <div className="text-center">
                        <Link to="/login" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 inline-flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
