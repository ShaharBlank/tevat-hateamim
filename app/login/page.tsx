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

export default function LoginPage() {
  const { user, login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [loginError, setLoginError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // אם המשתמש כבר מחובר, הפנה אותו לדף הבית
  useEffect(() => {
    if (user) {
      router.push("/")
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
      const success = await login(formData.email, formData.password)

      if (success) {
        toast({
          title: "התחברת בהצלחה",
          description: "ברוך הבא לתיבת הטעמים!",
        })
        router.push("/")
      } else {
        // Set error message instead of navigating
        setLoginError("אימייל או סיסמה שגויים. אנא נסה שוב.")
        toast({
          title: "שגיאה בהתחברות",
          description: "אימייל או סיסמה שגויים. אנא נסה שוב.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("אירעה שגיאה בהתחברות. אנא נסה שוב מאוחר יותר.")
      toast({
        title: "שגיאה בהתחב��ות",
        description: "אירעה שגיאה בהתחברות. אנא נסה שוב מאוחר יותר.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">התחברות</h1>

          <div className="bg-white p-8 rounded-lg shadow-md">
            {loginError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {loginError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={validationErrors.password ? "border-red-500" : ""}
                />
                {validationErrors.password && <p className="text-xs text-red-500">{validationErrors.password}</p>}
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "מתחבר..." : "התחברות"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                אין לך חשבון?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  הירשם כאן
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

