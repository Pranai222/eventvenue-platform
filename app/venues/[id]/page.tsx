"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { venuesApi } from "@/lib/api/venues"
import { authApi } from "@/lib/api/auth"
import { useAuth } from "@/lib/contexts/auth-context"
import { VenueBookingForm } from "@/components/booking/venue-booking-form"
import { ReviewSection } from "@/components/reviews"
import { ImageGallery } from "@/components/ImageGallery"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Star, ArrowLeft, Wifi, Coffee, Utensils, Phone, Mail, Building2 } from "lucide-react"
import type { Venue } from "@/lib/types/booking"
import dynamic from "next/dynamic"
const ViewLocationMap = dynamic(() => import("@/components/view-location-map"), { ssr: false })

export default function VenueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [userPoints, setUserPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showLocationMap, setShowLocationMap] = useState(false)

  useEffect(() => {
    const venueId = Number(params.id)
    if (!venueId) {
      router.push("/venues")
      return
    }

    Promise.all([venuesApi.getById(venueId), user?.role === "USER" ? authApi.getUserProfile() : Promise.resolve(null)])
      .then(([venueData, profileResponse]) => {
        setVenue(venueData)
        if (profileResponse && typeof profileResponse === 'object') {
          // Handle both direct response and wrapped response
          const profile: any = 'data' in profileResponse ? profileResponse.data : profileResponse
          setUserPoints(profile?.points || 0)
        }
      })
      .catch((error) => {
        console.error("[pranai] Failed to load venue:", error)
        router.push("/venues")
      })
      .finally(() => setIsLoading(false))
  }, [params.id, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading venue...</p>
        </div>
      </div>
    )
  }

  if (!venue) return null

  // Safely handle images - runtime data might be string despite type definition
  const venueImagesRaw = venue.images as any
  const venueImages: string[] = Array.isArray(venueImagesRaw)
    ? venueImagesRaw
    : (venueImagesRaw && typeof venueImagesRaw === 'string' ? venueImagesRaw.split(",").map((i: string) => i.trim()) : [])

  const amenityIcons: Record<string, any> = {
    WiFi: Wifi,
    Coffee: Coffee,
    Catering: Utensils,
  }

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
          Back to Venues
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={venueImages} alt={venue.name} />

            {/* Details */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{venue.name}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <button
                      onClick={() => setShowLocationMap(true)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                      title="View on map"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>{venue.location}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Up to {venue.capacity} guests</span>
                    </div>
                    {venue.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span>
                          {venue.rating.toFixed(1)} ({venue.reviewCount} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {venue.featured && <Badge variant="secondary">Featured</Badge>}
              </div>

              <h2 className="text-2xl font-semibold mb-3">About This Venue</h2>
              <p className="text-muted-foreground leading-relaxed">{venue.description}</p>
            </div>

            {/* Host Information */}
            {(venue.vendorBusinessName || venue.vendorBusinessPhone || venue.vendorEmail) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Hosted by {venue.vendorBusinessName || "Vendor"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {venue.vendorBusinessPhone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Phone</p>
                        <p className="text-sm hover:text-primary transition-colors">
                          <a href={`tel:${venue.vendorBusinessPhone}`}>{venue.vendorBusinessPhone}</a>
                        </p>
                      </div>
                    </div>
                  )}
                  {venue.vendorEmail && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Email</p>
                        <p className="text-sm hover:text-primary transition-colors">
                          <a href={`mailto:${venue.vendorEmail}`}>{venue.vendorEmail}</a>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {venue.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                  <CardDescription>What this venue offers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {venue.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity] || Calendar
                      return (
                        <div key={amenity} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <ReviewSection
              venueId={venue.id}
              currentUserId={user?.role === "USER" ? user?.userId : undefined}
            />
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {user?.role === "USER" ? (
                venue.availability ? (
                  <VenueBookingForm venue={venue} userPoints={userPoints} />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground mb-4">This venue is currently unavailable for booking</p>
                      <Link href="/venues">
                        <Button variant="outline" className="w-full bg-transparent">
                          Browse Other Venues
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary">${venue.pricePerDay}</CardTitle>
                    <CardDescription>per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">Sign in to book this venue</p>
                    <Link href="/login?role=user">
                      <Button className="w-full">Sign In to Book</Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Don&apos;t have an account?{" "}
                      <Link href="/signup?role=user" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Map Modal */}
      {showLocationMap && (
        <ViewLocationMap
          address={venue.location}
          onClose={() => setShowLocationMap(false)}
        />
      )}
    </div>
  )
}
