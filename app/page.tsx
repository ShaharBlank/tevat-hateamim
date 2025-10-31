"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import FeaturedDesserts from "@/components/featured-desserts"
import DessertCategories from "@/components/dessert-categories"
import { useLanguage } from "@/lib/language-context"

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/20 to-background py-12 overflow-hidden">
          {/* Background Video */}
          <video
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="/videos/background_video.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Overlay (optional subtle dark layer for readability) */}
          <div className="absolute inset-0 bg-black/30 z-0" />

          {/* Content */}
          <div className="relative z-10 container mx-auto px-0 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="md:w-1/2 space-y-0 text-white">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-md">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-white/90 drop-shadow-sm">
                {t('hero.desc')}
              </p>
              <div className="flex flex-wrap gap-0">
                <Button size="lg" asChild>
                  <Link href="/desserts">{t('hero.orderNow')}</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-black">
                  <Link href="/contact">{t('hero.contact')}</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <Image
                  src="/images/logo.png"
                  alt={t('hero.title')}
                  fill
                  className="object-contain opacity-60 scale-90 drop-shadow-lg transition-all duration-500"
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
