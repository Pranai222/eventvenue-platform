"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { authApi } from "@/lib/api/auth"
import { bookingsApi, type BookingData } from "@/lib/api/bookings"
import { venuesApi, type VenueData } from "@/lib/api/venues"
import { eventsApi } from "@/lib/api/events"
import type { Event } from "@/lib/types/booking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, Calendar, MapPin, TrendingUp, ArrowRight, Ticket, Star, Sparkles } from "lucide-react"

interface UserProfile {
  id?: number
  userId?: number
  email: string
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
  points?: number
  role?: string
}

export default function UserDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { conversionRate } = useConversionRate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [featuredVenues, setFeaturedVenues] = useState<VenueData[]>([])
  const [topVenues, setTopVenues] = useState<VenueData[]>([])
  const [topEvents, setTopEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    async function loadData() {
      try {
        console.log("[EventVenue] UserDashboard - Loading data for user:", user?.email)

        const profileResponse = await authApi.getUserProfile()
        const profileData = profileResponse as UserProfile
        console.log("[EventVenue] UserDashboard - Profile loaded:", profileData.email)
        setProfile(profileData)

        const bookingsData = await bookingsApi.getUserBookings()
        console.log("[EventVenue] UserDashboard - Bookings loaded:", bookingsData.length)
        setBookings(Array.isArray(bookingsData) ? bookingsData.slice(0, 3) as any : [])

        const venuesData = await venuesApi.getAll()
        console.log("[EventVenue] UserDashboard - Venues loaded:", venuesData.length)
        setFeaturedVenues(Array.isArray(venuesData) ? venuesData.slice(0, 3) as any : [])

        // Get top-rated venues (sorted by rating descending)
        const sortedVenues = Array.isArray(venuesData)
          ? [...venuesData].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3) as any
          : []
        setTopVenues(sortedVenues)

        // Load and get top-rated events
        try {
          const eventsData = await eventsApi.getActive()
          const sortedEvents = Array.isArray(eventsData)
            ? [...eventsData].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3)
            : []
          setTopEvents(sortedEvents)
        } catch (e) {
          console.log("[EventVenue] Failed to load events:", e)
          setTopEvents([])
        }
      } catch (error: any) {
        console.error("[EventVenue] UserDashboard - Error loading data:", error)
        const errorMessage = error?.message || "Failed to load dashboard data"
        setError(errorMessage)

        if (error.statusCode === 401) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_user")
          router.replace("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, router])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const points = profile?.points || 0
  const pointsValue = points / conversionRate
  const userName = profile?.firstName || profile?.username || "User"

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your bookings</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
            <Coins className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{points.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Worth ₹{pointsValue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING").length}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Suggestions Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-2xl font-semibold">Top Suggestions</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Rated Venues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-4 w-4 text-primary" />
                Top Rated Venues
              </CardTitle>
              <CardDescription>Highest rated venues for your next event</CardDescription>
            </CardHeader>
            <CardContent>
              {topVenues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No venues available</p>
              ) : (
                <div className="space-y-3">
                  {topVenues.map((venue) => (
                    <Link key={venue.id} href={`/venues/${venue.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{venue.name}</p>
                          <p className="text-xs text-muted-foreground">{venue.city}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-sm font-medium">{(venue.rating || 0).toFixed(1)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">₹{venue.pricePerHour}/hr</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Rated Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ticket className="h-4 w-4 text-primary" />
                Top Rated Events
              </CardTitle>
              <CardDescription>Popular events happening soon</CardDescription>
            </CardHeader>
            <CardContent>
              {topEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No events available</p>
              ) : (
                <div className="space-y-3">
                  {topEvents.map((event) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground">{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date not set'}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-sm font-medium">{(event.rating || 0).toFixed(1)}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">₹{event.pricePerTicket}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent Bookings</h2>
          <Link href="/user/bookings">
            <Button variant="ghost" size="sm" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No bookings yet</p>
              <Link href="/venues">
                <Button>Browse Venues</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        {booking.venueId ? `Venue Booking #${booking.id}` : `Event Booking #${booking.id}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge
                          variant={
                            booking.status === "CONFIRMED"
                              ? "default"
                              : booking.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {booking.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">₹{booking.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/user/bookings/${booking.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Featured Venues</h2>
          <Link href="/venues">
            <Button variant="ghost" size="sm" className="gap-2">
              Explore All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredVenues.map((venue) => {
            const location = venue.city || venue.address || "Location not specified"
            const images =
              venue.images && typeof venue.images === "string" ? venue.images.split(",").filter(Boolean) : []

            return (
              <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="aspect-video bg-muted relative">
                  <img
                    src={images[0] || `/placeholder.svg?height=200&width=400&query=venue`}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 right-3">Featured</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">₹{venue.pricePerHour}</p>
                      <p className="text-xs text-muted-foreground">per hour</p>
                    </div>
                    <Link href={`/venues/${venue.id}`}>
                      <Button size="sm">Book Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
