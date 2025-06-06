"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MinusIcon, PlusIcon, TrashIcon, CalendarIcon, TruckIcon, ScaleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider" // Add this line to import Slider
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CartItem, useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { createOrder, getDesserts, Dessert } from "@/lib/db-service"
import Header from "@/components/header"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils" // Utility for conditional class names
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover" // Import Popover components

export default function CartPage() {
  const { items, updateQuantity, updateWeight, removeItem, getTotal, updateDeliveryDate, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [dessertsMap, setDessertsMap] = useState<Record<number, Dessert>>({}) // Map dessert ID to full Dessert object
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null)
  const [useProfileData, setUseProfileData] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const subtotal = getTotal()
  const shipping = 30
  const tax = subtotal * 0.18
  const total = subtotal + shipping + tax

  useEffect(() => {
    // Load user profile data if available
    if (user) {
      setEmail(user.email || "")

      // Try to get additional data from localStorage
      const storedPhone = localStorage.getItem("userPhone")
      const storedAddress = localStorage.getItem("userAddress")

      if (storedPhone) setPhone(storedPhone)
      if (storedAddress) setAddress(storedAddress)
    }
  }, [user])

  useEffect(() => {
    // Fetch desserts and map their full objects
    const fetchDesserts = async () => {
      try {
        const fetchedDesserts = await getDesserts()
        const dessertMap = fetchedDesserts.reduce((acc, dessert) => {
          acc[dessert.id] = dessert
          return acc
        }, {} as Record<number, Dessert>)
        setDessertsMap(dessertMap)
      } catch (error) {
        console.error("Error fetching desserts:", error)
      }
    }

    fetchDesserts()
  }, [])

  // Handle weight change
  const handleWeightChange = (id: number, weight: number) => {
    const minweight = dessertsMap[id]?.minweight || 1 // Default to 1kg if not found
    const adjustedWeight = Math.max(minweight, weight) // Ensure weight is at least minweight
    updateWeight(id, adjustedWeight)
  }

  const handleDateSelect = (id: number, date: Date | undefined) => {
    if (date) {
      updateDeliveryDate(id, date.toISOString())
      setOpenPopoverId(null) // Close the popover after date selection
    }
  }

  const handleUseProfileData = () => {
    if (!user) return

    setUseProfileData(!useProfileData)

    if (!useProfileData) {
      // Fill in data from profile
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone(user.phone || localStorage.getItem("userPhone") || "")
      setAddress(user.address || localStorage.getItem("userAddress") || "")
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Check if all items have delivery dates
    const missingDates = items.some((item) => !item.deliveryDate)
    if (missingDates) {
      errors.deliveryDates = "יש לבחור תאריך אספקה לכל המוצרים"
    }

    // Validate required fields
    if (!name.trim()) errors.name = "שם הוא שדה חובה"
    if (!email.trim()) errors.email = "אימייל הוא שדה חובה"
    if (!phone.trim()) errors.phone = "טלפון הוא שדה חובה"
    if (!address.trim()) errors.address = "כתובת היא שדה חובה"

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      errors.email = "אנא הזן כתובת אימייל תקינה"
    }

    // Validate phone format (Israeli phone number)
    const phoneRegex = /^0(5[0-9]|[2-4]|[8-9]|7[0-9])-?[0-9]{7}$/
    if (phone && !phoneRegex.test(phone.replace(/-/g, ""))) {
      errors.phone = "אנא הזן מספר טלפון תקין"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      // Show toast with the first error
      const firstError = Object.values(validationErrors)[0]
      toast({
        title: "שגיאה בטופס",
        description: firstError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create order
      const order = await createOrder({
        userid: user?.id || localStorage.getItem("guestId") || "guest",
        username: name,
        useremail: email,
        userphone: phone,
        useraddress: address,
        items,
        total,
        shipping,
        notes,
      })

      // Save user data for future use if logged in
      if (user) {
        localStorage.setItem("userPhone", phone)
        localStorage.setItem("userAddress", address)
      }

      toast({
        title: "ההזמנה נשלחה בהצלחה",
        description: `מספר הזמנה: ${order.orderNumber}. נעדכן אותך כשההזמנה תאושר`,
      })

      // Clear cart and redirect to orders page
      clearCart()
      router.push("/orders")
    } catch (error) {
      console.error("Error submitting order:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שליחת ההזמנה",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function addToCart(item: CartItem) {
    const { items, updateQuantity } = useCart();

    // Check if the item already exists in the cart
    const existingItem = items.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      // If the item exists, increase its quantity by 1
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      // If the item doesn't exist, add it to the cart with a default quantity of 1
      updateQuantity(item.id, 1);
    }
  }

  const handleAddToCart = (item: CartItem): void => {
    const cartIcon = document.querySelector("#cart-icon") as HTMLElement | null
    const itemElement = document.querySelector(`#item-${item.id}`) as HTMLElement | null

    if (cartIcon && itemElement) {
      const rect = itemElement.getBoundingClientRect()
      const cartRect = cartIcon.getBoundingClientRect()

      const animation = document.createElement("div")
      animation.className = "cart-animation"
      animation.style.position = "absolute"
      animation.style.top = `${rect.top}px`
      animation.style.left = `${rect.left}px`
      animation.style.width = `${rect.width}px`
      animation.style.height = `${rect.height}px`
      animation.style.backgroundImage = `url(${item.image})`
      animation.style.backgroundSize = "cover"
      animation.style.zIndex = "1000"
      document.body.appendChild(animation)

      animation.animate(
        [
          { transform: "translate(0, 0)", opacity: 1 },
          { transform: `translate(${cartRect.left - rect.left}px, ${cartRect.top - rect.top}px)`, opacity: 0.5 },
        ],
        { duration: 500, easing: "ease-in-out" }
      ).onfinish = () => {
        animation.remove()
      }
    }

    // Add item to cart logic
    addToCart(item)
  }

  const getDisabledDates = (dessert?: Dessert) => {
    if (!dessert) {
      return [] // Return an empty array if dessert is undefined
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to midnight for comparison

    if (dessert.available) {
      return [] // No disabled dates if the dessert is available
    }

    const leadTime = dessert.leadTime || 0
    const disabledDates = []

    for (let i = 0; i < leadTime; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i + 1)
      disabledDates.push(date.toISOString().split("T")[0]) // Format as YYYY-MM-DD
    }
    return disabledDates
  }

  const isDateDisabled = (date: Date, disabledDates: string[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to midnight for comparison
    const formattedDate = date.toISOString().split("T")[0]
    return date < today || disabledDates.includes(formattedDate) // Disable past dates and specific disabled dates
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">סל הקניות שלך</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">הסל שלך ריק</h2>
            <p className="text-gray-600 mb-8">נראה שעדיין לא הוספת קינוחים לסל הקניות שלך.</p>
            <Link
              href="/desserts"
              className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              עיין בקינוחים
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">פריטים בסל</h2>
                  <div className="divide-y">
                    {items.map((item) => {
                      const dessert = dessertsMap[item.id] // Get the full Dessert object
                      const disabledDates = getDisabledDates(dessert)

                      return (
                        <div key={item.id} className="py-6 flex flex-col sm:flex-row gap-4">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-semibold">{item.name}</h3>
                            <div className="text-sm text-gray-500 mt-1">
                              ₪{item.price.toFixed(2)}/ק"ג × {item.weight.toFixed(1)} ק"ג =
                              <span className="font-semibold"> ₪{(item.price * item.weight).toFixed(2)}</span>
                            </div>

                            {/* Weight control */}
                            <div className="mt-2 mb-2">
                              <label className="text-sm mb-1 flex items-center">
                                <ScaleIcon className="h-3 w-3 ml-1" />
                                משקל (ק"ג): {item.weight.toFixed(1)}
                              </label>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleWeightChange(item.id, Math.max(dessertsMap[item.id]?.minweight || 1, item.weight - 0.1))}
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </Button>
                                <Slider
                                  min={dessertsMap[item.id]?.minweight || 1} // Use minweight from the fetched desserts
                                  max={5}
                                  step={0.1}
                                  value={[item.weight]}
                                  onValueChange={(value) => handleWeightChange(item.id, value[0])} // Allow slider movement
                                  className="max-w-[100px] mx-1"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleWeightChange(item.id, item.weight + 0.1)}
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="mt-2">
                              <Popover
                                open={openPopoverId === item.id}
                                onOpenChange={(open) => setOpenPopoverId(open ? item.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-8 text-xs flex items-center gap-1 ${
                                      !item.deliveryDate && validationErrors.deliveryDates
                                        ? "border-red-500 text-red-500"
                                        : ""
                                    }`}
                                  >
                                    <CalendarIcon className="h-3 w-3 ml-1" />
                                    {item.deliveryDate
                                      ? format(new Date(item.deliveryDate), "dd/MM/yyyy", { locale: he })
                                      : "בחר תאריך אספקה"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-3" align="start" dir="rtl">
                                  <div className="flex flex-col items-center">
                                    <div className="grid grid-cols-7 gap-2 mb-2 w-full text-center"> {/* Adjusted spacing and alignment */}
                                      {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day) => (
                                        <div key={day} className="font-semibold text-sm text-gray-700">
                                          {day}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                      {Array.from({ length: 42 }).map((_, index) => {
                                        const currentDate = new Date();
                                        currentDate.setDate(currentDate.getDate() + index - currentDate.getDay());
                                        const isDisabled = isDateDisabled(currentDate, disabledDates);
                                        const isSelected = item.deliveryDate
                                          ? new Date(item.deliveryDate).toDateString() === currentDate.toDateString()
                                          : false;
                                        const isToday = new Date().toDateString() === currentDate.toDateString();

                                        return (
                                          <button
                                            key={index}
                                            onClick={() => !isDisabled && handleDateSelect(item.id, currentDate)}
                                            disabled={isDisabled}
                                            className={cn(
                                              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                                              isDisabled || currentDate < new Date()
                                                ? "bg-gray-200 text-gray-400 cursor-not-allowed" // Gray for disabled or past dates
                                                : "bg-white text-black hover:bg-primary hover:text-white",
                                              isSelected && "bg-primary text-white",
                                              isToday && !isSelected && "bg-accent text-accent-foreground"
                                            )}
                                          >
                                            {currentDate.getDate()}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">סיכום הזמנה</h2>
              <div className="divide-y">
                <div className="py-4 flex justify-between">
                  <span className="text-gray-700">ס subtotal</span>
                  <span className="font-semibold">₪{subtotal.toFixed(2)}</span>
                </div>
                <div className="py-4 flex justify-between">
                  <span className="text-gray-700">משלוח</span>
                  <span className="font-semibold">₪{shipping.toFixed(2)}</span>
                </div>
                <div className="py-4 flex justify-between">
                  <span className="text-gray-700">מע"מ (18%)</span>
                  <span className="font-semibold">₪{tax.toFixed(2)}</span>
                </div>
                <div className="py-4 flex justify-between font-semibold text-lg">
                  <span>סה"כ לתשלום</span>
                  <span>₪{total.toFixed(2)}</span>
                </div>
              </div>

              {/* User information form */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">פרטי המשלוח</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">
                      שם מלא
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">
                      אימייל
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm">
                      טלפון
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-sm">
                      כתובת
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    {validationErrors.address && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes" className="text-sm">
                    הערות נוספות
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mt-4 flex items-center">
                  <input
                    id="useProfileData"
                    type="checkbox"
                    checked={useProfileData}
                    onChange={handleUseProfileData}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="useProfileData" className="ml-2 text-sm text-gray-700">
                    השתמש בפרטי פרופיל
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleSubmitOrder}
                  className="w-full py-3 text-lg font-semibold rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "שולח הזמנה..." : "שלח הזמנה"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

