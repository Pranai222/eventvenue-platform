"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
// Removed useAuth - not needed, api client handles auth automatically
import { eventsApi } from "@/lib/api/events"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ImageUpload } from "@/components/ImageUpload"
import { SeatCategoryForm, type SeatCategoryConfig } from "@/components/vendor/seat-category-form"
import { SeatLayoutPreview } from "@/components/vendor/seat-layout-preview"
import { AlertCircle, CheckCircle, Armchair, Ticket, Calendar, Clock, MapPin, RefreshCw } from "lucide-react"
import type { Event, SeatCategory as SeatCategoryType } from "@/lib/types/booking"


export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  // Auth is handled by apiClient automatically
  const eventId = Number(params.id)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [bookingType, setBookingType] = useState<"QUANTITY" | "SEAT_SELECTION">("QUANTITY")
  const [seatCategories, setSeatCategories] = useState<SeatCategoryConfig[]>([])
  const [bookedSeatsCount, setBookedSeatsCount] = useState(0)

  // Track original values for schedule change detection
  const [rescheduleCount, setRescheduleCount] = useState(0)
  const [originalSchedule, setOriginalSchedule] = useState({
    eventDate: "",
    eventTime: "",
    location: ""
  })

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
  })

  // Calculate total seats from seat categories
  const totalSeatsFromCategories = seatCategories.reduce((total, cat) => {
    return total + (cat.rows.length * cat.seatsPerRow)
  }, 0)

  // Simple useEffect like venues - no auth waiting needed
  useEffect(() => {
    const loadEvent = async () => {
      setError("") // Clear any stale errors
      try {
        const event = await eventsApi.getById(eventId)
        setFormData({
          name: event.name,
          description: event.description,
          eventDate: event.eventDate?.split('T')[0] || event.date?.split('T')[0] || "",
          eventTime: event.eventTime || event.time || "",
          location: event.location,
          category: event.category || "",
          maxAttendees: event.maxAttendees || event.capacity,
          totalTickets: event.totalTickets,
          pricePerTicket: event.pricePerTicket,
          images: event.images || [],
        })
        setBookingType(event.bookingType || "QUANTITY")

        // Load seat categories if seat-selection event
        if (event.bookingType === "SEAT_SELECTION") {
          try {
            const layoutData = await eventsApi.getSeatLayout(eventId)
            if (layoutData.categories && layoutData.categories.length > 0) {
              const cats: SeatCategoryConfig[] = layoutData.categories.map((cat: SeatCategoryType) => ({
                name: cat.name,
                price: cat.price,
                color: cat.color,
                rows: cat.rows,
                seatsPerRow: cat.seatsPerRow,
                aisleAfter: cat.aisleAfter?.join(', ') || "",
              }))
              setSeatCategories(cats)
              const bookedCount = layoutData.seats?.filter((s: any) => s.status === 'BOOKED').length || 0
              setBookedSeatsCount(bookedCount)
            }
          } catch (e) {
            console.log("No seat layout found, starting fresh")
            // Don't set error for missing seat layout - it's optional
          }
        }

        // Check for quantity-based bookings
        if (event.bookingType !== "SEAT_SELECTION") {
          const ticketsSold = (event.totalTickets || 0) - (event.ticketsAvailable || 0)
          if (ticketsSold > 0) {
            setBookedSeatsCount(ticketsSold)
          }
        }

        // Load reschedule count and store original schedule values
        setRescheduleCount((event as any).rescheduleCount || 0)
        const originalDate = event.eventDate?.split('T')[0] || event.date?.split('T')[0] || ""
        const originalTime = event.eventTime || event.time || ""
        const originalLoc = event.location || ""
        setOriginalSchedule({
          eventDate: originalDate,
          eventTime: originalTime,
          location: originalLoc
        })

        // Clear error if we got here successfully
        setError("")
      } catch (err: any) {
        console.error("Error loading event:", err)
        setError(err.message || "Failed to load event")
      } finally {
        setIsLoading(false)
      }
    }
    loadEvent()
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      // Check if schedule changed when there are bookings
      const scheduleChanged = bookedSeatsCount > 0 && (
        formData.eventDate !== originalSchedule.eventDate ||
        formData.eventTime !== originalSchedule.eventTime ||
        formData.location !== originalSchedule.location
      )

      // If schedule changed and at limit, block
      if (scheduleChanged && rescheduleCount >= 2) {
        setError("Maximum schedule changes (2) reached. Cannot modify date, time, or location.")
        setIsSaving(false)
        return
      }

      // Calculate total tickets based on booking type
      const totalTickets = bookingType === "SEAT_SELECTION"
        ? totalSeatsFromCategories
        : formData.totalTickets

      // Combine date and time into LocalDateTime format for backend
      let eventDateTime = null
      if (formData.eventDate && formData.eventTime) {
        // Check if eventTime already has seconds (HH:mm:ss vs HH:mm)
        const timeWithSeconds = formData.eventTime.split(':').length === 3
          ? formData.eventTime
          : `${formData.eventTime}:00`
        eventDateTime = `${formData.eventDate}T${timeWithSeconds}`  // "2026-01-08T14:30:00"
      } else if (formData.eventDate) {
        eventDateTime = `${formData.eventDate}T00:00:00`  // Default to midnight if no time
      }

      // If schedule changed with bookings, call reschedule API first
      if (scheduleChanged) {
        console.log('[pranai] Schedule changed, calling reschedule API...')
        const rescheduleRequest = {
          newEventDate: eventDateTime,
          newEventTime: formData.eventTime,
          newLocation: formData.location,
          reason: "Schedule updated via edit form"
        }

        const rescheduleResponse = await fetch(`http://localhost:8080/api/events/${eventId}/reschedule`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(rescheduleRequest)
        })

        const rescheduleData = await rescheduleResponse.json()
        console.log('[pranai] Reschedule response:', rescheduleData)

        if (!rescheduleResponse.ok || !rescheduleData.success) {
          throw new Error(rescheduleData.message || 'Failed to update schedule')
        }

        // Update reschedule count locally
        setRescheduleCount(prev => prev + 1)
        setOriginalSchedule({
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          location: formData.location
        })
      }

      // Now update other event data (non-schedule fields)
      const eventData: Partial<Event> = {
        name: formData.name,
        description: formData.description,
        eventDate: eventDateTime as any,  // Backend expects LocalDateTime ISO format
        eventTime: formData.eventTime,
        location: formData.location,
        category: formData.category,
        maxAttendees: Number(formData.maxAttendees),
        totalTickets: Number(totalTickets),
        pricePerTicket: Number(formData.pricePerTicket),
        images: formData.images as any,
        bookingType: bookingType,
      }

      console.log('[pranai] Saving event with data:', eventData)
      await eventsApi.update(eventId, eventData)
      console.log('[pranai] Event updated successfully')

      // If seat selection, update seat layout
      if (bookingType === "SEAT_SELECTION" && seatCategories.length > 0) {
        const categoriesData = seatCategories.map((cat, index) => ({
          name: cat.name,
          price: cat.price,
          color: cat.color,
          rows: cat.rows,
          seatsPerRow: cat.seatsPerRow,
          aisleAfter: cat.aisleAfter,
          sortOrder: index,
        }))
        console.log('[pranai] Saving seat layout:', categoriesData)
        await eventsApi.configureSeatLayout(eventId, categoriesData)
        console.log('[pranai] Seat layout saved successfully')
      }

      setSuccess(true)

      // Show notification if schedule was changed
      if (scheduleChanged) {
        alert(`Event updated! Schedule change ${rescheduleCount + 1}/2 used. All ${bookedSeatsCount} booked users have been notified.`)
      }

      setTimeout(() => {
        router.push("/vendor/events")
      }, 1500)
    } catch (err: any) {
      // Simple error handling like venues
      setError(err.message || "Failed to update event")
    } finally {
      setIsSaving(false)
    }
  }


  // Helper function to check if schedule changed
  const hasScheduleChanged = () => {
    return (
      formData.eventDate !== originalSchedule.eventDate ||
      formData.eventTime !== originalSchedule.eventTime ||
      formData.location !== originalSchedule.location
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
        <p className="text-muted-foreground">Update your event information</p>
      </div>

      <div className={bookingType === "SEAT_SELECTION" ? "grid lg:grid-cols-2 gap-6" : "max-w-2xl mx-auto"}>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Modify your event information</CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">Event updated successfully!</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {bookedSeatsCount > 0 && (
              <div className="mb-6 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-amber-950/40 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-amber-100/50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100">Schedule Change Policy</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {bookedSeatsCount} {bookingType === "SEAT_SELECTION" ? "seats" : "tickets"} booked • Changes will notify all users
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={rescheduleCount >= 2 ? "destructive" : "outline"}
                      className={rescheduleCount >= 2
                        ? ""
                        : "border-amber-500 text-amber-700 bg-amber-100 dark:bg-amber-900/50"
                      }
                    >
                      {rescheduleCount >= 2 ? "🔒 Locked" : `${2 - rescheduleCount} changes left`}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-700 dark:text-amber-300">Schedule Changes Used</span>
                        <span className="font-medium text-amber-900 dark:text-amber-100">{rescheduleCount}/2</span>
                      </div>
                      <div className="h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${rescheduleCount >= 2
                            ? "bg-red-500"
                            : rescheduleCount === 1
                              ? "bg-amber-500"
                              : "bg-green-500"
                            }`}
                          style={{ width: `${(rescheduleCount / 2) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Dots */}
                    <div className="flex gap-2">
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i < rescheduleCount
                            ? "bg-amber-500 border-amber-500"
                            : "bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700"
                            }`}
                        >
                          {i < rescheduleCount && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info Text */}
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    {rescheduleCount >= 2
                      ? "Maximum changes reached. Date, time, and location fields are now locked."
                      : "Editing date, time, or location counts as a schedule change. Email notifications sent automatically."
                    }
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Booking Type Toggle */}
              <div className="space-y-2">
                <Label>Booking Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={bookingType === "QUANTITY" ? "default" : "outline"}
                    onClick={() => setBookingType("QUANTITY")}
                    className="flex-1 gap-2"
                  >
                    <Ticket className="h-4 w-4" />
                    Quantity Based
                  </Button>
                  <Button
                    type="button"
                    variant={bookingType === "SEAT_SELECTION" ? "default" : "outline"}
                    onClick={() => setBookingType("SEAT_SELECTION")}
                    className="flex-1 gap-2"
                  >
                    <Armchair className="h-4 w-4" />
                    Seat Selection
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {bookingType === "SEAT_SELECTION"
                    ? "Users will select specific seats from a visual layout"
                    : "Users will select ticket quantity"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
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
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location
                    {bookedSeatsCount > 0 && rescheduleCount < 2 && (
                      <span className="text-xs text-amber-600 ml-2">(counts as schedule change)</span>
                    )}
                    {rescheduleCount >= 2 && (
                      <span className="text-xs text-red-600 ml-2">(max changes reached)</span>
                    )}
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    disabled={bookedSeatsCount > 0 && rescheduleCount >= 2}
                    className={bookedSeatsCount > 0 && rescheduleCount >= 2 ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">
                    Event Date
                    {bookedSeatsCount > 0 && rescheduleCount < 2 && (
                      <span className="text-xs text-amber-600 ml-2">(counts as schedule change)</span>
                    )}
                    {rescheduleCount >= 2 && (
                      <span className="text-xs text-red-600 ml-2">(max changes reached)</span>
                    )}
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    disabled={bookedSeatsCount > 0 && rescheduleCount >= 2}
                    className={bookedSeatsCount > 0 && rescheduleCount >= 2 ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventTime">
                    Event Time
                    {bookedSeatsCount > 0 && rescheduleCount < 2 && (
                      <span className="text-xs text-amber-600 ml-2">(counts as schedule change)</span>
                    )}
                    {rescheduleCount >= 2 && (
                      <span className="text-xs text-red-600 ml-2">(max changes reached)</span>
                    )}
                  </Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    required
                    disabled={bookedSeatsCount > 0 && rescheduleCount >= 2}
                    className={bookedSeatsCount > 0 && rescheduleCount >= 2 ? "bg-muted cursor-not-allowed" : ""}
                  />
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
                      step="0.01"
                      value={formData.pricePerTicket || ""}
                      onChange={(e) => setFormData({ ...formData, pricePerTicket: Number.parseFloat(e.target.value) })}
                      required
                      min="0"
                    />
                  </div>
                </>
              )}

              {/* Seat Selection fields */}
              {bookingType === "SEAT_SELECTION" && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">Seat Categories</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure VIP, First Class, General, etc. with their own pricing and rows.
                    </p>
                  </div>

                  <SeatCategoryForm
                    categories={seatCategories}
                    onChange={setSeatCategories}
                  />

                  {totalSeatsFromCategories > 0 && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">
                        Total seats configured: <span className="text-primary">{totalSeatsFromCategories}</span>
                      </p>
                    </div>
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

              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Seat Layout Preview */}
        {bookingType === "SEAT_SELECTION" && (
          <Card className="lg:sticky lg:top-4 h-fit">
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

