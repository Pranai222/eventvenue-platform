"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api/auth"
import { venuesApi } from "@/lib/api/venues"
import { eventsApi } from "@/lib/api/events"
import { bookingsApi } from "@/lib/api/bookings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Ticket, Calendar, DollarSign, Plus, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Venue, Event, Booking } from "@/lib/types/booking"

interface VendorProfile {
  id?: number
  email: string
  businessName: string
  status: string
  isVerified: boolean
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      // Check for auth token first
      const token = localStorage.getItem("auth_token")
      const userStr = localStorage.getItem("auth_user")

      if (!token || !userStr) {
        router.push("/login?role=vendor")
        return
      }

      try {
        const user = JSON.parse(userStr)
        if (user.role !== "VENDOR") {
          router.push("/login?role=vendor")
          return
        }
      } catch {
        router.push("/login?role=vendor")
        return
      }

      try {
        const profileResponse = await authApi.getVendorProfile()
        const profileData = profileResponse as VendorProfile
        setProfile(profileData)

        try {
          const venuesResponse = await venuesApi.getVendorVenues()
          const venuesData = Array.isArray(venuesResponse) ? venuesResponse : []
          // Sort by ID descending to show recently added venues on top
          setVenues([...venuesData].sort((a, b) => b.id - a.id))
        } catch (err: any) {
          setVenues([])
        }

        try {
          const eventsResponse = await eventsApi.getVendorEvents()
          const eventsData = Array.isArray(eventsResponse) ? eventsResponse : []
          // Sort by ID descending to show recently added events on top
          setEvents([...eventsData].sort((a, b) => b.id - a.id))
        } catch (err: any) {
          setEvents([])
        }

        try {
          const bookingsResponse = await bookingsApi.getVendorBookings()
          const bookingsData = Array.isArray(bookingsResponse) ? bookingsResponse : []
          // Sort by createdAt descending to show recent activity on top (handle undefined createdAt)
          setBookings(bookingsData.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
          }))
        } catch (err: any) {
          setBookings([])
        }
      } catch (error: any) {
        setError(error.message || "Failed to load dashboard")
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

  const totalRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalAmount), 0)

  const activeBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.businessName}!</h1>
        <p className="text-muted-foreground">Manage your venues, events, and bookings</p>
      </div>

      {profile && !profile.isVerified && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Email Not Verified</AlertTitle>
          <AlertDescription>
            Please check your email for verification link to complete your account setup.
          </AlertDescription>
        </Alert>
      )}

      {profile?.status === "PENDING" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account Pending Admin Approval</AlertTitle>
          <AlertDescription>
            Your vendor account is currently awaiting admin approval. You can create venues and events, but they won't
            be visible to users until your account is approved. We typically review applications within 24-48 hours.
          </AlertDescription>
        </Alert>
      )}

      {profile?.status === "REJECTED" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account Rejected</AlertTitle>
          <AlertDescription>
            Your vendor account has been rejected. Please contact support for more information about why and how to
            appeal this decision.
          </AlertDescription>
        </Alert>
      )}

      {profile?.status === "APPROVED" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Account Approved</AlertTitle>
          <AlertDescription className="text-green-800">
            Your vendor account is approved! Your venues and events are now visible to users.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings.length}</div>
            <p className="text-xs text-muted-foreground">Current reservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Venues</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{venues.length}</div>
            <p className="text-xs text-muted-foreground">Listed properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Events</CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">Total events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your vendor account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/vendor/venues/new">
              <Button className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Add New Venue
              </Button>
            </Link>
            <Link href="/vendor/events/new">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Create New Event
              </Button>
            </Link>
            <Link href="/vendor/bookings">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                View All Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your listings</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">Booking #{booking.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "CONFIRMED"
                          ? "default"
                          : booking.status === "PENDING"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Listings</h2>
          <div className="flex gap-2">
            <Link href="/vendor/venues">
              <Button variant="outline" size="sm">
                View All Venues
              </Button>
            </Link>
            <Link href="/vendor/events">
              <Button variant="outline" size="sm">
                View All Events
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Venues</CardTitle>
            </CardHeader>
            <CardContent>
              {venues.length === 0 ? (
                <div className="text-center py-6">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">No venues yet</p>
                  <Link href="/vendor/venues/new">
                    <Button size="sm">Add Your First Venue</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {venues.slice(0, 3).map((venue) => (
                    <div key={venue.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{venue.name}</p>
                        <p className="text-xs text-muted-foreground">₹{venue.pricePerDay}/day</p>
                      </div>
                      <Link href={`/vendor/venues/${venue.id}`}>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-6">
                  <Ticket className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">No events yet</p>
                  <Link href="/vendor/events/new">
                    <Button size="sm">Create Your First Event</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Ticket className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>{event.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
