"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "./StarRating"
import { ReviewForm } from "./ReviewForm"
import { ReviewList } from "./ReviewList"
import { reviewsApi, ReviewData, CanReviewResponse } from "@/lib/api/reviews"
import { Star, MessageSquare } from "lucide-react"

interface ReviewSectionProps {
    venueId?: number
    eventId?: number
    currentUserId?: number
    isVendor?: boolean
    isAdmin?: boolean
}

export function ReviewSection({
    venueId,
    eventId,
    currentUserId,
    isVendor = false,
    isAdmin = false
}: ReviewSectionProps) {
    const [reviews, setReviews] = useState<ReviewData[]>([])
    const [averageRating, setAverageRating] = useState(0)
    const [totalReviews, setTotalReviews] = useState(0)
    const [canReview, setCanReview] = useState(false)
    const [hasBooked, setHasBooked] = useState(false)
    const [hasReviewed, setHasReviewed] = useState(false)
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const loadReviews = async () => {
        try {
            let response
            if (venueId) {
                response = await reviewsApi.getVenueReviews(venueId)
            } else if (eventId) {
                response = await reviewsApi.getEventReviews(eventId)
            }

            if (response) {
                setReviews(response.reviews || [])
                setAverageRating(response.averageRating || 0)
                setTotalReviews(response.totalReviews || 0)
            }
        } catch (err) {
            console.error("Failed to load reviews:", err)
        }
    }

    const checkCanReview = async () => {
        if (!currentUserId) return

        try {
            let response: CanReviewResponse
            if (venueId) {
                response = await reviewsApi.canReviewVenue(venueId)
            } else if (eventId) {
                response = await reviewsApi.canReviewEvent(eventId)
            } else {
                return
            }

            setCanReview(response.canReview)
            setHasBooked(response.hasBooked)
            setHasReviewed(response.hasReviewed)
        } catch (err) {
            console.error("Failed to check review eligibility:", err)
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            await Promise.all([loadReviews(), checkCanReview()])
            setIsLoading(false)
        }
        loadData()
    }, [venueId, eventId, currentUserId])

    const handleReviewSuccess = () => {
        setShowReviewForm(false)
        loadReviews()
        checkCanReview()
    }

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-muted rounded"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Rating Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        Reviews & Ratings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                            <StarRating rating={Math.round(averageRating)} size="sm" />
                            <p className="text-sm text-muted-foreground mt-1">
                                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                            </p>
                        </div>

                        {/* Rating breakdown could go here */}
                    </div>
                </CardContent>
            </Card>

            {/* Write Review Section */}
            {currentUserId && (
                <div>
                    {!hasBooked && (
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="py-4">
                                <p className="text-amber-800 text-sm">
                                    <MessageSquare className="inline h-4 w-4 mr-1" />
                                    You need to book this {venueId ? 'venue' : 'event'} before you can leave a review.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {hasBooked && hasReviewed && (
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="py-4">
                                <p className="text-green-800 text-sm">
                                    ✓ You have already reviewed this {venueId ? 'venue' : 'event'}.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {canReview && !showReviewForm && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="w-full py-3 border-2 border-dashed border-primary/50 rounded-lg text-primary hover:bg-primary/5 transition-colors"
                        >
                            + Write a Review
                        </button>
                    )}

                    {showReviewForm && (
                        <ReviewForm
                            venueId={venueId}
                            eventId={eventId}
                            onSuccess={handleReviewSuccess}
                            onCancel={() => setShowReviewForm(false)}
                        />
                    )}
                </div>
            )}

            {/* Reviews List */}
            <div>
                <h3 className="text-lg font-semibold mb-4">All Reviews</h3>
                <ReviewList
                    reviews={reviews}
                    currentUserId={currentUserId}
                    isVendor={isVendor}
                    isAdmin={isAdmin}
                    onReviewDeleted={loadReviews}
                    onReviewUpdated={loadReviews}
                />
            </div>
        </div>
    )
}

export default ReviewSection
