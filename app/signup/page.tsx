"use client"

import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { SignupForm } from "@/components/auth/signup-form"
import { OtpVerificationForm } from "@/components/auth/otp-verification-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Gift,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  Star,
  CheckCircle2,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  Globe,
  Briefcase
} from "lucide-react"

function SignupPageContent() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get("role")
  const [mounted, setMounted] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"USER" | "VENDOR">(roleParam === "vendor" ? "VENDOR" : "USER")
  const [emailForOtp, setEmailForOtp] = useState<string | null>(null)
  const [signedUpRole, setSignedUpRole] = useState<"USER" | "VENDOR">("USER")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (roleParam && mounted) {
      setSelectedRole(roleParam === "vendor" ? "VENDOR" : "USER")
    }
  }, [roleParam, mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (roleParam === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Admin Signup Disabled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                Admin accounts are pre-created in the database. Only admins can create new admin accounts.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-300">Please go to the login page to access your admin account.</p>
            <Link
              href="/login?role=admin"
              className="text-purple-300 hover:text-purple-200 text-sm font-medium block text-center transition-colors"
            >
              Go to Admin Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSignupSuccess = (email: string, role: "USER" | "VENDOR") => {
    setEmailForOtp(email)
    setSignedUpRole(role)
  }

  if (emailForOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="pt-6">
            <OtpVerificationForm email={emailForOtp} role={signedUpRole} />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Different benefits for users vs vendors
  const userBenefits = [
    { icon: Gift, text: "2,000 Welcome Points", highlight: true },
    { icon: Zap, text: "Instant Booking Confirmation" },
    { icon: Shield, text: "Secure Payment Processing" },
    { icon: Star, text: "Exclusive Member Rewards" },
  ]

  const vendorBenefits = [
    { icon: Gift, text: "200 Welcome Points", highlight: true },
    { icon: Building2, text: "List Unlimited Venues" },
    { icon: BarChart3, text: "Real-time Analytics Dashboard" },
    { icon: DollarSign, text: "Earn on Every Booking" },
  ]

  const benefits = selectedRole === "USER" ? userBenefits : vendorBenefits

  // Different background colors for user vs vendor
  const bgGradient = selectedRole === "USER"
    ? "from-slate-900 via-purple-900 to-slate-900"
    : "from-slate-900 via-slate-800 to-slate-900"

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {selectedRole === "USER" ? (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
          </>
        ) : (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
          </>
        )}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">

          {/* Left Side - Benefits & Branding */}
          <div className="hidden lg:block space-y-8 pr-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${selectedRole === "USER" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-emerald-500 to-cyan-500"}`}>
                  {selectedRole === "USER" ? <Calendar className="h-8 w-8 text-white" /> : <Briefcase className="h-8 w-8 text-white" />}
                </div>
                <span className="text-3xl font-bold text-white">EventVenue</span>
              </div>
              <h1 className="text-4xl font-bold text-white leading-tight">
                {selectedRole === "USER"
                  ? "Book Amazing Venues for Your Events"
                  : "Grow Your Venue Business with Us"}
              </h1>
              <p className="text-lg text-gray-300">
                {selectedRole === "USER"
                  ? "Join thousands of users finding perfect venues for weddings, parties, corporate events, and more."
                  : "Join our trusted network of venue partners. List your properties, manage bookings efficiently, and maximize your revenue."}
              </p>
            </div>

            {/* Different Banner for User vs Vendor */}
            {selectedRole === "USER" ? (
              /* User - 2000 Points Banner */
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">2,000 Points</div>
                      <div className="text-amber-100 text-lg">Welcome Bonus on Signup!</div>
                    </div>
                  </div>
                  <p className="mt-4 text-amber-100 text-sm">
                    Start booking immediately with your welcome points. No payment required to get started!
                  </p>
                </div>
              </div>
            ) : (
              /* Vendor - 200 Points Welcome Banner */
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur-lg opacity-40"></div>
                <div className="relative bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl p-6 text-white border border-emerald-400/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Gift className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">200 Points</div>
                      <div className="text-emerald-100 text-lg">Welcome Bonus for Vendors!</div>
                    </div>
                  </div>
                  <p className="mt-4 text-emerald-100 text-sm">
                    Start listing venues immediately with your welcome points. Earn more points with every booking!
                  </p>
                </div>
              </div>
            )}

            {/* Benefits List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                {selectedRole === "USER" ? "What You Get" : "Why Partner With Us"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl ${benefit.highlight
                      ? selectedRole === "USER"
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                        : "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30"
                      : "bg-white/5"
                      }`}
                  >
                    <benefit.icon className={`h-5 w-5 ${benefit.highlight
                      ? selectedRole === "USER" ? "text-amber-400" : "text-emerald-400"
                      : selectedRole === "USER" ? "text-purple-400" : "text-cyan-400"
                      }`} />
                    <span className={`text-sm font-medium ${benefit.highlight
                      ? selectedRole === "USER" ? "text-amber-200" : "text-emerald-200"
                      : "text-gray-300"
                      }`}>
                      {benefit.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor-specific trust indicators */}
            {selectedRole === "VENDOR" && (
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-xs text-gray-400">Active Vendors</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-xs text-gray-400">Bookings/Month</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold text-white">98%</div>
                  <div className="text-xs text-gray-400">Satisfaction</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className={`backdrop-blur-xl border-white/20 shadow-2xl ${selectedRole === "USER"
              ? "bg-white/10"
              : "bg-slate-800/80 border-slate-700/50"
              }`}>
              <CardHeader className="text-center pb-2">
                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-4">
                  <div className={`p-3 rounded-2xl ${selectedRole === "USER" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-emerald-500 to-cyan-500"}`}>
                    {selectedRole === "USER" ? <Calendar className="h-8 w-8 text-white" /> : <Briefcase className="h-8 w-8 text-white" />}
                  </div>
                </div>

                <CardTitle className="text-2xl font-bold text-white">
                  {selectedRole === "USER" ? "Create Your Account" : "Partner Registration"}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {selectedRole === "USER"
                    ? "Start booking venues for your events"
                    : "Register your business and start listing venues"}
                </CardDescription>

                {/* Mobile Banner */}
                <div className="lg:hidden mt-4">
                  {selectedRole === "USER" ? (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-center gap-3">
                        <Sparkles className="h-6 w-6 text-white" />
                        <div className="text-center">
                          <div className="text-xl font-bold">2,000 Welcome Points!</div>
                          <div className="text-amber-100 text-sm">Free on signup - start booking today</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-center gap-3">
                        <Gift className="h-6 w-6 text-white" />
                        <div className="text-center">
                          <div className="text-xl font-bold">200 Welcome Points!</div>
                          <div className="text-emerald-100 text-sm">Free on signup - start listing today</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Role Toggle */}
                <div className="flex rounded-xl bg-white/5 p-1">
                  <button
                    onClick={() => setSelectedRole("USER")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRole === "USER"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white"
                      }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4" />
                      User
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedRole("VENDOR")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRole === "VENDOR"
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white"
                      }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Vendor
                    </span>
                  </button>
                </div>

                <SignupForm role={selectedRole} onSignupSuccess={(email) => handleSignupSuccess(email, selectedRole)} />

                <div className="pt-4 space-y-3">
                  <div className="text-center text-sm text-gray-300">
                    Already have an account?{" "}
                    <Link
                      href={`/login?role=${selectedRole.toLowerCase()}`}
                      className={`font-medium transition-colors ${selectedRole === "USER"
                        ? "text-purple-300 hover:text-purple-200"
                        : "text-emerald-300 hover:text-emerald-200"
                        }`}
                    >
                      Sign in
                    </Link>
                  </div>

                  <div className="text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                      ← Back to Home
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-gray-400">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="h-4 w-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-4 w-4" />
                <span>Fast</span>
              </div>
            </div>
          </div >
        </div >
      </div >
    </div >
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  )
}
