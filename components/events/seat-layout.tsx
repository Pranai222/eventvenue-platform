"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import type { SeatLayout, EventSeat, SeatCategory } from "@/lib/types/booking"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Coins, CreditCard } from "lucide-react"

// PayPal Client ID
const PAYPAL_CLIENT_ID = "AcHqC_6TsYO9h_Zeaq9D-ADt_lsf63e69ifdyLvvJv-BdKNjZ-4yPMvqGO3bg9nrywlMI_HPq_Qw8occ"

interface SeatLayoutProps {
    layout: SeatLayout
    onBookSeats: (seatIds: number[], pointsToUse: number, paypalTransactionId?: string | null) => Promise<void>
    maxSeats?: number
    isLoading?: boolean
    userPoints?: number
    conversionRate?: number
    platformFee?: number
    eventName?: string
}

export function SeatLayoutComponent({
    layout,
    onBookSeats,
    maxSeats = 10,
    isLoading = false,
    userPoints = 0,
    conversionRate = 100,
    platformFee = 2,
    eventName = "Event"
}: SeatLayoutProps) {
    const [selectedSeats, setSelectedSeats] = useState<number[]>([])
    const [pointsToUse, setPointsToUse] = useState(0)
    const [showPaypalModal, setShowPaypalModal] = useState(false)
    const [paypalLoaded, setPaypalLoaded] = useState(false)
    const [paypalProcessing, setPaypalProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Ref for onBookSeats callback
    const onBookSeatsRef = useRef(onBookSeats)
    onBookSeatsRef.current = onBookSeats

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

    // Group seats by row
    const seatsByRow = useMemo(() => {
        const grouped: Record<string, EventSeat[]> = {}
        for (const seat of layout.seats) {
            if (!grouped[seat.rowLabel]) {
                grouped[seat.rowLabel] = []
            }
            grouped[seat.rowLabel].push(seat)
        }
        // Sort seats within each row
        for (const row of Object.keys(grouped)) {
            grouped[row].sort((a, b) => a.seatNumber - b.seatNumber)
        }
        return grouped
    }, [layout.seats])

    // Get category by ID
    const getCategoryById = (categoryId: number): SeatCategory | undefined => {
        return layout.categories.find(c => c.id === categoryId)
    }

    // Get all unique rows in order
    const orderedRows = useMemo(() => {
        const rows = new Set<string>()
        for (const category of layout.categories) {
            for (const row of category.rows) {
                rows.add(row)
            }
        }
        return Array.from(rows).sort()
    }, [layout.categories])

    // Calculate selected seats info
    const selectedSeatsInfo = useMemo(() => {
        const seats = layout.seats.filter(s => selectedSeats.includes(s.id))
        const total = seats.reduce((sum, s) => sum + s.price, 0)
        return { seats, total }
    }, [selectedSeats, layout.seats])

    // Points calculation
    const maxPointsUsable = useMemo(() => {
        const totalInPoints = Math.floor(selectedSeatsInfo.total * conversionRate)
        return Math.min(userPoints, totalInPoints)
    }, [selectedSeatsInfo.total, userPoints, conversionRate])

    const pointsDiscount = useMemo(() => {
        return pointsToUse / conversionRate
    }, [pointsToUse, conversionRate])

    const finalPrice = useMemo(() => {
        return Math.max(0, selectedSeatsInfo.total - pointsDiscount)
    }, [selectedSeatsInfo.total, pointsDiscount])

    // Render PayPal buttons when SDK is loaded
    useEffect(() => {
        if (paypalLoaded && showPaypalModal && (window as any).paypal && finalPrice > 0) {
            const paypalButtonContainer = document.getElementById('seat-paypal-button-container')
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
                                        value: finalPrice.toFixed(2),
                                        currency_code: 'USD'
                                    },
                                    description: `${eventName} - ${selectedSeats.length} seat(s)`
                                }]
                            })
                        },
                        onApprove: async (_data: any, actions: any) => {
                            setPaypalProcessing(true)
                            setError(null)

                            try {
                                const order = await actions.order.capture()
                                await onBookSeatsRef.current(selectedSeats, pointsToUse, order.id)
                                setShowPaypalModal(false)
                            } catch (err: any) {
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
                    }).render('#seat-paypal-button-container')
            }
        }
    }, [paypalLoaded, showPaypalModal, finalPrice, eventName, selectedSeats, pointsToUse])

    // Reset points when seats change
    useEffect(() => {
        setPointsToUse(0)
    }, [selectedSeats])

    const handleSeatClick = (seat: EventSeat) => {
        if (seat.status !== 'AVAILABLE') return

        setSelectedSeats(prev => {
            if (prev.includes(seat.id)) {
                return prev.filter(id => id !== seat.id)
            }
            if (prev.length >= maxSeats) {
                return prev
            }
            return [...prev, seat.id]
        })
    }

    const handleBooking = async () => {
        if (selectedSeats.length === 0) return

        // If there's a remaining amount to pay, show PayPal modal
        if (finalPrice > 0) {
            setShowPaypalModal(true)
            return
        }

        // If fully paid with points, book directly
        await onBookSeats(selectedSeats, pointsToUse, null)
    }

    // Get aisle positions for a category
    const getAislePositions = (categoryId: number): number[] => {
        const category = getCategoryById(categoryId)
        return category?.aisleAfter || []
    }

    return (
        <div className="space-y-6">
            {/* Screen/Stage indicator */}
            <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-t-full px-16 py-2 text-sm font-medium text-primary">
                    STAGE / SCREEN
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-green-500 rounded bg-white"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-green-500 rounded bg-green-500"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-gray-300 rounded bg-gray-200"></div>
                    <span>Sold</span>
                </div>
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4">
                {layout.categories.map(category => (
                    <Badge
                        key={category.id}
                        variant="outline"
                        style={{ borderColor: category.color, color: category.color }}
                    >
                        {category.name} - ₹{category.price}
                    </Badge>
                ))}
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto pb-4">
                <div className="flex flex-col items-center gap-1 min-w-fit mx-auto">
                    {orderedRows.map(rowLabel => {
                        const rowSeats = seatsByRow[rowLabel] || []
                        if (rowSeats.length === 0) return null

                        const category = getCategoryById(rowSeats[0]?.categoryId)
                        const aisles = getAislePositions(rowSeats[0]?.categoryId)

                        return (
                            <div key={rowLabel} className="flex items-center gap-1">
                                {/* Row Label */}
                                <div className="w-8 text-center font-bold text-muted-foreground">
                                    {rowLabel}
                                </div>

                                {/* Seats */}
                                <div className="flex gap-1">
                                    {rowSeats.map((seat, index) => {
                                        const isSelected = selectedSeats.includes(seat.id)
                                        const isAvailable = seat.status === 'AVAILABLE'
                                        const isBooked = seat.status === 'BOOKED'
                                        const needsAisle = aisles.includes(seat.seatNumber)

                                        return (
                                            <div key={seat.id} className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSeatClick(seat)}
                                                    disabled={!isAvailable}
                                                    className={cn(
                                                        "w-8 h-8 rounded text-xs font-medium transition-all",
                                                        "flex items-center justify-center",
                                                        isAvailable && !isSelected && "border-2 bg-white hover:bg-green-50 cursor-pointer",
                                                        isSelected && "border-2 bg-green-500 text-white",
                                                        isBooked && "border-2 border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed",
                                                        !isAvailable && !isBooked && "border-2 border-amber-300 bg-amber-100 cursor-not-allowed"
                                                    )}
                                                    style={{
                                                        borderColor: isAvailable || isSelected ? category?.color || '#22c55e' : undefined
                                                    }}
                                                    title={`${rowLabel}${seat.seatNumber} - ₹${seat.price}`}
                                                >
                                                    {seat.seatNumber}
                                                </button>
                                                {/* Aisle gap */}
                                                {needsAisle && <div className="w-4" />}
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Row Label (right side) */}
                                <div className="w-8 text-center font-bold text-muted-foreground">
                                    {rowLabel}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Selection Summary with Points */}
            <Card className="sticky bottom-4 bg-card/95 backdrop-blur">
                <CardContent className="pt-4">
                    <div className="space-y-4">
                        {/* Selected Seats Info */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                    Selected: {selectedSeats.length} / {maxSeats} seats
                                </p>
                                {selectedSeatsInfo.seats.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {selectedSeatsInfo.seats.map(s => `${s.rowLabel}${s.seatNumber}`).join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold">
                                    Subtotal: ₹{selectedSeatsInfo.total.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Points Usage Section */}
                        {userPoints > 0 && selectedSeats.length > 0 && (
                            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Coins className="h-4 w-4 text-primary" />
                                        <Label className="text-sm font-medium">Use Reward Points</Label>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        Available: {userPoints.toLocaleString()} pts
                                    </span>
                                </div>

                                <Slider
                                    value={[pointsToUse]}
                                    onValueChange={(v) => setPointsToUse(v[0])}
                                    max={maxPointsUsable}
                                    step={conversionRate}
                                    className="w-full"
                                />

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Using: {pointsToUse.toLocaleString()} pts
                                    </span>
                                    <span className="font-medium text-green-600">
                                        -₹{pointsDiscount.toFixed(2)} discount
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    {conversionRate} points = ₹1.00
                                </p>
                            </div>
                        )}

                        {/* Platform Fee */}
                        {selectedSeats.length > 0 && (
                            <div className="flex justify-between text-sm text-amber-600">
                                <span className="flex items-center gap-1">
                                    <Coins className="h-3 w-3" />
                                    Platform Fee
                                </span>
                                <span>{platformFee} pts</span>
                            </div>
                        )}

                        {/* Final Price and Book Button */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
                            <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                    ₹{finalPrice.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">Final Total</p>
                            </div>
                            <Button
                                onClick={handleBooking}
                                disabled={selectedSeats.length === 0 || isLoading}
                                size="lg"
                            >
                                {isLoading ? "Booking..." : finalPrice > 0 ? `Pay ₹${finalPrice.toFixed(2)} with PayPal` : `Book with ${pointsToUse.toLocaleString()} Points`}
                            </Button>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

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
                                <p className="text-4xl font-bold text-primary">₹{finalPrice.toFixed(2)}</p>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Points Used:</span>
                                    <span className="font-medium">{pointsToUse.toLocaleString()} pts</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Event:</span>
                                    <span className="font-medium">{eventName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Seats:</span>
                                    <span className="font-medium">{selectedSeats.length} seat(s)</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* PayPal SDK renders buttons here */}
                                {paypalLoaded ? (
                                    <div id="seat-paypal-button-container" className="min-h-[50px]" />
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
        </div>
    )
}

