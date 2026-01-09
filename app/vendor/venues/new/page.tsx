"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { venuesApi, type VenueData } from "@/lib/api/venues"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/ImageUpload"
import { AlertCircle, CheckCircle, Building2 } from "lucide-react"
import LocationPicker from "@/components/location-picker"
import { usePlatformFees } from "@/lib/contexts/platform-fees-context"

export default function CreateVenuePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { platformFees } = usePlatformFees()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    city: "",
    address: "",
    capacity: 0,
    pricePerHour: 0,
    amenities: "",
    images: [] as string[],
    vendorPhone: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const venueData: Omit<VenueData, "id" | "vendorId"> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        city: formData.city,
        address: formData.address,
        capacity: Number(formData.capacity),
        pricePerHour: Number(formData.pricePerHour),
        amenities: formData.amenities,
        images: formData.images.join(","),
        isAvailable: true,
        rating: 0,
        totalBookings: 0,
        vendorPhone: formData.vendorPhone,
      }

      await venuesApi.create(venueData)
      setSuccess(true)
      setTimeout(() => {
        router.push("/vendor/venues")
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to create venue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Venue</h1>
        <p className="text-muted-foreground">Add your venue to the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
          <CardDescription>Provide information about your venue</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Venue created successfully!</AlertDescription>
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
              <Label htmlFor="name">Venue Name</Label>
              <Input
                id="name"
                placeholder="e.g., Grand Ballroom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your venue..."
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
                  placeholder="e.g., Wedding Hall, Conference Room"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City name"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <LocationPicker
              value={formData.address}
              onChange={(address) => setFormData({ ...formData, address })}
              label="Venue Location"
              placeholder="Enter venue address or click map icon to select"
              required
            />

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

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Maximum guests"
                  value={formData.capacity || ""}
                  onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerHour">Price Per Hour (₹)</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.pricePerHour || ""}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: Number.parseFloat(e.target.value) })}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                placeholder="e.g., WiFi, Parking, Sound System, Catering"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              />
            </div>

            <ImageUpload
              images={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
              type="venues"
              label="Venue Images"
              maxImages={10}
            />

            {/* Platform Fee Display */}
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Platform Fee</h4>
                    <p className="text-xs text-muted-foreground">Venue listing creation</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-primary">{platformFees.venueCreationPoints}</span>
                    <span className="text-sm text-muted-foreground">points</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Deducted on creation</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">
                  💡 Venue listings include unlimited bookings and full management features.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : `Create Venue (${platformFees.venueCreationPoints} pts)`}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
