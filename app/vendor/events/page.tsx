"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { eventsApi } from "@/lib/api/events"
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
import { Ticket, Plus, MapPin, CalendarIcon, Edit, Trash2, XCircle, AlertTriangle, Users, RefreshCw, Ban } from "lucide-react"
import type { Event } from "@/lib/types/booking"

export default function VendorEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [eventToCancel, setEventToCancel] = useState<Event | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    // Check for auth token first
    const token = localStorage.getItem("auth_token")
    const userStr = localStorage.getItem("auth_user")

    if (!token || !userStr) {
      window.location.href = "/login?role=vendor"
      return
    }

    try {
      const user = JSON.parse(userStr)
      if (user.role !== "VENDOR") {
        window.location.href = "/login?role=vendor"
        return
      }
    } catch {
      window.location.href = "/login?role=vendor"
      return
    }

    eventsApi
      .getVendorEvents()
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.id - a.id)
        setEvents(sorted)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const getBookedCount = (event: Event) => {
    return (event.totalTickets || 0) - (event.ticketsAvailable || 0)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return
    try {
      await eventsApi.delete(id)
      setEvents(events.filter((e) => e.id !== id))
    } catch (error) {
      console.error("Failed to delete event:", error)
      alert("Failed to delete event")
    }
  }

  const handleTogglePublish = async (event: Event) => {
    const bookedCount = getBookedCount(event)
    if (event.status === "PUBLISHED" && bookedCount > 0) {
      alert(`Cannot unpublish: ${bookedCount} tickets are already booked. You can cancel the event instead.`)
      return
    }
    try {
      if (event.status === "PUBLISHED") {
        await eventsApi.unpublish(event.id)
        setEvents(events.map((e) => (e.id === event.id ? { ...e, status: "DRAFT" as const } : e)))
      } else {
        await eventsApi.publish(event.id)
        setEvents(events.map((e) => (e.id === event.id ? { ...e, status: "PUBLISHED" as const } : e)))
      }
    } catch (error) {
      console.error("Failed to toggle publish:", error)
      alert("Failed to update event status")
    }
  }

  const openCancelModal = (event: Event) => {
    setEventToCancel(event)
    setCancelReason("")
    setShowCancelModal(true)
  }

  const handleCancelEvent = async () => {
    if (!eventToCancel || !cancelReason.trim()) return
    setIsCancelling(true)
    try {
      const response = await fetch(`http://localhost:8080/api/events/${eventToCancel.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ reason: cancelReason })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setEvents(events.map(e => e.id === eventToCancel.id ? { ...e, status: "CANCELLED" as any } : e))
        setShowCancelModal(false)
        alert("Event cancelled! All booked users have been notified and refunded 100%.")
      } else {
        alert(data.message || "Failed to cancel event")
      }
    } catch (error) {
      console.error("Failed to cancel event:", error)
      alert("Failed to cancel event")
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
          <h1 className="text-3xl font-bold mb-2">My Events</h1>
          <p className="text-muted-foreground">Manage your event listings</p>
        </div>
        <Link href="/vendor/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Ticket className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Create your first event to start selling tickets
            </p>
            <Link href="/vendor/events/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const bookedCount = getBookedCount(event)
            const isCancelled = (event as any).status === "CANCELLED"
            return (
              <Card key={event.id} className={`overflow-hidden hover:shadow-lg transition ${isCancelled ? 'opacity-60' : ''}`}>
                <div className="aspect-video bg-muted relative">
                  <img
                    src={event.images?.[0] || `/placeholder.svg?height=200&width=400`}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 right-3" variant={isCancelled ? "destructive" : event.status === "PUBLISHED" ? "default" : "secondary"}>
                    {isCancelled ? "CANCELLED" : event.status}
                  </Badge>
                  {bookedCount > 0 && !isCancelled && (
                    <Badge className="absolute top-3 left-3 gap-1" variant="outline">
                      <Users className="h-3 w-3" />{bookedCount} booked
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{new Date(event.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Capacity: {event.capacity} | Tickets: {event.ticketTypes?.length || 0} types
                  </div>
                  {isCancelled ? (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <Ban className="h-4 w-4" />This event has been cancelled
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link href={`/vendor/events/${event.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2"><Edit className="h-4 w-4" />Edit</Button>
                      </Link>
                      <Button variant={event.status === "PUBLISHED" ? "secondary" : "default"} size="sm" onClick={() => handleTogglePublish(event)} disabled={event.status === "PUBLISHED" && bookedCount > 0}>
                        {event.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </Button>
                      {bookedCount > 0 ? (
                        <Button variant="outline" size="sm" onClick={() => openCancelModal(event)} className="text-destructive border-destructive hover:bg-destructive hover:text-white">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel Event Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />Cancel Event
            </DialogTitle>
            <DialogDescription>This action cannot be undone. All booked users will be notified and receive a 100% refund.</DialogDescription>
          </DialogHeader>
          {eventToCancel && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-orange-50 to-red-50 dark:from-red-950/40 dark:via-orange-950/40 dark:to-red-950/40 border-2 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/20"><XCircle className="h-6 w-6 text-red-600" /></div>
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100">{eventToCancel.name}</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">{new Date(eventToCancel.date).toLocaleDateString()} • {eventToCancel.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mt-4">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                    <Users className="h-5 w-5 mx-auto mb-1 text-red-600" />
                    <p className="text-lg font-bold text-red-600">{getBookedCount(eventToCancel)}</p>
                    <p className="text-xs text-muted-foreground">Affected Users</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                    <RefreshCw className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-lg font-bold text-green-600">100%</p>
                    <p className="text-xs text-muted-foreground">Refund Rate</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800">
                    <Ticket className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-lg font-bold text-amber-600">{getBookedCount(eventToCancel)}</p>
                    <p className="text-xs text-muted-foreground">Tickets Refunded</p>
                  </div>
                </div>
              </div>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription><strong>Warning:</strong> All {getBookedCount(eventToCancel)} booked users will receive an email notification and their points will be fully refunded.</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                <Textarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Explain why you're cancelling this event..." rows={4} className="resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep Event</Button>
            <Button variant="destructive" onClick={handleCancelEvent} disabled={isCancelling || !cancelReason.trim()} className="gap-2">
              {isCancelling ? <><RefreshCw className="h-4 w-4 animate-spin" />Cancelling...</> : <><XCircle className="h-4 w-4" />Cancel Event & Refund All</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
