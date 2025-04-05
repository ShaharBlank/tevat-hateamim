"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Header from "@/components/header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import AdminDashboard from "@/components/admin/admin-dashboard"
import AdminDesserts from "@/components/admin/admin-desserts"
import AdminOrders from "@/components/admin/admin-orders"
import AdminAnalytics from "@/components/admin/admin-analytics"
import AdminSettings from "@/components/admin/admin-settings"

type AdminTab = "dashboard" | "desserts" | "orders" | "analytics" | "settings"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard")

  useEffect(() => {
    if (!user) {
      router.push("/admin-login")
      return
    }

    if (user.role !== "admin") {
      router.push("/")
      return
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
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
        <h1 className="text-3xl font-bold mb-8">ניהול החנות</h1>

        <div className="flex flex-col md:flex-row gap-8">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="flex-1">
            {activeTab === "dashboard" && <AdminDashboard />}
            {activeTab === "desserts" && <AdminDesserts />}
            {activeTab === "orders" && <AdminOrders />}
            {activeTab === "analytics" && <AdminAnalytics />}
            {activeTab === "settings" && <AdminSettings />}
          </div>
        </div>
      </main>
    </div>
  )
}

