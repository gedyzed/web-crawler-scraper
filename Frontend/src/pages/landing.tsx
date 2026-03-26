import api from "@/lib/api";
import { getGitHubStars } from "@/lib/github";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import CrawlerBackground from "@/components/CrawlerBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConsolePreviewSkeleton } from "@/components/loading-skeletons";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import {
    Globe,
    Zap,
    Search,
    ArrowRight,
    Menu,
    X,
    Github,
    Star,
    BookOpen,
    Bug,
    Layers,
    Code2,
    Loader2,
    type LucideIcon,
} from "lucide-react";

// ─── JSON Syntax Highlighter ──────────────────────────────
interface JsonHighlightProps {
    data: any;
}

function JsonHighlight({ data }: JsonHighlightProps) {
    const json = JSON.stringify(data, null, 2);
    const lines = json.split("\n");

    return (
        <pre className="text-[13px] leading-relaxed font-mono">
            {lines.map((line, i) => (
                <div key={i} className="flex">
                    <span className="inline-block w-8 text-right mr-4 text-neutral-400 select-none text-xs">
                        {i + 1}
                    </span>
                    <span
                        dangerouslySetInnerHTML={{
                            __html: line
                                .replace(
                                    /"([^"]+)":/g,
                                    '<span class="text-cyan-600">\"$1\"</span>:'
                                )
                                .replace(
                                    /: "([^"]+)"/g,
                                    ': <span class="text-emerald-600 dark:text-emerald-400">\"$1\"</span>'
                                )
                                .replace(
                                    /: (\d+)/g,
                                    ': <span class="text-cyan-600 dark:text-cyan-400">$1</span>'
                                )
                                .replace(
                                    /: (true|false)/g,
                                    ': <span class="text-cyan-600 dark:text-cyan-400">$1</span>'
                                ),
                        }}
                    />
                </div>
            ))}
        </pre>
    );
}

// ─── Navbar ───────────────────────────────────────────────
function Navbar() {
    const [stars, setStars] = useState<number | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        getGitHubStars().then(count => setStars(count));
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0e14]/70 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
                <Link to="/" className="flex items-center gap-1.5 group">
                    <ImageWithSkeleton
                        src="/spidergo-logo.png"
                        alt="SpiderGo"
                        className="h-12 w-12 transition-transform group-hover:scale-110"
                        containerClassName="h-12 w-12"
                    />
                    <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        Spider<span className="text-cyan-600 dark:text-cyan-400">Go</span>
                    </span>
                </Link>

                <div className="hidden sm:flex items-center gap-6">
                    <a
                        href="https://docs.spidergo.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                    >
                        <BookOpen className="h-4 w-4" />
                        Docs
                    </a>
                    <a
                        href="https://docs.spidergo.app/cli"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                    >
                        <Code2 className="h-4 w-4" />
                        CLI
                    </a>
                </div>

                <div className="hidden sm:flex items-center gap-3">

                    <ThemeToggle />
                    <a
                        href="https://github.com/gedyzed/web-crawler-scraper"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors text-sm text-neutral-700 dark:text-neutral-300"
                    >
                        <Github className="h-4 w-4" />
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />
                        <span className="font-semibold">{stars ?? "..."}</span>
                    </a>
                    <Button
                        className="bg-cyan-600 text-white hover:bg-cyan-500 rounded-lg text-sm px-5"
                        asChild
                    >
                        <Link to="/signup">
                            Get Started <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </Button>
                </div>

                <div className="sm:hidden flex items-center gap-2">
                    <Button
                        className="bg-cyan-600 text-white hover:bg-cyan-500 rounded-lg text-sm px-4"
                        asChild
                    >
                        <Link to="/signup">Get Started</Link>
                    </Button>
                    <button
                        type="button"
                        aria-label="Toggle menu"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-200"
                    >
                        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="sm:hidden border-t border-neutral-200 dark:border-white/10 px-6 py-3 space-y-2">
                    <div className="h-10 flex items-center gap-2 px-1 text-sm text-neutral-700 dark:text-neutral-300">
                        <Layers className="h-4 w-4" />
                        <span>Theme</span>
                        <div className="ml-auto">
                            <ThemeToggle />
                        </div>
                    </div>
                    <a
                        href="https://github.com/gedyzed/web-crawler-scraper"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 rounded-xl border border-amber-200/70 dark:border-amber-400/20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 flex items-center justify-start gap-2 px-3 text-sm text-amber-800 dark:text-amber-200"
                    >
                        <Github className="h-4 w-4" />
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />
                        <span className="font-medium">Community Stars</span>
                        <span className="ml-auto rounded-full bg-white/80 dark:bg-black/30 px-2 py-0.5 text-xs font-semibold">
                            {stars ?? "..."}
                        </span>
                    </a>
                    <a
                        href="https://docs.spidergo.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex items-center justify-start gap-2 px-3 text-sm text-neutral-700 dark:text-neutral-300"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <BookOpen className="h-4 w-4" />
                        Docs
                    </a>
                    <a
                        href="https://docs.spidergo.app/cli"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex items-center justify-start gap-2 px-3 text-sm text-neutral-700 dark:text-neutral-300"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <Code2 className="h-4 w-4" />
                        CLI
                    </a>
                </div>
            )}
        </nav>
    );
}

