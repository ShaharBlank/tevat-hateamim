"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrders } from "@/lib/db"
import type { Order } from "@/lib/db-service"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("sales")

  useEffect(() => {
    async function fetchData() {
      try {
        const allOrders = await getOrders()
        setOrders(allOrders)
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

  // עיבוד נתונים למכירות לפי חודש
  const monthlySales = orders.reduce((acc: any, order) => {
    if (order.status === "completed" || order.status === "approved") {
      const date = new Date(order.createdat)
      const month = date.toLocaleString("he-IL", { month: "long" })

      if (!acc[month]) {
        acc[month] = { month, total: 0, count: 0 }
      }

      acc[month].total += order.total
      acc[month].count += 1
    }
    return acc
  }, {})

  const monthlyData = Object.values(monthlySales)

  // עיבוד נתונים לסטטוס הזמנות
  const orderStatusData = orders.reduce((acc: any, order) => {
    if (!acc[order.status]) {
      acc[order.status] = { name: getStatusName(order.status), value: 0 }
    }
    acc[order.status].value += 1
    return acc
  }, {})

  const statusData = Object.values(orderStatusData)

  // צבעים לגרף עוגה
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  function getStatusName(status: string) {
    switch (status) {
      case "pending":
        return "ממתין לאישור"
      case "approved":
        return "מאושר"
      case "rejected":
        return "נדחה"
      case "completed":
        return "הושלם"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ניתוח נתונים</h2>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales">מכירות</TabsTrigger>
          <TabsTrigger value="orders">הזמנות</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>מכירות לפי חודש</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₪${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="total" name="סה״כ מכירות" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>סה״כ מכירות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₪
                  {orders
                    .filter((order) => order.status === "completed" || order.status === "approved")
                    .reduce((sum, order) => sum + order.total, 0)
                    .toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ממוצע הזמנה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₪
                  {(orders.length > 0
                    ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
                    : 0
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>סטטוס הזמנות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} הזמנות`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>סה״כ הזמנות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{orders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>הזמנות ממתינות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{orders.filter((order) => order.status === "pending").length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

