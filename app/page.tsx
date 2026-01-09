import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Award, ArrowRight, Building2, Ticket } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">EventVenue</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/venues" className="text-sm hover:text-primary transition">
                Browse Venues
              </Link>
              <Link href="/events" className="text-sm hover:text-primary transition">
                Find Events
              </Link>
              <Link href="/become-vendor" className="text-sm hover:text-primary transition">
                Become a Vendor
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              Find Perfect Venues & Events for Every Occasion
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              Connect with trusted vendors, book amazing venues, and discover exciting events. Get 2000 points on
              signup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup?role=user">
                <Button size="lg" className="gap-2">
                  Book as User <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?role=vendor">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  List as Vendor <Building2 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Wide Selection</h3>
              <p className="text-muted-foreground">
                Browse thousands of verified venues and events across multiple categories
              </p>
            </div>
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <Ticket className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Easy Booking</h3>
              <p className="text-muted-foreground">Book instantly with our points system</p>
            </div>
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mx-auto">
                <Award className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Trusted Platform</h3>
              <p className="text-muted-foreground">Verified vendors, secure payments, and 24/7 customer support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-primary-foreground/90">Join thousands of users and vendors on EventVenue</p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">EventVenue</span>
              </div>
              <p className="text-sm text-muted-foreground">Your trusted platform for venues and events</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/venues">Browse Venues</Link>
                </li>
                <li>
                  <Link href="/events">Find Events</Link>
                </li>
                <li>
                  <Link href="/how-it-works">How It Works</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">For Vendors</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/become-vendor">Become a Vendor</Link>
                </li>
                <li>
                  <Link href="/vendor-login">Vendor Login</Link>
                </li>
                <li>
                  <Link href="/vendor-resources">Resources</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help">Help Center</Link>
                </li>
                <li>
                  <Link href="/terms">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 EventVenue. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
