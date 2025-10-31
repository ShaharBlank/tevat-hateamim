"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/lib/cart-context"
import { getDesserts, type Dessert } from "@/lib/db-service"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const DessertCard = ({ dessert, onImageClick, isNew = false, isPromo = false }: { 
  dessert: Dessert
  onImageClick: (image: string) => void
  isNew?: boolean
  isPromo?: boolean
}) => {
  const { t } = useLanguage()
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="relative h-64 cursor-pointer" onClick={() => onImageClick(dessert.image)}>
        <Image
          src={dessert.image || "/placeholder.svg"}
          alt={dessert.name}
          fill
          className="object-cover"
        />
        {/* New badge */}
        {isNew && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
              {t('featured.new.badge')}
            </span>
          </div>
        )}
        {/* Promo badge */}
        {isPromo && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {t('featured.promo.badge')}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{dessert.name}</h3>
        <p className="text-gray-600 text-sm mt-1">{dessert.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-lg">₪{dessert.price.toFixed(2)}/{t('featured.kgUnit')}</span>
          <div className="relative group">
            <Button 
              size="sm" 
              disabled
              className="bg-gray-400 cursor-not-allowed opacity-50"
            >
              <ShoppingCartIcon className="h-4 w-4 ml-1" />
              {t('featured.cart')}
            </Button>
            <span className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
              {t('featured.comingSoon')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeaturedDesserts() {
  const { toast: showToast } = useToast()
  const { addItem } = useCart()
  const { t } = useLanguage()
  const [featuredDesserts, setFeaturedDesserts] = useState<Dessert[]>([])
  const [saleDesserts, setSaleDesserts] = useState<Dessert[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedDesserts = async () => {
      try {
        const fetchedDesserts = await getDesserts()
        
        const newDesserts = fetchedDesserts.filter((dessert) =>
          Array.isArray(dessert.tags) && dessert.tags.some((tag) => tag.includes("חדש"))
        )
        setFeaturedDesserts(newDesserts)

        const promos = fetchedDesserts.filter((dessert) =>
          Array.isArray(dessert.tags) && dessert.tags.some((tag) => tag.includes("מבצע"))
        )
        setSaleDesserts(promos)
      } catch (error) {
        console.error("Error loading featured desserts:", error)
        showToast({
          title: t('errors.title'),
          description: t('errors.loadingError'),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    loadFeaturedDesserts()
  }, [t, showToast])

  const handleAddToCart = (dessert: Dessert) => {
    addItem({
      id: dessert.id,
      name: dessert.name,
      price: dessert.price,
      image: dessert.image,
      quantity: 1,
      weight: 1,
    })

    toast({
      title: t('featured.addedToCart'),
      description: `${dessert.name} ${t('featured.addedToCart').toLowerCase()}`,
    })
  }

  const handleImageClick = (image: string) => {
    setSelectedImage(image)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  if (isLoading) {
    return (
      <div className="py-16">
        <div className="container px-4 mx-auto">
          <div className="text-center text-gray-500">
            {t('errors.loading')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="py-16">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">{t('featured.new')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredDesserts.length === 0 ? (
            <p className="text-center col-span-full">{t('featured.noFeatured')}</p>
          ) : (
            featuredDesserts.map((dessert) => (
              <DessertCard
                key={dessert.id}
                dessert={dessert}
                onImageClick={handleImageClick}
                isNew={true}
              />
            ))
          )}
        </div>

        {/* Promotions section */}
        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">{t('featured.promos')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {saleDesserts.length === 0 ? (
              <p className="text-center col-span-full">{t('featured.noPromos')}</p>
            ) : (
              saleDesserts.map((dessert) => (
                <DessertCard
                  key={`sale-${dessert.id}`}
                  dessert={dessert}
                  onImageClick={handleImageClick}
                  isPromo={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Modal for enlarged image */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={closeImageModal}>
            <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden" />
            <DialogContent
              className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center overflow-hidden"
            >
              <DialogTitle>
                <VisuallyHidden>{t('featured.enlargedImage')}</VisuallyHidden>
              </DialogTitle>
              <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src={selectedImage}
                    alt={t('featured.enlargedImage')}
                    className="rounded-md object-contain"
                    style={{
                      maxWidth: "60%",
                      maxHeight: "60%",
                      width: "auto",
                      height: "auto",
                    }}
                    width={600}
                    height={400}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/desserts"
            className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-md font-medium hover:bg-primary/10 transition-colors"
          >
            {t('featured.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  )
}