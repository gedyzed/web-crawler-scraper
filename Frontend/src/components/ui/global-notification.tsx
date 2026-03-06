import * as React from "react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

interface GlobalNotificationProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    message: string
    type: "success" | "error" | "info"
    autoCloseMs?: number
}

export function GlobalNotification({
    open,
    onOpenChange,
    message,
    type,
    autoCloseMs = 500,
}: GlobalNotificationProps) {
    const [visible, setVisible] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            setVisible(true)
        } else {
            const t = setTimeout(() => setVisible(false), 250)
            return () => clearTimeout(t)
        }
    }, [open])

    const onOpenChangeRef = React.useRef(onOpenChange)
    React.useEffect(() => {
        onOpenChangeRef.current = onOpenChange
    }, [onOpenChange])

    React.useEffect(() => {
        if (!open || autoCloseMs <= 0) return
        const id = setTimeout(() => onOpenChangeRef.current(false), autoCloseMs)
        return () => clearTimeout(id)
    }, [open, autoCloseMs])

    if (!visible && !open) return null

    const cfg = {
        error: {
            icon: <AlertCircle className="h-4 w-4 text-white" />,
            bg: "bg-destructive",
        },
        success: {
            icon: <CheckCircle2 className="h-4 w-4 text-white" />,
            bg: "bg-green-500",
        },
        info: {
            icon: <Info className="h-4 w-4 text-white" />,
            bg: "bg-blue-500",
        },
    }[type]

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[99] backdrop-blur-[2px] bg-black/10 transition-opacity duration-250 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={() => onOpenChange(false)}
            />

            {/* Alert */}
            <div
                className={`fixed z-[100] top-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-sm transition-all duration-250 ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}
            >
                <div className={`${cfg.bg} rounded-lg shadow-lg overflow-hidden`}>
                    <div className="flex items-center gap-3 py-3 pl-4 pr-3">
                        <span className="shrink-0">{cfg.icon}</span>
                        <p className="flex-1 min-w-0 text-sm text-white font-medium leading-snug">{message}</p>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="shrink-0 p-1 rounded-md text-white/70 hover:text-white transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
