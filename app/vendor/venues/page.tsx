"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { venuesApi, type VenueData } from "@/lib/api/venues"
import { bookingsApi } from "@/lib/api/bookings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Building2, Plus, MapPin, Users, Edit, Trash2, XCircle, AlertTriangle, RefreshCw, Ban, Calendar } from "lucide-react"

export default function VendorVenuesPage() {
  const [venues, setVenues] = useState<VenueData[]>([])
  const [venueBookings, setVenueBookings] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [venueToCancel, setVenueToCancel] = useState<VenueData | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const venueData = await venuesApi.getVendorVenues()
        const sorted = [...venueData].sort((a, b) => b.id - a.id)
        setVenues(sorted)

        // Load booking counts for each venue
        const bookingCounts: Record<number, number> = {}
        for (const venue of sorted) {
          try {
            const bookings = await bookingsApi.getByVenue(venue.id)
            const activeBookings = bookings.filter((b: any) =>
              b.status === 'CONFIRMED' || b.status === 'PENDING'
            )
            bookingCounts[venue.id] = activeBookings.length
          } catch {
            bookingCounts[venue.id] = 0
          }
        }
        setVenueBookings(bookingCounts)
      } catch (error) {
        console.error("Failed to load venues:", error)
        setVenues([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleDelete = async (id: number) => {
    const bookingCount = venueBookings[id] || 0
    if (bookingCount > 0) {
      alert(`Cannot delete: ${bookingCount} active bookings exist. Please cancel the venue instead to refund all users.`)
      return
    }
    if (!confirm("Are you sure you want to delete this venue?")) return
    try {
      await venuesApi.delete(id)
      setVenues(venues.filter((v) => v.id !== id))
    } catch (error) {
      console.error("Failed to delete venue:", error)
      alert("Failed to delete venue")
    }
  }

  const handleTogglePublish = async (venue: VenueData) => {
    const bookingCount = venueBookings[venue.id] || 0
    if (venue.isAvailable && bookingCount > 0) {
      alert(`Cannot unpublish: ${bookingCount} active bookings exist. You can cancel the venue instead.`)
      return
    }
    try {
      if (venue.isAvailable) {
        await venuesApi.unpublish(venue.id)
        setVenues(venues.map((v) => (v.id === venue.id ? { ...v, isAvailable: false } : v)))
      } else {
        await venuesApi.publish(venue.id)
        setVenues(venues.map((v) => (v.id === venue.id ? { ...v, isAvailable: true } : v)))
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error)
      alert("Failed to update venue status")
    }
  }

  const openCancelModal = (venue: VenueData) => {
    setVenueToCancel(venue)
    setCancelReason("")
    setShowCancelModal(true)
  }

  const handleCancelVenue = async () => {
    if (!venueToCancel || !cancelReason.trim()) return
    setIsCancelling(true)
    try {
      // Cancel all venue bookings and refund users
      const response = await fetch(`http://localhost:8080/api/venues/${venueToCancel.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ reason: cancelReason })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setVenues(venues.map(v => v.id === venueToCancel.id ? { ...v, isAvailable: false } : v))
        setVenueBookings(prev => ({ ...prev, [venueToCancel.id]: 0 }))
        setShowCancelModal(false)
        alert("Venue cancelled! All bookings have been refunded and users notified.")
      } else {
        // If cancel endpoint doesn't exist, just unpublish
        await venuesApi.unpublish(venueToCancel.id)
        setVenues(venues.map(v => v.id === venueToCancel.id ? { ...v, isAvailable: false } : v))
        setShowCancelModal(false)
        alert("Venue unpublished. (Note: Please manually refund affected bookings)")
      }
    } catch (error) {
      console.error("Failed to cancel venue:", error)
      alert("Failed to cancel venue")
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Venues</h1>
          <p className="text-muted-foreground">Manage your venue listings</p>
        </div>
        <Link href="/vendor/venues/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Venue
          </Button>
        </Link>
      </div>

      {venues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No venues yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Start listing your venues to attract customers
            </p>
            <Link href="/vendor/venues/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Venue
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => {
            const bookingCount = venueBookings[venue.id] || 0
            return (
              <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="aspect-video bg-muted relative">
                  <img
                    src={venue.images?.[0] || `/placeholder.svg?height=200&width=400`}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 right-3" variant={venue.isAvailable ? "default" : "secondary"}>
                    {venue.isAvailable ? "Published" : "Unpublished"}
                  </Badge>
                  {bookingCount > 0 && (
                    <Badge className="absolute top-3 left-3 gap-1" variant="outline">
                      <Calendar className="h-3 w-3" />{bookingCount} bookings
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{venue.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />Capacity: {venue.capacity}
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-primary">₹{venue.pricePerHour}</span>
                      <span className="text-xs text-muted-foreground">/hr</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/vendor/venues/${venue.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2"><Edit className="h-4 w-4" />Edit</Button>
                    </Link>
                    <Button variant={venue.isAvailable ? "secondary" : "default"} size="sm" onClick={() => handleTogglePublish(venue)} disabled={venue.isAvailable && bookingCount > 0}>
                      {venue.isAvailable ? "Unpublish" : "Publish"}
                    </Button>
                    {bookingCount > 0 ? (
                      <Button variant="outline" size="sm" onClick={() => openCancelModal(venue)} className="text-destructive border-destructive hover:bg-destructive hover:text-white">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleDelete(venue.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel Venue Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />Cancel Venue & Refund All Bookings
            </DialogTitle>
            <DialogDescription>This will cancel all existing bookings and refund users 100% of their points.</DialogDescription>
          </DialogHeader>
          {venueToCancel && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-orange-50 to-red-50 dark:from-red-950/40 dark:via-orange-950/40 dark:to-red-950/40 border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20"><Building2 className="h-6 w-6 text-red-600" /></div>
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100">{venueToCancel.name}</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">{venueToCancel.city} • Capacity: {venueToCancel.capacity}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mt-4">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                    <Users className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <p className="text-lg font-bold text-red-600">{venueBookings[venueToCancel.id] || 0}</p>
                    <p className="text-xs text-muted-foreground">Affected Bookings</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                    <RefreshCw className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-lg font-bold text-green-600">100%</p>
                    <p className="text-xs text-muted-foreground">Refund Rate</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-lg font-bold text-amber-600">{venueBookings[venueToCancel.id] || 0}</p>
                    <p className="text-xs text-muted-foreground">Slots Cancelled</p>
                  </div>
                </div>
              </div>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription><strong>Warning:</strong> All affected users will receive email notifications and full refunds.</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                <Textarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Explain why you're cancelling this venue..." rows={4} className="resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep Venue</Button>
            <Button variant="destructive" onClick={handleCancelVenue} disabled={isCancelling || !cancelReason.trim()} className="gap-2">
              {isCancelling ? <><RefreshCw className="h-4 w-4 animate-spin" />Cancelling...</> : <><XCircle className="h-4 w-4" />Cancel & Refund All</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
