"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MinusIcon, PlusIcon, TrashIcon, CalendarIcon, TruckIcon, ScaleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CartItem, useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { createOrder, getDesserts } from "@/lib/db-service"
import Header from "@/components/header"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"

export default function CartPage() {
  const { items, updateQuantity, updateWeight, removeItem, getTotal, updateDeliveryDate, clearCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [desserts, setDesserts] = useState<Record<number, number>>({}) // Map dessert ID to minweight
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
    // Fetch desserts and map their minweight
    const fetchDesserts = async () => {
      try {
        const fetchedDesserts = await getDesserts()
        const dessertMinWeights = fetchedDesserts.reduce((acc, dessert) => {
          acc[dessert.id] = dessert.minweight || 1 // Default to 1kg if minweight is not defined
          return acc
        }, {} as Record<number, number>)
        setDesserts(dessertMinWeights)
      } catch (error) {
        console.error("Error fetching desserts:", error)
      }
    }

    fetchDesserts()
  }, [])

  // Handle weight change
  const handleWeightChange = (id: number, weight: number) => {
    const minweight = desserts[id] || 1 // Default to 1kg if not found
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
                    {items.map((item) => (
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
                                onClick={() => handleWeightChange(item.id, Math.max(desserts[item.id] || 1, item.weight - 0.1))}
                              >
                                <MinusIcon className="h-3 w-3" />
                              </Button>
                              <Slider
                                min={desserts[item.id] || 1} // Use minweight from the fetched desserts
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
                              onOpenChange={(open) => {
                                setOpenPopoverId(open ? item.id : null)
                              }}
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
                              <PopoverContent className="w-auto p-0" align="start" dir="rtl">
                                <Calendar
                                  mode="single"
                                  selected={item.deliveryDate ? new Date(item.deliveryDate) : undefined}
                                  onSelect={(date) => handleDateSelect(item.id, date)}
                                  disabled={(date) =>
                                    date < new Date() || date < new Date(new Date().setDate(new Date().getDate() + 2))
                                  }
                                  locale={he}
                                />
                              </PopoverContent>
                            </Popover>
                            {!item.deliveryDate && validationErrors.deliveryDates && (
                              <p className="text-xs text-red-500 mt-1">יש לבחור תאריך אספקה</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₪{(item.price * item.weight).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 mt-2 h-8 px-2"
                            onClick={() => removeItem(item.id)}
                          >
                            <TrashIcon className="h-4 w-4 ml-1" />
                            הסר
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">סיכום הזמנה</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>סכום ביניים</span>
                      <span>₪{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>משלוח</span>
                      <span>₪{shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מע"מ (18%)</span>
                      <span>₪{tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between font-semibold">
                      <span>סה"כ</span>
                      <span>₪{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">שם מלא</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="ישראל ישראלי"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={validationErrors.name ? "border-red-500" : ""}
                        disabled={useProfileData}
                        dir="rtl"
                      />
                      {validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={validationErrors.email ? "border-red-500" : ""}
                        disabled={useProfileData}
                        dir="rtl"
                      />
                      {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">מספר טלפון</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="050-1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className={validationErrors.phone ? "border-red-500" : ""}
                        disabled={useProfileData}
                        dir="rtl"
                      />
                      {validationErrors.phone && <p className="text-xs text-red-500">{validationErrors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">כתובת למשלוח</Label>
                      <Textarea
                        id="address"
                        placeholder="רחוב, מספר בית, עיר"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className={validationErrors.address ? "border-red-500" : ""}
                        disabled={useProfileData}
                        dir="rtl"
                      />
                      {validationErrors.address && <p className="text-xs text-red-500">{validationErrors.address}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">הערות להזמנה</Label>
                      <Textarea
                        id="notes"
                        placeholder="הערות מיוחדות להזמנה"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <Button
                      className="w-full mt-6 bg-primary hover:bg-primary/90"
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "שולח הזמנה..." : "שלח הזמנה"}
                    </Button>
                    <div className="mt-4 text-center">
                      <Link href="/desserts" className="text-sm text-primary hover:underline">
                        המשך בקניות
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
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

