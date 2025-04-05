"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabaseClient } from "./supabase-client"

type User = {
  id: string
  email: string
  name: string
  role: "user" | "admin"
  phone?: string
  address?: string
  city?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  adminLogin: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Query the database for a user with matching email and password
      const { data, error } = await supabaseClient
        .from("users")
        .select("id, name, email, role, phone, address, city")
        .eq("email", email)
        .eq("password", password)
        .single()

      if (error || !data) {
        console.error("Login error:", error)
        return false
      }

      // User found, set user state
      setUser(data)
      localStorage.setItem("user", JSON.stringify(data))

      // Store additional user data in localStorage for easy access
      if (data.phone) localStorage.setItem("userPhone", data.phone)
      if (data.address) localStorage.setItem("userAddress", data.address)
      if (data.city) localStorage.setItem("userCity", data.city)

      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      // Query the database for an admin user with matching email and password
      const { data, error } = await supabaseClient
        .from("users")
        .select("id, name, email, role, phone, address, city")
        .eq("email", email)
        .eq("password", password)
        .eq("role", "admin")
        .single()

      if (error || !data) {
        console.error("Admin login error:", error)
        return false
      }

      // Admin user found, set user state
      setUser(data)
      localStorage.setItem("user", JSON.stringify(data))
      return true
    } catch (error) {
      console.error("Admin login error:", error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Check if email is already in use
      const { data: existingUser, error: checkError } = await supabaseClient
        .from("users")
        .select("id")
        .eq("email", email)
        .single()

      if (existingUser) {
        console.error("Email already in use")
        return false
      }

      // Create new user
      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        password,
        role: "user" as const,
        createdat: new Date().toISOString(),
      }

      const { data, error } = await supabaseClient
        .from("users")
        .insert([newUser])
        .select("id, name, email, role, phone, address, city")
        .single()

      if (error || !data) {
        console.error("Registration error:", error)
        return false
      }

      // User created successfully, set user state
      setUser(data)
      localStorage.setItem("user", JSON.stringify(data))
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("userPhone")
    localStorage.removeItem("userAddress")
    localStorage.removeItem("userCity")
    localStorage.removeItem("userProfileImage")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

