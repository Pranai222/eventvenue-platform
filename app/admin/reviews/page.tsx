"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Trash2, Star, MessageSquare, Calendar, User, AlertCircle, Briefcase, AlertTriangle, Filter, X } from "lucide-react"
import type { Review } from "@/lib/types/booking"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const API_BASE_URL = "http://localhost:8080"

// Direct API calls for reviews
const reviewsApi = {
    getAllReviews: async (): Promise<Review[]> => {
        try {
            const response = await apiClient.get<any>("/api/reviews")
            if (response && typeof response === 'object' && 'data' in response) {
                return Array.isArray(response.data) ? response.data : []
            }
            return Array.isArray(response) ? response : []
        } catch (err) {
            console.error("[EventVenue] Error fetching reviews:", err)
            return []
        }
    },
    deleteReview: async (id: number) => {
        // Use admin endpoint for deleting reviews
        const token = localStorage.getItem("auth_token")
        const response = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
        if (!response.ok) {
            throw new Error("Failed to delete review")
        }
    }
}

interface Venue {
    id: number
    vendorId: number
    name: string
}

interface Event {
    id: number
    vendorId: number
    name: string
}

interface Vendor {
    id: number
    businessName: string
    email: string
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [venues, setVenues] = useState<Venue[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteReview, setDeleteReview] = useState<Review | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Advanced filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterRating, setFilterRating] = useState<string>("all")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterUserId, setFilterUserId] = useState("")
    const [filterVenueId, setFilterVenueId] = useState("")
    const [filterEventId, setFilterEventId] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            console.log("[EventVenue] Loading reviews and related data...")

            // Load reviews
            const reviewsData = await reviewsApi.getAllReviews()
            setReviews(reviewsData)

            // Load venues and events for vendor lookup
            const [venuesRes, eventsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/venues`).then(r => r.json()),
                fetch(`${API_BASE_URL}/api/events`).then(r => r.json())
            ])
            const venuesData = Array.isArray(venuesRes) ? venuesRes : venuesRes?.data || []
            const eventsData = Array.isArray(eventsRes) ? eventsRes : eventsRes?.data || []
            setVenues(venuesData)
            setEvents(eventsData)

            // Load vendors (need auth)
            const token = localStorage.getItem("auth_token")
            if (token) {
                const vendorsRes = await fetch(`${API_BASE_URL}/api/admin/vendors`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }).then(r => r.json())
                const vendorsData = Array.isArray(vendorsRes) ? vendorsRes : vendorsRes?.data || []
                setVendors(vendorsData)
            }

            setError(null)
        } catch (err: any) {
            console.error("[EventVenue] Failed to load data:", err)
            setError(err.message || "Failed to load reviews")
            setReviews([])
        } finally {
            setIsLoading(false)
        }
    }

    const getVendorForReview = (review: Review) => {
        let vendorId: number | null = null

        // Find vendor ID from venue or event
        if (review.venueId) {
            const venue = venues.find(v => v.id === review.venueId)
            vendorId = venue?.vendorId || null
        } else if (review.eventId) {
            const event = events.find(e => e.id === review.eventId)
            vendorId = event?.vendorId || null
        }

        if (vendorId) {
            const vendor = vendors.find(v => v.id === vendorId)
            return { id: vendorId, name: vendor?.businessName || `Vendor #${vendorId}` }
        }
        return null
    }

    const handleDeleteConfirm = async () => {
        if (!deleteReview) return
        setIsDeleting(true)

        try {
            console.log("[EventVenue] Deleting review:", deleteReview.id)
            await reviewsApi.deleteReview(deleteReview.id)
            setReviews(reviews.filter((r) => r.id !== deleteReview.id))
            setDeleteReview(null)
        } catch (error: any) {
            console.error("[EventVenue] Failed to delete review:", error)
            alert("Failed to delete review: " + (error.message || "Unknown error"))
        } finally {
            setIsDeleting(false)
        }
    }

    const hasActiveFilters = filterRating !== "all" || filterType !== "all" || filterUserId || filterVenueId || filterEventId

    const clearFilters = () => {
        setFilterRating("all")
        setFilterType("all")
        setFilterUserId("")
        setFilterVenueId("")
        setFilterEventId("")
        setSearchTerm("")
    }

    const filteredReviews = reviews.filter((review) => {
        // Text search
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = !searchTerm ||
            review.comment?.toLowerCase().includes(searchLower) ||
            review.id.toString().includes(searchLower) ||
            review.userId.toString().includes(searchLower)

        // Rating filter
        const matchesRating = filterRating === "all" || review.rating === parseInt(filterRating)

        // Type filter
        const matchesType = filterType === "all" ||
            (filterType === "venue" && review.venueId) ||
            (filterType === "event" && review.eventId)

        // ID filters
        const matchesUserId = !filterUserId || review.userId.toString().includes(filterUserId)
        const matchesVenueId = !filterVenueId || (review.venueId && review.venueId.toString().includes(filterVenueId))
        const matchesEventId = !filterEventId || (review.eventId && review.eventId.toString().includes(filterEventId))

        return matchesSearch && matchesRating && matchesType && matchesUserId && matchesVenueId && matchesEventId
    })

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-32 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Review Management</h1>
                    <p className="text-muted-foreground">Manage and moderate user reviews</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold">{reviews.length}</div>
                    <div className="text-sm text-muted-foreground">Total Reviews</div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    {/* Search Row */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by review content, ID, or user ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">{[filterRating !== "all", filterType !== "all", filterUserId, filterVenueId, filterEventId].filter(Boolean).length}</Badge>}
                        </Button>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear all filters">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Rating</label>
                                <Select value={filterRating} onValueChange={setFilterRating}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Ratings" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Ratings</SelectItem>
                                        <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                                        <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                                        <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                                        <SelectItem value="2">⭐⭐ (2)</SelectItem>
                                        <SelectItem value="1">⭐ (1)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Type</label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="venue">Venue Reviews</SelectItem>
                                        <SelectItem value="event">Event Reviews</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">User ID</label>
                                <Input
                                    placeholder="Filter by user..."
                                    value={filterUserId}
                                    onChange={(e) => setFilterUserId(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Venue ID</label>
                                <Input
                                    placeholder="Filter by venue..."
                                    value={filterVenueId}
                                    onChange={(e) => setFilterVenueId(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Event ID</label>
                                <Input
                                    placeholder="Filter by event..."
                                    value={filterEventId}
                                    onChange={(e) => setFilterEventId(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                        </div>
                    )}

                    {/* Filter Results Info */}
                    {(searchTerm || hasActiveFilters) && (
                        <div className="text-sm text-muted-foreground">
                            Found {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''} matching your criteria
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reviews.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {reviews.length > 0
                                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                : "0.0"}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Venue Reviews</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {reviews.filter((r) => r.venueId).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">
                                {reviews.length === 0 ? "No reviews yet" : "No reviews found"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredReviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {renderStars(review.rating)}
                                                <Badge variant="outline">ID: {review.id}</Badge>
                                                {review.venueId && (
                                                    <Badge variant="secondary">Venue ID: {review.venueId}</Badge>
                                                )}
                                                {review.eventId && (
                                                    <Badge variant="secondary">Event ID: {review.eventId}</Badge>
                                                )}
                                                {(() => {
                                                    const vendor = getVendorForReview(review)
                                                    return vendor ? (
                                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            <Briefcase className="h-3 w-3 mr-1" />
                                                            Vendor ID: {vendor.id} ({vendor.name})
                                                        </Badge>
                                                    ) : null
                                                })()}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <User className="h-4 w-4" />
                                                    <span>User ID: {review.userId}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setDeleteReview(review)}
                                            className="gap-2 text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>

                                    {/* Comment */}
                                    {review.comment && (
                                        <div className="bg-muted/50 rounded-lg p-4">
                                            <p className="text-sm leading-relaxed">{review.comment}</p>
                                        </div>
                                    )}

                                    {/* Helpful Count */}
                                    {(review as any).helpfulCount > 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            {(review as any).helpfulCount} {(review as any).helpfulCount === 1 ? "person" : "people"} found this helpful
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteReview} onOpenChange={() => setDeleteReview(null)}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-lg">Delete Review</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm">
                                    This action cannot be undone
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    {deleteReview && (
                        <div className="bg-muted/50 rounded-lg p-4 my-4 space-y-3">
                            {/* Rating Stars */}
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-4 w-4 ${star <= deleteReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium">{deleteReview.rating}/5</span>
                            </div>

                            {/* Review Info */}
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">Review ID: {deleteReview.id}</Badge>
                                <Badge variant="secondary" className="text-xs">User ID: {deleteReview.userId}</Badge>
                                {deleteReview.venueId && <Badge className="text-xs">Venue ID: {deleteReview.venueId}</Badge>}
                                {deleteReview.eventId && <Badge className="text-xs">Event ID: {deleteReview.eventId}</Badge>}
                            </div>

                            {/* Comment Preview */}
                            {deleteReview.comment && (
                                <div className="text-sm text-muted-foreground italic">
                                    "{deleteReview.comment.length > 100
                                        ? deleteReview.comment.substring(0, 100) + "..."
                                        : deleteReview.comment}"
                                </div>
                            )}

                            {/* Date */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Posted: {new Date(deleteReview.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to permanently delete this review? This will remove the review from the venue/event and update the overall rating.
                    </p>

                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete Review"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
