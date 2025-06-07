"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ShoppingCartIcon, FilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/lib/cart-context"
import { Dessert, getDesserts, getDessertCategories } from "@/lib/db-service"
import Header from "@/components/header"
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export default function DessertsPage() {
  const [desserts, setDesserts] = useState<Dessert[]>([])
  const [filteredDesserts, setFilteredDesserts] = useState<Dessert[]>([]) // Add state for filtered desserts
  const [categories, setCategories] = useState<string[]>([]) // Dynamically loaded categories
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 1000]) // Default wide range
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { addItem } = useCart()
  const [showFilters, setShowFilters] = useState(false) // Ensure showFilters state is defined
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    async function loadDesserts() {
      try {
        const allDesserts = await getDesserts()
        setDesserts(allDesserts)
        setFilteredDesserts(allDesserts) // Show all desserts by default
      } catch (error) {
        console.error("Error loading desserts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDesserts()
  }, [])

  useEffect(() => {
    async function loadCategories() {
      try {
        const fetchedCategories = await getDessertCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Error loading categories:", error)
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הקטגוריות",
          variant: "destructive",
        })
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    // Apply filters whenever filters change
    const filtered = desserts.filter((dessert) => {
      const matchesStock = dessert.stock > 0 // Replace available with stock > 0 logic
      const matchesCategory = selectedCategory === "all" || dessert.category === selectedCategory
      const matchesPrice = dessert.price >= priceRange[0] && dessert.price <= priceRange[1]
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => dessert.tags.includes(tag))
      return matchesCategory && matchesPrice && matchesTags
    })
    setFilteredDesserts(filtered)
  }, [desserts, selectedCategory, priceRange, selectedTags])

  // Update the handleAddToCart function to handle weight
  const handleAddToCart = (dessert: Dessert) => {
    if (dessert.stock <= 0) {
      toast({
        title: "לא ניתן להזמין",
        description: "המוצר אזל מהמלאי.",
        variant: "destructive",
      })
      return
    }

    const defaultWeight = typeof dessert.weights[0] === "string" ? parseFloat(dessert.weights[0]) : dessert.weights[0] || 1 // Ensure weight is a number

    addItem({
      id: dessert.id,
      name: dessert.name,
      price: dessert.price,
      image: dessert.image,
      quantity: 1,
      weight: defaultWeight,
    })

    toast({
      title: "נוסף לסל הקניות",
      description: `${dessert.name} נוסף לסל הקניות שלך`,
    })
  }

  // Get all unique tags from all desserts
  const allTags = Array.from(new Set(desserts.flatMap((dessert: any) => dessert.tags || [])))

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleImageClick = (image: string) => {
    setSelectedImage(image)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" dir="rtl">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">הקינוחים שלנו</h1>
          <div className="text-center py-12">טוען...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">הקינוחים שלנו</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center"
            >
              <FilterIcon className="h-4 w-4 ml-2" />
              {showFilters ? "הסתר סינון" : "הצג סינון"}
            </Button>
          </div>

          {/* Sidebar filters */}
          <div className={`lg:w-1/4 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="font-semibold text-lg mb-4">קטגוריות</h2>
              <div className="space-y-2 mb-6">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === selectedCategory ? "all" : category)}
                    className={`block w-full text-right px-3 py-2 rounded-md ${
                      selectedCategory === category ? "bg-pink-100 text-pink-700" : "hover:bg-gray-100"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <h2 className="font-semibold text-lg mb-4">טווח מחירים</h2>
              <div className="px-2">
                <Slider
                  defaultValue={[500, 0]} // Reverse the default range
                  min={0}
                  max={500}
                  step={5}
                  value={[500 - priceRange[1], 500 - priceRange[0]]} // Reverse the values
                  onValueChange={(values) =>
                    setPriceRange([500 - values[1], 500 - values[0]]) // Reverse the values on change
                  }
                  className="mb-6"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₪{priceRange[0]}</span>
                  <span>₪{priceRange[1]}</span>
                </div>
              </div>

              {allTags.length > 0 && (
                <>
                  <h2 className="font-semibold text-lg mt-6 mb-4">תגיות</h2>
                  <div className="space-y-2">
                    {allTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                        />
                        <label
                          htmlFor={`tag-${tag}`}
                          className="text-sm font-medium leading-none mr-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product grid */}
          <div className="lg:w-3/4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDesserts.map((dessert: any) => (
                <div
                  key={dessert.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-64 cursor-pointer" onClick={() => handleImageClick(dessert.image)}>
                    <Image src={dessert.image || "/placeholder.svg"} alt={dessert.name} fill className="object-cover" />
                    {dessert.tags?.includes("חדש") && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        חדש
                      </span>
                    )}
                    {dessert.tags?.includes("הנמכר ביותר") && (
                      <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                        הנמכר ביותר
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{dessert.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{dessert.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      {dessert.stock > 0 ? (
                        <span className="font-bold text-lg">₪{dessert.price.toFixed(2)}/ק"ג</span>
                      ) : (
                        <span className="text-red-600 font-medium">אזל המלאי</span>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(dessert)}
                        disabled={dessert.stock === 0}
                        className={`${
                          dessert.stock === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                        }`}
                      >
                        <ShoppingCartIcon className="h-4 w-4 ml-1" />
                        הוסף לסל
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDesserts.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">לא נמצאו קינוחים</h2>
                <p className="text-gray-600">נסה לשנות את הסינון כדי למצוא את מה שאתה מחפש.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal for enlarged image */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={closeImageModal}>
            <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden" />
            <DialogContent className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center overflow-hidden">
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
                    width={600}
                    height={400}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}

