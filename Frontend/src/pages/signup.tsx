import { SignupForm } from "@/components/signup-form"
import { Link } from "react-router-dom"
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton"
import spidergoLogo from "@/assets/spidergo-logo.png"
import scrapingImage from "@/assets/scraping.png"

export default function SignupPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2 bg-white dark:bg-[#0a0e14]">
            {/* Left — Form */}
            <div className="flex flex-col gap-6 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <Link to="/" className="flex items-center gap-1.5 font-medium">
                        <ImageWithSkeleton
                            src={spidergoLogo}
                            alt="SpiderGo"
                            className="h-8 w-8"
                            containerClassName="h-8 w-8"
                        />
                        <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Spider<span className="text-cyan-600 dark:text-cyan-400">Go</span>
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">
                        <SignupForm />
                    </div>
                </div>
            </div>

            {/* Right — Side Image */}
            <div className="bg-muted relative hidden lg:block">
                <ImageWithSkeleton
                    src={scrapingImage}
                    alt="SpiderGo web crawler illustration"
                    className="absolute inset-0 h-full w-full object-cover"
                    containerClassName="absolute inset-0"
                />
            </div>
        </div>
    )
}
