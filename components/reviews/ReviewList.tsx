"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StarRating } from "./StarRating"
import { ReviewForm } from "./ReviewForm"
import { reviewsApi, ReviewData } from "@/lib/api/reviews"
import { User, Pencil, Trash2, Calendar } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface ReviewListProps {
    reviews: ReviewData[]
    currentUserId?: number
    isVendor?: boolean
    isAdmin?: boolean
    onReviewDeleted?: () => void
    onReviewUpdated?: () => void
}

export function ReviewList({
    reviews,
    currentUserId,
    isVendor = false,
    isAdmin = false,
    onReviewDeleted,
    onReviewUpdated
}: ReviewListProps) {
    const [editingReview, setEditingReview] = useState<ReviewData | null>(null)
    const [editRating, setEditRating] = useState(0)
    const [editComment, setEditComment] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const handleEdit = (review: ReviewData) => {
        setEditingReview(review)
        setEditRating(review.rating)
        setEditComment(review.comment || "")
    }

    const handleUpdate = async () => {
        if (!editingReview?.id) return

        setIsUpdating(true)
        try {
            await reviewsApi.update(editingReview.id, {
                rating: editRating,
                comment: editComment
            })
            setEditingReview(null)
            onReviewUpdated?.()
        } catch (err: any) {
            alert(err.message || "Failed to update review")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDelete = async (reviewId: number) => {
        if (!confirm("Are you sure you want to delete this review?")) return

        setDeletingId(reviewId)
        try {
            if (isAdmin) {
                await reviewsApi.adminDelete(reviewId)
            } else if (isVendor) {
                await reviewsApi.vendorDelete(reviewId)
            } else {
                await reviewsApi.delete(reviewId)
            }
            onReviewDeleted?.()
        } catch (err: any) {
            alert(err.message || "Failed to delete review")
        } finally {
            setDeletingId(null)
        }
    }

    const canEdit = (review: ReviewData) => {
        return currentUserId && review.userId === currentUserId
    }

    const canDelete = (review: ReviewData) => {
        return isAdmin || isVendor || (currentUserId && review.userId === currentUserId)
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No reviews yet. Be the first to review!
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <Card key={review.id}>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={review.rating} size="sm" />
                                        <span className="text-sm text-muted-foreground">
                                            {review.rating}/5
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="mt-2 text-sm">{review.comment}</p>
                                    )}
                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                {canEdit(review) && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(review)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                                {canDelete(review) && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() => handleDelete(review.id!)}
                                        disabled={deletingId === review.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Edit Dialog */}
            <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Rating</label>
                            <StarRating
                                rating={editRating}
                                size="lg"
                                interactive
                                onChange={setEditRating}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Comment</label>
                            <Textarea
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleUpdate} disabled={isUpdating}>
                                Update Review
                            </Button>
                            <Button variant="outline" onClick={() => setEditingReview(null)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ReviewList
