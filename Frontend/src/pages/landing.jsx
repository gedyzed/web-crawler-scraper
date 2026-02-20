import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
    Globe,
    Zap,
    Search,
    ArrowRight,
    Github,
    Star,
    Play,
    BookOpen,
    ChevronDown,
    Bug,
    Layers,
    Code2,
    ExternalLink,
    Loader2,
} from "lucide-react";

// ─── Mock JSON Responses ──────────────────────────────────
const MOCK_SCRAPE = {
    success: true,
    data: {
        url: "https://example.com",
        title: "Example Domain",
        description: "This domain is for use in illustrative examples.",
        statusCode: 200,
        content: {
            text: "Example Domain. This domain is for use in illustrative examples...",
            html: "<html><head><title>Example Domain</title></head>...</html>",
        },
        metadata: {
            language: "en",
            responseTime: "124ms",
        },
        links: [
            "https://www.iana.org/domains/example",
        ],
    },
};

const MOCK_CRAWL = {
    success: true,
    data: {
        seedUrl: "https://example.com",
        pagesFound: 12,
        pagesCrawled: 12,
        depth: 2,
        duration: "3.2s",
        pages: [
            {
                url: "https://example.com",
                title: "Example Domain",
                statusCode: 200,
                links: 3,
            },
            {
                url: "https://example.com/about",
                title: "About Us",
                statusCode: 200,
                links: 5,
            },
            {
                url: "https://example.com/contact",
                title: "Contact",
                statusCode: 200,
                links: 2,
            },
        ],
    },
};

// ─── JSON Syntax Highlighter ──────────────────────────────
function JsonHighlight({ data }) {
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
                                    '<span class="text-cyan-600">"$1"</span>:'
                                )
                                .replace(
                                    /: "([^"]+)"/g,
                                    ': <span class="text-amber-600">"$1"</span>'
                                )
                                .replace(
                                    /: (\d+)/g,
                                    ': <span class="text-blue-600">$1</span>'
                                )
                                .replace(
                                    /: (true|false)/g,
                                    ': <span class="text-purple-600">$1</span>'
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
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <img
                        src="/spidergo-logo.svg"
                        alt="SpiderGo"
                        className="h-8 w-8 transition-transform group-hover:scale-110"
                    />
                    <span className="text-xl font-bold tracking-tight text-neutral-900">
                        Spider<span className="text-cyan-600">Go</span>
                    </span>
                </Link>

                {/* Center links */}
                <div className="hidden md:flex items-center gap-1">
                    <Button variant="ghost" className="text-sm text-neutral-600 hover:text-neutral-900 gap-1">
                        Products <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" className="text-sm text-neutral-600 hover:text-neutral-900" asChild>
                        <a href="https://github.com/gedyzed/web-crawler-scraper" target="_blank" rel="noopener noreferrer">
                            <BookOpen className="h-4 w-4 mr-1.5" /> Docs
                        </a>
                    </Button>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <a
                        href="https://github.com/gedyzed/web-crawler-scraper"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors text-sm text-neutral-700"
                    >
                        <Github className="h-4 w-4" />
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">1.2K</span>
                    </a>
                    <Button
                        className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-sm px-5"
                        asChild
                    >
                        <Link to="/signup">
                            Get Started <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}

