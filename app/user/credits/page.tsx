"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import { authApi } from "@/lib/api/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BuyCreditsModal } from "@/components/payment/buy-credits-modal"
import { RequestCreditsModal } from "@/components/payment/request-credits-modal"
import { Coins, CreditCard, Gift, TrendingUp, History, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import axios from "axios"

interface UserProfile {
    id?: number
    userId?: number
    email: string
    firstName?: string
    lastName?: string
    username?: string
    points?: number
}

interface Transaction {
    id: number
    transactionType: string
    pointsAmount: number
    amountUsd?: number
    status: string
    reason?: string
    createdAt: string
}

export default function CreditsPage() {
    const { user } = useAuth()
    const { conversionRate, isLoading: rateLoading } = useConversionRate()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
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

            // Load transactions (mock data for now - replace with actual API)
            // const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"; const txData = await axios.get(`${API_URL}/api/credit-transactions/user/${profileData.userId || profileData.id}`)
            // setTransactions(txData.data)
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
    const pointsValue = (points / conversionRate).toFixed(2) // Uses dynamic rate

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                    Credits & Payments
                </h1>
                <p className="text-muted-foreground text-lg">
                    Manage your points, purchase credits, and track transactions
                </p>
            </div>

            {/* Points Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Coins className="h-4 w-4" />
                            Available Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary mb-1">
                            {points.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ≈ ₹{pointsValue} INR
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Conversion Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600 mb-1">
                            {conversionRate}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Points per ₹1 INR
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Total Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-600 mb-1">
                            {transactions.length}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            All time activity
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="actions" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="actions">Quick Actions</TabsTrigger>
                    <TabsTrigger value="history">Transaction History</TabsTrigger>
                </TabsList>

                {/* Quick Actions Tab */}
                <TabsContent value="actions" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Buy Credits Card */}
                        <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <CreditCard className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Buy Credits</CardTitle>
                                        <CardDescription>Purchase points with your card</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Payment Method</span>
                                        <span className="font-medium">PayPal</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Processing</span>
                                        <span className="font-medium">Instant</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Powered by</span>
                                        <span className="font-medium">PayPal</span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full h-12 text-base font-semibold"
                                    onClick={() => setShowBuyModal(true)}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Buy Credits Now
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Secure payment • SSL encrypted • Test mode
                                </p>
                            </CardContent>
                        </Card>

                        {/* Request Credits Card */}
                        <Card className="border-2 hover:border-green-500/50 transition-all hover:shadow-lg">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                        <Gift className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Request Credits</CardTitle>
                                        <CardDescription>Request free points from admin</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Approval</span>
                                        <Badge variant="outline" className="border-green-500/50 text-green-600">
                                            Admin Review
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Processing Time</span>
                                        <span className="font-medium">24-48 hours</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Cost</span>
                                        <span className="font-medium text-green-600">Free</span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full h-12 text-base font-semibold"
                                    variant="outline"
                                    onClick={() => setShowRequestModal(true)}
                                >
                                    <Gift className="h-4 w-4 mr-2" />
                                    Request Free Credits
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Subject to admin approval • Provide valid reason
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Info Section */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Coins className="h-5 w-5 text-blue-600" />
                                How Points Work
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">Purchase</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Buy points instantly using PayPal secure payment
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">Earn</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Earn 5% cashback points on every booking you make
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">Spend</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Use points to book events and venues at checkout
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Transaction History Tab */}
                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Recent Transactions
                            </CardTitle>
                            <CardDescription>
                                View your credit purchases, requests, and point usage
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center  py-12">
                                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">No transactions yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        Your payment and credit history will appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${tx.transactionType === 'PURCHASE' ? 'bg-green-100 dark:bg-green-900/20' :
                                                    tx.transactionType === 'REQUEST' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                                        'bg-orange-100 dark:bg-orange-900/20'
                                                    }`}>
                                                    {tx.transactionType === 'PURCHASE' ? (
                                                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                                                    ) : tx.transactionType === 'REQUEST' ? (
                                                        <Gift className="h-5 w-5 text-blue-600" />
                                                    ) : (
                                                        <ArrowUpRight className="h-5 w-5 text-orange-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{tx.transactionType}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-lg">
                                                    {tx.transactionType === 'WITHDRAWAL' ? '-' : '+'}{tx.pointsAmount.toLocaleString()} pts
                                                </p>
                                                {tx.amountUsd && (
                                                    <p className="text-sm text-muted-foreground">
                                                        ${tx.amountUsd.toFixed(2)}
                                                    </p>
                                                )}
                                                <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                    {tx.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
