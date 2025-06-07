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
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, PencilIcon, TrashIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { v4 as uuidv4 } from "uuid"
import { supabaseClient } from "@/lib/supabase-client"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export default function AdminDesserts() {
  const [desserts, setDesserts] = useState<Dessert[]>([])
  const [categories, setCategories] = useState<string[]>([]) // Dynamically loaded categories
  const [newCategory, setNewCategory] = useState("") // Input for adding a new category
  const [isDessertsCollapsed, setIsDessertsCollapsed] = useState(false)
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDessert, setSelectedDessert] = useState<Dessert | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null) // Separate state for the File object
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null) // Separate state for the preview URL
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "/placeholder.svg?height=400&width=400",
    category: "",
    tags: "",
    minweight: "",
    leadTime: "", // New property for lead time
    stock: "",
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

  const handleImageClick = (image: string) => {
    setSelectedImagePreview(image) // Use the preview URL for modal display
  }

  const closeImageModal = () => {
    setSelectedImagePreview(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedImageFile(file)

      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const uploadImage = async (dessertName: string): Promise<string | null> => {
    if (!selectedImageFile) return null // Ensure selectedImageFile is not null

    setIsUploading(true)

    try {
      const fileExt = selectedImageFile.name.split(".").pop() // Use File.name safely
      const shortUuid = uuidv4().slice(0, 6)
      const fileName = `${shortUuid}.${fileExt}`
      const filePath = `desserts/${fileName}`

      const options = {
        cacheControl: "3600",
        contentType: selectedImageFile.type, // Use File.type safely
      }

      const { data, error: uploadError } = await supabaseClient.storage
        .from("tevat-hateamim")
        .upload(filePath, selectedImageFile, options)

      if (uploadError) {
        console.error("Upload error details:", uploadError)
        throw uploadError
      }

      if (!data) {
        throw new Error("Upload succeeded but returned no data")
      }

      const { data: urlData } = supabaseClient.storage.from("tevat-hateamim").getPublicUrl(filePath)

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
      const filePath = imageUrl.split("/").slice(-2).join("/")
      const { error } = await supabaseClient.storage.from("tevat-hateamim").remove([filePath])
      if (error) {
        console.error("Error deleting image:", error)
        throw error
      }
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
      minweight: "",
      leadTime: "", // Reset lead time
      stock: "",
    })
    setSelectedImageFile(null)
    setImagePreview(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "stock") {
      const minWeight = formData.minweight ? Number(formData.minweight) : 0
      const stockValue = Math.max(minWeight, Number(value)) // Ensure stock is at least minWeight
      setFormData((prev) => ({ ...prev, stock: stockValue.toString() }))
      return
    }

    // Prevent negative values for leadTime
    if (name === "leadTime" && Number(value) <= 0) {
      toast({
        title: "שגיאה",
        description: "זמן ההזמנה מראש לא יכול להיות שלילי",
        variant: "destructive",
      })
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddDessert = async () => {
    try {
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
        : 0.1
      if (isNaN(minweight) || minweight <= 0) {
        toast({
          title: "שגיאה",
          description: "משקל מינימלי חייב להיות מספר חיובי",
          variant: "destructive",
        })
        return
      }

      const leadTime = formData.leadTime ? Number.parseInt(formData.leadTime) : null
      if (leadTime !== null && isNaN(leadTime)) {
        toast({
          title: "שגיאה",
          description: "זמן ההזמנה המוקדם חייב להיות מספר שלם חיובי או ריק",
          variant: "destructive",
        })
        return
      }

      let imageUrl = formData.image
      if (selectedImageFile) {
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

      const newDessert = await addDessert({
        name: formData.name,
        description: formData.description,
        price: price,
        image: imageUrl,
        category: formData.category,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
        minweight: minweight,
        leadTime: leadTime,
        stock: Number(formData.stock),
      })

      await loadDesserts()

      setIsAddDialogOpen(false)
      resetForm()
      setSelectedImageFile(null)
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

  const handleEditDessert = async () => {
    if (!selectedDessert) return

    try {
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        toast({
          title: "שגיאה",
          description: "יש למלא את כל השדות החובה",
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

      const minweight = formData.minweight ? Number.parseFloat(formData.minweight) : null
      if (minweight !== null && (isNaN(minweight) || minweight <= 0)) {
        toast({
          title: "שגיאה",
          description: "משקל מינימלי חייב להיות מספר חיובי",
          variant: "destructive",
        })
        return
      }

      const leadTime = formData.leadTime ? Number.parseInt(formData.leadTime) : null
      if (leadTime !== null && isNaN(leadTime)) {
        toast({
          title: "שגיאה",
          description: "זמן ההזמנה המוקדם חייב להיות מספר שלם חיובי או ריק",
          variant: "destructive",
        })
        return
      }

      let imageUrl = formData.image
      if (selectedImageFile) {
        const uploadedUrl = await uploadImage(formData.name)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      await updateDessert(selectedDessert.id, {
        name: formData.name,
        description: formData.description,
        price: price,
        image: imageUrl,
        category: formData.category,
        tags: formData.tags.split(",").map((tag) => tag.trim()),
        minweight: minweight,
        leadTime: leadTime,
        stock: Number(formData.stock),
      })

      await loadDesserts()

      setIsEditDialogOpen(false)
      setSelectedDessert(null)
      resetForm()
      setSelectedImageFile(null)
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
      await deleteDessert(selectedDessert.id)

      if (selectedDessert.image) {
        await deleteImage(selectedDessert.image)
      }

      await loadDesserts()

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

  const openEditDialog = (dessert: Dessert) => {
    setSelectedDessert(dessert)
    setFormData({
      name: dessert.name,
      description: dessert.description,
      price: dessert.price.toString(),
      image: dessert.image,
      category: dessert.category,
      tags: dessert.tags.join(", "),
      minweight: dessert.minweight ? dessert.minweight.toString() : "",
      leadTime: dessert.leadTime ? dessert.leadTime.toString() : "",
      stock: dessert.stock.toString(),
    })
    setImagePreview(dessert.image)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (dessert: Dessert) => {
    setSelectedDessert(dessert)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Desserts Management */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">ניהול קינוחים</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDessertsCollapsed(!isDessertsCollapsed)}
          >
            {isDessertsCollapsed ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronUpIcon className="h-5 w-5" />}
          </Button>
        </div>
        {!isDessertsCollapsed && (
          <div>
            <div className="flex justify-between items-center mb-6">
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
                      <div className="grid gap-2">
                        <Label htmlFor="stock">כמות במלאי</Label>
                        <Input
                          id="stock"
                          name="stock"
                          type="number"
                          value={formData.stock}
                          onChange={handleInputChange}
                          placeholder="הזן כמות במלאי"
                          dir="rtl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="leadTime">זמן הזמנה מראש (ימים)</Label>
                        <Input
                          id="leadTime"
                          name="leadTime"
                          type="number"
                          value={formData.leadTime}
                          onChange={handleInputChange}
                          placeholder="הזן מספר ימים"
                          dir="rtl"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          הזמן המינימלי להזמנה מראש אם הקינוח לא זמין במלאי
                        </p>
                      </div>
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
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button
                      onClick={async () => {
                        await handleAddDessert()
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
                            <div className="relative w-12 h-12 cursor-pointer" onClick={() => handleImageClick(dessert.image)}>
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
                          <TableCell>{dessert.stock > 0 ? "כן" : "לא"}</TableCell>
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
          </div>
        )}
      </div>

      {/* Categories Management */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">ניהול קטגוריות</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCategoriesCollapsed(!isCategoriesCollapsed)}
          >
            {isCategoriesCollapsed ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronUpIcon className="h-5 w-5" />}
          </Button>
        </div>
        {!isCategoriesCollapsed && (
          <div>
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
        )}
      </div>

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
              <div className="grid gap-2">
                <Label htmlFor="edit-leadTime">זמן הזמנה מראש (ימים)</Label>
                <Input
                  id="edit-leadTime"
                  name="leadTime"
                  type="number"
                  value={formData.leadTime}
                  onChange={handleInputChange}
                  placeholder="הזן מספר ימים"
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground text-right">
                  הזמן המינימלי להזמנה מראש אם הקינוח לא זמין במלאי
                </p>
              </div>
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
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">כמות במלאי</Label>
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="הזן כמות במלאי"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="edit-available">זמין במלאי</Label>
                <input
                  id="edit-available"
                  name="available"
                  type="checkbox"
                  checked={Number(formData.stock) > 0}
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

      {/* Modal for enlarged image */}
      {selectedImagePreview && (
        <Dialog open={!!selectedImagePreview} onOpenChange={closeImageModal}>
          <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden" />
          <DialogContent className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center overflow-hidden">
            <DialogTitle>
              <VisuallyHidden>תמונה מוגדלת של קינוח</VisuallyHidden>
            </DialogTitle>
            <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90vw] max-h-[90vh] flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src={selectedImagePreview}
                  alt="תמונה מוגדלת של קינוח"
                  className="rounded-md object-contain"
                  style={{
                    maxWidth: "60%",
                    maxHeight: "60%",
                    width: "auto",
                    height: "auto",
                  }}
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

