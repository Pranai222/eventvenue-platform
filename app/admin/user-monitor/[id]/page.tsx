"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft, User as UserIcon, Briefcase, Calendar, Building2,
    Ticket, Star, TrendingUp, Clock, MapPin, Coins, Mail, Phone, ChevronDown, ChevronUp
} from "lucide-react"
import type { User } from "@/lib/types/auth"

interface Booking {
    id: number
    userId: number
    venueId?: number
    eventId?: number
    bookingDate: string
    totalAmount: number
    pointsUsed: number
    status: string
    createdAt?: string
    quantity?: number
}

interface Review {
    id: number
    userId: number
    venueId?: number
    eventId?: number
    rating: number
    comment: string
    status: string
    createdAt: string
}

interface Venue {
    id: number
    vendorId: number
    name: string
    city?: string
    address?: string
    pricePerHour: number
    isAvailable: boolean
}

interface Event {
    id: number
    vendorId: number
    name: string
    eventDate: string
    pricePerTicket: number
    isActive: boolean
    location?: string
}

export default function UserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = Number(params.id)

    const [user, setUser] = useState<User | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    const [venues, setVenues] = useState<Venue[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [allVenues, setAllVenues] = useState<Venue[]>([])
    const [allEvents, setAllEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAllBookings, setShowAllBookings] = useState(false)

    const BOOKINGS_DISPLAY_LIMIT = 10
    const API_BASE_URL = "http://localhost:8080"

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get auth token
                const token = localStorage.getItem("auth_token")
                const headers: Record<string, string> = {
                    "Content-Type": "application/json"
                }
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`
                }

                // Fetch user data from backend
                const userRes = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, { headers })
                if (!userRes.ok) throw new Error("Failed to fetch user")
                const userData = await userRes.json()
                const fetchedUser = userData.data || userData
                setUser(fetchedUser)

                // Fetch user's bookings from backend
                const bookingsRes = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/bookings`, { headers })
                if (bookingsRes.ok) {
                    const bookingsData = await bookingsRes.json()
                    const bookingsList = bookingsData.data || bookingsData || []
                    // Sort by most recent first
                    const sortedBookings = [...bookingsList].sort((a: Booking, b: Booking) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.bookingDate ? new Date(a.bookingDate).getTime() : 0)
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.bookingDate ? new Date(b.bookingDate).getTime() : 0)
                        return dateB - dateA
                    })
                    setBookings(sortedBookings)
                }

                // Fetch all reviews from backend and filter by user
                const reviewsRes = await fetch(`${API_BASE_URL}/api/admin/reviews`, { headers })
                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json()
                    const allReviews = Array.isArray(reviewsData) ? reviewsData : reviewsData.data || []
                    setReviews(allReviews.filter((r: Review) => r.userId === userId))
                }

                // Fetch all venues and events from backend for name resolution
                const [venuesRes, eventsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/venues`).then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/events`).then(r => r.json())
                ])
                const allVenuesData = Array.isArray(venuesRes) ? venuesRes : venuesRes?.data || []
                const allEventsData = Array.isArray(eventsRes) ? eventsRes : eventsRes?.data || []
                setAllVenues(allVenuesData)
                setAllEvents(allEventsData)

                // If user is a vendor, fetch their vendor profile to get the correct vendorId
                if (fetchedUser.role === "VENDOR") {
                    try {
                        const vendorRes = await fetch(
                            `${API_BASE_URL}/api/admin/vendors/by-email?email=${encodeURIComponent(fetchedUser.email)}`,
                            { headers }
                        )
                        if (vendorRes.ok) {
                            const vendorData = await vendorRes.json()
                            const vendor = vendorData.data || vendorData
                            const vendorId = vendor.id
                            console.log("Vendor ID:", vendorId, "filtering venues/events by this ID")

                            // Filter venues and events by vendor ID
                            setVenues(allVenuesData.filter((v: Venue) => v.vendorId === vendorId))
                            setEvents(allEventsData.filter((e: Event) => e.vendorId === vendorId))

                            // Also get bookings for vendor's venues/events
                            const venueIds = allVenuesData.filter((v: Venue) => v.vendorId === vendorId).map((v: Venue) => v.id)
                            const eventIds = allEventsData.filter((e: Event) => e.vendorId === vendorId).map((e: Event) => e.id)

                            // Re-fetch all bookings and filter for vendor
                            const allBookingsRes = await fetch(`${API_BASE_URL}/api/admin/bookings`, { headers })
                            if (allBookingsRes.ok) {
                                const allBookingsData = await allBookingsRes.json()
                                const allBookings = allBookingsData.data || allBookingsData || []
                                const vendorBookings = allBookings.filter((b: Booking) =>
                                    venueIds.includes(b.venueId) || eventIds.includes(b.eventId)
                                )
                                setBookings(vendorBookings)
                            }

                            // Get reviews for vendor's venues and events
                            setReviews(reviews.filter((r: Review) =>
                                venueIds.includes(r.venueId) || eventIds.includes(r.eventId)
                            ))
                        }
                    } catch (vendorErr) {
                        console.error("Failed to fetch vendor profile:", vendorErr)
                    }
                }

            } catch (err: any) {
                console.error("Failed to load user data:", err)
                setError(err.message || "Failed to load user data")
            } finally {
                setIsLoading(false)
            }
        }

        if (userId) {
            loadData()
        }
    }, [userId])

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }

    const getVenueName = (venueId: number) => {
        const venue = allVenues.find(v => v.id === venueId)
        return venue?.name || `Venue #${venueId}`
    }

    const getEventName = (eventId: number) => {
        const event = allEvents.find(e => e.id === eventId)
        return event?.name || `Event #${eventId}`
    }

    // Calculate vendor earnings
    const vendorVenueIds = venues.map(v => v.id)
    const vendorEventIds = events.map(e => e.id)
    const vendorBookings = bookings.length > 0 ? bookings :
        // For vendors, get all bookings for their venues/events
        []

    const totalPointsUsed = bookings.reduce((sum, b) => sum + (b.pointsUsed || 0), 0)

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-red-500">{error || "User not found"}</p>
                        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const getDisplayName = () => {
        if (user.name) return user.name
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
        if (user.firstName) return user.firstName
        if (user.username) return user.username
        return user.email.split('@')[0]
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Back Button */}
            <Button variant="outline" onClick={() => router.push('/admin/user-monitor')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to User Monitor
            </Button>

            {/* User Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.role === "VENDOR" ? (
                                <Briefcase className="h-10 w-10 text-primary" />
                            ) : (
                                <UserIcon className="h-10 w-10 text-primary" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{getDisplayName()}</h1>
                            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                                <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {user.email}</span>
                                {user.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {user.phone}</span>}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Badge variant={user.role === "VENDOR" ? "secondary" : user.role === "ADMIN" ? "default" : "outline"}>
                                    {user.role}
                                </Badge>
                                <Badge variant={user.isVerified ? "default" : "secondary"}>
                                    {user.isVerified ? "Verified" : "Unverified"}
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                    <Coins className="h-3 w-3" /> {user.points?.toLocaleString() || 0} points
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Registered: {formatDate(user.createdAt)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {user.role === "VENDOR" ? (
                /* ==================== VENDOR DETAILS ==================== */
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 dark:bg-blue-950">
                            <CardContent className="p-4 text-center">
                                <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <div className="text-2xl font-bold">{venues.length}</div>
                                <p className="text-sm text-muted-foreground">Venues Created</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-50 dark:bg-purple-950">
                            <CardContent className="p-4 text-center">
                                <Ticket className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                <div className="text-2xl font-bold">{events.length}</div>
                                <p className="text-sm text-muted-foreground">Events Created</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-950">
                            <CardContent className="p-4 text-center">
                                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <div className="text-2xl font-bold text-green-600">
                                    ₹{bookings.filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
                                        .reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
                                </div>
                                <p className="text-sm text-muted-foreground">Total Earnings</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50 dark:bg-amber-950">
                            <CardContent className="p-4 text-center">
                                <Star className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                                <div className="text-2xl font-bold">{reviews.length}</div>
                                <p className="text-sm text-muted-foreground">Reviews Received</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Venues */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                Venues Created ({venues.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {venues.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No venues created</p>
                            ) : (
                                <div className="space-y-2">
                                    {venues.map(venue => (
                                        <div key={venue.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{venue.name}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {venue.city || venue.address || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₹{venue.pricePerHour || 0}/hr</p>
                                                <Badge variant={venue.isAvailable ? "default" : "secondary"} className="text-xs">
                                                    {venue.isAvailable ? "Available" : "Unavailable"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Events */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-purple-600" />
                                Events Created ({events.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {events.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No events created</p>
                            ) : (
                                <div className="space-y-2">
                                    {events.map(event => (
                                        <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{event.name}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {formatDate(event.eventDate)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₹{event.pricePerTicket || 0}/ticket</p>
                                                <Badge variant={event.isActive ? "default" : "secondary"} className="text-xs">
                                                    {event.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reviews Received */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-amber-500" />
                                Reviews Received ({reviews.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reviews.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No reviews received</p>
                            ) : (
                                <div className="space-y-2">
                                    {reviews.map(review => (
                                        <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-4 w-4 ${star <= (review.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <Badge variant={review.status === "APPROVED" ? "default" : "secondary"} className="text-xs">
                                                    {review.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm">{review.comment || "No comment"}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{formatDate(review.createdAt)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* ==================== USER DETAILS ==================== */
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="bg-blue-50 dark:bg-blue-950">
                            <CardContent className="p-4 text-center">
                                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                <div className="text-2xl font-bold">{bookings.length}</div>
                                <p className="text-sm text-muted-foreground">Bookings Made</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50 dark:bg-amber-950">
                            <CardContent className="p-4 text-center">
                                <Star className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                                <div className="text-2xl font-bold">{reviews.length}</div>
                                <p className="text-sm text-muted-foreground">Reviews Posted</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-950">
                            <CardContent className="p-4 text-center">
                                <Coins className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                <div className="text-2xl font-bold text-green-600">
                                    {totalPointsUsed.toLocaleString()}
                                </div>
                                <p className="text-sm text-muted-foreground">Points Used</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bookings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    Bookings Made ({bookings.length})
                                </span>
                                {bookings.length > BOOKINGS_DISPLAY_LIMIT && (
                                    <span className="text-sm font-normal text-muted-foreground">
                                        Showing {showAllBookings ? bookings.length : Math.min(BOOKINGS_DISPLAY_LIMIT, bookings.length)} of {bookings.length}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {bookings.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No bookings made</p>
                            ) : (
                                <div className="space-y-2">
                                    {(showAllBookings ? bookings : bookings.slice(0, BOOKINGS_DISPLAY_LIMIT)).map(booking => (
                                        <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-medium flex items-center gap-1">
                                                    {booking.venueId ? (
                                                        <><Building2 className="h-4 w-4 text-blue-500" /> {getVenueName(booking.venueId)}</>
                                                    ) : (
                                                        <><Ticket className="h-4 w-4 text-purple-500" /> {getEventName(booking.eventId!)}</>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(booking.createdAt || booking.bookingDate)}
                                                    {booking.quantity && ` • ${booking.quantity} tickets`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">₹{booking.totalAmount || 0}</p>
                                                {booking.pointsUsed > 0 && (
                                                    <p className="text-xs text-amber-600">{booking.pointsUsed} pts used</p>
                                                )}
                                                <Badge
                                                    variant={booking.status === "CONFIRMED" ? "default" :
                                                        booking.status === "CANCELLED" ? "destructive" : "secondary"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}

                                    {/* View All / Show Less Button */}
                                    {bookings.length > BOOKINGS_DISPLAY_LIMIT && (
                                        <div className="flex justify-center pt-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowAllBookings(!showAllBookings)}
                                                className="gap-2"
                                            >
                                                {showAllBookings ? (
                                                    <>
                                                        <ChevronUp className="h-4 w-4" />
                                                        Show Less
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="h-4 w-4" />
                                                        View All ({bookings.length - BOOKINGS_DISPLAY_LIMIT} more)
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reviews */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-amber-500" />
                                Reviews Posted ({reviews.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reviews.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No reviews posted</p>
                            ) : (
                                <div className="space-y-2">
                                    {reviews.map(review => (
                                        <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-4 w-4 ${star <= (review.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <Badge variant={review.status === "APPROVED" ? "default" : "secondary"} className="text-xs">
                                                    {review.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm font-medium mb-1">
                                                {review.venueId ? (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" /> {getVenueName(review.venueId)}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <Ticket className="h-3 w-3" /> {getEventName(review.eventId!)}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{review.comment || "No comment"}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{formatDate(review.createdAt)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
