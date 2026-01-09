"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import axios from 'axios'
import { CheckCircle, Loader2, AlertCircle, CreditCard, IndianRupee } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WithdrawFundsModalProps {
    isOpen: boolean
    onClose: () => void
    userId: number
    currentPoints: number
    onSuccess?: () => void
}

export function WithdrawFundsModal({ isOpen, onClose, userId, currentPoints, onSuccess }: WithdrawFundsModalProps) {
    const [pointsAmount, setPointsAmount] = useState<string>('')
    const [cardNumber, setCardNumber] = useState<string>('')
    const [expiryDate, setExpiryDate] = useState<string>('')
    const [cvv, setCvv] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'amount' | 'card'>('amount')
    const [requiresApproval, setRequiresApproval] = useState(false)

    // Calculate INR (1 point = 1 INR)
    const inrAmount = parseInt(pointsAmount) || 0

    const getAuthHeaders = () => ({
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
    })

    const handlePointsChange = (value: string) => {
        setPointsAmount(value)
        const numValue = parseInt(value) || 0
        // Require approval for withdrawals >= 10000 INR
        setRequiresApproval(numValue >= 10000)
    }

    const handleContinueToCard = () => {
        const points = parseInt(pointsAmount)
        if (points <= 0 || points > currentPoints) {
            setError('Invalid points amount')
            return
        }
        if (points < 100) {
            setError('Minimum withdrawal is 100 points')
            return
        }
        setError(null)

        if (requiresApproval) {
            // Submit for admin approval
            handleSubmitForApproval()
        } else {
            // Proceed to card details
            setStep('card')
        }
    }

    const handleSubmitForApproval = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await axios.post(
                'http://localhost:8080/api/withdrawals/submit',
                { userId, pointsAmount: parseInt(pointsAmount) },
                getAuthHeaders()
            )

            if (response.data.success || response.data.withdrawal) {
                setIsSuccess(true)
                setTimeout(() => {
                    onSuccess?.()
                    handleClose()
                }, 2000)
            } else {
                setError(response.data.message || 'Failed to submit withdrawal request')
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit withdrawal request')
        } finally {
            setIsLoading(false)
        }
    }

    const handleWithdrawal = async () => {
        // Validate card details
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            setError('Please enter a valid 16-digit card number')
            return
        }
        if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
            setError('Please enter expiry date as MM/YY')
            return
        }
        if (cvv.length !== 3) {
            setError('Please enter a valid 3-digit CVV')
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            // Submit withdrawal request
            const submitResponse = await axios.post(
                'http://localhost:8080/api/withdrawals/submit',
                { userId, pointsAmount: parseInt(pointsAmount) },
                getAuthHeaders()
            )

            const withdrawalId = submitResponse.data.withdrawal?.id

            if (withdrawalId && !submitResponse.data.withdrawal.requiresApproval) {
                // Process immediately
                const processResponse = await axios.post(
                    `http://localhost:8080/api/withdrawals/process/${withdrawalId}`,
                    { cardLast4: cardNumber.replace(/\s/g, '').slice(-4) },
                    getAuthHeaders()
                )

                if (processResponse.data.success) {
                    setIsSuccess(true)
                    setTimeout(() => {
                        onSuccess?.()
                        handleClose()
                    }, 2000)
                } else {
                    setError(processResponse.data.message || 'Withdrawal processing failed')
                }
            } else {
                setIsSuccess(true)
                setTimeout(() => {
                    onSuccess?.()
                    handleClose()
                }, 2000)
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Withdrawal failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        const matches = v.match(/\d{4,16}/g)
        const match = (matches && matches[0]) || ''
        const parts = []
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }
        return parts.length ? parts.join(' ') : value
    }

    const handleClose = () => {
        setPointsAmount('')
        setCardNumber('')
        setExpiryDate('')
        setCvv('')
        setStep('amount')
        setError(null)
        setIsSuccess(false)
        setRequiresApproval(false)
        onClose()
    }

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                            {requiresApproval ? 'Request Submitted!' : 'Withdrawal Successful!'}
                        </h3>
                        <p className="text-muted-foreground text-center">
                            {requiresApproval
                                ? 'Your withdrawal request has been sent to admin for approval.'
                                : `₹${inrAmount.toLocaleString()} has been transferred to your card`
                            }
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Convert your points to money
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {step === 'amount' ? (
                        <>
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Available Points</span>
                                    <span className="font-semibold text-primary">{currentPoints.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="points">Points to Withdraw</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    min="100"
                                    max={currentPoints}
                                    placeholder="1000"
                                    value={pointsAmount}
                                    onChange={(e) => handlePointsChange(e.target.value)}
                                />
                                {inrAmount > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        You will receive <span className="font-semibold text-green-600">₹{inrAmount.toLocaleString()}</span>
                                    </p>
                                )}
                            </div>

                            {requiresApproval && inrAmount > 0 && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Withdrawals of ₹10,000 or more require admin approval. Your request will be reviewed within 24-48 hours.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleContinueToCard}
                                disabled={!pointsAmount || parseInt(pointsAmount) < 100 || parseInt(pointsAmount) > currentPoints || isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    requiresApproval ? 'Submit for Approval' : 'Continue to Withdrawal'
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Withdrawing</span>
                                    <span className="font-semibold">{parseInt(pointsAmount).toLocaleString()} points</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Amount</span>
                                    <span className="font-semibold text-green-600">₹{inrAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <Alert>
                                <AlertDescription>
                                    Enter the card details where you want to receive the funds.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="cardNumber"
                                            placeholder="1234 5678 9012 3456"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                            maxLength={19}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry">Expiry Date</Label>
                                        <Input
                                            id="expiry"
                                            placeholder="MM/YY"
                                            value={expiryDate}
                                            onChange={(e) => {
                                                let v = e.target.value.replace(/\D/g, '')
                                                if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4)
                                                setExpiryDate(v)
                                            }}
                                            maxLength={5}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cvv">CVV</Label>
                                        <Input
                                            id="cvv"
                                            type="password"
                                            placeholder="123"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            maxLength={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('amount')}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleWithdrawal}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Withdraw ₹${inrAmount.toLocaleString()}`
                                    )}
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                Your withdrawal is secure and encrypted
                            </p>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
