"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { bookingsApi } from "@/lib/api/bookings"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, DollarSign, Coins, ArrowLeft, AlertCircle, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import type { Booking } from "@/lib/types/booking"

interface CancelModalState {
  isOpen: boolean
  step: 'confirm' | 'result'
  isProcessing: boolean
  result?: {
    refundAmount: number
    refundPercentage: number
    pointsRefunded: number
    message: string
  }
}

export default function BookingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = Number(params.id)
  const { conversionRate } = useConversionRate()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState<CancelModalState>({
    isOpen: false,
    step: 'confirm',
    isProcessing: false,
  })

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const data = await bookingsApi.getById(bookingId)
        setBooking(data)
      } catch (error) {
        console.error("[EventVenue] Failed to load booking:", error)
        router.push("/user/bookings")
      } finally {
        setIsLoading(false)
      }
    }
    loadBooking()
  }, [bookingId, router])

  // Get refund info based on days until booking
  // NEW POLICY: Points refund = (percentage) × (total amount) × (conversion rate)
  // Example: 75% of ₹80 total with rate=1 = 60 points refunded
  // NO cash/PayPal refund - only points based on total value
  const getRefundInfo = () => {
    if (!booking) return null

    const isVenueBooking = booking.venueId !== undefined && booking.venueId !== null
    const bookingDate = new Date(booking.startDate || booking.bookingDate || new Date())
    const today = new Date()
    const daysUntil = Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil >= 2) {
      // 100% refund - 2+ days in advance
      const pointsRefund = Math.floor(booking.totalAmount * conversionRate)
      return {
        percentage: 100,
        amount: booking.totalAmount,
        pointsRefund: pointsRefund,
        message: `Cancelling ${daysUntil} days before ${isVenueBooking ? 'booking' : 'event'}`,
        hasRefund: true
      }
    } else {
      // 75% refund - less than 2 days
      const pointsRefund = Math.floor(booking.totalAmount * 0.75 * conversionRate)
      return {
        percentage: 75,
        amount: booking.totalAmount * 0.75,
        pointsRefund: pointsRefund,
        message: `Cancelling less than 2 days before ${isVenueBooking ? 'booking' : 'event'}`,
        hasRefund: true
      }
    }
  }

  const openCancelModal = () => {
    setCancelModal({
      isOpen: true,
      step: 'confirm',
      isProcessing: false,
    })
  }

  const closeCancelModal = () => {
    setCancelModal({
      isOpen: false,
      step: 'confirm',
      isProcessing: false,
    })
  }

  const processCancellation = async () => {
    if (!booking) return

    setCancelModal(prev => ({ ...prev, isProcessing: true }))

    try {
      const result = await bookingsApi.cancel(bookingId)
      const refundInfo = getRefundInfo()

      setCancelModal(prev => ({
        ...prev,
        step: 'result',
        isProcessing: false,
        result: {
          refundAmount: result.data?.refundAmount || refundInfo?.amount || 0,
          refundPercentage: result.data?.refundPercentage || refundInfo?.percentage || 0,
          pointsRefunded: refundInfo?.pointsRefund || 0,
          message: result.data?.message || 'Booking cancelled successfully'
        }
      }))

      setBooking(prev => prev ? { ...prev, status: "CANCELLED" } : null)
    } catch (error) {
      console.error("[EventVenue] Failed to cancel booking:", error)
      setCancelModal(prev => ({ ...prev, isProcessing: false }))
      alert("Failed to cancel booking")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Booking not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusColor = {
    PENDING: "secondary",
    CONFIRMED: "default",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  } as const

  const refundInfo = getRefundInfo()
  // Backend stores totalAmount as the ORIGINAL booking price (before any discount)
  // pointsUsed = actual points used, so discount = pointsUsed / conversionRate
  const pointsDiscount = (booking.pointsUsed || 0) / conversionRate
  const subtotal = booking.totalAmount  // This IS the original price
  const finalPaid = Math.max(0, subtotal - pointsDiscount)  // What was actually paid

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
          <p className="text-muted-foreground">Booking #{booking.id}</p>
        </div>

        {/* Status Alert */}
        <Card className={booking.status === "CONFIRMED" ? "border-green-200 bg-green-50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>
                  {booking.status === "CONFIRMED" && "Your booking is confirmed"}
                  {booking.status === "PENDING" && "Your booking is pending approval"}
                  {booking.status === "COMPLETED" && "Your booking has been completed"}
                  {booking.status === "CANCELLED" && "Your booking has been cancelled"}
                </CardDescription>
              </div>
              <Badge variant={statusColor[booking.status]}>{booking.status}</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Booking Type</h3>
                <p className="text-muted-foreground">{booking.venueId ? `Venue Booking` : `Event Booking`}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Booking Date</h3>
                <p className="text-muted-foreground">
                  {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Check-in
                </h3>
                <p className="text-muted-foreground">
                  {new Date(booking.startDate).toLocaleDateString()}
                  {booking.checkInTime && ` at ${booking.checkInTime}`}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Check-out
                </h3>
                <p className="text-muted-foreground">
                  {booking.endDate
                    ? new Date(booking.endDate).toLocaleDateString()
                    : new Date(booking.startDate).toLocaleDateString()}
                  {booking.checkOutTime && ` at ${booking.checkOutTime}`}
                </p>
              </div>
            </div>

            {booking.durationHours && (
              <div>
                <h3 className="font-semibold mb-2">Duration</h3>
                <p className="text-muted-foreground">
                  {booking.durationHours} hour{booking.durationHours !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Ticket/Seat Information for Event Bookings */}
            {booking.eventId && (
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                {/* Combined Ticket & Seat info */}
                {booking.seatLabels ? (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold mb-2">Tickets & Seats</h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground">
                        {booking.quantity || booking.seatCount} ticket{(booking.quantity || booking.seatCount) !== 1 ? 's' : ''} confirmed
                      </p>
                      <p className="text-primary font-medium flex items-center gap-2">
                        <span className="text-muted-foreground font-normal">Seat Numbers:</span>
                        {booking.seatLabels}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Regular quantity-based event */
                  booking.quantity && booking.quantity > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tickets</h3>
                      <p className="text-muted-foreground">
                        {booking.quantity} ticket{booking.quantity !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown - Dynamic conversion rate */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Subtotal</span>
              </div>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>

            {booking.pointsUsed > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-accent" />
                  <span>Points Discount</span>
                </div>
                <span className="font-semibold">-₹{pointsDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-4 flex items-center justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₹{finalPaid.toFixed(2)}</span>
            </div>

            {booking.pointsUsed > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{booking.pointsUsed.toLocaleString()}</span> points used for discount
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {booking.paymentStatus === "COMPLETED" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-semibold capitalize">{booking.paymentStatus}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {booking.status === "CONFIRMED" && (
          <div className="flex gap-4">
            <Button onClick={openCancelModal} variant="destructive" className="flex-1">
              Cancel Booking
            </Button>
            <Link href="/user/bookings" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Bookings
              </Button>
            </Link>
          </div>
        )}

        {booking.status !== "CONFIRMED" && (
          <Link href="/user/bookings" className="block">
            <Button variant="outline" className="w-full bg-transparent">
              Back to Bookings
            </Button>
          </Link>
        )}
      </div>

      {/* Cancellation Modal */}
      <Dialog open={cancelModal.isOpen} onOpenChange={(open) => !open && closeCancelModal()}>
        <DialogContent className="sm:max-w-md">
          {cancelModal.step === 'confirm' && booking && refundInfo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Cancel Booking
                </DialogTitle>
                <DialogDescription>
                  {booking.venueId ? 'Venue' : 'Event'} Booking #{booking.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Refund Policy Card */}
                <div className={`rounded-lg p-4 ${refundInfo.hasRefund ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {refundInfo.hasRefund ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
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
                    <span className="font-medium">₹{booking.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Refund ({refundInfo.percentage}%)</span>
                    <span className={`font-bold ${refundInfo.hasRefund ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{refundInfo.amount.toFixed(2)}
                    </span>
                  </div>

                  {(booking.pointsUsed || 0) > 0 && (
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
                  <CheckCircle className="h-5 w-5 text-green-500" />
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
