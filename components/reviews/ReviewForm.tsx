"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "./StarRating"
import { reviewsApi } from "@/lib/api/reviews"
import { Loader2 } from "lucide-react"

interface ReviewFormProps {
    venueId?: number
    eventId?: number
    onSuccess?: () => void
    onCancel?: () => void
}

export function ReviewForm({ venueId, eventId, onSuccess, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0) {
            setError("Please select a rating")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await reviewsApi.create({
                venueId,
                eventId,
                rating,
                comment
            })

            setRating(0)
            setComment("")
            onSuccess?.()
        } catch (err: any) {
            setError(err.message || "Failed to submit review")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">Your Rating</label>
                        <StarRating
                            rating={rating}
                            size="lg"
                            interactive
                            onChange={setRating}
                        />
                        {rating > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {rating === 1 && "Poor"}
                                {rating === 2 && "Fair"}
                                {rating === 3 && "Good"}
                                {rating === 4 && "Very Good"}
                                {rating === 5 && "Excellent"}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Your Review (optional)</label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={isSubmitting || rating === 0}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Review
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export default ReviewForm
