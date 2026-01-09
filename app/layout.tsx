import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { ConversionRateProvider } from "@/lib/contexts/conversion-rate-context"
import { PlatformFeesProvider } from "@/lib/contexts/platform-fees-context"
import { AIChatButton } from "@/components/ai/ai-chat-button"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "EventVenue - Book Venues & Events",
  description: "Multi-vendor platform for booking event venues and tickets",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} antialiased`}>
        <AuthProvider>
          <ConversionRateProvider>
            <PlatformFeesProvider>
              {children}
              <AIChatButton />
            </PlatformFeesProvider>
          </ConversionRateProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
