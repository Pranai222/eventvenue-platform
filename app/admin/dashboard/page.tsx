"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { adminApi } from "@/lib/api/admin"
import { venuesApi } from "@/lib/api/venues"
import { eventsApi } from "@/lib/api/events"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, Calendar, DollarSign, TrendingUp, AlertCircle, Ticket, Clock } from "lucide-react"
import type { SystemStats } from "@/lib/api/admin"
import type { Venue, Event } from "@/lib/types/booking"

interface BookingData {
  id: number
  userId: number
  venueId?: number
  eventId?: number
  totalAmount: number
  status: string
  createdAt: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<BookingData[]>([])
  const [recentVenues, setRecentVenues] = useState<Venue[]>([])
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load stats
        const statsData = await adminApi.getStats()
        setStats(statsData)

        // Load recent bookings
        try {
          const bookingsResponse = await adminApi.getAllBookings()
          const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : (bookingsResponse as any)?.data || []
          // Sort by createdAt descending and take top 3 for display
          const sortedBookings = bookings
            .sort((a: BookingData, b: BookingData) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
          setRecentBookings(sortedBookings)
        } catch (e) {
          console.error("Failed to load bookings:", e)
        }

        // Load recent venues
        try {
          const venues = await venuesApi.getAll()
          // Sort by most recent (assuming higher ID = more recent) and take top 3
          const sortedVenues = venues.sort((a, b) => b.id - a.id).slice(0, 3)
          setRecentVenues(sortedVenues)
        } catch (e) {
          console.error("Failed to load venues:", e)
        }

        // Load recent events
        try {
          const events = await eventsApi.getAll()
          // Sort by most recent and take top 3
          const sortedEvents = events.sort((a, b) => b.id - a.id).slice(0, 3)
          setRecentEvents(sortedEvents)
        } catch (e) {
          console.error("Failed to load events:", e)
        }
      } catch (error) {
        console.error("Failed to load admin data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    return `${diffDays} days ago`
  }

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage the EventVenue platform</p>
      </div>

      {/* Pending Actions Alert */}
      {stats && stats.pendingVendors > 0 && (
        <Card className="border-accent bg-accent/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium">Action Required</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingVendors} vendor{stats.pendingVendors > 1 ? "s" : ""} pending approval
                </p>
              </div>
            </div>
            <Link href="/admin/vendors">
              <Button variant="outline">Review Now</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVendors || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.pendingVendors || 0} pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Current reservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Platform earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
            <Building2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentVenues.length > 0 ? "Active" : "0"}</div>
            <p className="text-xs text-muted-foreground">Listed venues</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Bookings */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/vendors">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Building2 className="h-4 w-4" />
                Review Pending Vendors
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/bookings">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                View All Bookings
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <DollarSign className="h-4 w-4" />
                Update Points Rate
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">
                        {booking.venueId ? "Venue" : "Event"} Booking #{booking.id}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(booking.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹{Number(booking.totalAmount).toFixed(2)}</p>
                      <Badge variant={booking.status === "CONFIRMED" ? "default" : booking.status === "CANCELLED" ? "destructive" : "secondary"} className="text-xs">
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {recentBookings.length > 0 && (
              <Link href="/admin/bookings" className="block mt-4">
                <Button variant="outline" className="w-full">
                  View All Bookings
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Venues & Events */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Recent Venues
            </CardTitle>
            <CardDescription>Recently added venues</CardDescription>
          </CardHeader>
          <CardContent>
            {recentVenues.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No venues yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentVenues.map((venue) => (
                  <div key={venue.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{venue.name}</p>
                      <p className="text-xs text-muted-foreground">{venue.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹{venue.pricePerHour}/hr</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Recent Events
            </CardTitle>
            <CardDescription>Recently added events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date set'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹{event.pricePerTicket}</p>
                      <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"} className="text-xs">
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

