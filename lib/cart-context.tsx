"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

export type CartItem = {
  id: number
  name: string
  price: number // Price per kg
  image: string
  quantity: number
  weight: number // Weight in kg
  deliveryDate?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  updateWeight: (id: number, weight: number) => void
  updateDeliveryDate: (id: number, date: string) => void
  clearCart: () => void
  getTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      setItems(JSON.parse(storedCart))
    }
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  const addItem = (newItem: CartItem) => {
    // Ensure weight is positive
    if (!newItem.weight || newItem.weight <= 0) {
      newItem.weight = newItem.quantity // Default to 1kg per quantity if not specified
    }

    setItems((currentItems) => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex((item) => item.id === newItem.id)

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedItems = [...currentItems]
        updatedItems[existingItemIndex].quantity += newItem.quantity
        updatedItems[existingItemIndex].weight += newItem.weight
        return updatedItems
      } else {
        // Add new item if it doesn't exist
        return [...currentItems, newItem]
      }
    })
  }

  const removeItem = (id: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              // Update weight proportionally if it was previously set
              weight: item.weight ? (quantity * item.weight) / item.quantity : quantity,
            }
          : item,
      ),
    )
  }

  const updateWeight = (id: number, weight: number) => {
    if (weight <= 0) return

    setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, weight } : item)))
  }

  const updateDeliveryDate = (id: number, date: string) => {
    setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, deliveryDate: date } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotal = () => {
    return items.reduce((total, item) => total + item.price * item.weight, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateWeight,
        updateDeliveryDate,
        clearCart,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

