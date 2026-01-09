"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft, Ticket, Calendar, IndianRupee, Star, Users,
    CheckCircle, XCircle, User, Mail, Coins, ChevronDown, ChevronUp
} from "lucide-react"

interface Booking {
    id: number
    userId: number
    eventId: number
    bookingDate: string
    totalAmount: number
    pointsUsed: number
    status: string
    quantity?: number
    createdAt?: string
}

interface Review {
    id: number
    userId: number
    eventId: number
    rating: number
    comment: string
    status: string
    createdAt: string
}

interface Event {
    id: number
    name: string
    eventDate: string
    pricePerTicket: number
    totalTickets: number
    ticketsAvailable: number
    isActive: boolean
    location?: string
}

interface UserInfo {
    id: number
    name?: string
    firstName?: string
    lastName?: string
    email: string
}

const INITIAL_DISPLAY = 10

export default function EventAnalyticsPage() {
    const params = useParams()
    const router = useRouter()
    const eventId = Number(params.id)

    const [event, setEvent] = useState<Event | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    const [users, setUsers] = useState<Record<number, UserInfo>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [showAllBookings, setShowAllBookings] = useState(false)
    const [showAllReviews, setShowAllReviews] = useState(false)

    const API_BASE_URL = "http://localhost:8080"

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem("auth_token")
                const headers: Record<string, string> = { "Content-Type": "application/json" }
                if (token) headers["Authorization"] = `Bearer ${token}`

                // Fetch event details
                const eventRes = await fetch(`${API_BASE_URL}/api/events/${eventId}`, { headers })
                if (eventRes.ok) {
                    const eventData = await eventRes.json()
                    setEvent(eventData.data || eventData)
                }

                // Fetch all bookings and filter by eventId
                const bookingsRes = await fetch(`${API_BASE_URL}/api/bookings/vendor/my-bookings`, { headers })
                if (bookingsRes.ok) {
                    const bookingsData = await bookingsRes.json()
                    const allBookings = Array.isArray(bookingsData) ? bookingsData : bookingsData.data || []
                    const eventBookings = allBookings.filter((b: Booking) => b.eventId === eventId)
                    // Sort by most recent
                    eventBookings.sort((a: Booking, b: Booking) => {
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
                        return dateB - dateA
                    })
                    setBookings(eventBookings)

                    // Fetch user info
                    const userIds = [...new Set(eventBookings.map((b: Booking) => b.userId))]
                    const usersMap: Record<number, UserInfo> = {}
                    for (const userId of userIds) {
                        try {
                            const userRes = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, { headers })
                            if (userRes.ok) {
                                const userData = await userRes.json()
                                usersMap[userId as number] = userData.data || userData
                            }
                        } catch { }
                    }
                    setUsers(usersMap)
                }

                // Fetch reviews for this event
                try {
                    const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews/event/${eventId}`, { headers })
                    if (reviewsRes.ok) {
                        const reviewsData = await reviewsRes.json()
                        const allReviews = Array.isArray(reviewsData) ? reviewsData :
                            (reviewsData?.data && Array.isArray(reviewsData.data)) ? reviewsData.data : []
                        setReviews(allReviews)
                    }
                } catch {
                    setReviews([])
                }
            } catch (err) {
                console.error("Failed to load analytics:", err)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [eventId])

    const getUserName = (userId: number): string => {
        const user = users[userId]
        if (!user) return `User #${userId}`
        if (user.name) return user.name
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
        if (user.firstName) return user.firstName
        return user.email.split('@')[0]
    }

    const getUserEmail = (userId: number): string => {
        return users[userId]?.email || ''
    }

    // Calculate stats
    const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
    const cancelledBookings = bookings.filter(b => b.status === "CANCELLED")
    const totalTicketsBooked = confirmedBookings.reduce((sum, b) => sum + (b.quantity || 1), 0)
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    const ticketsSold = event ? (event.totalTickets - event.ticketsAvailable) : 0
    const estimatedFullRevenue = event ? (event.totalTickets * event.pricePerTicket) : 0
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-32 bg-muted rounded"></div>
                    <div className="h-64 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Back Button */}
            <Button variant="outline" onClick={() => router.push('/vendor/bookings')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Bookings
            </Button>

            {/* Event Header */}
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-purple-600 flex items-center justify-center">
                            <Ticket className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{event?.name || `Event #${eventId}`}</h1>
                            <p className="text-muted-foreground">
                                {event?.eventDate && new Date(event.eventDate).toLocaleDateString('en-IN', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}
                                {event?.location && ` • ${event.location}`}
                            </p>
                            <Badge variant={event?.isActive ? "default" : "secondary"} className="mt-2">
                                {event?.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        {event && (
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Ticket Price</p>
                                <p className="text-2xl font-bold text-purple-600 flex items-center gap-1 justify-end">
                                    <IndianRupee className="h-5 w-5" />{event.pricePerTicket}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Ticket className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold">{ticketsSold}</div>
                        <p className="text-xs text-muted-foreground">Tickets Sold</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950">
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold text-green-600">{confirmedBookings.length}</div>
                        <p className="text-xs text-muted-foreground">Confirmed</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-950">
                    <CardContent className="p-4 text-center">
                        <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                        <div className="text-2xl font-bold text-red-600">{cancelledBookings.length}</div>
                        <p className="text-xs text-muted-foreground">Cancelled</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950">
                    <CardContent className="p-4 text-center">
                        <IndianRupee className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-950">
                    <CardContent className="p-4 text-center">
                        <Star className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                        <div className="text-2xl font-bold text-amber-600">{avgRating.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">{reviews.length} Reviews</p>
                    </CardContent>
                </Card>
            </div>

            {/* Ticket Summary */}
            {event && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Available Tickets</p>
                                <p className="text-xl font-bold">{event.ticketsAvailable} / {event.totalTickets}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Estimated Full Revenue</p>
                                <p className="text-xl font-bold text-green-600">₹{estimatedFullRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                                style={{ width: `${((event.totalTickets - event.ticketsAvailable) / event.totalTickets) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bookings List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            Bookings ({bookings.length})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {bookings.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No bookings yet</p>
                    ) : (
                        <div className="space-y-3">
                            {(showAllBookings ? bookings : bookings.slice(0, INITIAL_DISPLAY)).map(booking => (
                                <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{getUserName(booking.userId)}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {getUserEmail(booking.userId)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium">{booking.quantity || 1} ticket{(booking.quantity || 1) > 1 ? 's' : ''}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-green-600 flex items-center gap-1 justify-end">
                                            <IndianRupee className="h-4 w-4" />{booking.totalAmount || 0}
                                        </p>
                                        {booking.pointsUsed > 0 && (
                                            <p className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                                                <Coins className="h-3 w-3" />{booking.pointsUsed} pts
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant={
                                            booking.status === "CONFIRMED" || booking.status === "COMPLETED" ? "default" :
                                                booking.status === "CANCELLED" ? "destructive" : "secondary"
                                        }
                                    >
                                        {booking.status}
                                    </Badge>
                                </div>
                            ))}

                            {bookings.length > INITIAL_DISPLAY && (
                                <div className="flex justify-center pt-2">
                                    <Button variant="outline" onClick={() => setShowAllBookings(!showAllBookings)} className="gap-2">
                                        {showAllBookings ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> View All</>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reviews List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Reviews ({reviews.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {reviews.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                    ) : (
                        <div className="space-y-3">
                            {(showAllReviews ? reviews : reviews.slice(0, 5)).map(review => (
                                <div key={review.id} className="p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star
                                                    key={star}
                                                    className={`h-4 w-4 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm">{review.comment || "No comment"}</p>
                                </div>
                            ))}

                            {reviews.length > 5 && (
                                <div className="flex justify-center pt-2">
                                    <Button variant="outline" onClick={() => setShowAllReviews(!showAllReviews)} className="gap-2">
                                        {showAllReviews ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> View All</>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
