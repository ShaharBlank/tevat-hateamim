// עדכון ה-db.ts כדי להשתמש ב-db-service עם Supabase
import type { CartItem } from "./cart-context"
import * as dbService from "./db-service"

export type Dessert = {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
  tags: string[]
  available: boolean
  minweight: number | null
}

export type Order = {
  id: string
  orderNumber: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  items: CartItem[]
  total: number
  status: "pending" | "approved" | "rejected" | "completed"
  createdAt: string
  useraddress?: string
  notes?: string
  shipping: number
}

export type Notification = {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  createdAt: string
  orderId?: string
}

// Mock desserts data for fallback
let desserts: Dessert[] = [
  {
    id: 1,
    name: "שוקולד דלישס",
    description: "קינוח שוקולד עשיר עם ציפוי גנאש",
    price: 159.99,
    image: "/placeholder.svg?height=400&width=400",
    category: "chocolate",
    tags: ["bestseller", "chocolate"],
    available: true,
    minweight: null,
  },
  {
    id: 2,
    name: "חלום תות",
    description: "קינוח וניל קליל עם תותים טריים",
    price: 169.99,
    image: "/placeholder.svg?height=400&width=400",
    category: "fruit",
    tags: ["bestseller", "fruit"],
    available: true,
    minweight: null,
  },
  {
    id: 3,
    name: "רד ולווט",
    description: "קינוח רד ולווט קלאסי עם ציפוי גבינת שמנת",
    price: 179.99,
    image: "/placeholder.svg?height=400&width=400",
    category: "classic",
    tags: ["popular", "cream cheese"],
    available: true,
    minweight: null,
  },
  {
    id: 4,
    name: "לימון ואוכמניות",
    description: "קינוח לימון חמצמץ עם קומפוט אוכמניות",
    price: 169.99,
    image: "/placeholder.svg?height=400&width=400",
    category: "fruit",
    tags: ["new", "fruit"],
    available: true,
    minweight: null,
  },
]

// Mock orders data
let orders: Order[] = []

// Mock notifications data
let notifications: Notification[] = []

// Dessert CRUD operations with Supabase fallback
export const getDesserts = async () => {
  try {
    return await dbService.getDesserts()
  } catch (error) {
    console.error("Error fetching desserts from Supabase, using mock data", error)
    return desserts
  }
}

export const getDessertById = async (id: number) => {
  try {
    return await dbService.getDessertById(id)
  } catch (error) {
    console.error("Error fetching dessert from Supabase, using mock data", error)
    return desserts.find((dessert) => dessert.id === id) || null
  }
}

export const getDessertsByCategory = async (category: string) => {
  try {
    return await dbService.getDessertsByCategory(category)
  } catch (error) {
    console.error("Error fetching desserts by category from Supabase, using mock data", error)
    return desserts.filter((dessert) => dessert.category === category)
  }
}

export const addDessert = async (dessert: Omit<Dessert, "id">) => {
  try {
    return await dbService.addDessert(dessert)
  } catch (error) {
    console.error("Error adding dessert to Supabase, using mock data", error)
    const newDessert = {
      ...dessert,
      id: desserts.length > 0 ? Math.max(...desserts.map((d) => d.id)) + 1 : 1,
    }
    desserts = [...desserts, newDessert]
    return newDessert
  }
}

export const updateDessert = async (id: number, dessert: Partial<Dessert>) => {
  try {
    return await dbService.updateDessert(id, dessert)
  } catch (error) {
    console.error("Error updating dessert in Supabase, using mock data", error)
    desserts = desserts.map((d) => (d.id === id ? { ...d, ...dessert } : d))
    return desserts.find((d) => d.id === id) || null
  }
}

export const deleteDessert = async (id: number) => {
  try {
    await dbService.deleteDessert(id)
  } catch (error) {
    console.error("Error deleting dessert from Supabase, using mock data", error)
    desserts = desserts.filter((d) => d.id !== id)
  }
}

// Order operations with Supabase fallback
export const getOrders = async () => {
  try {
    return await dbService.getOrders()
  } catch (error) {
    console.error("Error fetching orders from Supabase, using mock data", error)
    return orders
  }
}

export const getOrderById = async (id: string) => {
  try {
    return await dbService.getOrderById(id)
  } catch (error) {
    console.error("Error fetching order from Supabase, using mock data", error)
    return orders.find((order) => order.id === id) || null
  }
}

export const getOrdersByUserId = async (userId: string) => {
  try {
    return await dbService.getOrdersByUserId(userId)
  } catch (error) {
    console.error("Error fetching orders by user from Supabase, using mock data", error)
    return orders.filter((order) => order.userId === userId)
  }
}

export const createOrder = async (order: Omit<Order, "id" | "createdAt" | "status">) => {
  try {
    const completeOrder = {
      ...order,
      userid: order.userId,
      username: order.userName,
      useremail: order.userEmail,
      userphone: order.userPhone,
      orderNumber: order.orderNumber || Math.random().toString(36).substring(2, 9),
      useraddress: order.useraddress || "Default Address",
      shipping: typeof order.shipping === "number" ? order.shipping : 30, // Ensure shipping is a number
    }
    return await dbService.createOrder(completeOrder)
  } catch (error) {
    console.error("Error creating order in Supabase, using mock data", error)
    const newOrder = {
      ...order,
      id: Math.random().toString(36).substring(2, 9),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    }
    orders = [...orders, newOrder]
    return newOrder
  }
}

export const updateOrderStatus = async (id: string, status: Order["status"], notes?: string) => {
  try {
    return await dbService.updateOrderStatus(id, status, notes)
  } catch (error) {
    console.error("Error updating order status in Supabase, using mock data", error)
    orders = orders.map((o) => (o.id === id ? { ...o, status, notes: notes || o.notes } : o))
    return orders.find((o) => o.id === id) || null
  }
}

// Notification operations with Supabase fallback
export const getNotifications = async () => {
  try {
    return await dbService.getNotifications()
  } catch (error) {
    console.error("Error fetching notifications from Supabase, using mock data", error)
    return notifications
  }
}

export const getNotificationsByUserId = async (userId: string) => {
  try {
    return await dbService.getNotificationsByUserId(userId)
  } catch (error) {
    console.error("Error fetching notifications by user from Supabase, using mock data", error)
    return notifications.filter((notification) => notification.userId === userId)
  }
}

export const createNotification = async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
  try {
    return await dbService.createNotification({
      ...notification,
      userid: notification.userId,
    })
  } catch (error) {
    console.error("Error creating notification in Supabase, using mock data", error)
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      read: false,
      createdAt: new Date().toISOString(), // Use correct property name
    }
    notifications = [...notifications, newNotification]
    return newNotification
  }
}

export const markNotificationAsRead = async (id: string) => {
  try {
    return await dbService.markNotificationAsRead(id)
  } catch (error) {
    console.error("Error marking notification as read in Supabase, using mock data", error)
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    return notifications.find((n) => n.id === id) || null
  }
}

