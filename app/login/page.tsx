"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { UserLoginForm } from "@/components/auth/user-login-form"
import { VendorLoginForm } from "@/components/auth/vendor-login-form"
import { AdminLoginForm } from "@/components/auth/admin-login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

function LoginPageContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role")

  const renderLoginContent = () => {
    if (role === "vendor") {
      return (
        <>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Vendor Login</CardTitle>
            <CardDescription>Sign in to your vendor account to manage venues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <VendorLoginForm />
            <div className="space-y-3 text-sm">
              <div className="text-center">
                Don't have a vendor account?{" "}
                <Link href="/signup?role=vendor" className="text-primary hover:underline">
                  Create one here
                </Link>
              </div>
              <div className="flex gap-2 justify-center text-xs text-muted-foreground">
                <Link href="/login" className="hover:text-primary">
                  User Login
                </Link>
                <span>•</span>
                <Link href="/login?role=admin" className="hover:text-primary">
                  Admin Login
                </Link>
              </div>
            </div>
          </CardContent>
        </>
      )
    }

    if (role === "admin") {
      return (
        <>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Sign in to manage the EventVenue platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminLoginForm />
            <div className="flex gap-2 justify-center text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-primary">
                User Login
              </Link>
              <span>•</span>
              <Link href="/login?role=vendor" className="hover:text-primary">
                Vendor Login
              </Link>
            </div>
          </CardContent>
        </>
      )
    }

    // Default to user login
    return (
      <>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your EventVenue account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserLoginForm />
          <div className="space-y-3 text-sm">
            <div className="text-center">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up here
              </Link>
            </div>
            <div className="flex gap-2 justify-center text-xs text-muted-foreground">
              <Link href="/login?role=vendor" className="hover:text-primary">
                Vendor Login
              </Link>
              <span>•</span>
              <Link href="/login?role=admin" className="hover:text-primary">
                Admin Login
              </Link>
            </div>
          </div>
        </CardContent>
      </>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">{renderLoginContent()}</Card>
      <div className="absolute bottom-4">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
