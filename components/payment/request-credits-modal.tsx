"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react'
import axios from 'axios'
import { CheckCircle, Loader2 } from 'lucide-react'

interface RequestCreditsModalProps {
    isOpen: boolean
    onClose: () => void
    userId: number
    onSuccess?: () => void
}

export function RequestCreditsModal({ isOpen, onClose, userId, onSuccess }: RequestCreditsModalProps) {
    const [pointsRequested, setPointsRequested] = useState<string>('')
    const [reason, setReason] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const points = parseInt(pointsRequested)
        if (points <= 0) {
            setError('Please enter a valid number of points')
            return
        }

        if (!reason.trim()) {
            setError('Please provide a reason for your request')
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"; const response = await axios.post(`${API_URL}/api/credit-requests/submit`, {
                userId,
                pointsRequested: points,
                reason: reason.trim()
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            })

            if (response.data.success) {
                setIsSuccess(true)
                setTimeout(() => {
                    onSuccess?.()
                    onClose()
                    setPointsRequested('')
                    setReason('')
                    setIsSuccess(false)
                }, 2000)
            } else {
                setError(response.data.error || response.data.message || 'Failed to submit request')
            }
        } catch (err: any) {
            console.error('[CreditRequest] Error:', err)
            const errorMessage = err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                'Failed to submit request. Please try again.'
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Request Submitted!</h3>
                        <p className="text-muted-foreground text-center">
                            Your credit request has been sent to the admin for review
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Credits</DialogTitle>
                    <DialogDescription>
                        Submit a request for free credits. Admin approval required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="points">Points Requested</Label>
                        <Input
                            id="points"
                            type="number"
                            min="1"
                            placeholder="5000"
                            value={pointsRequested}
                            onChange={(e) => setPointsRequested(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Request</Label>
                        <Textarea
                            id="reason"
                            placeholder="Please explain why you need these credits..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            required
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Be specific about why you need the credits. This helps admins make faster decisions.
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Request'
                        )}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
