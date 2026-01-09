"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { eventsApi } from "@/lib/api/events"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/ImageUpload"
import { AlertCircle, CheckCircle, Armchair, Ticket } from "lucide-react"
import type { Event } from "@/lib/types/booking"
import { getToken } from "@/lib/auth"
import { SeatCategoryForm, type SeatCategoryConfig } from "@/components/vendor/seat-category-form"
import { SeatLayoutPreview } from "@/components/vendor/seat-layout-preview"
import LocationPicker from "@/components/location-picker"
import { usePlatformFees } from "@/lib/contexts/platform-fees-context"

export default function CreateEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [bookingType, setBookingType] = useState<"QUANTITY" | "SEAT_SELECTION">("QUANTITY")
  const [seatCategories, setSeatCategories] = useState<SeatCategoryConfig[]>([])
  const { platformFees } = usePlatformFees()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventDate: "",
    eventTime: "",
    location: "",
    category: "",
    maxAttendees: 0,
    totalTickets: 0,
    pricePerTicket: 0,
    images: [] as string[],
    vendorPhone: "",
  })

  // Calculate total seats from seat categories
  const totalSeatsFromCategories = seatCategories.reduce((total, cat) => {
    return total + (cat.rows.length * cat.seatsPerRow)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Check authentication before making API call
      const token = getToken()
      if (!token) {
        setError("You must be logged in to create an event. Please log in again.")
        setTimeout(() => {
          router.push("/login?role=vendor")
        }, 2000)
        return
      }

      // Validate seat categories for seat-based booking
      if (bookingType === "SEAT_SELECTION") {
        if (seatCategories.length === 0) {
          setError("Please add at least one seat category for seat selection booking.")
          setIsLoading(false)
          return
        }
        const hasRows = seatCategories.some(cat => cat.rows.length > 0)
        if (!hasRows) {
          setError("Please select rows for your seat categories.")
          setIsLoading(false)
          return
        }
      }

      // Combine date and time into proper format
      const eventDateTime = formData.eventTime
        ? `${formData.eventDate}T${formData.eventTime}:00`
        : `${formData.eventDate}T00:00:00`

      // Prepare data for backend
      const backendEventData = {
        name: formData.name,
        description: formData.description,
        eventDate: eventDateTime,
        eventTime: formData.eventTime,
        location: formData.location,
        category: formData.category,
        maxAttendees: bookingType === "SEAT_SELECTION" ? totalSeatsFromCategories : Number(formData.maxAttendees),
        totalTickets: bookingType === "SEAT_SELECTION" ? totalSeatsFromCategories : Number(formData.totalTickets),
        ticketsAvailable: bookingType === "SEAT_SELECTION" ? totalSeatsFromCategories : Number(formData.totalTickets),
        pricePerTicket: bookingType === "SEAT_SELECTION"
          ? (seatCategories[0]?.price || 0)
          : Number(formData.pricePerTicket),
        images: formData.images.join(","),
        isActive: false,
        bookingType: bookingType,
        vendorPhone: formData.vendorPhone,
      }

      const result = await eventsApi.create(backendEventData as any)

      // If seat selection, configure seat layout
      if (bookingType === "SEAT_SELECTION" && result.id) {
        const categoryData = seatCategories.map(cat => ({
          name: cat.name,
          price: cat.price,
          color: cat.color,
          rows: cat.rows,
          seatsPerRow: cat.seatsPerRow,
          aisleAfter: cat.aisleAfter,
        }))
        await eventsApi.configureSeatLayout(result.id, categoryData)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/vendor/events")
      }, 1500)
    } catch (err: any) {
      if (err.statusCode === 401) {
        setError("Your session has expired. Please log in again.")
        setTimeout(() => {
          router.push("/login?role=vendor")
        }, 2000)
      } else if (err.statusCode === 403) {
        setError("You don't have permission to create events.")
      } else {
        setError(err.message || "Failed to create event. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
        <p className="text-muted-foreground">Create a new event for your venue</p>
      </div>

      <div className={bookingType === "SEAT_SELECTION" ? "grid lg:grid-cols-2 gap-6" : "max-w-2xl mx-auto"}>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Provide information about your event</CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">Event created successfully!</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Annual Gala"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Wedding, Concert, Conference"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <LocationPicker
                  value={formData.location}
                  onChange={(location) => setFormData({ ...formData, location })}
                  label="Event Location"
                  placeholder="Enter event location or click map icon to select"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventTime">Event Time</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorPhone">Contact Phone Number *</Label>
                <Input
                  id="vendorPhone"
                  type="tel"
                  placeholder="e.g., +91 98765 43210"
                  value={formData.vendorPhone}
                  onChange={(e) => setFormData({ ...formData, vendorPhone: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">This will be shown to customers for contact purposes</p>
              </div>

              {/* Booking Type Toggle */}
              <div className="space-y-3">
                <Label>Booking Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setBookingType("QUANTITY")}
                    className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${bookingType === "QUANTITY"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <Ticket className={`h-6 w-6 ${bookingType === "QUANTITY" ? "text-primary" : "text-gray-500"}`} />
                    <span className="font-medium">Quantity Based</span>
                    <span className="text-xs text-muted-foreground text-center">User selects number of tickets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType("SEAT_SELECTION")}
                    className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${bookingType === "SEAT_SELECTION"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <Armchair className={`h-6 w-6 ${bookingType === "SEAT_SELECTION" ? "text-primary" : "text-gray-500"}`} />
                    <span className="font-medium">Seat Selection</span>
                    <span className="text-xs text-muted-foreground text-center">User picks specific seats</span>
                  </button>
                </div>
              </div>

              {/* Quantity-based fields */}
              {bookingType === "QUANTITY" && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxAttendees">Max Attendees</Label>
                      <Input
                        id="maxAttendees"
                        type="number"
                        placeholder="Maximum attendees"
                        value={formData.maxAttendees || ""}
                        onChange={(e) => setFormData({ ...formData, maxAttendees: Number.parseInt(e.target.value) })}
                        required
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="totalTickets">Total Tickets</Label>
                      <Input
                        id="totalTickets"
                        type="number"
                        placeholder="Number of tickets"
                        value={formData.totalTickets || ""}
                        onChange={(e) => setFormData({ ...formData, totalTickets: Number.parseInt(e.target.value) })}
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricePerTicket">Price Per Ticket (₹)</Label>
                    <Input
                      id="pricePerTicket"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.pricePerTicket || ""}
                      onChange={(e) => setFormData({ ...formData, pricePerTicket: Number.parseFloat(e.target.value) })}
                      required
                      min="0"
                    />
                  </div>
                </>
              )}

              {/* Seat-based configuration */}
              {bookingType === "SEAT_SELECTION" && (
                <div className="space-y-4">
                  <Label>Seat Categories</Label>
                  <SeatCategoryForm
                    categories={seatCategories}
                    onChange={setSeatCategories}
                  />
                  {totalSeatsFromCategories > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Total seats: <strong>{totalSeatsFromCategories}</strong>
                    </p>
                  )}
                </div>
              )}

              <ImageUpload
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
                type="events"
                label="Event Images"
                maxImages={10}
              />

              {/* Platform Fee Display */}
              <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Platform Fee</h4>
                      <p className="text-xs text-muted-foreground">
                        {bookingType === "QUANTITY"
                          ? "Quantity-based event creation"
                          : "Seat selection event creation"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-primary">
                        {bookingType === "QUANTITY" ? platformFees.eventCreationPointsQuantity : platformFees.eventCreationPointsSeat}
                      </span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deducted on creation
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    💡 {bookingType === "QUANTITY"
                      ? "Quantity-based events have a lower fee for simpler booking management."
                      : "Seat selection events include advanced seat layout features."
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : `Create Event (${bookingType === "QUANTITY" ? platformFees.eventCreationPointsQuantity : platformFees.eventCreationPointsSeat} pts)`}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview for Seat Selection */}
        {bookingType === "SEAT_SELECTION" && (
          <Card className="h-fit sticky top-4">
            <CardHeader>
              <CardTitle>Seat Layout Preview</CardTitle>
              <CardDescription>This is how users will see your seat layout</CardDescription>
            </CardHeader>
            <CardContent>
              <SeatLayoutPreview categories={seatCategories} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

