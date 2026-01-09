"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { venuesApi } from "@/lib/api/venues"
import type { Venue } from "@/lib/types/booking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, MapPin, Users, Star, Search, SlidersHorizontal, User, LogOut, DollarSign, X, Filter, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ViewLocationMap from "@/components/view-location-map"

const VENUE_TYPES = [
  "All Types",
  "Conference Hall",
  "Banquet Hall",
  "Outdoor Venue",
  "Hotel",
  "Restaurant",
  "Rooftop",
  "Garden",
  "Auditorium",
  "Studio",
  "Other"
]

const CAPACITY_OPTIONS = [
  { label: "Any Capacity", value: "any" },
  { label: "Up to 50 guests", value: "50" },
  { label: "50 - 100 guests", value: "100" },
  { label: "100 - 200 guests", value: "200" },
  { label: "200 - 500 guests", value: "500" },
  { label: "500+ guests", value: "501" },
]

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [allVenues, setAllVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("")
  const [filters, setFilters] = useState({
    search: "",
    venueType: "",
    location: "",
    minPrice: "",
    maxPrice: "",
    capacity: "",
    rating: "",
  })
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    setIsLoading(true)
    try {
      const venuesData = await venuesApi.getAll()
      const venuesList = Array.isArray(venuesData) ? venuesData : []
      // Sort by ID descending to show newest venues first
      const sortedVenues = venuesList.sort((a, b) => b.id - a.id)
      setAllVenues(sortedVenues)
      setVenues(sortedVenues)
    } catch (error) {
      console.error("Failed to load venues:", error)
      setVenues([])
      setAllVenues([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter venues based on current filters
  const filteredVenues = allVenues.filter((venue) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!venue.name.toLowerCase().includes(searchLower) &&
        !(venue.city || "").toLowerCase().includes(searchLower) &&
        !(venue.address || "").toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Venue type filter
    if (filters.venueType && filters.venueType !== "All Types") {
      const venueCategory = venue.category || venue.name || ""
      if (!venueCategory.toLowerCase().includes(filters.venueType.toLowerCase())) {
        return false
      }
    }

    // Location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase()
      if (!(venue.city || "").toLowerCase().includes(locationLower) &&
        !(venue.address || "").toLowerCase().includes(locationLower)) {
        return false
      }
    }

    // Price filter
    if (filters.minPrice) {
      if (venue.pricePerHour < Number(filters.minPrice)) return false
    }
    if (filters.maxPrice) {
      if (venue.pricePerHour > Number(filters.maxPrice)) return false
    }

    // Capacity filter
    if (filters.capacity && filters.capacity !== "any") {
      if (venue.capacity < Number(filters.capacity)) return false
    }

    // Rating filter
    if (filters.rating && filters.rating !== "any") {
      if ((venue.rating || 0) < Number(filters.rating)) return false
    }

    return true
  })

  const clearFilters = () => {
    setFilters({
      search: "",
      venueType: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      capacity: "",
      rating: "",
    })
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "All Types").length

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
              <Link href="/events">
                <Button variant="ghost">Browse Events</Button>
              </Link>
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="h-4 w-4" />
                      {user.firstName || user.email?.split('@')[0] || 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardRoute()}>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={user.role === "USER" ? "/user/profile" : "/vendor/profile"}>Profile</Link>
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
            Discover Amazing Venues
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find the perfect space for your next event, meeting, or celebration
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-card border rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search venues by name or location..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Venue Type Select */}
            <Select
              value={filters.venueType}
              onValueChange={(value) => setFilters({ ...filters, venueType: value })}
            >
              <SelectTrigger className="w-full lg:w-48 h-12">
                <SelectValue placeholder="Venue Type" />
              </SelectTrigger>
              <SelectContent>
                {VENUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
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
                    placeholder="City or address..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price Range (per hour)
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

                {/* Capacity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Minimum Capacity
                  </Label>
                  <Select
                    value={filters.capacity}
                    onValueChange={(value) => setFilters({ ...filters, capacity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPACITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value || "any"}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* Results Count & Active Filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : `Found ${filteredVenues.length} venue${filteredVenues.length !== 1 ? "s" : ""}`}
          </p>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.venueType && filters.venueType !== "All Types" && (
                <Badge variant="secondary">{filters.venueType}</Badge>
              )}
              {filters.location && (
                <Badge variant="secondary">{filters.location}</Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary">
                  ${filters.minPrice || 0} - ${filters.maxPrice || "∞"}/hr
                </Badge>
              )}
              {filters.capacity && filters.capacity !== "any" && (
                <Badge variant="secondary">{filters.capacity}+ guests</Badge>
              )}
              {filters.rating && filters.rating !== "any" && (
                <Badge variant="secondary">{filters.rating}+ stars</Badge>
              )}
            </div>
          )}
        </div>

        {/* Venues Grid */}
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
        ) : filteredVenues.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Filter className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No venues found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Try adjusting your search filters or check back later for new listings
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => {
              const location = venue.city || venue.address || "Location not specified"
              const venueImages = venue.images as any
              const images: string[] = Array.isArray(venueImages)
                ? venueImages
                : (venueImages && typeof venueImages === 'string' ? venueImages.split(",").map(s => s.trim()).filter(s => s) : [])

              return (
                <Card key={venue.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={images[0] || `/placeholder.svg?height=300&width=500&text=Venue`}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {!venue.isAvailable && (
                      <Badge className="absolute top-3 left-3" variant="destructive">
                        Unavailable
                      </Badge>
                    )}
                    {(venue as any).venueType && (
                      <Badge className="absolute top-3 right-3 bg-primary/90">{(venue as any).venueType}</Badge>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Users className="h-4 w-4" />
                        <span>{venue.capacity} guests</span>
                      </div>
                      {venue.rating > 0 && (
                        <div className="flex items-center gap-1 text-white text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{venue.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition">
                      {venue.name}
                    </CardTitle>
                    <CardDescription>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedLocation(location)
                          setShowLocationPopup(true)
                        }}
                        className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1 hover:underline">{location}</span>
                      </button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">₹{venue.pricePerHour}</p>
                        <p className="text-xs text-muted-foreground">per hour</p>
                      </div>
                      <Link href={`/venues/${venue.id}`}>
                        <Button size="sm" className="shadow-lg">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
