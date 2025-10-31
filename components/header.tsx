"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCartIcon, UserIcon, MenuIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getNotificationsByUserId, getOrders } from "@/lib/db-service"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { items } = useCart()
  const [notifications, setNotifications] = useState<any[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  const [hasPendingOrders, setHasPendingOrders] = useState(false)

  // פונקציה לטעינת התראות
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const userNotifications = await getNotificationsByUserId(user.id)
          setNotifications(userNotifications)

          // בדיקה אם יש התראות שלא נקראו
          const unreadExists = userNotifications.some((notification) => !notification.read)
          setHasUnread(unreadExists)
        } catch (error) {
          console.error("Error fetching notifications:", error)
        }
      }

      fetchNotifications()

      // טעינת התראות כל 30 שניות
      const interval = setInterval(fetchNotifications, 30000)

      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const checkPendingOrders = async () => {
      try {
        const orders = await getOrders()
        const pendingExists = orders.some((order) => order.status === "pending")
        setHasPendingOrders(pendingExists)
      } catch (error) {
        console.error("Error checking pending orders:", error)
      }
    }

    checkPendingOrders()

    const interval = setInterval(checkPendingOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-10 bg-white border-b" dir="rtl">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="relative w-10 h-10">
            <Image src="/images/logo.png" alt="תיבת הטעמים" fill className="object-contain" />
          </div>
          <span>תיבת הטעמים</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            דף הבית
          </Link>
          <Link href="/desserts" className="text-sm font-medium hover:text-primary transition-colors">
            כל הקינוחים
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
            צור קשר
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Button 
              variant="ghost" 
              size="icon" 
              className="cursor-not-allowed opacity-50"
              disabled
            > 
              <ShoppingCartIcon className="h-6 w-6" />
            </Button>
            <span className="absolute hidden group-hover:block right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap">
              בקרוב..
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative">
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border border-white"></span>
                  )}
                </Button>
                {user?.role === "admin" && hasPendingOrders && (
                  <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                      הזמנה חדשה
                    </span>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-right">
              {user ? (
                <>
                  <DropdownMenuLabel>שלום, {user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full">
                      הפרופיל שלי
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="relative w-full">
                      ההזמנות שלי
                      {hasUnread && <Badge className="mr-2 bg-red-500 text-white text-[10px] px-1.5 py-0">חדש</Badge>}
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full">
                        ניהול החנות
                      </Link>
                    </DropdownMenuItem>
                  )}                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="w-full">
                    התנתק
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full">
                      התחברות
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="w-full">
                      הרשמה
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <nav className="container px-4 py-4 flex flex-col gap-4">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              דף הבית
            </Link>
            <Link
              href="/desserts"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              כל הקינוחים
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              צור קשר
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

