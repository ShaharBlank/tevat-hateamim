"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MinusIcon, PlusIcon, TrashIcon, CalendarIcon, TruckIcon, ScaleIcon, Bold } from "lucide-react"
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
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery">("pickup"); // Add state for delivery option
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // State for selected image
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null); // State for the single delivery date

  const subtotal = getTotal()
  const shipping = deliveryOption === "delivery" ? 50 : 0; // Update shipping cost based on delivery option
  const tax = subtotal * 0.18
  const total = subtotal + shipping + tax // Recalculate total

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
  const handleAmountChange = (id: number, amount: number) => {
    updateWeight(id, amount); // עדיין משתמש בפונקציה של cart-context, אבל המשמעות היא כמות/משקל
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDeliveryDate(date.toISOString()); // Set the single delivery date
      setOpenPopoverId(null); // Close the popover after date selection
    }
  }

  const handleUseProfileData = () => {
    if (!user) return;

    setUseProfileData(!useProfileData);

    if (!useProfileData) {
      // Fill in data from profile
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || localStorage.getItem("userPhone") || "");
      setAddress(user.address || localStorage.getItem("userAddress") || "");
    } else {
      // Allow editing again by clearing the fields
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
    }
  }

  const handleDeliveryOptionChange = (option: "pickup" | "delivery") => {
    setDeliveryOption(option);
    if (option === "pickup") {
      setAddress(""); // Clear address for pickup
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Check if a delivery date is selected
    if (!deliveryDate) {
      errors.deliveryDates = "יש לבחור תאריך אספקה להזמנה";
    }

    // Validate required fields
    if (!name.trim()) errors.name = "שם הוא שדה חובה";
    if (!email.trim()) errors.email = "אימייל הוא שדה חובה";
    if (!phone.trim()) errors.phone = "טלפון הוא שדה חובה";
    if (deliveryOption === "delivery" && !address.trim()) {
      errors.address = "כתובת היא שדה חובה למשלוח";
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.email = "אנא הזן כתובת אימייל תקינה";
    }

    // Validate phone format (Israeli phone number)
    const phoneRegex = /^0(5[0-9]|[2-4]|[8-9]|7[0-9])-?[0-9]{7}$/;
    if (phone && !phoneRegex.test(phone.replace(/-/g, ""))) {
      errors.phone = "אנא הזן מספר טלפון תקין";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      // Show toast with the first error
      const firstError = Object.values(validationErrors)[0];
      toast({
        title: "שגיאה בטופס",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

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
        deliveryDate: deliveryDate || "", // Ensure deliveryDate is a string
      });

      // Save user data for future use if logged in
      if (user) {
        localStorage.setItem("userPhone", phone);
        localStorage.setItem("userAddress", address);
      }

      toast({
        title: "ההזמנה נשלחה בהצלחה",
        description: `מספר הזמנה: ${order.orderNumber}. נעדכן אותך כשההזמנה תאושר`,
      });

      // Clear cart and redirect to orders page
      clearCart();
      router.push("/orders");
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שליחת ההזמנה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dessert.stock > 0) {
      return []; // No disabled dates if the dessert is in stock
    }

    const leadtime = dessert.leadtime || 0; // Updated to match the new column name
    const disabledDates = [];

    for (let i = 0; i < leadtime; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i + 1);
      disabledDates.push(date.toISOString().split("T")[0]);
    }
    return disabledDates;
  }

  const getMaxLeadTime = () => {
    return items.reduce((max, item) => {
      const dessert = dessertsMap[item.id];
      return dessert?.leadtime && dessert.leadtime > max ? dessert.leadtime : max;
    }, 0);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison

    const maxLeadTime = getMaxLeadTime();
    const leadtimeLimit = new Date(today);
    leadtimeLimit.setDate(today.getDate() + maxLeadTime);

    return date < today || date > leadtimeLimit; // Disable past dates and dates beyond the max lead time
  }

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Reduced gap */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4"> {/* Reduced padding */}
                  <h2 className="text-xl font-semibold mb-3">פריטים בסל</h2> {/* Reduced margin */}
                  <div className="divide-y">
                    {items.map((item) => {
                      const dessert = dessertsMap[item.id];
                      if (!dessert) return null;
                      return (
                        <div key={item.id} className="py-6 flex flex-col sm:flex-row gap-6">
                          <div
                            className="relative w-40 h-42 flex-shrink-0 cursor-pointer"
                            onClick={() => handleImageClick(item.image || "/placeholder.svg")}
                          >
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-semibold text-xl">{item.name}</h3>
                            <div className="text-base text-gray-500 mt-2">
                              ₪{item.price.toFixed(2)}/{dessert.isweight ? "ק\"ג" : "יח'"} × {item.weight.toFixed(1)} {dessert.isweight ? "ק\"ג" : "יח'"} =
                              <span className="font-semibold"> ₪{(item.price * item.weight).toFixed(2)}</span>
                            </div>
                            {dessert?.leadtime != null && dessert?.leadtime > 0 && (
                              <p className="text-base text-gray-500 mt-1">
                                ימי הזמנה מראש: <b>{dessert.leadtime}</b>
                              </p>
                            )}
                            {/* Amount/Weight control */}
                            <div className="mt-3 mb-3">
                              <label className="text-base mb-2 flex items-center">
                                <ScaleIcon className="h-4 w-4 ml-2" />
                                {dessert.isweight ? "משקל (ק\"ג):" : "כמות (יחידות):"}
                              </label>
                              <div className="flex items-center gap-3">
                                <select
                                  value={item.weight}
                                  onChange={(e) => handleAmountChange(item.id, parseFloat(e.target.value))}
                                  className="border rounded-md p-2"
                                >
                                  {dessert.amount.map((val) => (
                                    <option key={val} value={val}>
                                      {val} {dessert.isweight ? "ק\"ג" : "יח'"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Remove item button */}
                          <div className="flex-shrink-0 flex justify-center items-center">
                            <Button
                              variant="destructive"
                              size="lg"
                              onClick={() => removeItem(item.id)}
                              className="text-white bg-red-500 hover:bg-red-700 px-6 py-3 rounded-md flex items-center gap-2"
                            >
                              <TrashIcon className="h-5 w-5" />
                              מחק
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-lg shadow-md p-4"> {/* Reduced padding */}
              <h2 className="text-xl font-semibold mb-3">סיכום הזמנה</h2> {/* Reduced margin */}
              <div className="divide-y">
                <div className="py-2 flex justify-between"> {/* Reduced padding */}
                  <span className="text-gray-700">סכום ביניים</span>
                  <span className="font-semibold">₪{subtotal.toFixed(2)}</span>
                </div>
                <div className="py-2 flex justify-between"> {/* Reduced padding */}
                  <span className="text-gray-700">משלוח</span>
                  <span className="font-semibold">{deliveryOption === "delivery" ? "₪50.00" : "₪0.00"}</span>
                </div>
                <div className="py-2 flex justify-between"> {/* Reduced padding */}
                  <span className="text-gray-700">מע"מ (18%)</span>
                  <span className="font-semibold">₪{tax.toFixed(2)}</span>
                </div>
                <div className="py-2 flex justify-between font-semibold text-lg"> {/* Reduced padding */}
                  <span>סה"כ לתשלום</span>
                  <span>₪{total.toFixed(2)}</span>
                </div>
              </div>

              {/* User information form */}
              <div className="mt-4"> {/* Reduced margin */}
                <h3 className="text-lg font-semibold mb-3">פרטי המשלוח</h3> {/* Reduced margin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> {/* Reduced gap */}
                  <div>
                    <Label htmlFor="name" className="text-sm">שם מלא</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                      disabled={useProfileData || isSubmitting}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                      disabled={useProfileData || isSubmitting}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm">טלפון</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1"
                      disabled={useProfileData || isSubmitting}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-sm">כתובת</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1"
                      disabled={deliveryOption === "pickup" || useProfileData || isSubmitting} // Disable for pickup
                    />
                    {deliveryOption === "delivery" && validationErrors.address && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3"> {/* Reduced margin */}
                  <Label htmlFor="notes" className="text-sm">הערות נוספות</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mt-3 flex items-center"> {/* Reduced margin */}
                  <input
                    id="useProfileData"
                    type="checkbox"
                    checked={useProfileData}
                    onChange={handleUseProfileData}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="useProfileData" className="ml-2 text-sm text-gray-700">השתמש בפרטי פרופיל</label>
                </div>
              </div>

              <div className="mt-4"> {/* Reduced margin */}
                <h3 className="text-lg font-semibold mb-3">אפשרויות משלוח</h3> {/* Reduced margin */}
                <div className="flex items-center gap-3"> {/* Reduced gap */}
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="pickup"
                      checked={deliveryOption === "pickup"}
                      onChange={() => handleDeliveryOptionChange("pickup")}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span>איסוף עצמי</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="delivery"
                      checked={deliveryOption === "delivery"}
                      onChange={() => handleDeliveryOptionChange("delivery")}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span>משלוח (₪50 לבאר שבע בלבד)</span>
                  </label>
                </div>
              </div>

              {/* Delivery date selection */}
              <div className="mt-4">
                <Popover
                  open={openPopoverId === 0}
                  onOpenChange={(open) => setOpenPopoverId(open ? 0 : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-10 text-sm flex items-center gap-2 ${
                        !deliveryDate && validationErrors.deliveryDates ? "border-red-500 text-red-500" : ""
                      }`}
                    >
                      <CalendarIcon className="h-4 w-4 ml-2" />
                      {deliveryDate
                        ? format(new Date(deliveryDate), "dd/MM/yyyy", { locale: he })
                        : "בחר תאריך אספקה"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start" dir="rtl">
                    <div className="flex flex-col items-center">
                      <div className="grid grid-cols-7 gap-2 mb-2 w-full text-center">
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
                          const isDisabled = isDateDisabled(currentDate);
                          const isSelected = deliveryDate
                            ? new Date(deliveryDate).toDateString() === currentDate.toDateString()
                            : false;
                          const isToday = new Date().toDateString() === currentDate.toDateString();

                          return (
                            <button
                              key={index}
                              onClick={() => !isDisabled && handleDateSelect(currentDate)}
                              disabled={isDisabled}
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                                isDisabled || currentDate < new Date()
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
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

              <div className="mt-4"> {/* Reduced margin */}
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

