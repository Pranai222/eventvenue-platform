"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { eventsApi } from "@/lib/api/events"
import { useAuth } from "@/lib/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, MapPin, Ticket, Search, User, SlidersHorizontal, X, DollarSign, Filter, LogOut, ArrowLeft, Star } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Event } from "@/lib/types/booking"
import ViewLocationMap from "@/components/view-location-map"

const EVENT_CATEGORIES = [
  "All Categories",
  "Conference",
  "Concert",
  "Workshop",
  "Seminar",
  "Festival",
  "Sports",
  "Exhibition",
  "Networking",
  "Other"
]

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("")
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    minPrice: "",
    maxPrice: "",
    dateFrom: "",
    dateTo: "",
    rating: "",
  })
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    eventsApi
      .getActive()
      .then((data) => {
        // Sort by ID descending to show newest events first
        const sortedEvents = Array.isArray(data) ? data.sort((a, b) => b.id - a.id) : []
        setEvents(sortedEvents)
      })
      .catch((error) => {
        console.error("[EventVenue] Failed to load events:", error)
        setEvents([])
      })
      .finally(() => setIsLoading(false))
  }, [])

  const filteredEvents = events.filter((event) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!event.name.toLowerCase().includes(searchLower) &&
        !event.location.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Category filter
    if (filters.category && filters.category !== "All Categories") {
      if (!event.category?.toLowerCase().includes(filters.category.toLowerCase())) {
        return false
      }
    }

    // Location filter
    if (filters.location) {
      if (!event.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false
      }
    }

    // Price filter
    if (filters.minPrice) {
      if (event.pricePerTicket < Number(filters.minPrice)) return false
    }
    if (filters.maxPrice) {
      if (event.pricePerTicket > Number(filters.maxPrice)) return false
    }

    // Date filter
    if (filters.dateFrom) {
      const eventDate = new Date(event.eventDate || event.date)
      if (eventDate < new Date(filters.dateFrom)) return false
    }
    if (filters.dateTo) {
      const eventDate = new Date(event.eventDate || event.date)
      if (eventDate > new Date(filters.dateTo)) return false
    }

    // Rating filter
    if (filters.rating && filters.rating !== "any") {
      if ((event.rating || 0) < Number(filters.rating)) return false
    }

    return true
  })

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      dateFrom: "",
      dateTo: "",
      rating: "",
    })
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "All Categories").length

  const getDashboardRoute = () => {
    if (!user) return "/"
    switch (user.role) {
      case "USER": return "/user/dashboard"
      case "VENDOR": return "/vendor/dashboard"
      case "ADMIN": return "/admin/dashboard"
      default: return "/"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">EventVenue</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/venues">
                <Button variant="ghost">Browse Venues</Button>
              </Link>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      {user.firstName || user.email?.split('@')[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardRoute()}>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/user/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Discover Exciting Events
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find and book tickets for amazing experiences near you
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-card border rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search events by name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Category Select */}
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="w-full lg:w-48 h-12">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Toggle Button */}
            <Button
              variant={showFilters ? "default" : "outline"}
              className="h-12 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-primary/20">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    placeholder="City or venue..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price Range
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    From Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    To Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Minimum Rating
                  </Label>
                  <Select
                    value={filters.rating}
                    onValueChange={(value) => setFilters({ ...filters, rating: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any rating</SelectItem>
                      <SelectItem value="4.5">4.5+ stars</SelectItem>
                      <SelectItem value="4">4+ stars</SelectItem>
                      <SelectItem value="3.5">3.5+ stars</SelectItem>
                      <SelectItem value="3">3+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="h-4 w-4 mr-1" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : `Found ${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}`}
          </p>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.category && filters.category !== "All Categories" && (
                <Badge variant="secondary">{filters.category}</Badge>
              )}
              {filters.location && (
                <Badge variant="secondary">{filters.location}</Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary">
                  ${filters.minPrice || 0} - ${filters.maxPrice || "∞"}
                </Badge>
              )}
              {filters.rating && filters.rating !== "any" && (
                <Badge variant="secondary">{filters.rating}+ stars</Badge>
              )}
            </div>
          )}
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-xl"></div>
                <div className="p-6 space-y-3 bg-card rounded-b-xl border border-t-0">
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Filter className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Try adjusting your search filters or check back later for new events
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={event.images && event.images.length > 0
                      ? event.images[0]
                      : `/placeholder.svg?height=300&width=500&text=${encodeURIComponent(event.name)}`}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <Badge className="absolute top-3 right-3 bg-primary/90">{event.category || "Event"}</Badge>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <p className="text-white text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.eventDate || event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {(event.rating || 0) > 0 && (
                      <div className="flex items-center gap-1 text-white text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{event.rating?.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition">
                    {event.name}
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedLocation(event.location)
                        setShowLocationPopup(true)
                      }}
                      className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1 hover:underline">{event.location}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Ticket className="h-3 w-3" />
                      <span>{event.ticketsAvailable} tickets available</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">₹{event.pricePerTicket}</p>
                      <p className="text-xs text-muted-foreground">per ticket</p>
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <Button size="sm" className="shadow-lg">Get Tickets</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Location Popup */}
      {showLocationPopup && selectedLocation && (
        <ViewLocationMap
          address={selectedLocation}
          onClose={() => setShowLocationPopup(false)}
        />
      )}
    </div>
  )
}
