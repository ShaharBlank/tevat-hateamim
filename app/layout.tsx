import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { LanguageProvider } from "@/lib/language-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "תיבת הטעמים - עוגות מעוצבות",
  description: "עוגות מעוצבות לכל אירוע - חתונות, ימי הולדת ואירועים מיוחדים",
  icons: {
    icon: "/favicon-32x32.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="icon" href="/favicon-32x32.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <LanguageProvider>
              {children}
              <Toaster />
            </LanguageProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}