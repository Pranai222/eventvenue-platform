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
import { Calendar, User, LogOut, Coins } from "lucide-react"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api/auth"

export function UserNav() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (user?.role === "USER") {
      authApi
        .getUserProfile()
        .then((profile) => {
          setUserProfile(profile)
        })
        .catch(() => { })
    }
  }, [user])

  const navItems = [
    { href: "/user/dashboard", label: "Dashboard" },
    { href: "/venues", label: "Browse Venues" },
    { href: "/events", label: "Find Events" },
    { href: "/user/bookings", label: "My Bookings" },
    { href: "/user/transactions", label: "Transactions" },
  ]

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/user/dashboard" className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">EventVenue</span>
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
            {userProfile?.points !== undefined && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10">
                <Coins className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{userProfile.points.toLocaleString()} pts</span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.username || userProfile?.firstName || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/user/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/user/points-history">Points History</Link>
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
