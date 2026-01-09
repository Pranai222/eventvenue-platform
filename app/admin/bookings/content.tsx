"use client"

import { useEffect, useState } from "react"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar, Users, IndianRupee, Search, ChevronDown, ChevronUp } from "lucide-react"
import type { Booking } from "@/lib/types/booking"

const INITIAL_DISPLAY_COUNT = 10

export default function AdminBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    adminApi
      .getAllBookings()
      .then((response) => {
        // Extract data array from response
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        // Sort by most recent first (using id as fallback if no createdAt)
        const sorted = [...data].sort((a: Booking, b: Booking) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a.id
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b.id
          return dateB - dateA
        })
        setBookings(sorted)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.id.toString().includes(searchTerm) || booking.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Limit displayed bookings unless showAll is true or user is searching
  const displayedBookings = searchTerm || showAll
    ? filteredBookings
    : filteredBookings.slice(0, INITIAL_DISPLAY_COUNT)

  const hasMoreBookings = filteredBookings.length > INITIAL_DISPLAY_COUNT

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "default"
      case "PENDING":
        return "secondary"
      case "COMPLETED":
        return "default"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
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
          <h1 className="text-3xl font-bold mb-2">Bookings</h1>
          <p className="text-muted-foreground">View and manage all platform bookings</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{bookings.length}</p>
          <p className="text-sm text-muted-foreground">Total Bookings</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookings by ID or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Showing count info */}
      {!searchTerm && hasMoreBookings && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {showAll ? filteredBookings.length : Math.min(INITIAL_DISPLAY_COUNT, filteredBookings.length)} of {filteredBookings.length} bookings
            {!showAll && " (most recent)"}
          </span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="space-y-4">
        {displayedBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">User ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Booking Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Payment</th>
                </tr>
              </thead>
              <tbody>
                {displayedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">#{booking.id}</td>
                    <td className="py-3 px-4 text-sm">{booking.userId}</td>
                    <td className="py-3 px-4 text-sm">
                      {booking.venueId ? "Venue" : booking.eventId ? "Event" : "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-sm">{new Date(booking.startDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm flex items-center gap-1">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      {booking.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Badge variant={booking.paymentStatus === "COMPLETED" ? "default" : "secondary"}>
                        {booking.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View All / Show Less Button */}
        {!searchTerm && hasMoreBookings && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View All ({filteredBookings.length - INITIAL_DISPLAY_COUNT} more)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-accent/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Confirmed</p>
                <p className="text-2xl font-bold">{bookings.filter((b) => b.status === "CONFIRMED").length}</p>
              </div>
              <Users className="h-8 w-8 text-secondary-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

