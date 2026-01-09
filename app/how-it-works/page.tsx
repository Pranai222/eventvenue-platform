"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Search, Calendar, CreditCard, CheckCircle } from "lucide-react"

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "Search & Browse",
      description: "Explore our extensive catalog of venues and events tailored to your needs.",
    },
    {
      icon: Calendar,
      title: "Choose Your Date",
      description: "Select your preferred dates and times with our interactive booking calendar.",
    },
    {
      icon: CreditCard,
      title: "Use Your Points",
      description: "Pay with your points or combine with other payment methods.",
    },
    {
      icon: CheckCircle,
      title: "Confirm Booking",
      description: "Complete your booking and receive instant confirmation with all details.",
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
            <h1 className="text-4xl md:text-5xl font-bold text-balance">How EventVenue Works</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Booking venues and attending events has never been easier. Follow these simple steps to get started.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <Card key={index} className="relative">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-primary">Step {index + 1}</div>
                        <CardTitle>{step.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Features */}
          <div className="bg-primary/5 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold">Why Choose EventVenue?</h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Verified vendors and secure transactions</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Earn points on every booking</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>24/7 customer support</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Flexible booking and cancellation policies</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Ready to get started?</p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Create Your Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
