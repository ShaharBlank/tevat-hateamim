"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CakeIcon, ShoppingBagIcon, BarChart3Icon, SettingsIcon } from "lucide-react"
import { getOrders } from "@/lib/db-service"

type AdminTab = "dashboard" | "desserts" | "orders" | "analytics" | "settings"

interface AdminSidebarProps {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
}

export default function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const [hasPendingOrders, setHasPendingOrders] = useState(false)

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

    // Recheck every 30 seconds
    const interval = setInterval(checkPendingOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full md:w-64 mb-8 md:mb-0">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">ניהול החנות</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Button
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("dashboard")}
          >
            <BarChart3Icon className="h-4 w-4 ml-2" />
            דף הבית
          </Button>
          <Button
            variant={activeTab === "desserts" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("desserts")}
          >
            <CakeIcon className="h-4 w-4 ml-2" />
            ניהול קינוחים
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            className="w-full justify-start relative"
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBagIcon className="h-4 w-4 ml-2" />
            ניהול הזמנות
            {hasPendingOrders && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                הזמנה חדשה
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart3Icon className="h-4 w-4 ml-2" />
            ניתוח נתונים
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("settings")}
          >
            <SettingsIcon className="h-4 w-4 ml-2" />
            הגדרות
          </Button>
        </nav>
      </div>
    </div>
  )
}

