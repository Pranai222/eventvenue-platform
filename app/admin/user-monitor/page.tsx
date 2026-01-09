"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Eye, Briefcase, User as UserIcon, Coins, Filter, X } from "lucide-react"
import type { User } from "@/lib/types/auth"

interface Vendor {
    id: number
    email: string
    businessName: string
}

export default function AdminUserMonitorPage() {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("all")

    // Advanced filters
    const [showFilters, setShowFilters] = useState(false)
    const [filterRole, setFilterRole] = useState<string>("all")
    const [filterMinPoints, setFilterMinPoints] = useState("")
    const [filterMaxPoints, setFilterMaxPoints] = useState("")
    const [filterId, setFilterId] = useState("")
    const [filterVendorId, setFilterVendorId] = useState("")
    const [filterEmail, setFilterEmail] = useState("")

    const API_BASE_URL = "http://localhost:8080"

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get auth token
                const token = localStorage.getItem("auth_token")
                const headers: Record<string, string> = {
                    "Content-Type": "application/json"
                }
                if (token) {
                    headers["Authorization"] = `Bearer ${token}`
                }

                // Fetch all users from backend
                const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers })
                if (res.ok) {
                    const data = await res.json()
                    const usersData = data.data || data || []
                    setUsers(Array.isArray(usersData) ? usersData : [])
                } else {
                    console.error("Failed to fetch users:", res.status)
                    setUsers([])
                }

                // Fetch all vendors to get Vendor IDs
                const vendorsRes = await fetch(`${API_BASE_URL}/api/admin/vendors`, { headers })
                if (vendorsRes.ok) {
                    const vendorsData = await vendorsRes.json()
                    const vendorsList = vendorsData.data || vendorsData || []
                    setVendors(Array.isArray(vendorsList) ? vendorsList : [])
                }
            } catch (err) {
                console.error("Failed to load users:", err)
                setUsers([])
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    // Create a map of email to vendor ID for quick lookup
    const vendorMap = new Map<string, number>()
    vendors.forEach(v => vendorMap.set(v.email.toLowerCase(), v.id))

    const handleViewDetails = (userId: number) => {
        router.push(`/admin/user-monitor/${userId}`)
    }

    const getDisplayName = (user: User): string => {
        if (user.name) return user.name
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
        if (user.firstName) return user.firstName
        if (user.username) return user.username
        return user.email.split('@')[0]
    }

    const getVendorId = (user: User): number | null => {
        if (user.role !== "VENDOR") return null
        return vendorMap.get(user.email.toLowerCase()) || null
    }

    const hasActiveFilters = filterRole !== "all" || filterMinPoints || filterMaxPoints || filterId || filterVendorId || filterEmail

    const clearFilters = () => {
        setFilterRole("all")
        setFilterMinPoints("")
        setFilterMaxPoints("")
        setFilterId("")
        setFilterVendorId("")
        setFilterEmail("")
        setSearchTerm("")
    }

    const filteredUsers = users.filter(user => {
        // Text search (name or email)
        const displayName = getDisplayName(user)
        const matchesSearch = !searchTerm ||
            displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id.toString().includes(searchTerm)

        // Role filter
        const matchesRole = filterRole === "all" || user.role === filterRole

        // Points range filter
        const points = user.points || 0
        const matchesMinPoints = !filterMinPoints || points >= parseInt(filterMinPoints)
        const matchesMaxPoints = !filterMaxPoints || points <= parseInt(filterMaxPoints)

        // User ID filter (for USER role or all)
        const matchesId = !filterId || user.id.toString().includes(filterId)

        // Vendor ID filter (for VENDOR role)
        const vendorId = getVendorId(user)
        const matchesVendorId = !filterVendorId || (vendorId && vendorId.toString().includes(filterVendorId))

        // Email filter
        const matchesEmail = !filterEmail || user.email.toLowerCase().includes(filterEmail.toLowerCase())

        return matchesSearch && matchesRole && matchesMinPoints && matchesMaxPoints && matchesId && matchesVendorId && matchesEmail
    })

    const allUsersFiltered = filteredUsers.filter(u => u.role !== "ADMIN")
    const vendorUsers = filteredUsers.filter(u => u.role === "VENDOR")
    const regularUsers = filteredUsers.filter(u => u.role === "USER")

    const renderUserCard = (user: User) => {
        const vendorId = getVendorId(user)

        return (
            <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewDetails(user.id)}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                {user.role === "VENDOR" ? (
                                    <Briefcase className="h-6 w-6 text-primary" />
                                ) : (
                                    <UserIcon className="h-6 w-6 text-primary" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold">{getDisplayName(user)}</h3>
                                    {user.role === "VENDOR" ? (
                                        vendorId ? (
                                            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">Vendor ID: {vendorId}</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950 text-red-700">User ID: {user.id} (No Vendor Record)</Badge>
                                        )
                                    ) : (
                                        <Badge variant="outline" className="text-xs">User ID: {user.id}</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant={user.role === "VENDOR" ? "secondary" : "outline"} className="text-xs">
                                        {user.role}
                                    </Badge>
                                    <Badge variant={user.isVerified ? "default" : "secondary"} className="text-xs">
                                        {user.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Coins className="h-3 w-3" /> {user.points?.toLocaleString() || 0} pts
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button onClick={(e) => { e.stopPropagation(); handleViewDetails(user.id); }} className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-12 bg-muted rounded"></div>
                    <div className="h-32 bg-muted rounded"></div>
                    <div className="h-32 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Eye className="h-8 w-8" />
                    User Monitor
                </h1>
                <p className="text-muted-foreground">
                    Click on any user or vendor to view their complete activity details
                </p>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    {/* Search Row */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">{[filterRole !== "all", filterMinPoints, filterMaxPoints, filterId, filterVendorId, filterEmail].filter(Boolean).length}</Badge>}
                        </Button>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear all filters">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Role</label>
                                <Select value={filterRole} onValueChange={setFilterRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="USER">Users</SelectItem>
                                        <SelectItem value="VENDOR">Vendors</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* User ID - show for Users or All Roles */}
                            {(filterRole === "all" || filterRole === "USER") && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">User ID</label>
                                    <Input
                                        placeholder="Filter by User ID..."
                                        value={filterId}
                                        onChange={(e) => setFilterId(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                            )}
                            {/* Vendor ID - show for Vendors or All Roles */}
                            {(filterRole === "all" || filterRole === "VENDOR") && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Vendor ID</label>
                                    <Input
                                        placeholder="Filter by Vendor ID..."
                                        value={filterVendorId}
                                        onChange={(e) => setFilterVendorId(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Email</label>
                                <Input
                                    placeholder="Filter by email..."
                                    value={filterEmail}
                                    onChange={(e) => setFilterEmail(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Min Points</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={filterMinPoints}
                                    onChange={(e) => setFilterMinPoints(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Max Points</label>
                                <Input
                                    type="number"
                                    placeholder="∞"
                                    value={filterMaxPoints}
                                    onChange={(e) => setFilterMaxPoints(e.target.value)}
                                    className="h-10"
                                />
                            </div>
                        </div>
                    )}

                    {/* Filter Results Info */}
                    {(searchTerm || hasActiveFilters) && (
                        <div className="text-sm text-muted-foreground">
                            Found {allUsersFiltered.length} user{allUsersFiltered.length !== 1 ? 's' : ''} matching your criteria
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="gap-2">
                        <Users className="h-4 w-4" />
                        All ({allUsersFiltered.length})
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

                <TabsContent value="all" className="mt-6 space-y-3">
                    {allUsersFiltered.length === 0 ? (
                        <Card><CardContent className="text-center py-8 text-muted-foreground">No users found</CardContent></Card>
                    ) : (
                        allUsersFiltered.map(renderUserCard)
                    )}
                </TabsContent>

                <TabsContent value="vendors" className="mt-6 space-y-3">
                    {vendorUsers.length === 0 ? (
                        <Card><CardContent className="text-center py-8 text-muted-foreground">No vendors found</CardContent></Card>
                    ) : (
                        vendorUsers.map(renderUserCard)
                    )}
                </TabsContent>

                <TabsContent value="users" className="mt-6 space-y-3">
                    {regularUsers.length === 0 ? (
                        <Card><CardContent className="text-center py-8 text-muted-foreground">No users found</CardContent></Card>
                    ) : (
                        regularUsers.map(renderUserCard)
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
