"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { venuesApi, type VenueData } from "@/lib/api/venues"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/ImageUpload"
import { AlertCircle, CheckCircle, Lock, AlertTriangle } from "lucide-react"
import LocationPicker from "@/components/location-picker"

// Premium Edit Count Indicator Component with Industrial-Grade UI
function EditCountIndicator({ editCount, isLocked }: { editCount: number; isLocked: boolean }) {
  const maxEdits = 2
  const remaining = maxEdits - editCount
  const progressPercent = (editCount / maxEdits) * 100

  return (
    <div className={`relative overflow-hidden rounded-xl mb-6 ${isLocked
        ? 'bg-gradient-to-br from-red-950/90 via-red-900/80 to-red-950/90 border-2 border-red-500/50'
        : 'bg-gradient-to-br from-amber-950/90 via-amber-900/80 to-amber-950/90 border-2 border-amber-500/50'
      }`}>
      {/* Glow Effect */}
      <div className={`absolute inset-0 ${isLocked ? 'bg-red-500/10' : 'bg-amber-500/10'} blur-xl`} />

      {/* Main Content */}
      <div className="relative z-10 p-5">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Icon with Glow */}
            <div className={`relative p-3 rounded-xl ${isLocked
                ? 'bg-red-500/20 ring-2 ring-red-400/30'
                : 'bg-amber-500/20 ring-2 ring-amber-400/30'
              }`}>
              {isLocked ? (
                <Lock className={`h-6 w-6 ${isLocked ? 'text-red-400' : 'text-amber-400'}`} />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              )}
              {/* Pulse Effect */}
              {!isLocked && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-400 rounded-full animate-pulse" />
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h4 className={`font-bold text-lg ${isLocked ? 'text-red-200' : 'text-amber-200'}`}>
                {isLocked ? '🔒 Location Editing Locked' : '⚠️ Location Edit Limit'}
              </h4>
              <p className={`text-sm ${isLocked ? 'text-red-300/80' : 'text-amber-300/80'}`}>
                {isLocked
                  ? 'Maximum edits reached. Contact support for changes.'
                  : `${remaining} edit${remaining !== 1 ? 's' : ''} remaining for address/city`
                }
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${isLocked
              ? 'bg-red-500/30 text-red-200 ring-2 ring-red-400/40'
              : editCount === 1
                ? 'bg-amber-500/30 text-amber-200 ring-2 ring-amber-400/40'
                : 'bg-green-500/30 text-green-200 ring-2 ring-green-400/40'
            }`}>
            {isLocked ? 'LOCKED' : remaining === 2 ? 'READY' : 'LIMITED'}
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            {/* Progress Bar */}
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2">
                <span className={isLocked ? 'text-red-300' : 'text-amber-300'}>Edits Used</span>
                <span className={`font-mono font-bold ${isLocked ? 'text-red-200' : 'text-amber-200'}`}>
                  {editCount} / {maxEdits}
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${isLocked
                      ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'
                      : editCount === 1
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500'
                        : 'bg-gradient-to-r from-green-500 via-green-400 to-green-500'
                    }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex items-center gap-3">
              {[0, 1].map((dot) => (
                <div key={dot} className="relative">
                  {/* Outer Ring */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${dot < editCount
                      ? isLocked
                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                        : 'bg-amber-500 shadow-lg shadow-amber-500/50'
                      : 'bg-gray-700 border-2 border-dashed border-gray-500'
                    }`}>
                    {dot < editCount ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-xs text-gray-400 font-bold">{dot + 1}</span>
                    )}
                  </div>
                  {/* Glow Effect for Filled Dots */}
                  {dot < editCount && (
                    <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${isLocked ? 'bg-red-400' : 'bg-amber-400'
                      }`} style={{ animationDuration: '2s' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Text */}
        <p className={`text-xs mt-3 flex items-center gap-2 ${isLocked ? 'text-red-400' : 'text-amber-400'}`}>
          <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
          {isLocked
            ? 'Address and city fields are permanently locked after 2 edits'
            : 'Each address or city change counts towards the edit limit'
          }
        </p>
      </div>
    </div>
  )
}

export default function EditVenuePage() {
  const router = useRouter()
  const params = useParams()
  const venueId = Number(params.id)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [editCount, setEditCount] = useState(0)
  const [isEditLocked, setIsEditLocked] = useState(false)
  const [originalCity, setOriginalCity] = useState("")
  const [originalAddress, setOriginalAddress] = useState("")

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

  useEffect(() => {
    const loadVenue = async () => {
      try {
        const venue = await venuesApi.getById(venueId)
        setFormData({
          name: venue.name,
          description: venue.description,
          category: venue.category || "",
          city: venue.city,
          address: venue.address,
          capacity: venue.capacity,
          pricePerHour: venue.pricePerHour,
          amenities: venue.amenities?.join(", ") || "",
          images: venue.images || [],
          vendorPhone: venue.vendorPhone || "",
        })
        setOriginalCity(venue.city)
        setOriginalAddress(venue.address)
        setEditCount(venue.editCount || 0)
        setIsEditLocked(venue.isEditLocked || false)
      } catch (err: any) {
        setError(err.message || "Failed to load venue")
      } finally {
        setIsLoading(false)
      }
    }
    loadVenue()
  }, [venueId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const venueData: Partial<VenueData> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        city: formData.city,
        address: formData.address,
        capacity: Number(formData.capacity),
        pricePerHour: Number(formData.pricePerHour),
        amenities: formData.amenities,
        images: formData.images.join(','),
        vendorPhone: formData.vendorPhone,
      }

      await venuesApi.update(venueId, venueData)
      setSuccess(true)
      setTimeout(() => {
        router.push("/vendor/venues")
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to update venue")
    } finally {
      setIsSaving(false)
    }
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Venue</h1>
        <p className="text-muted-foreground">Update your venue information</p>
      </div>

      {/* Edit Count Indicator */}
      <EditCountIndicator editCount={editCount} isLocked={isEditLocked} />

      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
          <CardDescription>Modify your venue information</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Venue updated successfully!</AlertDescription>
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
                <Label htmlFor="city" className="flex items-center gap-2">
                  City
                  {isEditLocked && <Lock className="h-3 w-3 text-red-500" />}
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  disabled={isEditLocked}
                  className={isEditLocked ? "bg-gray-100 cursor-not-allowed" : ""}
                />
                {isEditLocked && (
                  <p className="text-xs text-red-500">Location editing is locked</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Venue Location
                {isEditLocked && <Lock className="h-3 w-3 text-red-500" />}
              </Label>
              {isEditLocked ? (
                <div className="p-3 bg-gray-100 border rounded-md text-gray-500 cursor-not-allowed">
                  {formData.address}
                  <p className="text-xs text-red-500 mt-1">Location editing is locked</p>
                </div>
              ) : (
                <LocationPicker
                  value={formData.address}
                  onChange={(address) => setFormData({ ...formData, address })}
                  label=""
                  placeholder="Enter venue address or click map icon to select"
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorPhone">Contact Phone Number</Label>
              <Input
                id="vendorPhone"
                type="tel"
                value={formData.vendorPhone}
                onChange={(e) => setFormData({ ...formData, vendorPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
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
    </div>
  )
}

