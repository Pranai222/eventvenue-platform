"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useConversionRate } from "@/lib/contexts/conversion-rate-context"
import axios from 'axios'
import { CheckCircle, Loader2, IndianRupee, Building2, AlertCircle } from 'lucide-react'

// PayPal Client ID - Sandbox
const PAYPAL_CLIENT_ID = "AcHqC_6TsYO9h_Zeaq9D-ADt_lsf63e69ifdyLvvJv-BdKNjZ-4yPMvqGO3bg9nrywlMI_HPq_Qw8occ"

interface VendorBuyCreditsModalProps {
    isOpen: boolean
    onClose: () => void
    vendorId: number
    onSuccess?: () => void
}

export function VendorBuyCreditsModal({ isOpen, onClose, vendorId, onSuccess }: VendorBuyCreditsModalProps) {
    const { conversionRate } = useConversionRate()
    const [amount, setAmount] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'amount' | 'paypal'>('amount')
    const [paypalLoaded, setPaypalLoaded] = useState(false)

    // Calculate points based on conversion rate
    const points = Math.floor((parseFloat(amount) || 0) * conversionRate)

    const getAuthHeaders = () => ({
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
    })

    // Load PayPal SDK
    useEffect(() => {
        if (step === 'paypal' && !paypalLoaded) {
            const existingScript = document.getElementById('paypal-sdk-vendor')
            if (existingScript) {
                setPaypalLoaded(true)
                return
            }

            const script = document.createElement('script')
            script.id = 'paypal-sdk-vendor'
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
            const paypalButtonContainer = document.getElementById('paypal-button-container-vendor')
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
                                    description: `Vendor purchase ${points} points`
                                }]
                            })
                        },
                        onApprove: async (_data: any, actions: any) => {
                            setIsLoading(true)
                            setError(null)

                            try {
                                // Capture the order
                                const order = await actions.order.capture()

                                // Send to backend to credit points
                                const response = await axios.post(
                                    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + '/api/vendor/points/purchase',
                                    {
                                        points: points,
                                        amount: parseFloat(amount),
                                        paymentMethod: 'PAYPAL',
                                        transactionId: order.id,
                                        paypalOrderId: order.id
                                    },
                                    getAuthHeaders()
                                )

                                if (response.data.success) {
                                    setIsSuccess(true)
                                    setTimeout(() => {
                                        onSuccess?.()
                                        handleClose()
                                    }, 2000)
                                } else {
                                    setError(response.data.message || 'Failed to credit points')
                                }
                            } catch (err: any) {
                                setError(err.response?.data?.message || 'Payment completed but failed to credit points. Please contact support.')
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
                    }).render('#paypal-button-container-vendor')
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
        setStep('amount')
        setError(null)
        setIsSuccess(false)
        setIsLoading(false)
        onClose()
    }

    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Purchase Successful!</h3>
                        <p className="text-muted-foreground">{points.toLocaleString()} points added to your vendor account</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <DialogTitle>Buy Vendor Credits</DialogTitle>
                    </div>
                    <DialogDescription>
                        Purchase points for creating events and venues
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {step === 'amount' ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (INR ₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min="10"
                                        placeholder="100"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                {points > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        You will receive <span className="font-semibold text-primary">{points.toLocaleString()} points</span>
                                        <span className="text-xs ml-1">(Rate: {conversionRate} pts/$1)</span>
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleContinueToPayPal}
                                disabled={!amount || parseFloat(amount) < 10}
                                className="w-full bg-[#0070ba] hover:bg-[#003087]"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                                </svg>
                                Continue with PayPal
                            </Button>

                            <p className="text-xs text-center text-muted-foreground">
                                Secure payment via PayPal • Sandbox Mode
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Amount</span>
                                    <span className="font-semibold">₹{parseFloat(amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Points</span>
                                    <span className="font-semibold text-primary">{points.toLocaleString()}</span>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                    <p className="text-muted-foreground">Processing payment...</p>
                                </div>
                            ) : (
                                <div id="paypal-button-container-vendor" className="min-h-[150px]">
                                    {!paypalLoaded && (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                            <span className="text-muted-foreground">Loading PayPal...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep('amount')
                                    setError(null)
                                }}
                                disabled={isLoading}
                                className="w-full"
                            >
                                Back
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                Log in with your PayPal account to complete payment
                            </p>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
