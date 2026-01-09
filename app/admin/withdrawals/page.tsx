"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import axios from "axios"
import { Wallet, CheckCircle, XCircle, Clock, User, Coins, AlertCircle, RefreshCw, DollarSign } from "lucide-react"

interface WithdrawalRequest {
    id: number
    userId: number
    pointsAmount: number
    amountUsd: number
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
    requiresApproval: boolean
    adminNotes?: string
    createdAt: string
    updatedAt?: string
}

export default function AdminWithdrawalsPage() {
    const { user } = useAuth()
    const [requests, setRequests] = useState<WithdrawalRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
    const [adminNotes, setAdminNotes] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    const getAuthHeaders = () => ({
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
    })

    const loadRequests = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await axios.get(
                'http://localhost:8080/api/withdrawals/admin/pending-approvals',
                getAuthHeaders()
            )
            setRequests(response.data.withdrawals || response.data || [])
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load withdrawal requests')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadRequests()
    }, [])

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return

        setIsProcessing(true)
        try {
            const endpoint = actionType === 'approve'
                ? `http://localhost:8080/api/withdrawals/admin/approve/${selectedRequest.id}`
                : `http://localhost:8080/api/withdrawals/admin/reject/${selectedRequest.id}`

            await axios.post(endpoint, {
                adminId: (user as any)?.userId || (user as any)?.id || 1,
                notes: adminNotes
            }, getAuthHeaders())

            // Close dialog and refresh
            setSelectedRequest(null)
            setActionType(null)
            setAdminNotes("")
            loadRequests()
        } catch (err: any) {
            setError(err.response?.data?.error || `Failed to ${actionType} withdrawal`)
        } finally {
            setIsProcessing(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="outline" className="border-amber-500 text-amber-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
            case 'APPROVED':
                return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
            case 'REJECTED':
                return <Badge variant="outline" className="border-red-500 text-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
            case 'COMPLETED':
                return <Badge variant="outline" className="border-blue-500 text-blue-600"><DollarSign className="h-3 w-3 mr-1" />Completed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                        <Wallet className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
                        <p className="text-muted-foreground">Review and approve vendor withdrawal requests over 10,000 points</p>
                    </div>
                </div>
            </div>

            <Button variant="ghost" size="sm" onClick={loadRequests} className="mb-6">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
            </Button>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Requests List */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Withdrawals ({requests.length})</CardTitle>
                    <CardDescription>
                        Withdrawals over 10,000 points require admin approval
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="h-12 w-12 bg-muted rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                        <div className="h-3 bg-muted rounded w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12">
                            <Wallet className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">No pending withdrawal requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-500/10 rounded-full">
                                            <User className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Vendor/User #{request.userId}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 font-bold text-lg">
                                                <Coins className="h-4 w-4 text-amber-500" />
                                                {request.pointsAmount.toLocaleString()} pts
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-green-600">
                                                <DollarSign className="h-3 w-3" />
                                                ${request.amountUsd?.toFixed(2) || '0.00'}
                                            </div>
                                            {getStatusBadge(request.status)}
                                        </div>

                                        {request.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-500 text-green-600 hover:bg-green-50"
                                                    onClick={() => {
                                                        setSelectedRequest(request)
                                                        setActionType('approve')
                                                    }}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-500 text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        setSelectedRequest(request)
                                                        setActionType('reject')
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Dialog */}
            <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
                setSelectedRequest(null)
                setActionType(null)
                setAdminNotes("")
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {actionType === 'approve' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            {actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? `This will approve ${selectedRequest?.pointsAmount.toLocaleString()} points ($${selectedRequest?.amountUsd?.toFixed(2)}) withdrawal for User #${selectedRequest?.userId}. They will receive an email notification.`
                                : 'The vendor will be notified that their withdrawal was rejected'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Admin Notes (optional)</label>
                            <Textarea
                                placeholder={actionType === 'approve'
                                    ? "e.g., Approved - verified vendor account"
                                    : "e.g., Rejected - please verify bank details"
                                }
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setSelectedRequest(null)
                            setActionType(null)
                            setAdminNotes("")
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={isProcessing}
                            className={actionType === 'approve'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }
                        >
                            {isProcessing ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
