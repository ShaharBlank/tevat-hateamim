"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/header"
import { getOrdersByUserId } from "@/lib/db-service"
import { supabaseClient } from "@/lib/supabase-client"
import { MapPinIcon, PhoneIcon } from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [orderCount, setOrderCount] = useState(0)

  // Profile form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    profileImage: "/placeholder.svg?height=200&width=200",
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Load user data
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || localStorage.getItem("userPhone") || "",
      address: user.address || localStorage.getItem("userAddress") || "",
      city: user.city || localStorage.getItem("userCity") || "",
      profileImage: localStorage.getItem("userProfileImage") || "/placeholder.svg?height=200&width=200",
    })

    // Fetch order count
    async function fetchOrderCount() {
      try {
        const orders = await getOrdersByUserId(user.id)
        setOrderCount(orders.length)
      } catch (error) {
        console.error("Error fetching orders:", error)
        setOrderCount(0) // Set to 0 in case of error
      } finally {
        setLoading(false)
      }
    }

    fetchOrderCount()
  }, [user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const validateProfileForm = () => {
    const errors: Record<string, string> = {}

    // Validate phone format (Israeli phone number)
    if (formData.phone) {
      const phoneRegex = /^0(5[0-9]|[2-4]|[8-9]|7[0-9])-?[0-9]{7}$/
      if (!phoneRegex.test(formData.phone.replace(/-/g, ""))) {
        errors.phone = "אנא הזן מספר טלפון תקין"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      errors.currentPassword = "יש להזין את הסיסמה הנוכחית"
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "יש להזין סיסמה חדשה"
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "הסיסמה חייבת להכיל לפחות 6 תווים"
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "הסיסמאות אינן תואמות"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateProfileForm()) {
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
      // Update user profile in the database
      const { error } = await supabaseClient
        .from("users")
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        })
        .eq("id", user?.id || "")

      if (error) throw error

      // Update local storage
      localStorage.setItem("userPhone", formData.phone)
      localStorage.setItem("userAddress", formData.address)
      localStorage.setItem("userCity", formData.city)

      // Update user context
      if (user) {
        const updatedUser = {
          ...user,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        }
        localStorage.setItem("user", JSON.stringify(updatedUser))
      }

      toast({
        title: "הפרופיל עודכן בהצלחה",
        description: "פרטי הפרופיל שלך נשמרו בהצלחה",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת עדכון הפרופיל",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswordForm()) {
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
      // Verify current password
      const { data, error } = await supabaseClient
        .from("users")
        .select("id")
        .eq("id", user?.id || "")
        .eq("password", passwordData.currentPassword)
        .single()

      if (error || !data) {
        toast({
          title: "שגיאה",
          description: "הסיסמה הנוכחית שגויה",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Update password
      const { error: updateError } = await supabaseClient
        .from("users")
        .update({ password: passwordData.newPassword })
        .eq("id", user?.id || "")

      if (updateError) throw updateError

      toast({
        title: "הסיסמה עודכנה בהצלחה",
        description: "הסיסמה שלך שונתה בהצלחה",
      })

      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת עדכון הסיסמה",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" dir="rtl">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center py-12">טוען...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">הפרופיל שלי</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              {user.image && ( // Only display the image if it exists
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={user.image}
                    alt="תמונת פרופיל"
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              )}
              <CardTitle className="text-xl">{formData.name}</CardTitle>
              <CardDescription>{formData.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span className="mr-2">{formData.phone || "לא הוגדר"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="mr-2">{formData.address ? `${formData.address}, ${formData.city}` : "לא הוגדר"}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">הזמנות</span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                    {orderCount}
                  </span>
                </div>
                <Button variant="outline" className="w-full" onClick={() => router.push("/orders")}>
                  צפה בהזמנות
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" className="w-full" onClick={logout}>
                התנתק
              </Button>
            </CardFooter>
          </Card>

          {/* Edit Profile Tabs */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>עריכת פרופיל</CardTitle>
              <CardDescription>עדכן את פרטי החשבון שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">פרטים אישיים</TabsTrigger>
                  <TabsTrigger value="password">סיסמה</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4 pt-4">
                  <form onSubmit={handleProfileSubmit} className="space-y-4 text-right">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-right block">
                        שם מלא
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="שם מלא"
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-right block">
                        אימייל
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        disabled
                        className="text-right"
                      />
                      <p className="text-xs text-muted-foreground text-right">לא ניתן לשנות את כתובת האימייל</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-right block">
                        טלפון
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="050-1234567"
                        className={`text-right ${validationErrors.phone ? "border-red-500" : ""}`}
                      />
                      {validationErrors.phone && (
                        <p className="text-xs text-red-500 text-right">{validationErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-right block">
                        כתובת
                      </Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="הזן את כתובתך"
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-right block">
                        עיר
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="עיר"
                        className="text-right"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "שומר שינויים..." : "שמור שינויים"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="password" className="space-y-4 pt-4">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 text-right">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-right block">
                        סיסמה נוכחית
                      </Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        required
                        className={`text-right ${validationErrors.currentPassword ? "border-red-500" : ""}`}
                      />
                      {validationErrors.currentPassword && (
                        <p className="text-xs text-red-500 text-right">{validationErrors.currentPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-right block">
                        סיסמה חדשה
                      </Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        required
                        className={`text-right ${validationErrors.newPassword ? "border-red-500" : ""}`}
                      />
                      {validationErrors.newPassword && (
                        <p className="text-xs text-red-500 text-right">{validationErrors.newPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-right block">
                        אימות סיסמה חדשה
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        required
                        className={`text-right ${validationErrors.confirmPassword ? "border-red-500" : ""}`}
                      />
                      {validationErrors.confirmPassword && (
                        <p className="text-xs text-red-500 text-right">{validationErrors.confirmPassword}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "מעדכן סיסמה..." : "עדכן סיסמה"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

