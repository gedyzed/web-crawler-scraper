import { LoginForm } from "@/components/login-form"
import { Link } from "react-router-dom"

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  )
}

