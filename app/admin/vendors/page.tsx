"use client"

import { useEffect, useState } from "react"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Check, X, Trash2 } from "lucide-react"
import type { Vendor } from "@/lib/types/auth"

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminApi
      .getAllVendors()
      .then(setVendors)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleApprove = async (id: number) => {
    try {
      await adminApi.approveVendor(id)
      setVendors(vendors.map((v) => (v.id === id ? { ...v, status: "APPROVED" as const } : v)))
    } catch (error) {
      alert("Failed to approve vendor")
    }
  }

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this vendor?")) return
    try {
      await adminApi.rejectVendor(id)
      setVendors(vendors.map((v) => (v.id === id ? { ...v, status: "REJECTED" as const } : v)))
    } catch (error) {
      alert("Failed to reject vendor")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) return
    try {
      await adminApi.deleteVendor(id)
      setVendors(vendors.filter((v) => v.id !== id))
    } catch (error) {
      alert("Failed to delete vendor")
    }
  }

  const pendingVendors = vendors.filter((v) => v.status === "PENDING")
  const approvedVendors = vendors.filter((v) => v.status === "APPROVED")
  const rejectedVendors = vendors.filter((v) => v.status === "REJECTED")

  const VendorCard = ({ vendor }: { vendor: Vendor }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 flex-1">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{vendor.businessName}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{vendor.email}</p>
                  <Badge
                    variant={
                      vendor.status === "APPROVED"
                        ? "default"
                        : vendor.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {vendor.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground mt-3">
                <div>
                  <strong>Email Verified:</strong> {vendor.isVerified ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Registered:</strong> {new Date(vendor.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {vendor.status === "PENDING" && (
                  <>
                    <Button size="sm" onClick={() => handleApprove(vendor.id)} className="gap-2">
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(vendor.id)} className="gap-2">
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {vendor.status === "REJECTED" && (
                  <Button size="sm" onClick={() => handleApprove(vendor.id)} className="gap-2">
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleDelete(vendor.id)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vendor Management</h1>
        <p className="text-muted-foreground">Review and manage vendor accounts</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingVendors.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedVendors.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedVendors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingVendors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending vendors</p>
              </CardContent>
            </Card>
          ) : (
            pendingVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedVendors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No approved vendors</p>
              </CardContent>
            </Card>
          ) : (
            approvedVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedVendors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No rejected vendors</p>
              </CardContent>
            </Card>
          ) : (
            rejectedVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
