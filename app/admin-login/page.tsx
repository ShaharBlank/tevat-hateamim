"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"
import { notifyPendingOrders } from "@/hooks/use-toast"

export default function AdminLoginPage() {
  const { user, adminLogin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [loginError, setLoginError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // אם המשתמש כבר מחובר כמנהל, הפנה אותו לדף הניהול
  useEffect(() => {
    if (user && user.role === "admin") {
      notifyPendingOrders(); // Notify about pending orders
      router.push("/admin")
    }
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing again
    setLoginError(null)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.email.trim()) {
      errors.email = "אימייל הוא שדה חובה"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = "אנא הזן כתובת אימייל תקינה"
      }
    }

    if (!formData.password) {
      errors.password = "סיסמה היא שדה חובה"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setLoginError(null)

    try {
      const success = await adminLogin(formData.email, formData.password)

      if (success) {
        toast({
          title: "התחברת בהצלחה",
          description: "ברוכים הבאים למערכת הניהול",
        })
        router.push("/admin")
      } else {
        // Set error message instead of navigating
        setLoginError("אימייל או סיסמה שגויים, או שאין לך הרשאות מנהל.")
        toast({
          title: "התחברות נכשלה",
          description: "אימייל או סיסמה שגויים, או שאין לך הרשאות מנהל.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("אירעה שגיאה בעת ההתחברות. אנא נסה שוב מאוחר יותר.")
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת ההתחברות",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">כניסת מנהל</h1>
            <p className="mt-2 text-gray-600">התחבר למערכת הניהול של תיבת הטעמים</p>
          </div>

          {loginError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{loginError}</div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                className={validationErrors.email ? "border-red-500" : ""}
                required
              />
              {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={validationErrors.password ? "border-red-500" : ""}
                required
              />
              {validationErrors.password && <p className="text-xs text-red-500">{validationErrors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "מתחבר..." : "התחבר כמנהל"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              <Link href="/login" className="text-primary hover:underline">
                חזרה לכניסת משתמש רגיל
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

