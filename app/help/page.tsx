"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, HelpCircle, Mail, Phone } from "lucide-react"
import { useState, Suspense } from "react"

function FAQContent() {
  const [searchQuery, setSearchQuery] = useState("")

  const faqs = [
    {
      question: "How do I sign up for EventVenue?",
      answer:
        "Visit our signup page, choose your role (user or vendor), and fill in the required information. You'll receive an OTP for verification.",
    },
    {
      question: "How does the points system work?",
      answer:
        "You earn 2000 points when you sign up. You can use points to pay for bookings or save them for later. Check the booking pages for current conversion rates.",
    },
    {
      question: "Can I cancel a booking?",
      answer:
        "Yes, you can cancel bookings anytime. Cancellation fees may apply depending on the timing and vendor policies.",
    },
    {
      question: "How do I become a vendor?",
      answer:
        "Sign up as a vendor, fill in your business details, and submit for approval. Our team will review and approve your application within 24 hours.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept points, credit/debit cards, and other digital payment methods.",
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach our support team via email at pranaib20@gmail.com or call us at 1-800-VENUE-1.",
    },
  ]

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No results found. Try a different search.</p>
          </div>
        )}
      </div>
    </>
  )
}

export default function HelpPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-balance">Help Center</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Find answers to common questions or contact our support team
            </p>
          </div>

          {/* FAQ Content with Suspense */}
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <FAQContent />
          </Suspense>

          {/* Contact Section */}
          <div className="bg-primary/5 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold">Didn't find what you're looking for?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Email Support</h3>
                  <p className="text-sm text-muted-foreground">pranaib20@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Phone Support</h3>
                  <p className="text-sm text-muted-foreground">1-800-VENUE-1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
