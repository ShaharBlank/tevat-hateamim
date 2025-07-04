import { supabaseClient } from "./supabase-client"
import type { CartItem } from "./cart-context"

// Update the Dessert type to include weight
export type Dessert = {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
  tags: string[]
  stock: number
  leadtime: number | null
  amount: string[] // ערכים אפשריים (משקלים או יחידות)
  isweight: boolean // האם נמכר לפי משקל
}

export type Order = {
  id: string
  orderNumber: string
  userid: string
  username: string
  useremail: string
  userphone: string
  useraddress: string
  items: CartItem[]
  total: number
  shipping: number
  status: "pending" | "approved" | "rejected" | "completed"
  createdat: string
  deliveryDate?: string // Add delivery date field
  notes?: string
}

// Delivery date type
export type DeliveryDate = {
  id: string
  orderid: string
  date: string
  time: string
}

// Notification type
export type Notification = {
  id: string
  userid: string
  title: string
  message: string
  read: boolean
  createdat: string
  orderid?: string
}

// Initialize database - now just logs a message
export const initDatabase = async () => {
  try {
    console.log("Database initialization")
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

// Add policies for public access on specific tables - this helps address row-level security issues
export const setupSupabasePolicies = async () => {
  try {
    // This function tries to ensure public access to tables we need
    // It's a workaround for the row-level security errors
    // You'll need to also configure these in the Supabase dashboard
    console.log("Setting up Supabase policies")
    return true
  } catch (error) {
    console.error("Error setting up Supabase policies:", error)
    return false
  }
}

// Generate a unique order number (between 1000 and 1,000,000,000)
export const generateorderNumber = async (): Promise<string> => {
  // Generate a random number between 1000 and 1,000,000,000
  const min = 1000
  const max = 1000000000

  // Generate a random number
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min

  // Check if this order number already exists
  const { data } = await supabaseClient.from("orders").select("orderNumber").eq("orderNumber", randomNum.toString())

  // If it exists, generate a new one recursively
  if (data && data.length > 0) {
    return generateorderNumber()
  }

  return randomNum.toString()
}

// Get desserts with error handling to prevent 204 errors
export const getDesserts = async (): Promise<Dessert[]> => {
  try {
    const { data, error } = await supabaseClient
      .from("desserts")
      .select("id, name, description, price, image, category, tags, stock, amount, isweight, leadtime");

    if (error) throw error;
    return (data || []).map((dessert) => ({
      ...dessert,
      amount: JSON.parse(dessert.amount),
      isweight: dessert.isweight,
      leadtime: dessert.leadtime,
    }));
  } catch (error) {
    console.error("Error getting desserts:", error);
    return [];
  }
};

export const getDessertById = async (id: number): Promise<Dessert | null> => {
  try {
    const { data, error } = await supabaseClient
      .from("desserts")
      .select("id, name, description, price, image, category, tags, stock, amount, isweight, leadtime")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? { ...data, amount: JSON.parse(data.amount), isweight: data.isweight, leadtime: data.leadtime } : null;
  } catch (error) {
    console.error(`Error getting dessert with id ${id}:`, error);
    return null;
  }
};

export const getDessertsByCategory = async (category: string): Promise<Dessert[]> => {
  try {
    const { data, error } = await supabaseClient.from("desserts").select("*").eq("category", category)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error getting desserts with category ${category}:`, error)
    return []
  }
}

// Update to handle minweight properly in addDessert
export const addDessert = async (dessert: Omit<Dessert, "id">): Promise<Dessert> => {
  try {
    const { data, error } = await supabaseClient
      .from("desserts")
      .insert([{ ...dessert, amount: JSON.stringify(dessert.amount) }])
      .select()
      .single();

    if (error) throw error;
    return { ...data, amount: JSON.parse(data.amount), isweight: data.isweight, leadtime: data.leadtime };
  } catch (error) {
    console.error("Error adding dessert:", error);
    throw error;
  }
}

// Update updateDessert to handle minweight properly
export const updateDessert = async (id: number, dessert: Partial<Dessert>): Promise<Dessert | null> => {
  try {
    const { data, error } = await supabaseClient
      .from("desserts")
      .update({
        ...dessert,
        amount: dessert.amount ? JSON.stringify(dessert.amount) : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data ? { ...data, amount: JSON.parse(data.amount), isweight: data.isweight, leadtime: data.leadtime } : null;
  } catch (error) {
    console.error(`Error updating dessert with id ${id}:`, error);
    throw error;
  }
}

export const deleteDessert = async (id: number): Promise<void> => {
  try {
    const { error } = await supabaseClient.from("desserts").delete().eq("id", id)

    if (error) throw error
  } catch (error) {
    console.error(`Error deleting dessert with id ${id}:`, error)
    throw error
  }
}

// Dessert category operations
export const getDessertCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabaseClient.from("dessert_categories").select("category")
    if (error) throw error
    return data.map((row) => row.category)
  } catch (error) {
    console.error("Error fetching dessert categories:", error)
    return []
  }
}

export const addDessertCategory = async (category: string): Promise<void> => {
  try {
    const { error } = await supabaseClient.from("dessert_categories").insert([{ category }])
    if (error) throw error
  } catch (error) {
    console.error("Error adding dessert category:", error)
    throw error
  }
}

export const deleteDessertCategory = async (category: string): Promise<void> => {
  try {
    const { error } = await supabaseClient.from("dessert_categories").delete().eq("category", category)
    if (error) throw error
  } catch (error) {
    console.error("Error deleting dessert category:", error)
    throw error
  }
}

// Order operations
export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("id, ordernumber, userid, username, useremail, userphone, useraddress, items, total, shipping, status, createdat, notes")
      .order("createdat", { ascending: false })

    if (error) throw error
    return (data || []).map((order) => ({
      ...order,
      orderNumber: order.ordernumber, // Map ordernumber to orderNumber
    }))
  } catch (error) {
    console.error("Error getting orders:", error)
    return []
  }
}

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("id, ordernumber, userid, username, useremail, userphone, useraddress, items, total, shipping, status, createdat, notes")
      .eq("id", id)
      .single()

    if (error) throw error
    return data ? { ...data, orderNumber: data.ordernumber } : null // Map ordernumber to orderNumber
  } catch (error) {
    console.error(`Error getting order with id ${id}:`, error)
    return null
  }
}

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("id, ordernumber, userid, username, useremail, userphone, useraddress, items, total, shipping, status, createdat, notes")
      .eq("userid", userId)
      .order("createdat", { ascending: false })

    if (error) throw error
    return (data || []).map((order) => ({
      ...order,
      orderNumber: order.ordernumber, // Map ordernumber to orderNumber
    }))
  } catch (error) {
    console.error(`Error getting orders for user ${userId}:`, error)
    return []
  }
}

export const createOrder = async (
  order: Omit<Order, "id" | "createdat" | "status" | "orderNumber"> & { deliveryDate: string },
): Promise<Order> => {
  try {
    const orderNumber = await generateorderNumber()
    const newOrder = {
      ...order,
      id: crypto.randomUUID(),
      ordernumber: orderNumber, // Use correct database field
      status: "pending" as const,
      createdat: new Date().toISOString(), // Use correct property name
      deliveryDate: order.deliveryDate, // Include delivery date
    }
    const { data, error } = await supabaseClient.from("orders").insert([newOrder]).select().single()
    if (error) throw error
    return { ...data, orderNumber: data.ordernumber } // Map ordernumber to orderNumber
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export const updateOrderStatus = async (id: string, status: Order["status"], notes?: string): Promise<Order | null> => {
  try {
    const { data: order } = await supabaseClient.from("orders").select("userid").eq("id", id).single()

    const { data, error } = await supabaseClient.from("orders").update({ status, notes }).eq("id", id).select().single()

    if (error) throw error

    // יצירת התראה למשתמש על עדכון סטטוס ההזמנה
    if (order && order.userid) {
      const title = "עדכון סטטוס הזמנה"
      let message = `סטטוס ההזמנה שלך (מספר ${data.orderNumber}) עודכן ל`

      switch (status) {
        case "approved":
          message += "מאושר"
          break
        case "rejected":
          message += "נדחה"
          break
        case "completed":
          message += "הושלם"
          break
        default:
          message += status
      }

      await createNotification({
        userid: order.userid,
        title,
        message,
        orderid: id,
      })
    }

    return data
  } catch (error) {
    console.error(`Error updating order status for order ${id}:`, error)
    throw error
  }
}

// Notification operations
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .order("createdat", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("userid", userId)
      .order("createdat", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error getting notifications for user ${userId}:`, error)
    return []
  }
}

export const createNotification = async (
  notification: Omit<Notification, "id" | "createdat" | "read">,
): Promise<Notification> => {
  try {
    const newNotification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdat: new Date().toISOString(), // Use correct property name
    }
    const { data, error } = await supabaseClient.from("notifications").insert([newNotification]).select().single()
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export const markNotificationAsRead = async (id: string): Promise<Notification | null> => {
  try {
    const { data, error } = await supabaseClient
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Error marking notification ${id} as read:`, error)
    throw error
  }
}

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const { error } = await supabaseClient.from("notifications").delete().eq("id", id)
    if (error) throw error
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error)
    throw error
  }
}

