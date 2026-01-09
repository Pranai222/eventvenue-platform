"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
    rating: number
    maxRating?: number
    size?: "sm" | "md" | "lg"
    interactive?: boolean
    onChange?: (rating: number) => void
    className?: string
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
}

export function StarRating({
    rating,
    maxRating = 5,
    size = "md",
    interactive = false,
    onChange,
    className
}: StarRatingProps) {
    const handleClick = (value: number) => {
        if (interactive && onChange) {
            onChange(value)
        }
    }

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const value = index + 1
                const isFilled = value <= rating

                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleClick(value)}
                        disabled={!interactive}
                        className={cn(
                            "transition-colors",
                            interactive && "cursor-pointer hover:scale-110",
                            !interactive && "cursor-default"
                        )}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            )}
                        />
                    </button>
                )
            })}
        </div>
    )
}

export default StarRating
