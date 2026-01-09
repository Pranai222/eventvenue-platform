"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { apiClient } from '@/lib/api/client'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

// PayPal Client ID - Sandbox
const PAYPAL_CLIENT_ID = "AcHqC_6TsYO9h_Zeaq9D-ADt_lsf63e69ifdyLvvJv-BdKNjZ-4yPMvqGO3bg9nrywlMI_HPq_Qw8occ"

interface BuyCreditsModalProps {
    isOpen: boolean
    onClose: () => void
    userId: number
    onSuccess?: () => void
}

export function BuyCreditsModal({ isOpen, onClose, userId, onSuccess }: BuyCreditsModalProps) {
    const [amount, setAmount] = useState('')
    const [points, setPoints] = useState(0)
    const [step, setStep] = useState<'amount' | 'paypal'>('amount')
    const [isSuccess, setIsSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [paypalLoaded, setPaypalLoaded] = useState(false)

    // Load PayPal SDK
    useEffect(() => {
        if (step === 'paypal' && !paypalLoaded) {
            const existingScript = document.getElementById('paypal-sdk')
            if (existingScript) {
                setPaypalLoaded(true)
                return
            }

            const script = document.createElement('script')
            script.id = 'paypal-sdk'
            script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`
            script.async = true
            script.onload = () => {
                setPaypalLoaded(true)
            }
            script.onerror = () => {
                setError('Failed to load PayPal. Please try again.')
            }
            document.body.appendChild(script)
        }
    }, [step, paypalLoaded])

    // Render PayPal buttons when SDK is loaded
    useEffect(() => {
        if (paypalLoaded && step === 'paypal' && (window as any).paypal) {
            const paypalButtonContainer = document.getElementById('paypal-button-container')
            if (paypalButtonContainer) {
                paypalButtonContainer.innerHTML = '' // Clear previous buttons

                    ; (window as any).paypal.Buttons({
                        style: {
                            layout: 'vertical',
                            color: 'blue',
                            shape: 'rect',
                            label: 'pay'
                        },
                        createOrder: (_data: any, actions: any) => {
                            return actions.order.create({
                                purchase_units: [{
                                    amount: {
                                        value: parseFloat(amount).toFixed(2),
                                        currency_code: 'USD'
                                    },
                                    description: `Purchase ${points} points`
                                }]
                            })
                        },
                        onApprove: async (_data: any, actions: any) => {
                            setIsLoading(true)
                            setError(null)

                            try {
                                // Capture the order
                                const order = await actions.order.capture()

                                // Send to backend to credit points using apiClient
                                const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(
                                    '/api/user/points/purchase',
                                    {
                                        points: points,
                                        amount: parseFloat(amount),
                                        paymentMethod: 'PAYPAL',
                                        transactionId: order.id,
                                        paypalOrderId: order.id
                                    }
                                )

                                // apiClient returns the data directly
                                setIsSuccess(true)
                                setTimeout(() => {
                                    onSuccess?.()
                                    handleClose()
                                }, 2000)
                            } catch (err: any) {
                                console.error('[BuyCredits] Error:', err)
                                setError(err.message || 'Payment completed but failed to credit points. Please contact support.')
                            } finally {
                                setIsLoading(false)
                            }
                        },
                        onError: (err: any) => {
                            console.error('PayPal error:', err)
                            setError('PayPal payment failed. Please try again.')
                        },
                        onCancel: () => {
                            setError('Payment cancelled')
                        }
                    }).render('#paypal-button-container')
            }
        }
    }, [paypalLoaded, step, amount, points])

    const handleContinueToPayPal = () => {
        const numAmount = parseFloat(amount)
        if (numAmount <= 0 || numAmount < 10) {
            setError('Minimum amount is ₹10')
            return
        }
        setError(null)
        setStep('paypal')
    }

    const handleClose = () => {
        setAmount('')
        setPoints(0)
        setStep('amount')
        setIsSuccess(false)
        setError(null)
        onClose()
    }

    const handleAmountChange = (value: string) => {
        setAmount(value)
        const numValue = parseFloat(value) || 0
        // 1 point = ₹1 (conversion rate is 1:1)
        setPoints(Math.floor(numValue))
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-green-600">Payment Successful!</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {points.toLocaleString()} points have been added to your account
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Buy Credits</DialogTitle>
                            <DialogDescription>
                                Purchase points to book events and venues
                            </DialogDescription>
                        </DialogHeader>

                        {step === 'amount' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="amount">Amount (₹)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="Enter amount (min ₹10)"
                                            value={amount}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            min="10"
                                            className="mt-1"
                                        />
                                    </div>

                                    <div className="rounded-lg border p-4 bg-muted/30">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Amount</span>
                                            <span className="font-medium">₹{parseFloat(amount || '0').toFixed(2)}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Points</span>
                                            <span className="font-bold text-primary">{points.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    onClick={handleContinueToPayPal}
                                    className="w-full"
                                    disabled={!amount || parseFloat(amount) < 10}
                                >
                                    Continue to Payment
                                </Button>
                            </div>
                        )}

                        {step === 'paypal' && (
                            <div className="space-y-4">
                                {/* Summary Card */}
                                <div className="rounded-lg border p-4 bg-muted/30">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span className="font-medium">₹{parseFloat(amount).toFixed(2)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Points</span>
                                        <span className="font-bold text-primary">{points.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* PayPal Button Container */}
                                <div className="space-y-3">
                                    {paypalLoaded ? (
                                        <div id="paypal-button-container" className="min-h-[100px]" />
                                    ) : (
                                        <div className="flex items-center justify-center h-24">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                            <span className="ml-2 text-sm text-muted-foreground">Loading PayPal...</span>
                                        </div>
                                    )}
                                </div>

                                {isLoading && (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span className="text-sm">Processing payment...</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={() => setStep('amount')}
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    Back
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Log in with your PayPal account to complete payment
                                </p>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
