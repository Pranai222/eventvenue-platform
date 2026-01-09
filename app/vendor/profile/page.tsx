"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

interface VendorProfile {
  id?: number
  email: string
  businessName: string
  businessDescription?: string
  businessPhone?: string
  businessAddress?: string
  city?: string
  state?: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  isVerified: boolean
  createdAt?: string
}

export default function VendorProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    businessPhone: "",
    businessAddress: "",
    city: "",
    state: "",
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          router.push("/login?role=vendor")
          return
        }

        const response = await authApi.getVendorProfile()
        const data = response?.data || response
        setProfile(data)
        setFormData({
          businessName: data.businessName || "",
          businessDescription: data.businessDescription || "",
          businessPhone: data.businessPhone || "",
          businessAddress: data.businessAddress || "",
          city: data.city || "",
          state: data.state || "",
        })
      } catch (err: any) {
        if (err.statusCode === 401) {
          router.push("/login?role=vendor")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess(false)

    try {
      await authApi.updateVendorProfile(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load vendor profile</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vendor Profile</h1>
        <p className="text-muted-foreground">Manage your business information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your vendor details</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Profile updated successfully!</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Status Section */}
            <div className="pb-6 border-b space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Account Status</h3>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      profile.status === "APPROVED"
                        ? "default"
                        : profile.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {profile.status}
                  </Badge>
                  {!profile.isVerified && <Badge variant="outline">Email Not Verified</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.status === "PENDING"
                  ? "Your account is awaiting admin approval."
                  : profile.status === "APPROVED"
                    ? "Your account is approved and active."
                    : "Your account has been rejected."}
              </p>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description</Label>
              <Input
                id="businessDescription"
                placeholder="Brief description of your business"
                value={formData.businessDescription}
                onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              />
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Phone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City name"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="businessAddress">Address</Label>
              <Input
                id="businessAddress"
                placeholder="Business address"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
