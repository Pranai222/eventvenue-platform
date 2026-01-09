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
import { Gift, CheckCircle, XCircle, Clock, User, Coins, AlertCircle, RefreshCw } from "lucide-react"

interface CreditRequest {
    id: number
    userId: number
    pointsRequested: number
    reason: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    adminNotes?: string
    createdAt: string
    processedAt?: string
}

export default function AdminCreditRequestsPage() {
    const { user } = useAuth()
    const [requests, setRequests] = useState<CreditRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
    const [adminNotes, setAdminNotes] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

    const getAuthHeaders = () => ({
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
    })

    const loadRequests = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const endpoint = filter === 'pending'
                ? 'http://localhost:8080/api/credit-requests/admin/pending'
                : 'http://localhost:8080/api/credit-requests/admin/all'

            const response = await axios.get(endpoint, getAuthHeaders())
            let data = response.data

            // Filter by status if not showing all
            if (filter !== 'all' && filter !== 'pending') {
                data = data.filter((r: CreditRequest) => r.status === filter.toUpperCase())
            }

            setRequests(data)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load credit requests')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadRequests()
    }, [filter])

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return

        setIsProcessing(true)
        try {
            const endpoint = actionType === 'approve'
                ? `http://localhost:8080/api/credit-requests/admin/approve/${selectedRequest.id}`
                : `http://localhost:8080/api/credit-requests/admin/reject/${selectedRequest.id}`

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
            setError(err.response?.data?.error || `Failed to ${actionType} request`)
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
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                        <Gift className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Credit Requests</h1>
                        <p className="text-muted-foreground">Review and process user credit requests</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(f)}
                        className="capitalize"
                    >
                        {f}
                    </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={loadRequests} className="ml-auto">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                </Button>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Requests List */}
            <Card>
                <CardHeader>
                    <CardTitle>Credit Requests ({requests.length})</CardTitle>
                    <CardDescription>
                        {filter === 'pending' ? 'Requests awaiting your approval' : `Showing ${filter} requests`}
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
                            <Gift className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">No {filter} credit requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-500/10 rounded-full">
                                            <User className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">User #{request.userId}</p>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {request.reason}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 font-bold text-lg">
                                                <Coins className="h-4 w-4 text-amber-500" />
                                                {request.pointsRequested.toLocaleString()}
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
                            {actionType === 'approve' ? 'Approve' : 'Reject'} Credit Request
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? `This will credit ${selectedRequest?.pointsRequested.toLocaleString()} points to User #${selectedRequest?.userId}`
                                : 'The user will be notified that their request was rejected'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm font-medium mb-1">Request Reason:</p>
                            <p className="text-sm text-muted-foreground">{selectedRequest?.reason}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Admin Notes (optional)</label>
                            <Textarea
                                placeholder={actionType === 'approve'
                                    ? "e.g., Approved for promotional event"
                                    : "e.g., Insufficient justification provided"
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
