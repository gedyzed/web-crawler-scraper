import { LoginForm } from "@/components/login-form"
import { Link } from "react-router-dom"
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton"

export default function LoginPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2 bg-white dark:bg-[#0a0e14]">
            {/* Left — Form */}
            <div className="flex flex-col gap-4 p-4 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <Link to="/" className="flex items-center gap-2 font-medium">
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
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">
                        <LoginForm />
                    </div>
                </div>
            </div>

            {/* Right — Side Image */}
            <div className="bg-muted relative hidden lg:block">
                <ImageWithSkeleton
                    src="/crawling.png"
                    alt="SpiderGo web crawler illustration"
                    className="absolute inset-0 h-full w-full object-cover"
                    containerClassName="absolute inset-0"
                />
            </div>
        </div>
    )
}
