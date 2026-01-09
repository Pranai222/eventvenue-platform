"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { bookingsApi } from "@/lib/api/bookings"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, AlertTriangle, CheckCircle2, XCircle, Coins } from "lucide-react"
import type { Booking } from "@/lib/types/booking"

interface CancelModalState {
  isOpen: boolean
  booking: Booking | null
  step: 'confirm' | 'result'
  isProcessing: boolean
  result?: {
    refundAmount: number
    refundPercentage: number
    pointsRefunded: number
    message: string
  }
}

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAllActive, setShowAllActive] = useState(false)
  const [showAllPast, setShowAllPast] = useState(false)
  const [showAllCancelled, setShowAllCancelled] = useState(false)
  const [conversionRate, setConversionRate] = useState(1) // Admin-set conversion rate
  const [cancelModal, setCancelModal] = useState<CancelModalState>({
    isOpen: false,
    booking: null,
    step: 'confirm',
    isProcessing: false,
  })

  useEffect(() => {
    // Fetch bookings
    bookingsApi
      .getUserBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setIsLoading(false))

    // Fetch conversion rate from admin settings
    adminApi.getConversionRate()
      .then((rate: { pointsPerDollar: number }) => {
        setConversionRate(rate.pointsPerDollar || 1)
        console.log("[Bookings] Conversion rate:", rate.pointsPerDollar)
      })
      .catch((err: Error) => {
        console.error("[Bookings] Failed to fetch conversion rate:", err)
        setConversionRate(1) // Default to 1
      })
  }, [])

  // Sort helper function - newest first
  const sortByNewest = (a: Booking, b: Booking) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  }

  const activeBookings = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")
    .sort(sortByNewest)
  const pastBookings = bookings
    .filter((b) => b.status === "COMPLETED")
    .sort(sortByNewest)
  const cancelledBookings = bookings
    .filter((b) => b.status === "CANCELLED")
    .sort(sortByNewest)

  // Pagination - show only 10 items unless showAll is true
  const ITEMS_PER_PAGE = 10
  const displayedActiveBookings = showAllActive ? activeBookings : activeBookings.slice(0, ITEMS_PER_PAGE)
  const displayedPastBookings = showAllPast ? pastBookings : pastBookings.slice(0, ITEMS_PER_PAGE)
  const displayedCancelledBookings = showAllCancelled ? cancelledBookings : cancelledBookings.slice(0, ITEMS_PER_PAGE)

  const getRefundInfo = (booking: Booking) => {
    const isVenueBooking = booking.venueId !== undefined && booking.venueId !== null
    const bookingDate = new Date(booking.startDate || booking.bookingDate || new Date())
    const today = new Date()
    const daysUntil = Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // NEW REFUND POLICY:
    // Points refund = (refund percentage) × (total booking amount) × (conversion rate)
    // Example: 75% of ₹80 total with rate=1 = 60 points refunded
    // NO cash/PayPal refund - only points based on total value

    if (isVenueBooking) {
      if (daysUntil >= 2) {
        // 100% refund - 2+ days in advance
        const pointsRefund = Math.floor(booking.totalAmount * conversionRate)
        return {
          percentage: 100,
          amount: booking.totalAmount,
          pointsRefund: pointsRefund,
          message: `Cancelling ${daysUntil} days before booking`,
          hasRefund: true
        }
      } else {
        // 75% refund - less than 2 days
        const pointsRefund = Math.floor(booking.totalAmount * 0.75 * conversionRate)
        return {
          percentage: 75,
          amount: booking.totalAmount * 0.75,
          pointsRefund: pointsRefund,
          message: `Cancelling less than 2 days before booking`,
          hasRefund: true
        }
      }
    } else {
      if (daysUntil >= 2) {
        // 100% refund - 2+ days in advance
        const pointsRefund = Math.floor(booking.totalAmount * conversionRate)
        return {
          percentage: 100,
          amount: booking.totalAmount,
          pointsRefund: pointsRefund,
          message: `Cancelling ${daysUntil} days before event`,
          hasRefund: true
        }
      } else {
        // 75% refund - less than 2 days
        const pointsRefund = Math.floor(booking.totalAmount * 0.75 * conversionRate)
        return {
          percentage: 75,
          amount: booking.totalAmount * 0.75,
          pointsRefund: pointsRefund,
          message: `Cancelling less than 2 days before event`,
          hasRefund: true
        }
      }
    }
  }

  const openCancelModal = (booking: Booking) => {
    setCancelModal({
      isOpen: true,
      booking,
      step: 'confirm',
      isProcessing: false,
    })
  }

  const closeCancelModal = () => {
    setCancelModal({
      isOpen: false,
      booking: null,
      step: 'confirm',
      isProcessing: false,
    })
  }

  const processCancellation = async () => {
    if (!cancelModal.booking) return

    setCancelModal(prev => ({ ...prev, isProcessing: true }))

    try {
      const result = await bookingsApi.cancel(cancelModal.booking.id)
      const refundInfo = getRefundInfo(cancelModal.booking)

      setCancelModal(prev => ({
        ...prev,
        step: 'result',
        isProcessing: false,
        result: {
          refundAmount: result.data?.refundAmount || refundInfo.amount,
          refundPercentage: result.data?.refundPercentage || refundInfo.percentage,
          pointsRefunded: refundInfo.pointsRefund,
          message: result.data?.message || 'Booking cancelled successfully'
        }
      }))

      setBookings(bookings.map((b) =>
        b.id === cancelModal.booking?.id ? { ...b, status: "CANCELLED" as const } : b
      ))
    } catch (error) {
      console.error("[EventVenue] Failed to cancel booking:", error)
      setCancelModal(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4 flex-1">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {booking.venueId ? `Venue Booking` : `Event Booking`} #{booking.id}
                  </h3>
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
                <div className="text-right">
                  <p className="text-2xl font-bold">₹{booking.totalAmount.toFixed(2)}</p>
                  {booking.pointsUsed > 0 && (
                    <p className="text-xs text-muted-foreground">{booking.pointsUsed} points used</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(booking.startDate).toLocaleDateString()}
                    {booking.endDate && ` - ${new Date(booking.endDate).toLocaleDateString()}`}
                  </span>
                </div>
                {/* Seat info for seat-selection events */}
                {booking.seatCount && booking.seatCount > 0 && (
                  <div className="flex items-center gap-2 text-primary">
                    <span className="font-medium">{booking.seatCount} seat{booking.seatCount > 1 ? 's' : ''}</span>
                    {booking.seatLabels && (
                      <span className="text-muted-foreground">({booking.seatLabels})</span>
                    )}
                  </div>
                )}
                <p className="text-xs">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-3 mt-4">
                <Link href={`/user/bookings/${booking.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
                {booking.status === "CONFIRMED" && (
                  <Button variant="destructive" size="sm" onClick={() => openCancelModal(booking)}>
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const refundInfo = cancelModal.booking ? getRefundInfo(cancelModal.booking) : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">Manage all your venue and event bookings</p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No active bookings</p>
                <Link href="/venues">
                  <Button>Browse Venues</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {displayedActiveBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
              {activeBookings.length > ITEMS_PER_PAGE && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllActive(!showAllActive)}
                  >
                    {showAllActive ? 'Show Less' : `View All (${activeBookings.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No past bookings</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {displayedPastBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
              {pastBookings.length > ITEMS_PER_PAGE && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllPast(!showAllPast)}
                  >
                    {showAllPast ? 'Show Less' : `View All (${pastBookings.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No cancelled bookings</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {displayedCancelledBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
              {cancelledBookings.length > ITEMS_PER_PAGE && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllCancelled(!showAllCancelled)}
                  >
                    {showAllCancelled ? 'Show Less' : `View All (${cancelledBookings.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancellation Modal */}
      <Dialog open={cancelModal.isOpen} onOpenChange={(open) => !open && closeCancelModal()}>
        <DialogContent className="sm:max-w-md">
          {cancelModal.step === 'confirm' && cancelModal.booking && refundInfo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Cancel Booking
                </DialogTitle>
                <DialogDescription>
                  {cancelModal.booking.venueId ? 'Venue' : 'Event'} Booking #{cancelModal.booking.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Refund Policy Card */}
                <div className={`rounded-lg p-4 ${refundInfo.hasRefund ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {refundInfo.hasRefund ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${refundInfo.hasRefund ? 'text-green-800' : 'text-red-800'}`}>
                        {refundInfo.percentage}% Refund
                      </p>
                      <p className={`text-sm ${refundInfo.hasRefund ? 'text-green-700' : 'text-red-700'}`}>
                        {refundInfo.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Refund Breakdown */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Refund Breakdown</h4>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Original Amount</span>
                    <span className="font-medium">₹{cancelModal.booking.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Refund ({refundInfo.percentage}%)</span>
                    <span className={`font-bold ${refundInfo.hasRefund ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{refundInfo.amount.toFixed(2)}
                    </span>
                  </div>

                  {cancelModal.booking.pointsUsed > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        Points Refund ({refundInfo.percentage}%)
                      </span>
                      <span className={`font-bold ${refundInfo.pointsRefund > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {refundInfo.pointsRefund} pts
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  This action cannot be undone.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={closeCancelModal}>
                  Keep Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={processCancellation}
                  disabled={cancelModal.isProcessing}
                >
                  {cancelModal.isProcessing ? 'Processing...' : 'Confirm Cancellation'}
                </Button>
              </DialogFooter>
            </>
          )}

          {cancelModal.step === 'result' && cancelModal.result && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Booking Cancelled
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium mb-2">Refund Processed</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₹{cancelModal.result.refundAmount.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {cancelModal.result.refundPercentage}% of original amount
                  </p>
                </div>

                {cancelModal.result.pointsRefunded > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-800 font-medium flex items-center justify-center gap-2">
                      <Coins className="h-4 w-4" />
                      Points Refunded
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {cancelModal.result.pointsRefunded} pts
                    </p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground text-center">
                  Refund will be processed within 3-5 business days.
                </p>
              </div>

              <DialogFooter>
                <Button onClick={closeCancelModal} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
