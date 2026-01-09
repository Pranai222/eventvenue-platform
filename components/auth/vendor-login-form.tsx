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

export function VendorLoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [vendorStatus, setVendorStatus] = useState<"" | "PENDING">("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setVendorStatus("")
    setIsLoading(true)

    try {
      const response = await authApi.vendorLogin({ email, password })
      login(response)
    } catch (err: any) {
      const errorMsg = err.message || "Login failed. Please try again."

      if (errorMsg.toLowerCase().includes("awaiting") || errorMsg.toLowerCase().includes("pending")) {
        setVendorStatus("PENDING")
        setError("Your vendor account is awaiting admin approval. Please check back later.")
      } else if (errorMsg.toLowerCase().includes("verify your email")) {
        setError("Please verify your email first before logging in.")
      } else if (errorMsg.toLowerCase().includes("connection") || errorMsg.toLowerCase().includes("timeout")) {
        setError("Unable to connect to server. Please ensure the backend is running.")
      } else {
        setError(errorMsg)
      }
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {vendorStatus === "PENDING" && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your vendor account is pending approval. Please wait for admin to review your application.
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
        <Label htmlFor="vendor-email">Email</Label>
        <Input
          id="vendor-email"
          type="email"
          placeholder="vendor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor-password">Password</Label>
        <Input
          id="vendor-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In as Vendor"}
      </Button>
    </form>
  )
}
