import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Building2, DollarSign, TrendingUp, ArrowRight } from "lucide-react"

export default function BecomeVendorPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">EventVenue</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login?role=vendor">
                <Button variant="outline">Vendor Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">Grow Your Business with EventVenue</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Join our platform and reach thousands of customers looking for venues and events
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup?role=vendor">
                <Button size="lg" className="gap-2">
                  Start Listing <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login?role=vendor">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  <Building2 className="h-4 w-4" />
                  Vendor Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose EventVenue?</h2>
            <p className="text-muted-foreground text-lg">Everything you need to succeed</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Easy Listing Management</CardTitle>
                <CardDescription>
                  Simple tools to add and manage your venues and events with real-time availability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Maximize Revenue</CardTitle>
                <CardDescription>Reach more customers and increase bookings with our growing user base</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>Track your performance with detailed analytics and booking reports</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get started in minutes</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Create Your Account</h3>
                  <p className="text-muted-foreground">Sign up with your business details and verify your email</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Wait for Approval</h3>
                  <p className="text-muted-foreground">Our team will review and approve your vendor account</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Add Your Listings</h3>
                  <p className="text-muted-foreground">Create venues and events with photos, pricing, and details</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Start Receiving Bookings</h3>
                  <p className="text-muted-foreground">
                    Manage bookings, payments, and grow your business with our platform
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-8 text-primary-foreground/90">
                Join hundreds of vendors already growing their business on EventVenue
              </p>
              <Link href="/signup?role=vendor">
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Vendor Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
