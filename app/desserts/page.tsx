"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ShoppingCartIcon, FilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/lib/cart-context"
import { Dessert, getDesserts } from "@/lib/db-service"
import Header from "@/components/header"

export default function DessertsPage() {
  const [desserts, setDesserts] = useState<Dessert[]>([])
  const [filteredDesserts, setFilteredDesserts] = useState<Dessert[]>([])
  const [categories, setCategories] = useState<string[]>([]) // Dynamically loaded categories
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null) // Default: show all
  const [priceRange, setPriceRange] = useState([0, 0]) // Dynamically set range
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { addItem } = useCart()
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function loadDesserts() {
      try {
        const allDesserts = await getDesserts()
        setDesserts(allDesserts)
        setFilteredDesserts(allDesserts) // Show all desserts by default

        // Extract unique categories from desserts
        const uniqueCategories = Array.from(new Set(allDesserts.map((dessert) => dessert.category).filter(Boolean)))
        setCategories(uniqueCategories)

        // Set dynamic price range
        const maxPrice = Math.max(...allDesserts.map((dessert) => dessert.price))
        setPriceRange([0, maxPrice])
      } catch (error) {
        console.error("Error loading desserts:", error)
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בטעינת הקינוחים",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDesserts()
  }, [])

  useEffect(() => {
    // Apply filters whenever filters change
    const filtered = desserts.filter((dessert) => {
      const matchesCategory = !selectedCategory || dessert.category === selectedCategory
      const matchesPrice = dessert.price >= priceRange[0] && dessert.price <= priceRange[1]
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) =>
          tag === "ללא תגית"
            ? dessert.tags?.includes("")
            : dessert.tags?.includes(tag)
        )
      return matchesCategory && matchesPrice && matchesTags
    })
    setFilteredDesserts(filtered)
  }, [desserts, selectedCategory, priceRange, selectedTags])

  const handleAddToCart = (dessert: Dessert) => {
    const minweight = dessert.minweight || 1

    addItem({
      id: dessert.id,
      name: dessert.name,
      price: dessert.price,
      image: dessert.image,
      quantity: 1,
      weight: minweight,
    })

    toast({
      title: "התווסף לסל",
      description: `${dessert.name} התווסף לסל הקניות שלך.`,
    })
  }

  const allTags = Array.from(
    new Set(
      desserts.flatMap((dessert) => (dessert.tags && dessert.tags.length > 0 ? dessert.tags : [""]))
    )
  ).map((tag) => (tag === "" ? "ללא תגית" : tag))
  
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
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
                    onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
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
                  min={0}
                  max={priceRange[1]} // Use dynamic max price
                  step={5}
                  value={priceRange}
                  onValueChange={(values) => setPriceRange(values)}
                  className="mb-6"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₪{priceRange[1]}</span>
                  <span>₪{priceRange[0]}</span>
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
              {filteredDesserts.map((dessert) => (
                <div
                  key={dessert.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-64">
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
                      <span className="font-bold text-lg">₪{dessert.price.toFixed(2)}/ק"ג</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(dessert)}
                        className="bg-primary hover:bg-primary/90"
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
      </main>
    </div>
  )
}

