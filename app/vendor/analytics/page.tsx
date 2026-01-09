"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api/auth"
import { venuesApi } from "@/lib/api/venues"
import { eventsApi } from "@/lib/api/events"
import { bookingsApi } from "@/lib/api/bookings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Building2,
    Ticket,
    Users,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Coins,
    Wallet
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import type { VenueData } from "@/lib/api/venues"
import type { Event } from "@/lib/types/booking"
import type { BookingData } from "@/lib/api/bookings"

interface VendorProfile {
    id?: number
    email: string
    businessName: string
    status: string
    isVerified: boolean
    points?: number // Points earned from bookings
}

interface RevenueStats {
    allTime: number
    thisMonth: number
    thisWeek: number
    today: number
}

export default function VendorAnalyticsPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<VendorProfile | null>(null)
    const [venues, setVenues] = useState<VenueData[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [bookings, setBookings] = useState<BookingData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { conversionRate, isLoading: rateLoading } = useConversionRate()

    useEffect(() => {
        async function loadData() {
            // Check for auth token first
            const token = localStorage.getItem("auth_token")
            const userStr = localStorage.getItem("auth_user")

            if (!token || !userStr) {
                window.location.href = "/login?role=vendor"
                return
            }

            try {
                const user = JSON.parse(userStr)
                if (user.role !== "VENDOR") {
                    window.location.href = "/login?role=vendor"
                    return
                }
            } catch {
                window.location.href = "/login?role=vendor"
                return
            }

            try {
                const profileResponse = await authApi.getVendorProfile()
                const profileData = profileResponse as VendorProfile
                setProfile(profileData)

                try {
                    const venuesResponse = await venuesApi.getVendorVenues()
                    setVenues(Array.isArray(venuesResponse) ? venuesResponse as any : [])
                } catch (err: any) {
                    console.error("[EventVenue] Failed to fetch venues:", err)
                    setVenues([])
                }

                try {
                    const eventsResponse = await eventsApi.getVendorEvents()
                    setEvents(Array.isArray(eventsResponse) ? eventsResponse : [])
                } catch (err: any) {
                    console.error("[EventVenue] Failed to fetch events:", err)
                    setEvents([])
                }

                try {
                    const bookingsResponse = await bookingsApi.getVendorBookings()
                    console.log("[EventVenue] Bookings raw response:", bookingsResponse)

                    // Handle the response - bookingsApi already converts to Booking type
                    // We need to convert it to BookingData for our component
                    let bookingsList: any[] = []
                    if (Array.isArray(bookingsResponse)) {
                        bookingsList = bookingsResponse
                    } else if (bookingsResponse && typeof bookingsResponse === 'object') {
                        bookingsList = [bookingsResponse]
                    }

                    // Map to BookingData format with proper null checks
                    const cleanedBookings: BookingData[] = bookingsList
                        .filter(b => b && typeof b === 'object' && b.id)
                        .map(booking => ({
                            id: Number(booking.id) || 0,
                            userId: Number(booking.userId) || 0,
                            venueId: booking.venueId ? Number(booking.venueId) : undefined,
                            eventId: booking.eventId ? Number(booking.eventId) : undefined,
                            bookingDate: booking.bookingDate || booking.startDate || new Date().toISOString(),
                            checkInTime: booking.checkInTime,
                            checkOutTime: booking.checkOutTime,
                            durationHours: booking.durationHours ? Number(booking.durationHours) : undefined,
                            totalAmount: Number(booking.totalAmount) || 0,
                            pointsUsed: Number(booking.pointsUsed) || 0,
                            status: booking.status || "PENDING",
                            paymentStatus: booking.paymentStatus || "PENDING",
                            createdAt: booking.createdAt || booking.updatedAt || new Date().toISOString(),
                            updatedAt: booking.updatedAt,
                        }))

                    console.log("[EventVenue] Cleaned bookings:", cleanedBookings)
                    setBookings(cleanedBookings)
                } catch (err: any) {
                    console.error("[EventVenue] Failed to fetch bookings:", err)
                    setBookings([])
                }
            } catch (error: any) {
                setError(error.message || "Failed to load analytics")
                if (error.statusCode === 401) {
                    localStorage.removeItem("auth_token")
                    localStorage.removeItem("auth_user")
                    router.push("/login?role=vendor")
                }
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [router])

    // Calculate revenue statistics
    const calculateRevenue = (): RevenueStats => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const confirmedBookings = bookings.filter(
            (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
        )

        return {
            allTime: confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0),
            thisMonth: confirmedBookings
                .filter((b) => b.createdAt && new Date(b.createdAt) >= startOfMonth)
                .reduce((sum, b) => sum + Number(b.totalAmount), 0),
            thisWeek: confirmedBookings
                .filter((b) => b.createdAt && new Date(b.createdAt) >= startOfWeek)
                .reduce((sum, b) => sum + Number(b.totalAmount), 0),
            today: confirmedBookings
                .filter((b) => b.createdAt && new Date(b.createdAt) >= startOfDay)
                .reduce((sum, b) => sum + Number(b.totalAmount), 0),
        }
    }

    // Calculate booking statistics
    const bookingStats = {
        total: bookings.length,
        confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
        pending: bookings.filter((b) => b.status === "PENDING").length,
        completed: bookings.filter((b) => b.status === "COMPLETED").length,
        cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    }

    // Get top performing venues
    const topVenues = venues
        .map((venue) => ({
            ...venue,
            bookingCount: bookings.filter((b) => b.venueId === venue.id).length,
            revenue: bookings
                .filter((b) => b.venueId === venue.id && (b.status === "CONFIRMED" || b.status === "COMPLETED"))
                .reduce((sum, b) => sum + Number(b.totalAmount), 0),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

    const revenue = calculateRevenue()

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="h-32 bg-muted rounded"></div>
                        <div className="h-32 bg-muted rounded"></div>
                        <div className="h-32 bg-muted rounded"></div>
                        <div className="h-32 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                <p className="text-muted-foreground">
                    Track your business performance and revenue
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Points Balance - Prominent Card with Payout Request */}
            <Card className="border-2 border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">Your Points Balance</CardTitle>
                    <Wallet className="h-6 w-6 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <div className="text-4xl font-bold text-green-600">
                                <Coins className="inline h-8 w-8 mr-2" />
                                {(profile?.points || 0).toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Points earned from bookings
                            </p>
                        </div>
                        <div className="text-right md:text-center px-4 py-2 bg-white/50 rounded-lg">
                            <p className="text-3xl font-bold text-green-700">
                                ₹{((profile?.points || 0) / conversionRate).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Equivalent Cash Value</p>
                        </div>
                        <div className="md:ml-4">
                            <Button
                                size="lg"
                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white gap-2"
                                onClick={() => {
                                    const points = profile?.points || 0;
                                    const cashValue = (points / conversionRate).toFixed(2);
                                    const subject = encodeURIComponent(`Payout Request - ${points} Points (₹${cashValue})`);
                                    const body = encodeURIComponent(
                                        `Hello Admin,\n\nI would like to request a payout for my vendor points.\n\n` +
                                        `Vendor: ${profile?.businessName || 'N/A'}\n` +
                                        `Email: ${profile?.email || 'N/A'}\n` +
                                        `Points: ${points.toLocaleString()}\n` +
                                        `Cash Value: ₹${cashValue} (at ${conversionRate} points = ₹1)\n\n` +
                                        `Please process this payout request at your earliest convenience.\n\nThank you!`
                                    );
                                    window.location.href = `mailto:admin@eventvenue.com?subject=${subject}&body=${body}`;
                                }}
                                disabled={(profile?.points || 0) === 0}
                            >
                                <DollarSign className="h-5 w-5" />
                                Request Payout
                            </Button>
                        </div>
                    </div>

                    {/* Conversion Rate Info */}
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Conversion Rate</span>
                        <span className="text-lg font-semibold text-primary">{conversionRate} pts = ₹1.00</span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                        💡 Points are automatically credited when users book your events/venues.
                        Click "Request Payout" to contact admin and convert your points to real money.
                    </p>
                </CardContent>
            </Card>

            {/* Revenue Overview */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Revenue Overview</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">All Time Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{revenue.allTime.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Total earnings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{revenue.thisMonth.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Last 30 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Week</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{revenue.thisWeek.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Last 7 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today</CardTitle>
                            <DollarSign className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{revenue.today.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Today's earnings</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Business Statistics */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Business Statistics</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                            <Building2 className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{venues.length + events.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {venues.length} Venues, {events.length} Events
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <Users className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{bookingStats.total}</div>
                            <p className="text-xs text-muted-foreground">All time bookings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ₹{bookingStats.total > 0 ? (revenue.allTime / bookingStats.total).toFixed(2) : "0.00"}
                            </div>
                            <p className="text-xs text-muted-foreground">Per booking</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Booking Status Breakdown */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Booking Status</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{bookingStats.confirmed}</div>
                            <p className="text-xs text-muted-foreground">Active bookings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{bookingStats.pending}</div>
                            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{bookingStats.completed}</div>
                            <p className="text-xs text-muted-foreground">Past bookings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{bookingStats.cancelled}</div>
                            <p className="text-xs text-muted-foreground">Cancelled bookings</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Platform Charges History */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Platform Charges History</h2>
                <Card className="border-2 border-orange-200 dark:border-orange-800/50 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-orange-600" />
                            Your Platform Fee Summary
                        </CardTitle>
                        <CardDescription>
                            Points deducted for creating venues and events
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Building2 className="h-6 w-6 text-orange-600" />
                                    <span className="font-semibold">Venue Creation</span>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">{venues.length * 10} pts</p>
                                <p className="text-xs text-muted-foreground">{venues.length} venues × 10 pts each</p>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Ticket className="h-6 w-6 text-orange-600" />
                                    <span className="font-semibold">Event Creation</span>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">
                                    {events.reduce((sum, e) => sum + ((e as any).bookingType === 'SEAT_SELECTION' ? 20 : 10), 0)} pts
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {events.filter(e => (e as any).bookingType !== 'SEAT_SELECTION').length} qty × 10 + {events.filter(e => (e as any).bookingType === 'SEAT_SELECTION').length} seat × 20
                                </p>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Coins className="h-6 w-6 text-red-600" />
                                    <span className="font-semibold">Total Spent</span>
                                </div>
                                <p className="text-2xl font-bold text-red-600">
                                    {(venues.length * 10) + events.reduce((sum, e) => sum + ((e as any).bookingType === 'SEAT_SELECTION' ? 20 : 10), 0)} pts
                                </p>
                                <p className="text-xs text-muted-foreground">All platform charges</p>
                            </div>
                        </div>

                        {/* Fee Structure Info */}
                        <div className="bg-muted/50 p-4 rounded-lg border">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                Platform Fee Structure
                            </h4>
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                                    <span className="text-muted-foreground">Create Venue</span>
                                    <Badge variant="outline" className="border-orange-500 text-orange-600">10 Points</Badge>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                                    <span className="text-muted-foreground">Event (Quantity)</span>
                                    <Badge variant="outline" className="border-orange-500 text-orange-600">10 Points</Badge>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                                    <span className="text-muted-foreground">Event (Seat-based)</span>
                                    <Badge variant="outline" className="border-orange-500 text-orange-600">20 Points</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Logs */}
                        <div className="mt-4 bg-white dark:bg-gray-900 rounded-xl border p-4">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-orange-600" />
                                Transaction Logs
                            </h4>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {/* Venue Creation Logs */}
                                {venues.map((venue) => (
                                    <div key={`venue-${venue.id}`} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4 text-orange-600" />
                                            <div>
                                                <p className="font-medium text-sm">{venue.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Venue Created • {venue.createdAt ? new Date(venue.createdAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-orange-500 text-orange-600">-10 pts</Badge>
                                    </div>
                                ))}

                                {/* Event Creation Logs */}
                                {events.map((event) => (
                                    <div key={`event-${event.id}`} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <div className="flex items-center gap-3">
                                            <Ticket className="h-4 w-4 text-orange-600" />
                                            <div>
                                                <p className="font-medium text-sm">{event.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Event ({(event as any).bookingType === 'SEAT_SELECTION' ? 'Seat' : 'Qty'}) • {(event as any).createdAt ? new Date((event as any).createdAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                                            -{(event as any).bookingType === 'SEAT_SELECTION' ? 20 : 10} pts
                                        </Badge>
                                    </div>
                                ))}

                                {venues.length === 0 && events.length === 0 && (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <p className="text-sm">No platform fee transactions yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performing Venues */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Venues</CardTitle>
                    <CardDescription>Your highest revenue-generating venues</CardDescription>
                </CardHeader>
                <CardContent>
                    {topVenues.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No venue data available yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topVenues.map((venue, index) => (
                                <div
                                    key={venue.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{venue.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {venue.bookingCount} bookings
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">₹{venue.revenue.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">Total revenue</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>Latest booking activity</CardDescription>
                </CardHeader>
                <CardContent>
                    {bookings.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No bookings yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bookings.slice(0, 5).map((booking) => (
                                <div
                                    key={booking.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                    <div>
                                        <p className="font-medium text-sm">Booking #{booking.id}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'} at{" "}
                                            {booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-medium">₹{Number(booking.totalAmount).toFixed(2)}</p>
                                        <Badge
                                            variant={
                                                booking.status === "CONFIRMED"
                                                    ? "default"
                                                    : booking.status === "PENDING"
                                                        ? "secondary"
                                                        : booking.status === "COMPLETED"
                                                            ? "outline"
                                                            : "destructive"
                                            }
                                        >
                                            {booking.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
