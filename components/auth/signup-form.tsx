"use client"

import type React from "react"

import { useState } from "react"
import { authApi } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Briefcase, TrendingUp } from "lucide-react"

interface SignupFormProps {
  role: "USER" | "VENDOR"
  onSignupSuccess?: (email: string) => void
}

export function SignupForm({ role, onSignupSuccess }: SignupFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    businessName: "",
    businessDescription: "",
    businessPhone: "",
    businessAddress: "",
    city: "",
    state: "",
    pincode: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (role === "VENDOR") {
      if (!formData.businessName || !formData.businessDescription) {
        setError("Business name and description are required")
        return
      }
      if (!formData.city) {
        setError("City is required")
        return
      }
    }

    setIsLoading(true)

    try {
      let response
      if (role === "USER") {
        response = await authApi.userSignup({
          username: formData.username || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        })
      } else {
        response = await authApi.vendorSignup({
          username: formData.username || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName,
          businessDescription: formData.businessDescription,
          businessPhone: formData.businessPhone || undefined,
          businessAddress: formData.businessAddress || undefined,
          city: formData.city,
          state: formData.state || undefined,
          pincode: formData.pincode || undefined,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        })
      }

      setSuccess(true)
      onSignupSuccess?.(formData.email)
    } catch (err: any) {
      const errorMessage = err.message || "Signup failed. Please try again."
      if (errorMessage.toLowerCase().includes("connection") || errorMessage.toLowerCase().includes("timeout")) {
        setError("Unable to connect to server. Please check your internet connection and try again.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${role === "USER"
          ? "bg-gradient-to-br from-green-400 to-emerald-500"
          : "bg-gradient-to-br from-emerald-500 to-cyan-500"
          }`}>
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white">
          {role === "USER" ? "Account Created!" : "Registration Submitted!"}
        </h3>
        <p className="text-gray-300">
          {role === "USER"
            ? "Check your email for OTP verification."
            : "Check your email to verify your account. Your vendor profile will be reviewed by our team."}
        </p>
        {role === "USER" ? (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 mt-4">
            <div className="flex items-center justify-center gap-2 text-amber-300">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">2,000 points will be credited after verification!</span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-4 mt-4">
            <div className="flex items-center justify-center gap-2 text-emerald-300">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">200 welcome points have been credited!</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const inputClassName = role === "USER"
    ? "bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
    : "bg-slate-700/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:border-emerald-400 focus:ring-emerald-400/20"

  const labelClassName = "text-gray-200 text-sm font-medium"

  const buttonClassName = role === "USER"
    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/25 hover:shadow-purple-500/40"
    : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${role === "USER" ? "rgba(168, 85, 247, 0.5)" : "rgba(16, 185, 129, 0.5)"};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${role === "USER" ? "rgba(168, 85, 247, 0.7)" : "rgba(16, 185, 129, 0.7)"};
        }
      `}</style>

      {error && (
        <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className={labelClassName}>First Name *</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className={labelClassName}>Last Name *</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            className={inputClassName}
          />
        </div>
      </div>

      {role === "VENDOR" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="businessName" className={labelClassName}>Business Name *</Label>
            <Input
              id="businessName"
              type="text"
              placeholder="Your Business Name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
              className={inputClassName}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessDescription" className={labelClassName}>Business Description *</Label>
            <Input
              id="businessDescription"
              type="text"
              placeholder="Brief description of your business"
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              required
              className={inputClassName}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="businessPhone" className={labelClassName}>Business Phone</Label>
              <Input
                id="businessPhone"
                type="tel"
                placeholder="+1234567890"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className={labelClassName}>City *</Label>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className={inputClassName}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessAddress" className={labelClassName}>Business Address</Label>
            <Input
              id="businessAddress"
              type="text"
              placeholder="123 Main Street"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              className={inputClassName}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="state" className={labelClassName}>State</Label>
              <Input
                id="state"
                type="text"
                placeholder="NY"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pincode" className={labelClassName}>Pincode</Label>
              <Input
                id="pincode"
                type="text"
                placeholder="10001"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className={inputClassName}
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="phone" className={labelClassName}>Phone *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1234567890"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          className={inputClassName}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className={labelClassName}>Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className={inputClassName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="password" className={labelClassName}>Password *</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className={labelClassName}>Confirm *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className={inputClassName}
          />
        </div>
      </div>

      <Button
        type="submit"
        className={`w-full text-white font-semibold py-2.5 rounded-xl shadow-lg transition-all duration-200 ${buttonClassName}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {role === "USER" ? "Creating account..." : "Submitting registration..."}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {role === "USER" ? (
              <>
                <Sparkles className="h-4 w-4" />
                Create Account & Get 2,000 Points
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Register & Get 200 Points
              </>
            )}
          </span>
        )}
      </Button>
    </form>
  )
}
