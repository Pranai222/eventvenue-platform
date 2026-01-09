"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { uploadApi } from "@/lib/api/upload"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"

interface ImageUploadProps {
    images: string[]
    onChange: (images: string[]) => void
    maxImages?: number
    type?: string
    label?: string
}

export function ImageUpload({
    images,
    onChange,
    maxImages = 10,
    type = "general",
    label = "Upload Images"
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files)

        if (images.length + fileArray.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed`)
            return
        }

        // Filter only image files
        const imageFiles = fileArray.filter(file => file.type.startsWith("image/"))

        if (imageFiles.length === 0) {
            setError("Please select image files only")
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            const urls = await uploadApi.uploadImages(imageFiles, type)
            onChange([...images, ...urls])
        } catch (err: any) {
            setError(err.message || "Failed to upload images")
        } finally {
            setIsUploading(false)
        }
    }, [images, maxImages, type, onChange])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }

    const handleClick = () => {
        inputRef.current?.click()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files)
        }
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        onChange(newImages)
    }

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium">{label}</label>

            {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Upload Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${isUploading ? "opacity-50 pointer-events-none" : ""}
        `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleChange}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            Drag & drop images here or click to browse
                        </span>
                        <span className="text-xs text-muted-foreground">
                            JPG, PNG, GIF or WebP (max 10MB each, up to {maxImages} images)
                        </span>
                    </div>
                )}
            </div>

            {/* Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                                src={url}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeImage(index)
                                }}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                                    Main
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                {images.length} / {maxImages} images uploaded
            </p>
        </div>
    )
}

export default ImageUpload
