import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

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
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        setLoaded(false)
    }, [src])

    return (
        <div className={cn("relative overflow-hidden", containerClassName)}>
            {!loaded && <Skeleton className={cn("absolute inset-0", skeletonClassName)} aria-hidden="true" />}
            <img
                {...props}
                src={src}
                onLoad={(e) => {
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