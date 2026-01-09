"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { authApi } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, ArrowLeft } from "lucide-react"

interface OtpVerificationFormProps {
  email: string
  role?: "USER" | "VENDOR"
  onBack?: () => void
}

export function OtpVerificationForm({ email, role = "USER", onBack }: OtpVerificationFormProps) {
  const { login } = useAuth()
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isVendorWaiting, setIsVendorWaiting] = useState(false)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push(`/signup?role=${role.toLowerCase()}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsVendorWaiting(false)
    setIsLoading(true)

    try {
      const response = await authApi.verifyOtp({ email, otp, role })
      console.log('[OTP] Verification response (unwrapped):', response)

      // response is AuthResponse directly (unwrapped by postPublic)
      const message = response.message || ""
      const isSuccess = message.toLowerCase().includes("verified") || message.toLowerCase().includes("success")

      console.log('[OTP] Is successful:', isSuccess)
      console.log('[OTP] Message:', message)
      console.log('[OTP] Has token:', !!response.token)

      if (!isSuccess && !response.token) {
        throw new Error(message || "Verification failed")
      }

      // Check if vendor needs approval  
      if (role === "VENDOR" && message.toLowerCase().includes("awaiting")) {
        setIsVendorWaiting(true)
        return
      }

      // Auto-login for USER (and approved VENDOR)
      if (response.token) {
        console.log('[OTP] Auto-login: Logging in with token')

        try {
          // Login with the response (it's already AuthResponse, not wrapped)
          await login(response)
          console.log('[OTP] Auto-login: Login successful, redirecting...')

          // Small delay to ensure state is updated
          setTimeout(() => {
            const dashboardPath = role === "VENDOR" ? "/vendor/dashboard" : "/user/dashboard"
            console.log('[OTP] Auto-login: Redirecting to', dashboardPath)
            router.push(dashboardPath)
          }, 500)
        } catch (loginError) {
          console.error('[OTP] Auto-login failed:', loginError)
          setError("Login failed. Please try logging in manually.")
        }
      } else {
        console.error('[OTP] Missing token. Response keys:', Object.keys(response))
        setError(`Verification successful, but auto-login failed (missing token). Please log in manually at /login`)
      }
    } catch (err: any) {
      console.error('[OTP] Verification error:', err)
      setError(err.message || "Invalid OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isVendorWaiting) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-semibold">Verification Successful</h2>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your vendor account has been registered successfully! Our admin team will review your information and
            approve your account shortly. You'll be able to log in once approved.
          </AlertDescription>
        </Alert>
        <div className="text-sm text-muted-foreground">
          <p>In the meantime, you can:</p>
          <ul className="mt-2 space-y-1">
            <li>• Prepare your venue listings</li>
            <li>• Review our vendor guidelines</li>
            <li>• Wait for admin approval email</li>
          </ul>
        </div>
        <Button onClick={() => router.push("/login?role=vendor")} className="w-full">
          Return to Login
        </Button>
      </div>
    )
  }

  const handleResend = async () => {
    setError("")
    setIsResending(true)

    try {
      await authApi.resendOtp(email, role)
      alert("New OTP sent to your email!")
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Signup
      </Button>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Verify Your Email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
        <p className="text-xs text-muted-foreground italic">Check the backend console logs for the OTP code</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="otp">Enter OTP</Label>
          <Input
            id="otp"
            type="text"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            className="text-center text-2xl tracking-widest"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
          {isLoading ? "Verifying..." : "Verify OTP"}
        </Button>

        <div className="text-center">
          <Button type="button" variant="link" onClick={handleResend} disabled={isResending} className="text-sm">
            {isResending ? "Sending..." : "Didn't receive the code? Resend"}
          </Button>
        </div>
      </form>
    </div>
  )
}

