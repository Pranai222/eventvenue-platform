"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { bookingsApi } from "@/lib/api/bookings"
import { venuesApi } from "@/lib/api/venues"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { usePlatformFees } from "@/lib/contexts/platform-fees-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Coins, Calendar, CreditCard } from "lucide-react"
import type { Venue } from "@/lib/types/booking"

interface VenueBookingFormProps {
  venue: Venue
  userPoints: number
}

export function VenueBookingForm({ venue, userPoints }: VenueBookingFormProps) {
  const router = useRouter()
  const { conversionRate, isLoading: rateLoading } = useConversionRate()
  const { platformFees } = usePlatformFees()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [showPaypalModal, setShowPaypalModal] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalProcessing, setPaypalProcessing] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // PayPal Client ID - Same as buy-credits-modal
  const PAYPAL_CLIENT_ID = "AcHqC_6TsYO9h_Zeaq9D-ADt_lsf63e69ifdyLvvJv-BdKNjZ-4yPMvqGO3bg9nrywlMI_HPq_Qw8occ"

  // Load PayPal SDK when modal opens
  useEffect(() => {
    if (showPaypalModal && !paypalLoaded) {
      const existingScript = document.getElementById('paypal-sdk')
      if (existingScript) {
        setPaypalLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.id = 'paypal-sdk'
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`
      script.async = true
      script.onload = () => setPaypalLoaded(true)
      script.onerror = () => setError('Failed to load PayPal. Please try again.')
      document.body.appendChild(script)
    }
  }, [showPaypalModal, paypalLoaded])

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    // Inclusive day counting: same day = 1, consecutive days = 2
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, days) * venue.pricePerDay
  }

  const total = calculateTotal()
  const pointsDiscount = usePoints ? pointsToUse / conversionRate : 0 // Dynamic conversion
  const finalTotal = Math.max(0, total - pointsDiscount)

  // processBooking function reference for PayPal callback
  const processBookingRef = useRef<((txnId: string | null) => Promise<void>) | null>(null)

  // Render PayPal buttons when SDK is loaded
  useEffect(() => {
    if (paypalLoaded && showPaypalModal && (window as any).paypal && finalTotal > 0) {
      const paypalButtonContainer = document.getElementById('venue-paypal-button-container')
      if (paypalButtonContainer) {
        paypalButtonContainer.innerHTML = ''

          ; (window as any).paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay'
            },
            createOrder: (_data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: finalTotal.toFixed(2),
                    currency_code: 'USD'
                  },
                  description: `Venue Booking: ${venue.name} (${startDate} to ${endDate})`
                }]
              })
            },
            onApprove: async (_data: any, actions: any) => {
              setPaypalProcessing(true)
              setError('')

              try {
                const order = await actions.order.capture()
                if (processBookingRef.current) {
                  await processBookingRef.current(order.id)
                } else {
                  console.error('processBookingRef is null')
                  setError('Booking function not available. Please try again.')
                }
              } catch (err: any) {
                console.error('PayPal onApprove error:', err)
                setError('Payment completed but booking failed. Please contact support.')
              } finally {
                setPaypalProcessing(false)
              }
            },
            onError: (err: any) => {
              console.error('PayPal error:', err)
              setError('PayPal payment failed. Please try again.')
            },
            onCancel: () => {
              setError('Payment cancelled')
            }
          }).render('#venue-paypal-button-container')
      }
    }
  }, [paypalLoaded, showPaypalModal, finalTotal, startDate, endDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be before start date")
      return
    }

    // If there's remaining amount, show PayPal modal instead of submitting directly
    if (finalTotal > 0) {
      setShowPaypalModal(true)
      return
    }

    // If fully paid with points, submit directly
    await processBooking(null)
  }

  // Process booking after PayPal payment or with full points
  const processBooking = async (paypalTxnId: string | null) => {
    setIsLoading(true)
    setPaypalProcessing(true)
    const platformFeePoints = platformFees.userPlatformFeePoints

    // Check if user has enough points for platform fee
    const totalPointsNeeded = (usePoints ? pointsToUse : 0) + platformFeePoints
    if (userPoints < totalPointsNeeded) {
      setError(`Not enough points. Need ${totalPointsNeeded} points (including ${platformFeePoints} platform fee) but you have ${userPoints}`)
      setIsLoading(false)
      return
    }

    try {
      // Check availability first
      const { available } = await venuesApi.checkAvailability(venue.id, startDate, endDate)

      if (!available) {
        setError("This venue is not available for the selected dates")
        setIsLoading(false)
        return
      }

      // Calculate duration in hours for backend - inclusive day counting
      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const durationHours = Math.max(1, days) * 24

      const booking = await bookingsApi.createWithPoints({
        venueId: venue.id,
        bookingDate: startDate,
        durationHours,
        // IMPORTANT: Send the SUBTOTAL (original price before any discount)
        // The backend will store this so the booking details page can correctly display:
        // Subtotal = totalAmount, Discount = pointsUsed/rate, Final = totalAmount - discount
        totalAmount: total,
        pointsToUse: usePoints ? pointsToUse : 0,
        paypalTransactionId: paypalTxnId,
        remainingAmount: finalTotal > 0 ? finalTotal : 0
      })


      router.push(`/user/bookings/${booking.id}`)
    } catch (err: any) {
      console.error('Booking error:', err)
      setError(err.message || "Failed to create booking")
    } finally {
      setIsLoading(false)
      setPaypalProcessing(false)
      setShowPaypalModal(false)
    }
  }

  // Set processBookingRef after function is defined so PayPal can access it
  processBookingRef.current = processBooking

  const maxPointsToUse = Math.min(userPoints, Math.ceil(total * conversionRate))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book This Venue</CardTitle>
        <CardDescription>Select your dates and complete your booking</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          {/* Points Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="usePoints" checked={usePoints} onCheckedChange={(checked) => setUsePoints(!!checked)} />
                <Label htmlFor="usePoints" className="cursor-pointer">
                  Use Points
                </Label>
              </div>
              <div className="text-sm text-muted-foreground">
                <Coins className="h-4 w-4 inline mr-1" />
                {userPoints.toLocaleString()} available
              </div>
            </div>

            {usePoints && (
              <div className="space-y-2">
                <Label htmlFor="pointsToUse">Points to Use (Max: {maxPointsToUse})</Label>
                <Input
                  id="pointsToUse"
                  type="number"
                  min={0}
                  max={maxPointsToUse}
                  value={pointsToUse || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "" || /^\d+$/.test(val)) {
                      const numVal = val === "" ? 0 : parseInt(val, 10)
                      setPointsToUse(Math.min(maxPointsToUse, numVal))
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {conversionRate} points = ₹1 discount. Discount: ₹{pointsDiscount.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            {usePoints && pointsDiscount > 0 && (
              <div className="flex justify-between text-sm text-accent">
                <span>Points Discount</span>
                <span>-₹{pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-amber-600">
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" />
                Platform Fee
              </span>
              <span>{platformFees.userPlatformFeePoints} pts</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Show payment method based on remaining amount */}
          {finalTotal > 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">Payment Summary</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points Payment:</span>
                  <span className="font-medium text-green-600">{pointsToUse.toLocaleString()} pts (₹{pointsDiscount.toFixed(2)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PayPal Payment:</span>
                  <span className="font-medium text-blue-600">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900 dark:text-green-100">Full Points Payment</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Paying with {pointsToUse.toLocaleString()} points
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Processing..." : finalTotal > 0 ? `Pay ₹${finalTotal.toFixed(2)} with PayPal` : `Confirm Booking (${pointsToUse.toLocaleString()} pts)`}
          </Button>
        </form>

        {/* PayPal Payment Modal */}
        {showPaypalModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              {/* PayPal Header */}
              <div className="bg-gradient-to-r from-[#003087] to-[#009cde] p-6 text-white">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-2xl font-bold">Pay</span>
                  <span className="text-2xl font-bold text-[#00ade9]">Pal</span>
                </div>
                <p className="text-center text-sm opacity-90">Secure Payment Gateway</p>
              </div>

              {/* Payment Details */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Amount to Pay</p>
                  <p className="text-4xl font-bold text-primary">₹{finalTotal.toFixed(2)}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points Used:</span>
                    <span className="font-medium">{pointsToUse.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Venue:</span>
                    <span className="font-medium">{venue.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dates:</span>
                    <span className="font-medium">{startDate} to {endDate}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* PayPal SDK renders buttons here */}
                  {paypalLoaded ? (
                    <div id="venue-paypal-button-container" className="min-h-[50px]" />
                  ) : (
                    <div className="flex items-center justify-center h-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading PayPal...</span>
                    </div>
                  )}

                  {paypalProcessing && (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2" />
                      <span className="text-sm">Processing payment...</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowPaypalModal(false)}
                    className="w-full"
                    disabled={paypalProcessing}
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Your payment is secured with 256-bit encryption
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
