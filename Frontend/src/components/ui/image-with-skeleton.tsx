import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const loadedImageSrc = new Set<string>()
const loadingImagePromises = new Map<string, Promise<void>>()

function ensureImageLoaded(src: string): Promise<void> {
    if (!src || typeof window === "undefined") {
        return Promise.resolve()
    }

    if (loadedImageSrc.has(src)) {
        return Promise.resolve()
    }

    const existingPromise = loadingImagePromises.get(src)
    if (existingPromise) {
        return existingPromise
    }

    const promise = new Promise<void>((resolve) => {
        const img = new window.Image()
        img.onload = () => {
            loadedImageSrc.add(src)
            resolve()
        }
        img.onerror = () => {
            resolve()
        }
        img.src = src
    }).finally(() => {
        loadingImagePromises.delete(src)
    })

    loadingImagePromises.set(src, promise)
    return promise
}

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    containerClassName?: string
    skeletonClassName?: string
}

export function ImageWithSkeleton({
    className,
    containerClassName,
    skeletonClassName,
    src,
    onLoad,
    onError,
    ...props
}: ImageWithSkeletonProps) {
    const [loaded, setLoaded] = useState(() => {
        if (typeof src !== "string" || !src) {
            return true
        }
        return loadedImageSrc.has(src)
    })

    useEffect(() => {
        if (typeof src !== "string" || !src) {
            setLoaded(true)
            return
        }

        if (loadedImageSrc.has(src)) {
            setLoaded(true)
            return
        }

        let cancelled = false
        setLoaded(false)

        void ensureImageLoaded(src).then(() => {
            if (!cancelled) {
                setLoaded(true)
            }
        })

        return () => {
            cancelled = true
        }
    }, [src])

    return (
        <div className={cn("relative overflow-hidden", containerClassName)}>
            {!loaded && <Skeleton className={cn("absolute inset-0", skeletonClassName)} aria-hidden="true" />}
            <img
                {...props}
                src={src}
                onLoad={(e) => {
                    if (typeof src === "string" && src) {
                        loadedImageSrc.add(src)
                    }
                    setLoaded(true)
                    onLoad?.(e)
                }}
                onError={(e) => {
                    setLoaded(true)
                    onError?.(e)
                }}
                className={cn(className, loaded ? "opacity-100" : "opacity-0", "transition-opacity duration-300")}
            />
        </div>
    )
}