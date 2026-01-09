"use client"

import { useEffect, useState } from "react"
import { reviewsApi, ReviewData } from "@/lib/api/reviews"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/reviews/StarRating"
import { MessageSquare, Star, Trash2, Calendar, Building2, Ticket, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function VendorReviewsPage() {
    const [reviews, setReviews] = useState<ReviewData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const loadReviews = async () => {
        try {
            const data = await reviewsApi.getVendorReviews()
            setReviews(data || [])
        } catch (error) {
            console.error("Failed to load reviews:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadReviews()
    }, [])

    const handleDelete = async (reviewId: number) => {
        if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
            return
        }

        setDeletingId(reviewId)
        try {
            await reviewsApi.vendorDelete(reviewId)
            setReviews(reviews.filter(r => r.id !== reviewId))
        } catch (error: any) {
            alert(error.message || "Failed to delete review")
        } finally {
            setDeletingId(null)
        }
    }

    // Calculate stats
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0
    const venueReviews = reviews.filter(r => r.venueId)
    const eventReviews = reviews.filter(r => r.eventId)

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-32 bg-muted rounded"></div>
                    <div className="h-32 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Customer Reviews</h1>
                <p className="text-muted-foreground">
                    Manage reviews for your venues and events
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{totalReviews}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Venue Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold">{venueReviews.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Event Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-purple-500" />
                            <span className="text-2xl font-bold">{eventReviews.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground text-lg">No reviews yet</p>
                        <p className="text-sm text-muted-foreground">
                            Reviews will appear here when customers review your venues and events
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <StarRating rating={review.rating} size="sm" />
                                            <span className="text-sm font-medium">{review.rating}/5</span>
                                            <Badge variant={review.venueId ? "secondary" : "outline"}>
                                                {review.venueId ? "Venue" : "Event"}
                                            </Badge>
                                        </div>

                                        {review.comment && (
                                            <p className="text-sm mb-3">{review.comment}</p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span className="font-medium">{review.userName || review.userEmail || `User #${review.userId}`}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                                            </div>
                                            {review.venueId && (
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {review.venueName || `Venue #${review.venueId}`}
                                                </div>
                                            )}
                                            {review.eventId && (
                                                <div className="flex items-center gap-1">
                                                    <Ticket className="h-3 w-3" />
                                                    {review.eventName || `Event #${review.eventId}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() => handleDelete(review.id!)}
                                        disabled={deletingId === review.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