// ─── Hero Section ─────────────────────────────────────────
function HeroSection() {
    const [activeTab, setActiveTab] = useState("scrape");
    const [url, setUrl] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleRun = () => {
        if (!url.trim()) return;
        setLoading(true);
        setResult(null);
        // Simulate API call
        setTimeout(() => {
            setResult(activeTab === "scrape" ? MOCK_SCRAPE : MOCK_CRAWL);
            setLoading(false);
        }, 1500);
    };

    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 grid-bg" />
            {/* Radial fade */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,white_70%)]" />

            <div className="relative mx-auto max-w-4xl px-6 text-center">
                {/* Badge */}
                <Badge
                    variant="outline"
                    className="mb-6 border-cyan-200 bg-cyan-50 text-cyan-700 px-4 py-1.5 text-sm font-medium"
                >
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    Open Source Web Crawler & Scraper
                </Badge>

                {/* Headline */}
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">
                    Turn any website into{" "}
                    <span className="bg-gradient-to-r from-cyan-500 to-sky-600 bg-clip-text text-transparent">
                        structured data
                    </span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                    Crawl, scrape, and extract clean data from any website.
                    <br className="hidden sm:block" />
                    Built in Go for speed. Delivered as JSON, ready to use.
                </p>

                {/* ─── Search Bar ────────────────────────────── */}
                <div className="mt-12 mx-auto max-w-2xl">
                    <div className="rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/50 overflow-hidden">
                        {/* URL Input */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="relative">
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleRun()}
                                    placeholder="https://example.com"
                                    className="pl-11 h-12 rounded-xl border-neutral-200 bg-neutral-50 text-sm placeholder:text-neutral-400 focus-visible:ring-cyan-500"
                                />
                            </div>
                        </div>

                        {/* Tabs row + Go button */}
                        <div className="flex items-center justify-between px-5 pb-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="bg-transparent p-0 h-auto gap-1">
                                    <TabsTrigger
                                        value="scrape"
                                        className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900 data-[state=active]:shadow-none transition-colors"
                                    >
                                        <Search className="h-3.5 w-3.5 mr-1.5" />
                                        Scrape
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="crawl"
                                        className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900 data-[state=active]:shadow-none transition-colors"
                                    >
                                        <Globe className="h-3.5 w-3.5 mr-1.5" />
                                        Crawl
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button
                                onClick={handleRun}
                                disabled={loading || !url.trim()}
                                className="h-10 w-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-200/50 transition-all hover:shadow-cyan-300/50 p-0 flex items-center justify-center cursor-pointer"
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

                {/* ─── JSON Result Preview ───────────────────── */}
                <div className="mt-8 mx-auto max-w-2xl">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-950 overflow-hidden shadow-2xl shadow-neutral-300/30">
                        {/* Window controls */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                <div className="h-3 w-3 rounded-full bg-cyan-500/80" />
                            </div>
                            <span className="text-xs text-neutral-500 font-mono">
                                {activeTab === "scrape" ? "scrape" : "crawl"}-response.json
                            </span>
                            <div className="w-14" />
                        </div>

                        {/* JSON content */}
                        <div className="p-5 text-left overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar">
                            {result ? (
                                <div className="animate-in fade-in duration-500">
                                    <JsonHighlight data={result} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                                    <Code2 className="h-10 w-10 mb-3 text-neutral-600" />
                                    <p className="text-sm font-mono">
                                        Enter a URL and hit{" "}
                                        <span className="text-cyan-500">
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
const features = [
    {
        icon: Zap,
        title: "Lightning-Fast Crawling",
        description:
            "Built in Go with concurrent goroutines for blazing-fast, parallel page crawling across entire websites.",
        color: "text-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-100",
    },
    {
        icon: Search,
        title: "Smart Scraping",
        description:
            "Extract structured data from any page — titles, metadata, links, and content delivered as clean JSON.",
        color: "text-cyan-600",
        bg: "bg-cyan-50",
        border: "border-cyan-100",
    },
    {
        icon: Layers,
        title: "Depth-Controlled Crawling",
        description:
            "Control how deep SpiderGo crawls with configurable depth limits, page caps, and domain restrictions.",
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
    },
    {
        icon: Bug,
        title: "E-Commerce Extraction",
        description:
            "Automatically detect and extract product names, prices, and images from e-commerce pages.",
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-100",
    },
    {
        icon: Globe,
        title: "Full Site Discovery",
        description:
            "Map entire websites by discovering all internal and external links, building a complete site graph.",
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-100",
    },
    {
        icon: Code2,
        title: "JSON API Output",
        description:
            "Every response is clean, structured JSON — ready to pipe into your apps, databases, or AI pipelines.",
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
    },
];

function FeaturesSection() {
    return (
        <section className="py-24 bg-neutral-50/50">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <Badge
                        variant="outline"
                        className="mb-4 border-neutral-200 text-neutral-600 px-3 py-1 text-xs font-medium"
                    >
                        Features
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                        Everything you need to{" "}
                        <span className="bg-gradient-to-r from-cyan-500 to-sky-600 bg-clip-text text-transparent">
                            extract the web
                        </span>
                    </h2>
                    <p className="mt-4 text-neutral-500 text-lg max-w-xl mx-auto">
                        A complete toolkit for web data extraction, built for performance and reliability.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <Card
                            key={i}
                            className="group border-neutral-200 hover:border-neutral-300 bg-white hover:shadow-lg transition-all duration-300 cursor-default rounded-2xl"
                        >
                            <CardContent className="p-6">
                                <div
                                    className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${f.bg} ${f.border} border mb-4`}
                                >
                                    <f.icon className={`h-5 w-5 ${f.color}`} />
                                </div>
                                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                                    {f.title}
                                </h3>
                                <p className="text-sm text-neutral-500 leading-relaxed">
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
        <section className="py-24">
            <div className="mx-auto max-w-4xl px-6">
                <div className="relative rounded-3xl border border-neutral-200 bg-white overflow-hidden p-12 sm:p-16 text-center shadow-xl shadow-neutral-200/30">
                    {/* Subtle grid */}
                    <div className="absolute inset-0 grid-bg opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-sky-50/50" />

                    <div className="relative">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                            Ready to start crawling?
                        </h2>
                        <p className="mt-4 text-neutral-500 text-lg max-w-md mx-auto">
                            Get up and running in minutes. SpiderGo is open source and free to
                            use.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button
                                className="h-12 px-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm shadow-lg"
                                asChild
                            >
                                <Link to="/signup">
                                    Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 px-8 rounded-xl border-neutral-200 text-neutral-700 font-medium text-sm hover:bg-neutral-50"
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
        <footer className="border-t border-neutral-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <img src="/spidergo-logo.svg" alt="SpiderGo" className="h-7 w-7" />
                        <span className="text-lg font-bold text-neutral-900">
                            Spider<span className="text-cyan-600">Go</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm text-neutral-500">
                        <a
                            href="https://github.com/gedyzed/web-crawler-scraper"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-neutral-900 transition-colors flex items-center gap-1.5"
                        >
                            <Github className="h-4 w-4" /> GitHub
                        </a>
                        <a
                            href="#"
                            className="hover:text-neutral-900 transition-colors flex items-center gap-1.5"
                        >
                            <BookOpen className="h-4 w-4" /> Docs
                        </a>
                        <Link
                            to="/login"
                            className="hover:text-neutral-900 transition-colors flex items-center gap-1.5"
                        >
                            <ExternalLink className="h-4 w-4" /> Login
                        </Link>
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-neutral-400">
                        © {new Date().getFullYear()} SpiderGo by <a href="https://github.com/gedyzed" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors underline underline-offset-2">gedyzed</a>. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

// ─── Main Landing Page ────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-neutral-900">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <CTASection />
            <Footer />
        </div>
    );
}
