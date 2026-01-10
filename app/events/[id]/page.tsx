"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { eventsApi } from "@/lib/api/events"
import { authApi } from "@/lib/api/auth"
import { useAuth } from "@/lib/contexts/auth-context"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { usePlatformFees } from "@/lib/contexts/platform-fees-context"
import { EventBookingForm } from "@/components/booking/event-booking-form"
import { ReviewSection } from "@/components/reviews"
import { ImageGallery } from "@/components/ImageGallery"
import { SeatLayoutComponent } from "@/components/events/seat-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, MapPin, Users, Ticket, ArrowLeft, CheckCircle, AlertCircle, Armchair, Phone, Mail, Building2 } from "lucide-react"
import type { Event, SeatLayout } from "@/lib/types/booking"
import dynamic from "next/dynamic"
const ViewLocationMap = dynamic(() => import("@/components/view-location-map"), { ssr: false })

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { conversionRate } = useConversionRate()
  const { platformFees } = usePlatformFees()
  const [event, setEvent] = useState<Event | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState("")
  const [showLocationMap, setShowLocationMap] = useState(false)

  useEffect(() => {
    const eventId = Number(params.id)
    if (!eventId) {
      router.push("/events")
      return
    }

    const loadEventAndProfile = async () => {
      try {
        const eventData = await eventsApi.getById(eventId)
        setEvent(eventData)

        // Load seat layout if seat-selection event
        if (eventData.bookingType === "SEAT_SELECTION") {
          try {
            const layout = await eventsApi.getSeatLayout(eventId)
            setSeatLayout(layout as SeatLayout)
          } catch (error) {
            console.log("[pranai] No seat layout found for event")
          }
        }

        // Only fetch user profile if user is logged in as USER
        if (user?.role === "USER") {
          try {
            const profileResponse = await authApi.getUserProfile()
            const profile: any = 'data' in profileResponse ? profileResponse.data : profileResponse
            setUserPoints(profile?.points || 0)
          } catch (error) {
            console.log("[pranai] Could not fetch user points, defaulting to 0")
            setUserPoints(0)
          }
        }
      } catch (error) {
        console.error("[pranai] Failed to load event:", error)
        router.push("/events")
      } finally {
        setIsLoading(false)
      }
    }

    loadEventAndProfile()
  }, [params.id, user, router])

  const handleSeatBooking = async (seatIds: number[], pointsToUse: number, paypalTransactionId?: string | null) => {
    if (!event) return

    setIsBooking(true)
    setBookingError("")

    try {
      const result = await eventsApi.bookSeats(event.id, seatIds, pointsToUse, paypalTransactionId || undefined)
      if (result.success) {
        setBookingSuccess(true)
        // Refresh layout to show booked seats
        const layout = await eventsApi.getSeatLayout(event.id)
        setSeatLayout(layout as SeatLayout)
      } else {
        setBookingError(result.message || "Failed to book seats")
      }
    } catch (error: any) {
      setBookingError(error.message || "Failed to book seats. Please try again.")
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) return null

  const isPastEvent = new Date(event.date) < new Date()
  const isSeatSelection = event.bookingType === "SEAT_SELECTION" && seatLayout

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">EventVenue</span>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <Link href={`/${user.role.toLowerCase()}/dashboard`}>
                  <Button variant="outline">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>

        <div className={isSeatSelection ? "space-y-8" : "grid lg:grid-cols-3 gap-8"}>
          {/* Main Content */}
          <div className={isSeatSelection ? "" : "lg:col-span-2 space-y-6"}>
            {/* Image Gallery */}
            <ImageGallery images={event.images} alt={event.name} />

            {/* Details */}
            <div className="mt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => setShowLocationMap(true)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                      title="View on map"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Capacity: {event.capacity}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {event.featured && <Badge variant="secondary">Featured</Badge>}
                  {isPastEvent && <Badge variant="outline">Past Event</Badge>}
                  {isSeatSelection && (
                    <Badge variant="outline" className="gap-1">
                      <Armchair className="h-3 w-3" />
                      Seat Selection
                    </Badge>
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-3">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            {/* Host Information */}
            {(event.vendorBusinessName || event.vendorBusinessPhone || event.vendorEmail) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Hosted by {event.vendorBusinessName || "Vendor"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.vendorBusinessPhone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Phone</p>
                        <p className="text-sm hover:text-primary transition-colors">
                          <a href={`tel:${event.vendorBusinessPhone}`}>{event.vendorBusinessPhone}</a>
                        </p>
                      </div>
                    </div>
                  )}
                  {event.vendorEmail && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Email</p>
                        <p className="text-sm hover:text-primary transition-colors">
                          <a href={`mailto:${event.vendorEmail}`}>{event.vendorEmail}</a>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ticket Types for quantity-based events - inside main content */}
            {!isSeatSelection && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Available Tickets</CardTitle>
                  <CardDescription>Choose your ticket type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.ticketTypes.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <h3 className="font-semibold mb-1">{ticket.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ticket.availableQuantity} / {ticket.quantity} available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">₹{ticket.price}</p>
                          <p className="text-xs text-muted-foreground">per ticket</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seat Selection Section - for seat-based events */}
            {isSeatSelection && seatLayout && user?.role === "USER" && !isPastEvent && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Armchair className="h-5 w-5" />
                    Select Your Seats
                  </CardTitle>
                  <CardDescription>Click on available seats to select them</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingSuccess && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Seats booked successfully! Check your bookings in the dashboard.
                      </AlertDescription>
                    </Alert>
                  )}
                  {bookingError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{bookingError}</AlertDescription>
                    </Alert>
                  )}
                  <SeatLayoutComponent
                    layout={seatLayout}
                    onBookSeats={handleSeatBooking}
                    maxSeats={10}
                    isLoading={isBooking}
                    userPoints={userPoints}
                    conversionRate={conversionRate}
                    platformFee={platformFees.userPlatformFeePoints}
                    eventName={event.name}
                  />
                </CardContent>
              </Card>
            )}

            {/* Reviews Section - inside main content */}
            <ReviewSection
              eventId={event.id}
              currentUserId={user?.role === "USER" ? user?.userId : undefined}
            />
          </div>

          {/* Booking Sidebar - only for quantity-based events */}
          {!isSeatSelection && (
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {isPastEvent ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground mb-4">This event has already passed</p>
                      <Link href="/events">
                        <Button variant="outline" className="w-full bg-transparent">
                          Browse Other Events
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : user?.role === "USER" ? (
                  <EventBookingForm event={event} userPoints={userPoints} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Book Tickets</CardTitle>
                      <CardDescription>Sign in to purchase tickets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Starting from</p>
                          <p className="text-3xl font-bold text-primary">
                            ${Math.min(...event.ticketTypes.map((t) => t.price))}
                          </p>
                        </div>
                        <Link href="/login?role=user">
                          <Button className="w-full" size="lg">
                            Sign In to Book
                          </Button>
                        </Link>
                        <p className="text-xs text-center text-muted-foreground">
                          Don&apos;t have an account?{" "}
                          <Link href="/signup?role=user" className="text-primary hover:underline">
                            Sign up
                          </Link>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Sign in prompt for seat selection */}
          {isSeatSelection && !user && !isPastEvent && (
            <Card className="mt-6">
              <CardContent className="p-6 text-center">
                <Armchair className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Select Your Seats</h3>
                <p className="text-muted-foreground mb-4">Sign in to select and book your preferred seats</p>
                <Link href="/login?role=user">
                  <Button size="lg">Sign In to Book</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Location Map Modal */}
        {showLocationMap && event && (
          <ViewLocationMap
            address={event.location}
            onClose={() => setShowLocationMap(false)}
          />
        )}
      </div>
    </div>
  )
}
