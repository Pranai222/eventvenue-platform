"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"

interface ImageGalleryProps {
    images: string[]
    alt?: string
}

export function ImageGallery({ images, alt = "Image" }: ImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // Handle empty or invalid images
    const validImages = images.filter(img => img && img.trim() !== "")

    if (validImages.length === 0) {
        return (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">No images available</span>
            </div>
        )
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
    }

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const minSwipeDistance = 50

        if (Math.abs(distance) > minSwipeDistance) {
            if (distance > 0) {
                goToNext()
            } else {
                goToPrevious()
            }
        }
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isFullscreen) {
                if (e.key === "ArrowLeft") goToPrevious()
                if (e.key === "ArrowRight") goToNext()
                if (e.key === "Escape") setIsFullscreen(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isFullscreen])

    return (
        <>
            {/* Main Gallery */}
            <div className="relative group">
                <div
                    className="aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => setIsFullscreen(true)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <img
                        src={validImages[currentIndex]}
                        alt={`${alt} ${currentIndex + 1}`}
                        className="w-full h-full object-cover transition-opacity"
                    />

                    {/* Zoom icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Navigation Arrows */}
                {validImages.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); goToPrevious() }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); goToNext() }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}

                {/* Dots Indicator */}
                {validImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {validImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index) }}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/50"
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
                    {currentIndex + 1} / {validImages.length}
                </div>
            </div>

            {/* Thumbnails */}
            {validImages.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                    {validImages.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${index === currentIndex ? "border-primary" : "border-transparent hover:border-primary/50"
                                }`}
                        >
                            <img
                                src={img}
                                alt={`${alt} thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-50 bg-black flex items-center justify-center"
                    onClick={() => setIsFullscreen(false)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 z-10"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <img
                        src={validImages[currentIndex]}
                        alt={`${alt} ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {validImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToPrevious() }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToNext() }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                        {currentIndex + 1} / {validImages.length}
                    </div>
                </div>
            )}
        </>
    )
}

export default ImageGallery
