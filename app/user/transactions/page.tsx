"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/auth-context"
import { authApi } from "@/lib/api/auth"
import { pointsApi, type PointHistory } from "@/lib/api/points"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BuyCreditsModal } from "@/components/payment/buy-credits-modal"
import { RequestCreditsModal } from "@/components/payment/request-credits-modal"
import {
    Coins, CreditCard, Gift, TrendingUp, TrendingDown, History,
    ArrowUpRight, ArrowDownRight, Clock, ChevronRight,
    Sparkles, Zap, Shield, DollarSign, Activity, ShoppingCart, Award
} from "lucide-react"

interface UserProfile {
    id?: number
    userId?: number
    email: string
    firstName?: string
    lastName?: string
    username?: string
    points?: number
}

export default function TransactionsPage() {
    const { user } = useAuth()
    const { conversionRate } = useConversionRate()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [transactions, setTransactions] = useState<PointHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showBuyModal, setShowBuyModal] = useState(false)
    const [showRequestModal, setShowRequestModal] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const profileData = await authApi.getUserProfile()
            setProfile(profileData as UserProfile)

            // Load recent transactions from points history
            const historyData = await pointsApi.getHistory()
            setTransactions(historyData)
        } catch (error) {
            console.error("Failed to load data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const refreshData = () => {
        loadData()
    }

    const points = profile?.points || 0
    const pointsValue = points / conversionRate

    // Calculate stats
    const totalEarned = transactions.filter(t => t.pointsChanged > 0).reduce((sum, t) => sum + t.pointsChanged, 0)
    const totalSpent = Math.abs(transactions.filter(t => t.pointsChanged < 0).reduce((sum, t) => sum + t.pointsChanged, 0))

    const getTransactionIcon = (reason: string, points: number) => {
        const lower = reason.toLowerCase()
        if (lower.includes('purchase') || lower.includes('credit')) return <DollarSign className="h-5 w-5" />
        if (lower.includes('booking') || lower.includes('payment')) return <ShoppingCart className="h-5 w-5" />
        if (lower.includes('cashback') || lower.includes('earned')) return <Award className="h-5 w-5" />
        if (lower.includes('refund')) return <ArrowUpRight className="h-5 w-5" />
        if (lower.includes('request')) return <Gift className="h-5 w-5" />
        return points > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />
    }

    const getTransactionColor = (points: number) => {
        return points > 0
            ? 'text-green-600 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30'
            : 'text-red-600 bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30'
    }

    // Show only top 10 recent transactions
    const recentTransactions = transactions.slice(0, 10)

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Premium Header */}
            <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Zap className="h-6 w-6 text-yellow-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white">
                            Transactions & Payments
                        </h1>
                    </div>
                    <p className="text-purple-200/80 text-lg max-w-xl">
                        Manage your credits, purchase points, and track all your transactions
                    </p>
                </div>
            </div>

            {/* Points Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm shadow-lg shadow-primary/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-1.5 bg-primary/20 rounded-lg">
                                <Coins className="h-4 w-4 text-primary" />
                            </div>
                            Available Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-bold text-primary tracking-tight mb-1">
                            {points.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            ≈ ₹{pointsValue.toFixed(2)} INR value
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm shadow-lg shadow-green-500/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-2xl"></div>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-1.5 bg-green-500/20 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                            Total Earned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-bold text-green-600 tracking-tight mb-1">
                            +{totalEarned.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            All time earnings
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm shadow-lg shadow-blue-500/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                            Conversion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-bold text-blue-600 tracking-tight mb-1">
                            {conversionRate}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Points per ₹1 INR
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Buy & Request */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Buy Credits Card */}
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-4 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                                <CreditCard className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Buy Credits</CardTitle>
                                <CardDescription className="text-base">Instant purchase with PayPal</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                        <div className="bg-muted/50 p-4 rounded-xl space-y-3 border">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Payment Method
                                </span>
                                <span className="font-medium">PayPal</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Processing
                                </span>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Instant</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Powered by</span>
                                <span className="font-semibold text-primary">PayPal</span>
                            </div>
                        </div>
                        <Button
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25"
                            onClick={() => setShowBuyModal(true)}
                        >
                            <CreditCard className="h-5 w-5 mr-2" />
                            Buy Credits Now
                        </Button>
                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                            <Shield className="h-3 w-3" />
                            Secure payment • SSL encrypted • Test mode
                        </p>
                    </CardContent>
                </Card>

                {/* Request Credits Card */}
                <Card className="border-2 hover:border-green-500/50 transition-all hover:shadow-2xl hover:shadow-green-500/10 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                                <Gift className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Request Credits</CardTitle>
                                <CardDescription className="text-base">Get free points from admin</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                        <div className="bg-muted/50 p-4 rounded-xl space-y-3 border">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Approval</span>
                                <Badge variant="outline" className="border-green-500/50 text-green-600">
                                    Admin Review
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Processing Time
                                </span>
                                <span className="font-medium">24-48 hours</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Cost</span>
                                <span className="font-semibold text-green-600">Free</span>
                            </div>
                        </div>
                        <Button
                            className="w-full h-14 text-lg font-semibold"
                            variant="outline"
                            onClick={() => setShowRequestModal(true)}
                        >
                            <Gift className="h-5 w-5 mr-2" />
                            Request Free Credits
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Subject to admin approval • Provide valid reason
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* How Points Work - Info Section */}
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800/50 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        How Points Work
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Purchase</h4>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Buy points instantly using PayPal secure payment
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Award className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Earn</h4>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Earn 5% cashback points on every booking you make
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Spend</h4>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Use points to book events and venues at checkout
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Transactions - Top 10 */}
            <Card className="border-2 border-muted/50 shadow-xl">
                <CardHeader className="border-b border-muted/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <History className="h-5 w-5 text-primary" />
                                Recent Transactions
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Your latest {recentTransactions.length} transactions
                            </CardDescription>
                        </div>
                        {transactions.length > 10 && (
                            <Link href="/user/points-history">
                                <Button variant="outline" size="sm" className="gap-1 border-2 hover:bg-primary hover:text-primary-foreground transition-all">
                                    View All
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border-2 rounded-xl">
                                    <div className="h-12 w-12 bg-muted rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/2"></div>
                                        <div className="h-3 bg-muted rounded w-1/4"></div>
                                    </div>
                                    <div className="h-6 w-20 bg-muted rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                    ) : recentTransactions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="relative mx-auto w-20 h-20 mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
                                <Clock className="h-20 w-20 text-muted-foreground/30 mx-auto relative z-10" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Your payment and credit history will appear here once you make transactions
                            </p>
                            <Button onClick={() => setShowBuyModal(true)} className="gap-2">
                                <CreditCard className="h-4 w-4" />
                                Buy Your First Credits
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((tx, index) => (
                                <div
                                    key={tx.id}
                                    className={`flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-lg transition-all duration-300 group ${getTransactionColor(tx.pointsChanged)}`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-3 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
                                            {getTransactionIcon(tx.reason, tx.pointsChanged)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{tx.reason}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold flex items-center gap-1 ${tx.pointsChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.pointsChanged > 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            {tx.pointsChanged > 0 ? '+' : ''}{tx.pointsChanged.toLocaleString()}
                                        </p>
                                        <Badge variant="outline" className="text-xs">
                                            {tx.pointsChanged > 0 ? 'Earned' : 'Spent'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Modals */}
            <BuyCreditsModal
                isOpen={showBuyModal}
                onClose={() => setShowBuyModal(false)}
                userId={profile?.userId || profile?.id || 0}
                onSuccess={refreshData}
            />

            <RequestCreditsModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                userId={profile?.userId || profile?.id || 0}
                onSuccess={refreshData}
            />
        </div>
    )
}
