"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { adminApi, type PlatformFees } from "@/lib/api/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Coins, Settings } from "lucide-react"

export default function AdminSettingsPage() {
  const [conversionRate, setConversionRate] = useState(1)
  const [newRate, setNewRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Platform fees state
  const [platformFees, setPlatformFees] = useState<PlatformFees>({
    userPlatformFeePoints: 2,
    venueCreationPoints: 10,
    eventCreationPointsQuantity: 10,
    eventCreationPointsSeat: 20,
  })
  const [isSavingFees, setIsSavingFees] = useState(false)
  const [feesMessage, setFeesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [rateData, feesData] = await Promise.all([
          adminApi.getConversionRate(),
          adminApi.getPlatformFees()
        ])
        setConversionRate(rateData.pointsPerDollar)
        setNewRate(rateData.pointsPerDollar)
        setPlatformFees(feesData)
      } catch (error) {
        console.error("Failed to load settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSaving(true)

    try {
      await adminApi.updateConversionRate(newRate)
      setConversionRate(newRate)
      setMessage({ type: "success", text: "Conversion rate updated successfully!" })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update conversion rate" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFees = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeesMessage(null)
    setIsSavingFees(true)

    try {
      await adminApi.updatePlatformFees(platformFees)
      setFeesMessage({ type: "success", text: "Platform fees updated successfully!" })
    } catch (error: any) {
      setFeesMessage({ type: "error", text: error.message || "Failed to update platform fees" })
    } finally {
      setIsSavingFees(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings</p>
        </div>

        {/* Points Conversion Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent" />
              <CardTitle>Points Conversion Rate</CardTitle>
            </div>
            <CardDescription>Set how many points equal one rupee</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                  {message.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="rate">Points per ₹1</Label>
                <Input
                  id="rate"
                  type="number"
                  min={1}
                  value={newRate || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "" || /^\d+$/.test(val)) {
                      setNewRate(val === "" ? 0 : parseInt(val, 10))
                    }
                  }}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Current: {conversionRate} pts = ₹1
                </p>
              </div>

              <Button type="submit" disabled={isSaving || newRate === conversionRate}>
                {isSaving ? "Updating..." : "Update Conversion Rate"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Platform Fees */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              <CardTitle>Platform Fees</CardTitle>
            </div>
            <CardDescription>Configure point charges for users and vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveFees} className="space-y-4">
              {feesMessage && (
                <Alert variant={feesMessage.type === "error" ? "destructive" : "default"}>
                  {feesMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{feesMessage.text}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userFee">User Platform Fee (pts)</Label>
                  <Input
                    id="userFee"
                    type="number"
                    min={0}
                    value={platformFees.userPlatformFeePoints}
                    onChange={(e) => setPlatformFees({ ...platformFees, userPlatformFeePoints: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Added to user bookings</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venueCreation">Venue Creation (pts)</Label>
                  <Input
                    id="venueCreation"
                    type="number"
                    min={0}
                    value={platformFees.venueCreationPoints}
                    onChange={(e) => setPlatformFees({ ...platformFees, venueCreationPoints: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Deducted from vendor</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventQty">Event (Quantity) (pts)</Label>
                  <Input
                    id="eventQty"
                    type="number"
                    min={0}
                    value={platformFees.eventCreationPointsQuantity}
                    onChange={(e) => setPlatformFees({ ...platformFees, eventCreationPointsQuantity: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Quantity-based event</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventSeat">Event (Seat-based) (pts)</Label>
                  <Input
                    id="eventSeat"
                    type="number"
                    min={0}
                    value={platformFees.eventCreationPointsSeat}
                    onChange={(e) => setPlatformFees({ ...platformFees, eventCreationPointsSeat: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Seat-selection event</p>
                </div>
              </div>

              <Button type="submit" disabled={isSavingFees}>
                {isSavingFees ? "Saving..." : "Save Platform Fees"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
