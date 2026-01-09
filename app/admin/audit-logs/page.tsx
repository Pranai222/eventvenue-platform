"use client"

import { useEffect, useState } from "react"
import { adminApi, type AuditLog } from "@/lib/api/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollText, Filter, Clock, User, Building2, Calendar, Ticket, Settings, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

const INITIAL_DISPLAY_COUNT = 10

const entityTypes = [
    { value: "all", label: "All Types" },
    { value: "USER", label: "User" },
    { value: "VENDOR", label: "Vendor" },
    { value: "VENUE", label: "Venue" },
    { value: "EVENT", label: "Event" },
    { value: "BOOKING", label: "Booking" },
    { value: "REVIEW", label: "Review" },
    { value: "SETTINGS", label: "Settings" },
]

const actionTypes = [
    { value: "all", label: "All Actions" },
    { value: "CREATED", label: "Created" },
    { value: "UPDATED", label: "Updated" },
    { value: "DELETED", label: "Deleted" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "REGISTERED", label: "Registered" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "BOOKED", label: "Booked" },
]

const getEntityIcon = (entityType: string) => {
    switch (entityType) {
        case "USER":
            return <User className="h-4 w-4" />
        case "VENDOR":
            return <Building2 className="h-4 w-4" />
        case "VENUE":
            return <Building2 className="h-4 w-4" />
        case "EVENT":
            return <Ticket className="h-4 w-4" />
        case "BOOKING":
            return <Calendar className="h-4 w-4" />
        case "SETTINGS":
            return <Settings className="h-4 w-4" />
        default:
            return <ScrollText className="h-4 w-4" />
    }
}

const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("CREATED") || action.includes("APPROVED") || action.includes("REGISTERED")) {
        return "default"
    }
    if (action.includes("DELETED") || action.includes("REJECTED") || action.includes("CANCELLED")) {
        return "destructive"
    }
    if (action.includes("UPDATED") || action.includes("MODIFIED")) {
        return "secondary"
    }
    return "outline"
}

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterEntityType, setFilterEntityType] = useState("all")
    const [filterAction, setFilterAction] = useState("all")
    const [error, setError] = useState<string | null>(null)
    const [showAll, setShowAll] = useState(false)

    const loadLogs = async () => {
        setIsLoading(true)
        setError(null)
        try {
            let response
            if (filterEntityType === "all") {
                response = await adminApi.getAuditLogs()
            } else {
                response = await adminApi.getAuditLogsByEntityType(filterEntityType)
            }
            const data = Array.isArray(response) ? response : (response as any)?.data || []
            setLogs(data)
        } catch (err: any) {
            console.error("Failed to load audit logs:", err)
            if (err?.statusCode === 401 || err?.message?.includes("401")) {
                setError("Authentication error. Please ensure you are logged in as an admin and the backend is running with the latest code.")
            } else if (err?.statusCode === 404 || err?.message?.includes("404")) {
                setError("Audit logs endpoint not found. Please restart the backend server to load new endpoints.")
            } else {
                setError(err?.message || "Failed to load audit logs. Please ensure the backend is running.")
            }
            setLogs([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadLogs()
    }, [filterEntityType])

    // Apply action filter on loaded logs
    useEffect(() => {
        if (filterAction === "all") {
            setFilteredLogs(logs)
        } else {
            setFilteredLogs(logs.filter(log => log.action.includes(filterAction)))
        }
    }, [logs, filterAction])

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins} min ago`
        if (diffHours < 24) return `${diffHours} hr ago`
        if (diffDays < 7) return `${diffDays} days ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ScrollText className="h-8 w-8" />
                        Audit Logs
                    </h1>
                    <p className="text-muted-foreground">Track all system activities and changes</p>
                </div>
                <Button onClick={loadLogs} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-48">
                            <label className="text-sm font-medium mb-1 block">Entity Type</label>
                            <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {entityTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-48">
                            <label className="text-sm font-medium mb-1 block">Action Type</label>
                            <Select value={filterAction} onValueChange={setFilterAction}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                    {actionTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>
                        {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"} found
                        {(filterEntityType !== "all" || filterAction !== "all") && " (filtered)"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/3"></div>
                                        <div className="h-3 bg-muted rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <ScrollText className="h-12 w-12 mx-auto mb-4 text-destructive opacity-70" />
                            <p className="text-lg font-medium text-destructive">Error Loading Logs</p>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">{error}</p>
                            <Button onClick={loadLogs} variant="outline" className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No audit logs found</p>
                            <p className="text-sm">Activity logs will appear here as actions are performed</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(showAll ? filteredLogs : filteredLogs.slice(0, INITIAL_DISPLAY_COUNT)).map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                                >
                                    <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                        {getEntityIcon(log.entityType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                                                {log.action.replace(/_/g, " ")}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {log.entityType}
                                                {log.entityId ? ` #${log.entityId}` : ""}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-foreground">{log.description || "No description"}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {log.performedBy}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {log.userRole}
                                                </Badge>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTimeAgo(log.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* View All / Show Less Button */}
                            {filteredLogs.length > INITIAL_DISPLAY_COUNT && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAll(!showAll)}
                                        className="gap-2"
                                    >
                                        {showAll ? (
                                            <>
                                                <ChevronUp className="h-4 w-4" />
                                                Show Less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-4 w-4" />
                                                View All ({filteredLogs.length - INITIAL_DISPLAY_COUNT} more)
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
