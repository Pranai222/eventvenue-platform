"use client"

import type React from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UserNav } from "@/components/layout/user-nav"

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || isLoading) {
      console.log("[EventVenue] UserLayout - Waiting for mount/loading:", { isMounted, isLoading })
      return
    }

    console.log("[EventVenue] UserLayout - Auth check:", {
      hasUser: !!user,
      role: user?.role,
      isLoading,
      userEmail: user?.email
    })

    if (!user) {
      console.log("[EventVenue] UserLayout - No user found, redirecting to login")
      router.replace("/login?role=user")
      return
    }

    if (user.role !== "USER") {
      console.log("[EventVenue] UserLayout - Wrong role:", user.role, "expected USER")
      router.replace("/login?role=user")
      return
    }

    console.log("[EventVenue] UserLayout - Auth valid, rendering page")
  }, [user, isLoading, router, isMounted])

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "USER") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <UserNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}
