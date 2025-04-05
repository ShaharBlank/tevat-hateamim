"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"
import { getOrdersByUserId, initDatabase, getNotificationsByUserId, markNotificationAsRead, deleteNotification } from "@/lib/db-service"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { Order } from "@/lib/db-service" // Ensure consistent type usage

export default function OrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    async function fetchOrders() {
      try {
        setLoading(true)
        setError(null)

        // Initialize database first to ensure tables exist
        await initDatabase()

        if (!user) {
          throw new Error("User is not authenticated")
        }
        const userOrders = await getOrdersByUserId(user.id)
        setOrders(userOrders)

        // Fetch and handle notifications
        const notifications = await getNotificationsByUserId(user.id)
        const unreadNotifications = notifications.filter((notification) => !notification.read)

        for (const notification of unreadNotifications) {
          // Mark notification as read
          await markNotificationAsRead(notification.id)

          // Delete notification if it is related to an order status update
          if (notification.title.includes("עדכון סטטוס הזמנה")) {
            await deleteNotification(notification.id)
          }
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
        setError("אירעה שגיאה בטעינת ההזמנות. אנא נסה שוב מאוחר יותר.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "ממתין לאישור"
      case "approved":
        return "אושר"
      case "rejected":
        return "נדחה"
      case "completed":
        return "הושלם"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" dir="rtl">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">ההזמנות שלי</h1>
          <div className="text-center py-12">טוען...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen" dir="rtl">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">ההזמנות שלי</h1>
          <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
            {error}
            <div className="mt-4">
              <Button onClick={() => window.location.reload()}>נסה שוב</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">ההזמנות שלי</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">אין לך הזמנות עדיין</h2>
            <p className="text-gray-600 mb-8">נראה שעדיין לא ביצעת הזמנות באתר שלנו.</p>
            <Button onClick={() => router.push("/cakes")} className="bg-primary hover:bg-primary/90">
              עבור לקטלוג הקינוחים
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        הזמנה מספר: {order.orderNumber || order.id.substring(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(order.createdat), "dd בMMMM, yyyy", { locale: he })}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm`}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-sm text-gray-500 mb-1">פרטי לקוח</h3>
                        <p className="text-sm">{order.username}</p>
                        <p className="text-sm">{order.useremail}</p>
                        <p className="text-sm">{order.userphone}</p>
                        <p className="text-sm">{order.useraddress}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-gray-500 mb-1">סיכום הזמנה</h3>
                        <p className="text-sm">סה"כ: ₪{order.total.toFixed(2)}</p>
                        <p className="text-sm">משלוח: ₪{order.shipping?.toFixed(2) || "30.00"}</p>
                        {order.notes && (
                          <div className="mt-2">
                            <h3 className="font-medium text-sm text-gray-500 mb-1">הערות</h3>
                            <p className="text-sm">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="items">
                        <AccordionTrigger>פריטים בהזמנה</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {order.items.map((item: any) => (
                              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">
                                    משקל: {(item.weight || 0).toFixed(1)} ק"ג | ₪{(item.price || 0).toFixed(2)} לק"ג
                                  </p>
                                  {item.deliveryDate && (
                                    <p className="text-xs text-gray-500">
                                      תאריך אספקה: {format(new Date(item.deliveryDate), "dd/MM/yyyy", { locale: he })}
                                    </p>
                                  )}
                                </div>
                                <p className="font-medium">₪{((item.price || 0) * (item.weight || 0)).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