// ─── Hero Section ─────────────────────────────────────────
function HeroSection() {
    const [activeTab, setActiveTab] = useState<string>("scrape");
    const [url, setUrl] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const endpoint = activeTab === 'crawl' ? '/crawl' : '/scrape';
            const body = activeTab === 'crawl'
                ? { url, maxPages: 10, depth: 1, allowedPatterns: [], deniedPatterns: [] }
                : { url };

            const response = await api.post(`/trial${endpoint}`, body);
            setResult(response.data.message || response.data);
        } catch (err: any) {
            setResult({
                error: true,
                message: err.response?.data?.message || err.message || 'An error occurred during the job execution.',
                status: err.response?.status
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            <div className="relative mx-auto max-w-4xl px-6 text-center">
                <Badge
                    variant="outline"
                    className="mb-6 border-cyan-200 dark:border-cyan-400/20 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-4 py-1.5 text-sm font-medium"
                >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    Open Source Web Crawler & Scraper
                </Badge>

                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
                    Turn any website into{" "}
                    <span className="bg-gradient-to-r from-cyan-500 to-sky-600 dark:from-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                        structured data
                    </span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                    Crawl, scrape, and extract clean data from any website.
                    <br className="hidden sm:block" />
                    Built in Go for speed. Delivered as JSON, ready to use.
                </p>

                <div className="mt-12 mx-auto max-w-2xl">
                    <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.04] backdrop-blur-md shadow-xl shadow-neutral-200/50 dark:shadow-black/30 overflow-hidden">
                        <div className="px-5 pt-5 pb-3">
                            <div className="relative">
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleRun()}
                                    placeholder="https://example.com"
                                    className="pl-11 h-12 rounded-xl border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.05] text-neutral-900 dark:text-neutral-200 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-500/50"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-5 pb-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="bg-transparent p-0 h-auto gap-1">
                                    <TabsTrigger
                                        value="scrape"
                                        className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-white/10 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100 data-[state=active]:shadow-none transition-colors border border-neutral-200 dark:border-white/10"
                                    >
                                        <Search className="h-3.5 w-3.5 mr-1.5" />
                                        Scrape
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="crawl"
                                        className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-white/10 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100 data-[state=active]:shadow-none transition-colors border border-neutral-200 dark:border-white/10"
                                    >
                                        <Globe className="h-3.5 w-3.5 mr-1.5" />
                                        Crawl
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button
                                onClick={handleRun}
                                disabled={loading || !url.trim()}
                                className="h-10 w-20 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/40 transition-all p-0 flex items-center justify-center cursor-pointer"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-4.5 w-4.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 mx-auto max-w-2xl">
                    <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-950 overflow-hidden shadow-2xl shadow-neutral-300/30 dark:shadow-black/40">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 dark:border-white/[0.06]">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                            </div>
                            <span className="text-xs text-neutral-500 font-mono">
                                {activeTab === "scrape" ? "scrape" : "crawl"}-response.json
                            </span>
                            <div className="w-14" />
                        </div>

                        <div className="p-5 text-left overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <ConsolePreviewSkeleton />
                            ) : result ? (
                                <div className="animate-in fade-in duration-500">
                                    <JsonHighlight data={result} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                                    <Code2 className="h-10 w-10 mb-3 text-neutral-600" />
                                    <p className="text-sm font-mono">
                                        Enter a URL and hit{" "}
                                        <span className="text-cyan-400">
                                            {activeTab === "scrape" ? "Scrape" : "Crawl"}
                                        </span>{" "}
                                        to see results
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Features 
interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
    color: string;
}

