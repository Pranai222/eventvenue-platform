"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { pointsApi, type PointHistory } from "@/lib/api/points"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    TrendingUp, TrendingDown, Coins, Calendar, Search, Filter,
    ArrowUpRight, ArrowDownRight, ShoppingCart, Gift, DollarSign,
    Award, Clock, ChevronRight, Sparkles, Activity
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function PointsHistoryPage() {
    const { user } = useAuth()
    const { conversionRate } = useConversionRate()
    const [history, setHistory] = useState<PointHistory[]>([])
    const [creditRequests, setCreditRequests] = useState<any[]>([])
    const [filteredHistory, setFilteredHistory] = useState<PointHistory[]>([])
    const [displayedHistory, setDisplayedHistory] = useState<PointHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        loadHistory()
    }, [])

    useEffect(() => {
        filterHistory()
    }, [history, creditRequests, searchTerm, filterType])

    useEffect(() => {
        // Show only top 10 or all based on showAll state
        if (showAll) {
            setDisplayedHistory(filteredHistory)
        } else {
            setDisplayedHistory(filteredHistory.slice(0, 10))
        }
    }, [filteredHistory, showAll])

    const loadHistory = async () => {
        try {
            const data = await pointsApi.getHistory()
            // Data is already sorted by createdAt DESC from backend
            setHistory(data)

            // Also fetch credit requests
            try {
                const token = localStorage.getItem('auth_token')
                const userProfile = await fetch('http://localhost:8080/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (userProfile.ok) {
                    const profile = await userProfile.json()
                    const userId = profile.id || profile.userId
                    console.log('[PointsHistory] Fetching credit requests for userId:', userId)
                    if (userId) {
                        const crResponse = await fetch(`http://localhost:8080/api/credit-requests/user/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        console.log('[PointsHistory] Credit requests response status:', crResponse.status)
                        if (crResponse.ok) {
                            const crData = await crResponse.json()
                            console.log('[PointsHistory] Credit requests data:', crData)
                            setCreditRequests(Array.isArray(crData) ? crData : [])
                        } else {
                            console.log('[PointsHistory] Credit requests fetch failed:', crResponse.statusText)
                        }
                    }
                }
            } catch (e) {
                console.log('[PointsHistory] Error fetching credit requests:', e)
            }
        } catch (error) {
            console.error("Failed to load points history:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const filterHistory = () => {
        // Convert credit requests to PointHistory format
        const requestsAsHistory: PointHistory[] = creditRequests.map(cr => ({
            id: cr.id + 1000000, // Offset to avoid ID collision
            userId: cr.userId,
            pointsChanged: cr.pointsRequested, // Always show the requested points
            previousPoints: 0,
            newPoints: cr.status === 'APPROVED' ? cr.pointsRequested : 0,
            reason: cr.status === 'APPROVED'
                ? `Credit Request Approved`
                : cr.status === 'PENDING'
                    ? `Credit Request Pending`
                    : `Credit Request ${cr.status}`,
            createdAt: cr.createdAt,
            _isRequest: true,
            _requestStatus: cr.status,
            _requestPoints: cr.pointsRequested
        } as any))

        // Merge history and requests
        let merged = [...history, ...requestsAsHistory]

        // Sort by date DESC
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        let filtered = merged

        // Filter by type
        if (filterType !== "all") {
            if (filterType === "earned") {
                filtered = filtered.filter(h => h.pointsChanged > 0 && !(h as any)._isRequest)
            } else if (filterType === "spent") {
                filtered = filtered.filter(h => h.pointsChanged < 0)
            } else if (filterType === "requested") {
                filtered = filtered.filter(h => (h as any)._isRequest)
            }
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(h =>
                h.reason.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredHistory(filtered)
    }

    const totalEarned = history.filter(h => h.pointsChanged > 0).reduce((sum, h) => sum + h.pointsChanged, 0)
    const totalSpent = Math.abs(history.filter(h => h.pointsChanged < 0).reduce((sum, h) => sum + h.pointsChanged, 0))
    const netChange = totalEarned - totalSpent
    const currentPoints = history.length > 0 ? history[0].newPoints : 0

    const getTransactionIcon = (reason: string, points: number) => {
        const lower = reason.toLowerCase()
        if (lower.includes('purchase') || lower.includes('credit')) return <DollarSign className="h-5 w-5" />
        if (lower.includes('booking') || lower.includes('payment')) return <ShoppingCart className="h-5 w-5" />
        if (lower.includes('cashback') || lower.includes('earned')) return <Award className="h-5 w-5" />
        if (lower.includes('refund')) return <ArrowUpRight className="h-5 w-5" />
        if (lower.includes('request')) return <Gift className="h-5 w-5" />
        return points > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />
    }

    const getTransactionColor = (reason: string, points: number) => {
        const lower = reason.toLowerCase()
        if (lower.includes('cashback') || lower.includes('earned')) return 'text-yellow-600 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/30'
        if (lower.includes('purchase') || lower.includes('credit')) return 'text-green-600 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30'
        if (lower.includes('refund')) return 'text-blue-600 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30'
        if (lower.includes('request')) return 'text-purple-600 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30'
        return points > 0
            ? 'text-green-600 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30'
            : 'text-red-600 bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30'
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Premium Header */}
            <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Activity className="h-6 w-6 text-purple-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white">
                            Points History
                        </h1>
                    </div>
                    <p className="text-purple-200/80 text-lg max-w-xl">
                        Track your earnings, spending, and view detailed transaction analytics
                    </p>
                </div>
            </div>

            {/* Stats Overview - Industrial Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm shadow-lg shadow-primary/10">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Current Balance
                            </CardTitle>
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Coins className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary tracking-tight">
                            {currentPoints.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            ≈ ₹{(currentPoints / conversionRate).toFixed(2)} INR
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm shadow-lg shadow-green-500/10">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Earned
                            </CardTitle>
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600 tracking-tight">
                            +{totalEarned.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            All time earnings
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-sm shadow-lg shadow-red-500/10">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Spent
                            </CardTitle>
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-red-600 tracking-tight">
                            -{totalSpent.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            All time spending
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border-2 ${netChange >= 0 ? 'border-blue-500/30 shadow-blue-500/10' : 'border-orange-500/30 shadow-orange-500/10'} bg-gradient-to-br ${netChange >= 0 ? 'from-blue-500/10 via-blue-500/5' : 'from-orange-500/10 via-orange-500/5'} to-transparent backdrop-blur-sm shadow-lg`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Net Change
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${netChange >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                                <Activity className={`h-4 w-4 ${netChange >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold tracking-tight ${netChange >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {netChange >= 0 ? '+' : ''}{netChange.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Overall balance
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters - Industrial Style */}
            <Card className="mb-6 border-2 border-muted/50 shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        Filter Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 border-2"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full md:w-[200px] h-11 border-2">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Transactions</SelectItem>
                                <SelectItem value="earned">Points Earned</SelectItem>
                                <SelectItem value="spent">Points Spent</SelectItem>
                                <SelectItem value="requested">Credit Requests</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History - Premium Cards */}
            <Card className="border-2 border-muted/50 shadow-xl">
                <CardHeader className="border-b border-muted/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Clock className="h-5 w-5 text-primary" />
                                Transaction History
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Showing {displayedHistory.length} of {filteredHistory.length} transactions
                            </CardDescription>
                        </div>
                        {!showAll && filteredHistory.length > 10 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAll(true)}
                                className="gap-1 border-2 hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                                View All
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                        {showAll && filteredHistory.length > 10 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAll(false)}
                                className="gap-1"
                            >
                                Show Less
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border-2 rounded-xl">
                                    <div className="h-14 w-14 bg-muted rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/2"></div>
                                        <div className="h-3 bg-muted rounded w-1/4"></div>
                                    </div>
                                    <div className="h-8 w-24 bg-muted rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                    ) : displayedHistory.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="relative mx-auto w-24 h-24 mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
                                <Coins className="h-24 w-24 text-muted-foreground/30 mx-auto relative z-10" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                {searchTerm || filterType !== 'all'
                                    ? 'Try adjusting your filters to see more results'
                                    : 'Your points activity will appear here once you make transactions'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayedHistory.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-lg transition-all duration-300 group ${getTransactionColor(item.reason, item.pointsChanged)}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`p-3 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform`}>
                                            {getTransactionIcon(item.reason, item.pointsChanged)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-base truncate">{item.reason}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                <span className="hidden md:flex items-center gap-1">
                                                    <Activity className="h-3 w-3" />
                                                    {item.previousPoints.toLocaleString()} → {item.newPoints.toLocaleString()} pts
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {(item as any)._isRequest ? (
                                            // Credit Request display
                                            <>
                                                <div className={`text-2xl font-bold flex items-center justify-end gap-1 ${(item as any)._requestStatus === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {(item as any)._requestStatus === 'APPROVED' ? (
                                                        <TrendingUp className="h-5 w-5" />
                                                    ) : (
                                                        <Clock className="h-5 w-5" />
                                                    )}
                                                    +{((item as any)._requestPoints || item.pointsChanged).toLocaleString()}
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`mt-1 ${(item as any)._requestStatus === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-300' : (item as any)._requestStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-red-100 text-red-700 border-red-300'}`}
                                                >
                                                    {(item as any)._requestStatus === 'APPROVED' ? 'Approved' : (item as any)._requestStatus === 'PENDING' ? 'Requested' : 'Rejected'}
                                                </Badge>
                                            </>
                                        ) : (
                                            // Regular transaction display
                                            <>
                                                <div className={`text-2xl font-bold flex items-center gap-1 ${item.pointsChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.pointsChanged > 0 ? (
                                                        <TrendingUp className="h-5 w-5" />
                                                    ) : (
                                                        <TrendingDown className="h-5 w-5" />
                                                    )}
                                                    {item.pointsChanged > 0 ? '+' : ''}{item.pointsChanged.toLocaleString()}
                                                </div>
                                                <Badge variant="outline" className="mt-1">
                                                    {item.pointsChanged > 0 ? 'Earned' : 'Spent'}
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bottom CTA */}
            <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4">Need more points?</p>
                <Link href="/user/transactions">
                    <Button size="lg" className="gap-2 h-12 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                        <Coins className="h-5 w-5" />
                        Buy or Request Credits
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
