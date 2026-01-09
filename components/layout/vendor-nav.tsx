"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, LogOut, Building2 } from "lucide-react"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api/auth"
import { Badge } from "@/components/ui/badge"

export function VendorNav() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [vendorProfile, setVendorProfile] = useState<any>(null)

  useEffect(() => {
    if (user?.role === "VENDOR") {
      authApi
        .getVendorProfile()
        .then(setVendorProfile)
        .catch(() => { })
    }
  }, [user])

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard" },
    { href: "/vendor/venues", label: "My Venues" },
    { href: "/vendor/events", label: "My Events" },
    { href: "/vendor/bookings", label: "Bookings" },
    { href: "/vendor/transactions", label: "Transactions" },
    { href: "/vendor/reviews", label: "Reviews" },
  ]

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/vendor/dashboard" className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">EventVenue</span>
            <Badge variant="secondary" className="ml-2">
              Vendor
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition ${pathname === item.href ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {vendorProfile && (
              <Badge
                variant={
                  vendorProfile.status === "APPROVED"
                    ? "default"
                    : vendorProfile.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                }
                className="hidden sm:flex"
              >
                {vendorProfile.status}
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Building2 className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {vendorProfile?.businessName || user?.businessName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/vendor/profile">Business Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vendor/analytics">Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
