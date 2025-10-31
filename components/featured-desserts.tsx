"use client"
import { useEffect, useState } from "react"
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

export default function FeaturedDesserts() {
  const { toast: showToast } = useToast()
  const { addItem } = useCart()
  const [featuredDesserts, setFeaturedDesserts] = useState<Dessert[]>([])
  const [saleDesserts, setSaleDesserts] = useState<Dessert[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const loadFeaturedDesserts = async () => {
      try {
        const fetchedDesserts = await getDesserts()
        // Select desserts with any tag that includes the substring "חדש"
        const newDesserts = fetchedDesserts.filter((dessert) =>
          Array.isArray(dessert.tags) && dessert.tags.some((tag) => tag.includes("חדש"))
        )
        setFeaturedDesserts(newDesserts)

        // Also select desserts that have any tag including the substring "מבצע" for promotions
        const promos = fetchedDesserts.filter((dessert) =>
          Array.isArray(dessert.tags) && dessert.tags.some((tag) => tag.includes("מבצע"))
        )
        setSaleDesserts(promos)
      } catch (error) {
        console.error("Error loading featured desserts:", error)
        showToast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הקינוחים המומלצים",
          variant: "destructive",
        })
      }
    }

    loadFeaturedDesserts()
  }, [useToast])

  const handleAddToCart = (dessert: Dessert) => {
    addItem({
      id: dessert.id,
      name: dessert.name,
      price: dessert.price, // Price per kg
      image: dessert.image,
      quantity: 1,
      weight: 1, // Default weight: 1kg
    })

    toast({
      title: "התווסף לסל",
      description: `${dessert.name} התווסף לסל הקניות שלך.`,
    })

    console.log(`${dessert.name} התווסף לסל הקניות שלך.`)
  }

  const handleImageClick = (image: string) => {
    setSelectedImage(image)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  return (
    <section className="py-16">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">חדש על המדף!</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredDesserts.length === 0 ? (
            <p className="text-center col-span-full">לא נמצאו קינוחים מומלצים</p>
          ) : (
            featuredDesserts.map((dessert) => (
              <div
                key={dessert.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div
                  className="relative h-64 cursor-pointer"
                  onClick={() => handleImageClick(dessert.image)}
                >
                  <Image
                    src={dessert.image || "/placeholder.svg"}
                    alt={dessert.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{dessert.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{dessert.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-lg">₪{dessert.price.toFixed(2)}/ק"ג</span>
                    <div className="relative group">
                      <Button 
                        size="sm" 
                        disabled
                        className="bg-gray-400 cursor-not-allowed opacity-50"
                      >
                        <ShoppingCartIcon className="h-4 w-4 ml-1" />
                        הוסף לסל
                      </Button>
                      <span className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                        בקרוב..
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promotions section - מבצעים */}
        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">מבצעים</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {saleDesserts.length === 0 ? (
              <p className="text-center col-span-full">לא נמצאו מבצעים</p>
            ) : (
              saleDesserts.map((dessert) => (
                <div
                  key={`sale-${dessert.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div
                    className="relative h-64 cursor-pointer"
                    onClick={() => handleImageClick(dessert.image)}
                  >
                    <Image
                      src={dessert.image || "/placeholder.svg"}
                      alt={dessert.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{dessert.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{dessert.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-bold text-lg">₪{dessert.price.toFixed(2)}/ק"ג</span>
                      <div className="relative group">
                        <Button 
                          size="sm" 
                          disabled
                          className="bg-gray-400 cursor-not-allowed opacity-50"
                        >
                          <ShoppingCartIcon className="h-4 w-4 ml-1" />
                          הוסף לסל
                        </Button>
                        <span className="absolute hidden group-hover:block bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                          בקרוב..
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
                <VisuallyHidden>תמונה מוגדלת של קינוח</VisuallyHidden>
              </DialogTitle>
              <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src={selectedImage}
                    alt="תמונה מוגדלת של קינוח"
                    className="rounded-md object-contain"
                    style={{
                      maxWidth: "60%",
                      maxHeight: "60%",
                      width: "auto",
                      height: "auto",
                    }}
                    width={600} // Adjusted width
                    height={400} // Adjusted height
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
            צפה בכל הקינוחים
          </Link>
        </div>
      </div>
    </section>
  )
}

