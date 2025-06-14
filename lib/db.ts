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
  stock: number // New field representing the quantity of the dessert
  leadtime: number // Updated to match the new column name
  amount: string[] // ערכים אפשריים (משקלים או יחידות)
  isweight: boolean // האם נמכר לפי משקל
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
  userid: string
  title: string
  message: string
  read: boolean
  createdat: string
  orderid?: string
}

// Dessert CRUD operations
export const getDesserts = async () => {
  const desserts = await dbService.getDesserts()
  return desserts.map((dessert) => ({
    ...dessert,
    available: dessert.stock > 0, // Replace available with stock > 0 logic
  }))
}

export const getDessertById = async (id: number) => {
  const dessert = await dbService.getDessertById(id)
  return dessert ? { ...dessert, available: dessert.stock > 0 } : null // Replace available with stock > 0 logic
}

export const getDessertsByCategory = async (category: string) => {
  return await dbService.getDessertsByCategory(category)
}

export const addDessert = async (dessert: Omit<Dessert, "id">) => {
  return await dbService.addDessert(dessert)
}

export const updateDessert = async (id: number, dessert: Partial<Dessert>) => {
  return await dbService.updateDessert(id, dessert)
}

export const deleteDessert = async (id: number) => {
  await dbService.deleteDessert(id)
}

// Order operations
export const getOrders = async () => {
  return await dbService.getOrders()
}

export const getOrderById = async (id: string) => {
  return await dbService.getOrderById(id)
}

export const getOrdersByUserId = async (userId: string) => {
  return await dbService.getOrdersByUserId(userId)
}

export const createOrder = async (order: Omit<Order, "id" | "status" | "orderNumber" | "createdat"> & { deliveryDate: string }) => {
  const completeOrder = {
    userid: order.userId,
    username: order.userName,
    useremail: order.userEmail,
    userphone: order.userPhone,
    useraddress: order.useraddress || "", // Ensure useraddress is a string
    ...order,
  }
  return await dbService.createOrder(completeOrder)
}

export const updateOrderStatus = async (id: string, status: Order["status"], notes?: string) => {
  return await dbService.updateOrderStatus(id, status, notes)
}

// Notification operations
export const getNotifications = async () => {
  return await dbService.getNotifications()
}

export const getNotificationsByUserId = async (userId: string) => {
  return await dbService.getNotificationsByUserId(userId)
}

export const createNotification = async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
  return await dbService.createNotification(notification)
}

export const markNotificationAsRead = async (id: string) => {
  return await dbService.markNotificationAsRead(id)
}

