"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import FeaturedDesserts from "@/components/featured-desserts"
import DessertCategories from "@/components/dessert-categories"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/20 to-background py-12">
          <div className="container mx-auto px-0 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="md:w-1/2 space-y-0">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">קינוחים מעוצבים ומגשי אירוח</h1>
              <p className="text-xl text-muted-foreground">
                אנו מתמחים ביצירת קינוחים מעוצבים ייחודיים לימי הולדת, חתונות, בר/בת מצווה וכל אירוע מיוחד.
              </p>
              <div className="flex flex-wrap gap-0">
                <Button size="lg" asChild>
                  <Link href="/desserts">הזמן עכשיו</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">צור קשר</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <Image
                  src="/images/logo.png"
                  alt="קינוח יום הולדת מעוצב"
                  fill
                  className="object-cover rounded-lg shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-0 bg-muted/50">
          <div className="container mx-auto px-4">
            <DessertCategories />
          </div>
        </section>

        {/* Featured Desserts Section */}
        <section className="py-0">
          <div className="container mx-auto px-4">
            <FeaturedDesserts />
          </div>
        </section>
      </main>
    </div>
  )
}

