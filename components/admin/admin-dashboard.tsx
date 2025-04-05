"use client"

import { useState, useEffect } from "react"
import { getOrders, getDesserts } from "@/lib/db-service" // Use db-service for consistent types
import type { Order } from "@/lib/db-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBagIcon, CakeIcon, UserIcon, DollarSignIcon } from "lucide-react"
import { supabaseClient } from "@/lib/supabase-client"

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [totalDesserts, setTotalDesserts] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uniqueCustomers, setUniqueCustomers] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch orders and desserts
        const allOrders = await getOrders()
        const allDesserts = await getDesserts()

        // Fetch users to count regular users (not admins)
        const { data: users } = await supabaseClient.from("users").select("id, role").eq("role", "user")

        const regularUsersCount = users?.length || 0

        setOrders(allOrders)
        setTotalDesserts(allDesserts.length)

        // Calculate total revenue from completed and approved orders
        const revenue = allOrders
          .filter((order) => order.status === "completed" || order.status === "approved")
          .reduce((sum, order) => sum + order.total, 0)
        setTotalRevenue(revenue)

        // Count pending orders
        const pending = allOrders.filter((order) => order.status === "pending").length
        setPendingOrders(pending)

        // Set unique customers count from users table
        setUniqueCustomers(regularUsersCount)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="text-center py-6">טוען נתונים...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">דף הבית</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הזמנות</CardTitle>
            <ShoppingBagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">{pendingOrders} הזמנות ממתינות לאישור</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה"כ קינוחים</CardTitle>
            <CakeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDesserts}</div>
            <p className="text-xs text-muted-foreground">במלאי החנות</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">לקוחות</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">לקוחות רשומים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">מהזמנות שאושרו והושלמו</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>הזמנות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">אין הזמנות להצגה</div>
          ) : (
            <div className="space-y-8">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center">
                  <div className="mr-4 space-y-1">
                    <p className="text-sm font-medium leading-none">הזמנה #{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.username}</p>
                  </div>
                  <div className="mr-auto font-medium">₪{order.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

