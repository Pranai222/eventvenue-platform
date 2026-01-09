"use client"

import { useEffect, useState } from "react"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Coins, Search, Trash2, Shield, Briefcase, User as UserIcon, AlertTriangle } from "lucide-react"
import type { User } from "@/lib/types/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [pointsToAdjust, setPointsToAdjust] = useState(0)
  const [adjustReason, setAdjustReason] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    adminApi
      .getAllUsers()
      .then(setUsers)
      .catch((err) => {
        console.error("[EventVenue] Failed to load users:", err)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return
    setIsDeleting(true)
    try {
      await adminApi.deleteUser(deleteUser.id)
      setUsers(users.filter((u) => u.id !== deleteUser.id))
      setDeleteUser(null)
    } catch (error) {
      alert("Failed to delete user")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAdjustPoints = async () => {
    if (!selectedUser || !adjustReason.trim()) {
      alert("Please provide a reason for the adjustment")
      return
    }

    try {
      await adminApi.adjustUserPoints(selectedUser.id, pointsToAdjust, adjustReason)
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, points: u.points + pointsToAdjust } : u)))
      setSelectedUser(null)
      setPointsToAdjust(0)
      setAdjustReason("")
    } catch (error) {
      alert("Failed to adjust points")
    }
  }

  // Helper to get display name
  const getDisplayName = (user: User): string => {
    if (user.name) return user.name
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
    if (user.firstName) return user.firstName
    if (user.username) return user.username
    return user.email.split('@')[0]
  }

  // Filter users by search term
  const filteredUsers = users.filter(
    (user) => {
      const displayName = getDisplayName(user)
      return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    }
  )

  // Categorize users by role
  const allUsers = filteredUsers
  const adminUsers = filteredUsers.filter(u => u.role === "ADMIN")
  // Show ALL vendors (verified and unverified) so admin can manage them
  const vendorUsers = filteredUsers.filter(u => u.role === "VENDOR")
  const verifiedVendors = vendorUsers.filter(u => u.isVerified)
  const unverifiedVendors = vendorUsers.filter(u => !u.isVerified)
  const regularUsers = filteredUsers.filter(u => u.role === "USER")

  const renderUsersList = (usersList: User[], emptyMessage: string) => {
    if (usersList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {usersList.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {user.role === "ADMIN" ? (
                      <Shield className="h-8 w-8 text-primary" />
                    ) : user.role === "VENDOR" ? (
                      <Briefcase className="h-8 w-8 text-primary" />
                    ) : (
                      <UserIcon className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{getDisplayName(user)}</h3>
                          <Badge variant="outline" className="text-xs">ID: {user.id}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={
                            user.role === "ADMIN" ? "default" :
                              user.role === "VENDOR" ? "secondary" :
                                "outline"
                          }>
                            {user.role}
                          </Badge>
                          <Badge variant={user.isVerified ? "default" : "secondary"}>
                            {user.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Coins className="h-4 w-4 text-accent" />
                            <span className="font-medium">{user.points.toLocaleString()} points</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mt-3">
                      <strong>Registered:</strong> {new Date(user.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                        className="gap-2 bg-transparent"
                      >
                        <Coins className="h-4 w-4" />
                        Adjust Points
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteUser(user)}
                        className="gap-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and points</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{users.length}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User Categories Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All ({allUsers.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Shield className="h-4 w-4" />
            Admins ({adminUsers.length})
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Vendors ({vendorUsers.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UserIcon className="h-4 w-4" />
            Users ({regularUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderUsersList(allUsers, "No users found")}
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          {renderUsersList(adminUsers, "No admin users found")}
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <div className="mb-4 flex gap-2">
            <Badge variant="default" className="text-xs">
              {verifiedVendors.length} Verified
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {unverifiedVendors.length} Unverified
            </Badge>
          </div>
          {renderUsersList(vendorUsers, "No vendors found")}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {renderUsersList(regularUsers, "No regular users found")}
        </TabsContent>
      </Tabs>

      {/* Points Adjustment Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
            <DialogDescription>
              Modify points balance for {selectedUser ? getDisplayName(selectedUser) : ''}. Current balance: {selectedUser?.points.toLocaleString()}{" "}
              points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points Adjustment</Label>
              <Input
                id="points"
                type="number"
                placeholder="Enter positive or negative number"
                value={pointsToAdjust || ""}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || /^-?\d+$/.test(val)) {
                    setPointsToAdjust(val === "" ? 0 : parseInt(val, 10))
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                New balance will be: {selectedUser ? (selectedUser.points + pointsToAdjust).toLocaleString() : 0} points
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Enter reason for adjustment"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustPoints}>Apply Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg">Delete User</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This action cannot be undone
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {deleteUser && (
            <div className="bg-muted/50 rounded-lg p-4 my-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {deleteUser.role === "VENDOR" ? (
                    <Briefcase className="h-5 w-5 text-primary" />
                  ) : deleteUser.role === "ADMIN" ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{deleteUser.firstName || deleteUser.username || deleteUser.email.split('@')[0]}</p>
                  <p className="text-sm text-muted-foreground">{deleteUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{deleteUser.role}</Badge>
                    <Badge variant="secondary" className="text-xs">{deleteUser.points?.toLocaleString() || 0} points</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete this user? All associated data including bookings, reviews, and points will be removed.
          </p>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
