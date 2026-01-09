"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { authApi } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle } from "lucide-react"
import type { UserRole } from "@/lib/types/auth"

interface LoginFormProps {
  role: UserRole
}

export function LoginForm({ role }: LoginFormProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [vendorStatus, setVendorStatus] = useState<"" | "PENDING" | "REJECTED">("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setVendorStatus("")
    setIsLoading(true)

    try {
      let response: any

      if (role === "USER") {
        response = await authApi.userLogin({ email, password })
      } else if (role === "VENDOR") {
        response = await authApi.vendorLogin({ email, password })
      } else if (role === "ADMIN") {
        response = await authApi.adminLogin({ email, password })
      }

      if (response?.data) {
        const message = response.data.message || response.message || ""

        if (role === "VENDOR" && message.toLowerCase().includes("awaiting")) {
          setVendorStatus("PENDING")
          setError("Your vendor account is awaiting admin approval. Please check back later.")
          return
        }

        login(response.data)
      } else if (response) {
        login(response as any)
      }
    } catch (err: any) {
      console.error("[EventVenue] Login error:", err)
      const errorMsg = err.message || "Login failed. Please try again."

      if (errorMsg.toLowerCase().includes("awaiting") || errorMsg.toLowerCase().includes("pending")) {
        setVendorStatus("PENDING")
        setError("Your vendor account is awaiting admin approval. You cannot login until approved.")
      } else if (errorMsg.toLowerCase().includes("verify your email")) {
        setError("Please verify your email first before logging in. Check your email for the verification link.")
      } else if (errorMsg.toLowerCase().includes("connection") || errorMsg.toLowerCase().includes("timeout")) {
        setError("Unable to connect to server. Please ensure the backend is running at http://localhost:8080")
      } else {
        setError(errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {vendorStatus === "PENDING" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your vendor account is pending approval. Please wait for admin to review your application before you can
            access the dashboard.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
}
