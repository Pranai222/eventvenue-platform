"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, TrendingUp, Settings } from "lucide-react"

export default function VendorResourcesPage() {
  const resources = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn how to set up your vendor account and list your first venue.",
    },
    {
      icon: Users,
      title: "Managing Bookings",
      description: "Handle customer bookings, confirmations, and cancellations efficiently.",
    },
    {
      icon: TrendingUp,
      title: "Growing Your Business",
      description: "Best practices for increasing bookings and customer satisfaction.",
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Manage your profile, pricing, and availability calendars.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost">← Back to Home</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">Vendor Resources</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Everything you need to succeed as a vendor on EventVenue
            </p>
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {resources.map((resource, index) => {
              const Icon = resource.icon
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-accent/10 p-3">
                        <Icon className="h-6 w-6 text-accent" />
                      </div>
                      <CardTitle>{resource.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{resource.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Support Section */}
          <div className="bg-primary/5 rounded-lg p-8 space-y-4">
            <h2 className="text-2xl font-bold">Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Our support team is available 24/7 to assist you with any questions or issues.
            </p>
            <div className="flex gap-4">
              <Link href="/help">
                <Button variant="outline">Contact Support</Button>
              </Link>
              <Link href="/become-vendor">
                <Button>Become a Vendor</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
