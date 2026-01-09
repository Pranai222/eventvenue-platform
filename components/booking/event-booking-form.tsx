"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { bookingsApi } from "@/lib/api/bookings"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { usePlatformFees } from "@/lib/contexts/platform-fees-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calendar, Ticket, CreditCard, Coins } from "lucide-react"
import type { Event, TicketType } from "@/lib/types/booking"

interface EventBookingFormProps {
    event: Event
    userPoints: number
}

export function EventBookingForm({ event, userPoints }: EventBookingFormProps) {
    const router = useRouter()
    const { conversionRate, isLoading: rateLoading } = useConversionRate()
    const { platformFees } = usePlatformFees()
    const [selectedTickets, setSelectedTickets] = useState<Record<number, number>>({})
    const [pointsToUse, setPointsToUse] = useState(0)
    const [showPaypalModal, setShowPaypalModal] = useState(false)
    const [paypalLoaded, setPaypalLoaded] = useState(false)
    const [paypalProcessing, setPaypalProcessing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // PayPal Client ID
    const PAYPAL_CLIENT_ID = "AcHqC_6TsYO9h_Zeaq9D-ADt_lsf63e69ifdyLvvJv-BdKNjZ-4yPMvqGO3bg9nrywlMI_HPq_Qw8occ"

    // processBooking function reference for PayPal callback
    const processBookingRef = useRef<((txnId: string | null) => Promise<void>) | null>(null)

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

    const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)

    const subtotal = Object.entries(selectedTickets).reduce((sum, [ticketId, qty]) => {
        const ticket = event.ticketTypes.find(t => t.id === Number(ticketId))
        return sum + (ticket ? ticket.price * qty : 0)
    }, 0)

    // Calculate discount: pointsToUse / conversionRate = dollars
    const pointsDiscount = pointsToUse / conversionRate
    const totalAmount = Math.max(0, subtotal - pointsDiscount)

    // Render PayPal buttons when SDK is loaded
    useEffect(() => {
        if (paypalLoaded && showPaypalModal && (window as any).paypal && totalAmount > 0) {
            const paypalButtonContainer = document.getElementById('event-paypal-button-container')
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
                                        value: totalAmount.toFixed(2),
                                        currency_code: 'USD'
                                    },
                                    description: `Event Tickets: ${event.name} (${totalTickets} tickets)`
                                }]
                            })
                        },
                        onApprove: async (_data: any, actions: any) => {
                            setPaypalProcessing(true)
                            setError(null)

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
                    }).render('#event-paypal-button-container')
            }
        }
    }, [paypalLoaded, showPaypalModal, totalAmount, event.name, totalTickets])

    const handleQuantityChange = (ticketId: number, delta: number) => {
        const ticket = event.ticketTypes.find(t => t.id === ticketId)
        if (!ticket) return

        const currentQty = selectedTickets[ticketId] || 0
        const newQty = Math.max(0, Math.min(ticket.availableQuantity, currentQty + delta))

        setSelectedTickets(prev => {
            if (newQty === 0) {
                const { [ticketId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [ticketId]: newQty }
        })
    }

    const handlePointsChange = (value: string) => {
        const points = parseInt(value) || 0
        // Maximum points: either userPoints or enough to cover subtotal
        const maxPointsForTotal = Math.ceil(subtotal * conversionRate)
        const validPoints = Math.max(0, Math.min(userPoints, maxPointsForTotal, points))
        setPointsToUse(validPoints)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (totalTickets === 0) {
            setError("Please select at least one ticket")
            return
        }

        // Check if user has enough points including platform fee
        const platformFeePoints = platformFees.userPlatformFeePoints
        const totalPointsNeeded = pointsToUse + platformFeePoints
        if (userPoints < totalPointsNeeded) {
            setError(`Not enough points. Need ${totalPointsNeeded} points (including ${platformFeePoints} platform fee) but you have ${userPoints}`)
            return
        }

        // If there's remaining amount, show PayPal modal
        if (totalAmount > 0) {
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

        try {
            console.log("[EventVenue] Creating event booking:", {
                eventId: event.id,
                totalTickets,
                totalAmount,
                pointsUsed: pointsToUse,
                paypalTxnId
            })

            await bookingsApi.createWithPoints({
                eventId: event.id,
                bookingDate: new Date().toISOString().split('T')[0],
                // IMPORTANT: Send the SUBTOTAL (original price before any discount)
                // The backend will store this so the booking details page can correctly display:
                // Subtotal = totalAmount, Discount = pointsUsed/rate, Final = totalAmount - discount
                totalAmount: subtotal,
                pointsToUse: pointsToUse,
                quantity: totalTickets,
                paypalTransactionId: paypalTxnId,
                remainingAmount: totalAmount > 0 ? totalAmount : 0
            })


            router.push("/user/bookings")
        } catch (error: any) {
            console.error("[EventVenue] Booking failed:", error)
            setError(error.message || "Failed to book tickets. Please try again.")
        } finally {
            setIsLoading(false)
            setPaypalProcessing(false)
            setShowPaypalModal(false)
        }
    }

    // Set processBookingRef after function is defined so PayPal can access it
    processBookingRef.current = processBooking

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Book Tickets</CardTitle>
                    <CardDescription>Select your tickets and checkout</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Ticket Selection */}
                    <div className="space-y-3">
                        <Label>Select Tickets</Label>
                        {event.ticketTypes.map((ticket) => (
                            <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex-1">
                                    <div className="font-medium">{ticket.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        ${ticket.price} • {ticket.availableQuantity} available
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleQuantityChange(ticket.id, -1)}
                                        disabled={!selectedTickets[ticket.id]}
                                    >
                                        -
                                    </Button>
                                    <span className="w-8 text-center font-medium">
                                        {selectedTickets[ticket.id] || 0}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleQuantityChange(ticket.id, 1)}
                                        disabled={ticket.availableQuantity === 0 || (selectedTickets[ticket.id] || 0) >= ticket.availableQuantity}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalTickets > 0 && (
                        <>
                            <Separator />

                            {/* Points */}
                            {userPoints > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="points">Use Points (Available: {userPoints})</Label>
                                    <div className="relative">
                                        <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="points"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={pointsToUse === 0 ? '' : pointsToUse}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                // Only allow digits
                                                if (value === '' || /^\d+$/.test(value)) {
                                                    // Parse immediately to remove leading zeros
                                                    const numValue = value === '' ? 0 : parseInt(value, 10)
                                                    handlePointsChange(numValue.toString())
                                                }
                                            }}
                                            className="pl-10"
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {conversionRate} points = ₹1 discount. Maximum: {Math.min(userPoints, Math.ceil(subtotal * conversionRate))} points
                                    </p>
                                </div>
                            )}

                            {/* Price Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'})</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {pointsToUse > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
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
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Payment Summary */}
                    {totalTickets > 0 && totalAmount > 0 && (
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
                                    <span className="font-medium text-blue-600">₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </CardContent>

                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isLoading || totalTickets === 0}
                    >
                        {isLoading ? (
                            "Processing..."
                        ) : (
                            <>
                                <Ticket className="h-4 w-4 mr-2" />
                                {totalAmount === 0 ? `Book with ${pointsToUse.toLocaleString()} Points` : `Pay ₹${totalAmount.toFixed(2)} with PayPal`}
                            </>
                        )}
                    </Button>
                </CardFooter>
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
                                <p className="text-4xl font-bold text-primary">₹{totalAmount.toFixed(2)}</p>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Points Used:</span>
                                    <span className="font-medium">{pointsToUse.toLocaleString()} pts</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Event:</span>
                                    <span className="font-medium">{event.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tickets:</span>
                                    <span className="font-medium">{totalTickets}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* PayPal SDK renders buttons here */}
                                {paypalLoaded ? (
                                    <div id="event-paypal-button-container" className="min-h-[50px]" />
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
        </Card>
    )
}