const features: Feature[] = [
    {
        icon: Zap,
        title: "Lightning-Fast Crawling",
        description:
            "Built in Go with concurrent goroutines for blazing-fast, parallel page crawling across entire websites.",
        color: "text-cyan-600 dark:text-cyan-400",
    },
    {
        icon: Search,
        title: "Smart Scraping",
        description:
            "Extract structured data from any page — titles, metadata, links, and content delivered as clean JSON.",
        color: "text-cyan-600 dark:text-cyan-400",
    },
    {
        icon: Layers,
        title: "Depth-Controlled Crawling",
        description:
            "Control how deep SpiderGo crawls with configurable depth limits, page caps, and domain restrictions.",
        color: "text-cyan-600 dark:text-cyan-400",
    },
    {
        icon: Bug,
        title: "E-Commerce Extraction",
        description:
            "Automatically detect and extract product names, prices, and images from e-commerce pages.",
        color: "text-cyan-600 dark:text-cyan-400",
    },
    {
        icon: Globe,
        title: "Full Site Discovery",
        description:
            "Map entire websites by discovering all internal and external links, building a complete site graph.",
        color: "text-cyan-600 dark:text-cyan-400",
    },
    {
        icon: Code2,
        title: "JSON API Output",
        description:
            "Every response is clean, structured JSON — ready to pipe into your apps, databases, or AI pipelines.",
        color: "text-cyan-600 dark:text-cyan-400",
    },
];

function FeaturesSection() {
    return (
        <section className="relative py-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <Badge
                        variant="outline"
                        className="mb-4 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 px-3 py-1 text-xs font-medium"
                    >
                        Features
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Everything you need to{" "}
                        <span className="bg-gradient-to-r from-cyan-500 to-sky-600 dark:from-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                            extract the web
                        </span>
                    </h2>
                    <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-lg max-w-xl mx-auto">
                        A complete toolkit for web data extraction, built for performance and reliability.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <Card
                            key={i}
                            className="group border-neutral-200 dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/15 bg-white dark:bg-white/[0.03] backdrop-blur-sm hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 cursor-default rounded-2xl"
                        >
                            <CardContent className="p-6">
                                <div
                                    className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 mb-4"
                                >
                                    <f.icon className={`h-5 w-5 ${f.color}`} />
                                </div>
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                    {f.title}
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    {f.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── CTA Section ──────────────────────────────────────────
function CTASection() {
    return (
        <section className="relative py-24">
            <div className="mx-auto max-w-4xl px-6">
                <div className="relative rounded-3xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] backdrop-blur-md overflow-hidden p-12 sm:p-16 text-center shadow-xl shadow-neutral-200/30 dark:shadow-black/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 dark:from-cyan-950/20 via-transparent to-sky-50/50 dark:to-sky-950/20" />

                    <div className="relative">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Ready to start crawling?
                        </h2>
                        <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-lg max-w-md mx-auto">
                            Get up and running in minutes. SpiderGo is open source and free to
                            use.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button
                                className="h-12 px-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm shadow-lg shadow-cyan-200/50 dark:shadow-cyan-900/40"
                                asChild
                            >
                                <Link to="/signup">
                                    Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 px-8 items-center gap-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                                asChild
                            >
                                <a
                                    href="https://github.com/gedyzed/web-crawler-scraper"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Github className="h-4 w-4 mr-2" />
                                    View on GitHub
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Footer 
function Footer() {
    return (
        <footer className="relative border-t border-neutral-200 dark:border-white/[0.06]">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-1.5">
                        <ImageWithSkeleton
                            src="/spidergo-logo.png"
                            alt="SpiderGo"
                            className="h-7 w-7"
                            containerClassName="h-7 w-7"
                        />
                        <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            Spider<span className="text-cyan-600 dark:text-cyan-400">Go</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-neutral-500">
                        <a
                            href="https://github.com/gedyzed/web-crawler-scraper"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors flex items-center gap-1.5"
                        >
                            <Github className="h-4 w-4" /> GitHub
                        </a>
                        <a
                            href="https://docs.spidergo.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors flex items-center gap-1.5"
                        >
                            <BookOpen className="h-4 w-4" /> Docs
                        </a>
                    </div>

                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        © {new Date().getFullYear()} SpiderGo by <a href="https://github.com/gedyzed" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors underline underline-offset-2">gedyzed</a>. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

// ─── Main Landing Page ────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="min-h-screen text-neutral-900 dark:text-neutral-100">
            <CrawlerBackground />
            <div className="relative z-10">
                <Navbar />
                <HeroSection />
                <FeaturesSection />
                <CTASection />
                <Footer />
            </div>
        </div>
    );
}
