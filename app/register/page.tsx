"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Header from "@/components/header"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "שם הוא שדה חובה"
    }

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
    } else if (formData.password.length < 6) {
      errors.password = "הסיסמה חייבת להכיל לפחות 6 תווים"
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "הסיסמאות אינן תואמות"
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

    try {
      await register(formData.name, formData.email, formData.password)
      toast({
        title: "נרשמת בהצלחה",
        description: "ברוך הבא לתיבת הטעמים!",
      })
      router.push("/")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "שגיאה בהרשמה",
        description: "אירעה שגיאה בעת ההרשמה. אנא נסה שוב.",
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
          <h1 className="text-3xl font-bold mb-8 text-center">הרשמה</h1>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="ישראל ישראלי"
                  value={formData.name}
                  onChange={handleChange}
                  className={validationErrors.name ? "border-red-500" : ""}
                />
                {validationErrors.name && <p className="text-xs text-red-500">{validationErrors.name}</p>}
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={validationErrors.confirmPassword ? "border-red-500" : ""}
                />
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "מבצע הרשמה..." : "הרשמה"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                כבר יש לך חשבון?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  התחבר כאן
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

