"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { bookingsApi } from "@/lib/api/bookings"
import { venuesApi } from "@/lib/api/venues"
import { eventsApi } from "@/lib/api/events"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar, IndianRupee, User, Mail, Building2, Ticket, Coins,
  ChevronDown, ChevronUp, Search, Filter, X, SlidersHorizontal
} from "lucide-react"
import type { Booking, Venue, Event } from "@/lib/types/booking"

const INITIAL_DISPLAY = 10

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "venue" | "event">("all")
  const [filterVenueId, setFilterVenueId] = useState<string>("all")
  const [filterEventId, setFilterEventId] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const bookingsData = await bookingsApi.getVendorBookings()
        const sortedBookings = [...bookingsData].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        setBookings(sortedBookings)

        const [venuesData, eventsData] = await Promise.all([
          venuesApi.getVendorVenues(),
          eventsApi.getVendorEvents()
        ])
        setVenues(venuesData)
        setEvents(eventsData)
      } catch (err) {
        console.error("Failed to load bookings:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const getUserName = (booking: Booking): string => {
    if (booking.userName) return booking.userName
    return `User #${booking.userId}`
  }

  const getUserEmail = (booking: Booking): string => {
    return booking.userEmail || ''
  }

  const getVenueName = (venueId: number): string => {
    return venues.find(v => v.id === venueId)?.name || `Venue #${venueId}`
  }

  const getEventName = (eventId: number): string => {
    return events.find(e => e.id === eventId)?.name || `Event #${eventId}`
  }

  const getBookingName = (booking: Booking): string => {
    if (booking.venueId) return getVenueName(booking.venueId)
    if (booking.eventId) return getEventName(booking.eventId)
    return "Unknown"
  }

  // Filter bookings based on search and filters
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Type filter
      if (filterType === "venue" && !booking.venueId) return false
      if (filterType === "event" && !booking.eventId) return false

      // Specific venue filter
      if (filterVenueId !== "all" && booking.venueId !== Number(filterVenueId)) return false

      // Specific event filter
      if (filterEventId !== "all" && booking.eventId !== Number(filterEventId)) return false

      // Search term (search by venue/event name or user name)
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const venueName = booking.venueId ? getVenueName(booking.venueId).toLowerCase() : ""
        const eventName = booking.eventId ? getEventName(booking.eventId).toLowerCase() : ""
        const userName = getUserName(booking).toLowerCase()
        const userEmail = getUserEmail(booking).toLowerCase()

        if (!venueName.includes(search) && !eventName.includes(search) &&
          !userName.includes(search) && !userEmail.includes(search)) {
          return false
        }
      }

      return true
    })
  }, [bookings, searchTerm, filterType, filterVenueId, filterEventId, venues, events])

  // Calculate counts based on filtered bookings
  const pendingBookings = filteredBookings.filter((b) => b.status === "PENDING")
  const confirmedBookings = filteredBookings.filter((b) => b.status === "CONFIRMED")
  const completedBookings = filteredBookings.filter((b) => b.status === "COMPLETED")
  const cancelledBookings = filteredBookings.filter((b) => b.status === "CANCELLED")

  const hasActiveFilters = searchTerm || filterType !== "all" || filterVenueId !== "all" || filterEventId !== "all"

  const clearFilters = () => {
    setSearchTerm("")
    setFilterType("all")
    setFilterVenueId("all")
    setFilterEventId("all")
  }

  const activeFilterCount = [
    searchTerm,
    filterType !== "all",
    filterVenueId !== "all",
    filterEventId !== "all"
  ].filter(Boolean).length

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${booking.venueId
                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                : "bg-gradient-to-br from-purple-500 to-purple-600"
              }`}>
              {booking.venueId ? (
                <Building2 className="h-6 w-6 text-white" />
              ) : (
                <Ticket className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {/* Venue/Event Name - Prominent */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {booking.venueId ? (
                  <Link href={`/vendor/venues/${booking.venueId}/analytics`} className="hover:underline">
                    <h3 className="font-bold text-lg text-blue-600 hover:text-blue-700 truncate">
                      {getVenueName(booking.venueId)}
                    </h3>
                  </Link>
                ) : (
                  <Link href={`/vendor/events/${booking.eventId}/analytics`} className="hover:underline">
                    <h3 className="font-bold text-lg text-purple-600 hover:text-purple-700 truncate">
                      {getEventName(booking.eventId!)}
                    </h3>
                  </Link>
                )}
                <Badge
                  variant={
                    booking.status === "CONFIRMED" ? "default" :
                      booking.status === "PENDING" ? "secondary" :
                        booking.status === "CANCELLED" ? "destructive" : "outline"
                  }
                  className="text-xs"
                >
                  {booking.status}
                </Badge>
              </div>

              {/* User Info - Clean inline display */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{getUserName(booking)}</span>
                </div>
                {getUserEmail(booking) && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{getUserEmail(booking)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Date info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Booked: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}</span>
                <span>•</span>
                <span>Date: {new Date(booking.startDate || booking.bookingDate).toLocaleDateString()}</span>
                {booking.quantity && booking.quantity > 1 && (
                  <>
                    <span>•</span>
                    <span>{booking.quantity} tickets</span>
                  </>
                )}
              </div>
            </div>

            {/* Amount Section */}
            <div className="text-right space-y-1 flex-shrink-0">
              <div className="flex items-center gap-1 text-xl font-bold text-green-600 justify-end">
                <IndianRupee className="h-4 w-4" />
                {booking.totalAmount?.toLocaleString() || '0'}
              </div>
              {booking.pointsUsed > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600 justify-end">
                  <Coins className="h-3.5 w-3.5" />
                  {booking.pointsUsed} pts
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderBookingList = (bookingList: Booking[], emptyMessage: string) => {
    if (bookingList.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">{emptyMessage}</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters to see all bookings
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    const displayedBookings = showAll ? bookingList : bookingList.slice(0, INITIAL_DISPLAY)

    return (
      <div className="space-y-3">
        {displayedBookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}

        {bookingList.length > INITIAL_DISPLAY && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => setShowAll(!showAll)} className="gap-2 px-6">
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View All ({bookingList.length - INITIAL_DISPLAY} more)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bookings</h1>
        <p className="text-muted-foreground">View and manage customer bookings for your venues and events</p>
      </div>

      {/* Search & Filter Section */}
      <Card className="mb-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
        <CardContent className="p-4">
          {/* Main Search Bar */}
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by venue, event, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-background"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 h-11"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
              {/* Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Booking Type</label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | "venue" | "event")}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="venue">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Venues Only
                      </div>
                    </SelectItem>
                    <SelectItem value="event">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-purple-600" />
                        Events Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Venue Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Specific Venue</label>
                <Select value={filterVenueId} onValueChange={setFilterVenueId} disabled={filterType === "event"}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Venues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Venues</SelectItem>
                    {venues.map(venue => (
                      <SelectItem key={venue.id} value={venue.id.toString()}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Specific Event</label>
                <Select value={filterEventId} onValueChange={setFilterEventId} disabled={filterType === "venue"}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchTerm}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {filterType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {filterType === "venue" ? "Venues" : "Events"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterType("all")} />
                  </Badge>
                )}
                {filterVenueId !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Venue: {venues.find(v => v.id === Number(filterVenueId))?.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterVenueId("all")} />
                  </Badge>
                )}
                {filterEventId !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Event: {events.find(e => e.id === Number(filterEventId))?.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterEventId("all")} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{pendingBookings.length}</div>
            <p className="text-sm text-amber-700 dark:text-amber-300">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{confirmedBookings.length}</div>
            <p className="text-sm text-green-700 dark:text-green-300">Confirmed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{completedBookings.length}</div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{cancelledBookings.length}</div>
            <p className="text-sm text-red-700 dark:text-red-300">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-background">
            All ({filteredBookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-background">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="data-[state=active]:bg-background">
            Confirmed ({confirmedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-background">
            Completed ({completedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-background">
            Cancelled ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderBookingList(filteredBookings, "No bookings yet")}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {renderBookingList(pendingBookings, "No pending bookings")}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {renderBookingList(confirmedBookings, "No confirmed bookings")}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {renderBookingList(completedBookings, "No completed bookings")}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {renderBookingList(cancelledBookings, "No cancelled bookings")}
        </TabsContent>
      </Tabs>
    </div>
  )
}
