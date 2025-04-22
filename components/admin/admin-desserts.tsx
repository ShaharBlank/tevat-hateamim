"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getDesserts, addDessert, updateDessert, deleteDessert, getDessertCategories, addDessertCategory, deleteDessertCategory, type Dessert } from "@/lib/db-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react"

// הוספת אפשרות להעלאת תמונה כקובץ
import { v4 as uuidv4 } from "uuid"
import { supabaseClient } from "@/lib/supabase-client"

export default function AdminDesserts() {
  const [desserts, setDesserts] = useState<Dessert[]>([])
  const [categories, setCategories] = useState<string[]>([]) // Dynamically loaded categories
  const [newCategory, setNewCategory] = useState("") // Input for adding a new category
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDessert, setSelectedDessert] = useState<Dessert | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // הוסף משתנה מצב חדש לתמונה שנבחרה:
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "/placeholder.svg?height=400&width=400",
    category: "",
    tags: "",
    available: true,
    minweight: "", // הוספת שדה למשקל מינימלי
  })

  useEffect(() => {
    loadDesserts()
    loadCategories()
  }, [])

  const loadDesserts = async () => {
    try {
      setLoading(true)
      const fetchedDesserts = await getDesserts()
      setDesserts(fetchedDesserts)
    } catch (error) {
      console.error("Error loading desserts:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הקינוחים",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const fetchedCategories = await getDessertCategories()
      setCategories(fetchedCategories)
    } catch (error) {
      console.error("Error loading categories:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הקטגוריות",
        variant: "destructive",
      })
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם קטגוריה",
        variant: "destructive",
      })
      return
    }

    try {
      await addDessertCategory(newCategory.trim())
      setNewCategory("")
      await loadCategories()
      toast({
        title: "הקטגוריה נוספה בהצלחה",
        description: `הקטגוריה "${newCategory}" נוספה למערכת`,
      })
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת הוספת הקטגוריה",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (category: string) => {
    try {
      await deleteDessertCategory(category)
      await loadCategories()
      toast({
        title: "הקטגוריה נמחקה בהצלחה",
        description: `הקטגוריה "${category}" נמחקה מהמערכת`,
      })
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת מחיקת הקטגוריה",
        variant: "destructive",
      })
    }
  }

  // הוסף פונקציה לטיפול בבחירת תמונה:
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedImage(file)

      // יצירת URL לתצוגה מקדימה של התמונה
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  // Update the uploadImage function
  const uploadImage = async (dessertName: string): Promise<string | null> => {
    if (!selectedImage) return null

    setIsUploading(true)

    try {
      // Create a unique filename using the dessert name and UUID
      const fileExt = selectedImage.name.split(".").pop()
      const shortUuid = uuidv4().slice(0, 6) // Short UUID (4 characters)
      const fileName = `${shortUuid}.${fileExt}`
      const filePath = `desserts/${fileName}`

      // Log the upload attempt for debugging
      console.log("Uploading image to path:", filePath)

      // Set up a proper content type
      const options = {
        cacheControl: "3600",
        contentType: selectedImage.type,
      }

      // Try the upload
      const { data, error: uploadError } = await supabaseClient.storage
        .from("tevat-hateamim")
        .upload(filePath, selectedImage, options)

      if (uploadError) {
        console.error("Upload error details:", uploadError)
        throw uploadError
      }

      if (!data) {
        throw new Error("Upload succeeded but returned no data")
      }

      console.log("Upload successful:", data)

      // Get the public URL
      const { data: urlData } = supabaseClient.storage.from("tevat-hateamim").getPublicUrl(filePath)

      console.log("Public URL:", urlData)
      return urlData.publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהעלאת התמונה: " + (error instanceof Error ? error.message : "שגיאה לא ידועה"),
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deleteImage = async (imageUrl: string) => {
    try {
      const filePath = imageUrl.split("/").slice(-2).join("/") // Extract the file path from the URL
      const { error } = await supabaseClient.storage.from("tevat-hateamim").remove([filePath])
      if (error) {
        console.error("Error deleting image:", error)
        throw error
      }
      console.log("Image deleted successfully:", filePath)
    } catch (error) {
      console.error("Error deleting image:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image: "/placeholder.svg?height=400&width=400",
      category: "",
      tags: "",
      available: true,
      minweight: "", // איפוס שדה משקל מינימלי
    })
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Update the handleAddDessert function to handle weight and price per kg
  const handleAddDessert = async () => {
    try {
      // Validate form
      if (!formData.name.trim()) {
        toast({
          title: "שגיאה",
          description: "יש להזין שם לקינוח",
          variant: "destructive",
        })
        return
      }

      if (!formData.description.trim()) {
        toast({
          title: "שגיאה",
          description: "יש להזין תיאור לקינוח",
          variant: "destructive",
        })
        return
      }

      if (!formData.price.trim()) {
        toast({
          title: "שגיאה",
          description: "יש להזין מחיר לקינוח",
          variant: "destructive",
        })
        return
      }

      const price = Number.parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        toast({
          title: "שגיאה",
          description: "המחיר לקילו חייב להיות מספר חיובי",
          variant: "destructive",
        })
        return
      }

      if (!formData.category.trim()) {
        toast({
          title: "שגיאה",
          description: "יש לבחור קטגוריה לקינוח",
          variant: "destructive",
        })
        return
      }

      const minweight = formData.minweight
        ? Number.parseFloat(formData.minweight)
        : 0.1 // Default to 0.1 kg if not provided
      if (isNaN(minweight) || minweight <= 0) {
        toast({
          title: "שגיאה",
          description: "משקל מינימלי חייב להיות מספר חיובי",
          variant: "destructive",
        })
        return
      }

      // Upload the image if selected
      let imageUrl = formData.image
      if (selectedImage) {
        const uploadedUrl = await uploadImage(formData.name)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          toast({
            title: "שגיאה",
            description: "אירעה שגיאה בהעלאת התמונה",
            variant: "destructive",
          })
          return
        }
      }

      // Create new dessert
      const newDessert = await addDessert({
        name: formData.name,
        description: formData.description,
        price: price, // Price per kg
        image: imageUrl,
        category: formData.category, // Save category in Hebrew as is
        tags: formData.tags.split(",").map((tag) => tag.trim()),
        available: formData.available,
        minweight: minweight,
      })

      // Update state
      await loadDesserts()

      // Close dialog and reset form
      setIsAddDialogOpen(false)
      resetForm()
      setSelectedImage(null)
      setImagePreview(null)

      toast({
        title: "הקינוח נוסף בהצלחה",
        description: `הקינוח "${newDessert.name}" נוסף למערכת`,
      })
    } catch (error) {
      console.error("Error adding dessert:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת הוספת הקינוח",
        variant: "destructive",
      })
    }
  }

  // Update the handleEditDessert function similarly
  const handleEditDessert = async () => {
    if (!selectedDessert) return

    try {
      // Validate form
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        toast({
          title: "שגיאה",
          description: "יש למלא את כל השדות החובה",
          variant: "destructive",
        })
        return
      }

      // Ensure price is positive
      const price = Number.parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        toast({
          title: "שגיאה",
          description: "המחיר לקילו חייב להיות מספר חיובי",
          variant: "destructive",
        })
        return
      }

      // Ensure minweight is positive or null
      const minweight = formData.minweight ? Number.parseFloat(formData.minweight) : null
      if (minweight !== null && (isNaN(minweight) || minweight <= 0)) {
        toast({
          title: "שגיאה",
          description: "משקל מינימלי חייב להיות מספר חיובי",
          variant: "destructive",
        })
        return
      }

      // Upload the image if selected
      let imageUrl = formData.image
      if (selectedImage) {
        const uploadedUrl = await uploadImage(formData.name)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      // Update dessert
      await updateDessert(selectedDessert.id, {
        name: formData.name,
        description: formData.description,
        price: price, // Price per kg
        image: imageUrl,
        category: formData.category, // Save category in Hebrew as is
        tags: formData.tags.split(",").map((tag) => tag.trim()),
        available: formData.available,
        minweight: minweight,
      })

      // Update state
      await loadDesserts()

      // Close dialog and reset form
      setIsEditDialogOpen(false)
      setSelectedDessert(null)
      resetForm()
      setSelectedImage(null)
      setImagePreview(null)

      toast({
        title: "הקינוח עודכן בהצלחה",
        description: `הקינוח "${formData.name}" עודכן במערכת`,
      })
    } catch (error) {
      console.error("Error updating dessert:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת עדכון הקינוח: " + (error instanceof Error ? error.message : "שגיאה לא ידועה"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteDessert = async () => {
    if (!selectedDessert) return

    try {
      // Delete dessert
      await deleteDessert(selectedDessert.id)

      // Delete the associated image
      if (selectedDessert.image) {
        await deleteImage(selectedDessert.image)
      }

      // Update state
      await loadDesserts()

      // Close dialog
      setIsDeleteDialogOpen(false)
      setSelectedDessert(null)

      toast({
        title: "הקינוח נמחק בהצלחה",
        description: `הקינוח "${selectedDessert.name}" נמחק מהמערכת`,
      })
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת מחיקת הקינוח",
        variant: "destructive",
      })
    }
  }

  // עדכן את פונקציית openEditDialog:
  const openEditDialog = (dessert: Dessert) => {
    setSelectedDessert(dessert)
    setFormData({
      name: dessert.name,
      description: dessert.description,
      price: dessert.price.toString(),
      image: dessert.image,
      category: dessert.category,
      tags: dessert.tags.join(", "),
      available: dessert.available,
      minweight: dessert.minweight ? dessert.minweight.toString() : "", // הוספת שדה משקל מינימלי
    })
    setImagePreview(dessert.image)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (dessert: Dessert) => {
    setSelectedDessert(dessert)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return <div className="text-center py-6">טוען קינוחים...</div>
  }

  return (
    <div className="space-y-6">
      {/* Category Management */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-semibold text-lg mb-4">ניהול קטגוריות</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="הזן קטגוריה חדשה"
              dir="rtl"
            />
            <Button onClick={handleAddCategory}>הוסף קטגוריה</Button>
          </div>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category} className="flex items-center justify-between">
                <span>{category}</span>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(category)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול קינוחים</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 ml-2" />
              הוסף קינוח חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>הוספת קינוח חדש</DialogTitle>
              <DialogDescription>הזן את פרטי הקינוח החדש. לחץ על שמור כדי להוסיף אותו למערכת.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto pr-1">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">שם הקינוח</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="שם הקינוח"
                    dir="rtl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">תיאור</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="תיאור הקינוח"
                    dir="rtl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">מחיר</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="מחיר הקינוח"
                    dir="rtl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minweight">מינימום משקל להזמנה (ק"ג)</Label>
                  <Input
                    id="minweight"
                    name="minweight"
                    type="number"
                    step="0.1"
                    value={formData.minweight}
                    onChange={handleInputChange}
                    placeholder="השאר ריק אם אין הגבלה"
                    dir="rtl"
                  />
                  <p className="text-xs text-muted-foreground text-right">השאר ריק אם אין הגבלת משקל מינימלי</p>
                </div>
                {/* החלף את שדה התמונה בדיאלוג הוספת קינוח: */}
                <div className="grid gap-2">
                  <Label htmlFor="image">תמונה</Label>
                  {imagePreview && (
                    <div className="relative w-full h-40 mb-2">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="תצוגה מקדימה"
                        fill
                        className="object-contain rounded-md"
                      />
                    </div>
                  )}
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                    dir="rtl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">קטגוריה</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger dir="rtl">
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">תגיות (מופרדות בפסיקים)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="תגיות מופרדות בפסיקים"
                    dir="rtl"
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Label htmlFor="available">זמין במלאי</Label>
                  <input
                    id="available"
                    name="available"
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData((prev) => ({ ...prev, available: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ביטול
              </Button>
              <Button
                onClick={async () => {
                  await handleAddDessert() // Ensure the function is called
                }}
                disabled={isUploading}
              >
                {isUploading ? "מעלה תמונה..." : "שמור"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תמונה</TableHead>
                <TableHead>שם</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>מינ' משקל</TableHead>
                <TableHead>זמין</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {desserts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    לא נמצאו קינוחים
                  </TableCell>
                </TableRow>
              ) : (
                desserts.map((dessert) => (
                  <TableRow key={dessert.id}>
                    <TableCell>
                      <div className="relative w-12 h-12">
                        <Image
                          src={dessert.image || "/placeholder.svg"}
                          alt={dessert.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{dessert.name}</TableCell>
                    <TableCell>₪{dessert.price.toFixed(2)}</TableCell>
                    <TableCell>{dessert.category}</TableCell>
                    <TableCell>{dessert.minweight ? `${dessert.minweight} ק"ג` : "-"}</TableCell>
                    <TableCell>{dessert.available ? "כן" : "לא"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(dessert)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(dessert)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>עריכת קינוח</DialogTitle>
            <DialogDescription>ערוך את פרטי הקינוח. לחץ על שמור כדי לעדכן אותו במערכת.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto pr-1"></div>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">שם הקינוח</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="שם הקינוח"
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">תיאור</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="תיאור הקינוח"
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">מחיר</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="מחיר הקינוח"
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-minweight">מינימום משקל להזמנה (ק"ג)</Label>
                <Input
                  id="edit-minweight"
                  name="minweight"
                  type="number"
                  step="0.1"
                  value={formData.minweight}
                  onChange={handleInputChange}
                  placeholder="השאר ריק אם אין הגבלה"
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground text-right">השאר ריק אם אין הגבלת משקל מינימלי</p>
              </div>
              {/* החלף את שדה התמונה בדיאלוג עריכת קינוח: */}
              <div className="grid gap-2">
                <Label htmlFor="edit-image">תמונה</Label>
                {imagePreview && (
                  <div className="relative w-full h-40 mb-2">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="תצוגה מקדימה"
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                )}
                <Input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="cursor-pointer"
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">קטגוריה</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tags">תגיות (מופרדות בפסיקים)</Label>
                <Input
                  id="edit-tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="תגיות מופרדות בפסיקים"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="edit-available">זמין במלאי</Label>
                <input
                  id="edit-available"
                  name="available"
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData((prev) => ({ ...prev, available: e.target.checked }))}
                  className="h-4 w-4"
                />
              </div>
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleEditDessert} disabled={isUploading}>
              {isUploading ? "מעלה תמונה..." : "שמור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>מחיקת קינוח</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את הקינוח "{selectedDessert?.name}"? פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteDessert}>
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

