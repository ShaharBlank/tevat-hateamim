"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

export default function AdminSettings() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // מצב לטאב הגדרות כלליות
  const [generalSettings, setGeneralSettings] = useState({
    storeName: "תיבת הטעמים",
    storeEmail: "info@tevatteamim.com",
    storePhone: "055-556-2540",
    storeAddress: "באר שבע, ישראל",
  })

  // מצב לטאב הגדרות משלוח
  const [shippingSettings, setShippingSettings] = useState({
    shippingCost: "30",
    freeShippingThreshold: "300",
    enableFreeShipping: true,
    minOrderAmount: "100",
  })

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setShippingSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setShippingSettings((prev) => ({ ...prev, enableFreeShipping: checked }))
  }

  const saveGeneralSettings = () => {
    setIsSubmitting(true)

    // כאן יש לבצע שמירה של ההגדרות במסד הנתונים
    // לצורך הדוגמה, נדמה שמירה מוצלחת

    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "ההגדרות נשמרו בהצלחה",
        description: "הגדרות החנות הכלליות עודכנו",
      })
    }, 1000)
  }

  const saveShippingSettings = () => {
    setIsSubmitting(true)

    // כאן יש לבצע שמירה של הגדרות המשלוח במסד הנתונים
    // לצורך הדוגמה, נדמה שמירה מוצלחת

    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "הגדרות המשלוח נשמרו בהצלחה",
        description: "הגדרות המשלוח של החנות עודכנו",
      })
    }, 1000)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold">הגדרות</h2>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">הגדרות כלליות</TabsTrigger>
          <TabsTrigger value="shipping">הגדרות משלוח</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="text-right"> {/* Align text to the right */}
              <CardTitle>הגדרות כלליות</CardTitle>
              <CardDescription>הגדר את פרטי החנות הבסיסיים</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName" className="text-right block">
                  שם החנות
                </Label>
                <Input
                  id="storeName"
                  name="storeName"
                  value={generalSettings.storeName}
                  onChange={handleGeneralChange}
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeEmail" className="text-right block">
                  אימייל החנות
                </Label>
                <Input
                  id="storeEmail"
                  name="storeEmail"
                  type="email"
                  value={generalSettings.storeEmail}
                  onChange={handleGeneralChange}
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storePhone" className="text-right block">
                  טלפון החנות
                </Label>
                <Input
                  id="storePhone"
                  name="storePhone"
                  value={generalSettings.storePhone}
                  onChange={handleGeneralChange}
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeAddress" className="text-right block">
                  כתובת החנות
                </Label>
                <Input
                  id="storeAddress"
                  name="storeAddress"
                  value={generalSettings.storeAddress}
                  onChange={handleGeneralChange}
                  className="text-right"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveGeneralSettings} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "שומר..." : "שמור הגדרות"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות משלוח</CardTitle>
              <CardDescription>הגדר את אפשרויות המשלוח והעלויות</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shippingCost" className="text-right block">
                  עלות משלוח (₪)
                </Label>
                <Input
                  id="shippingCost"
                  name="shippingCost"
                  type="number"
                  value={shippingSettings.shippingCost}
                  onChange={handleShippingChange}
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minOrderAmount" className="text-right block">
                  סכום מינימלי להזמנה (₪)
                </Label>
                <Input
                  id="minOrderAmount"
                  name="minOrderAmount"
                  type="number"
                  value={shippingSettings.minOrderAmount}
                  onChange={handleShippingChange}
                  className="text-right"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="enableFreeShipping"
                  checked={shippingSettings.enableFreeShipping}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="enableFreeShipping" className="mr-2">
                  אפשר משלוח חינם מעל סכום מסוים
                </Label>
              </div>

              {shippingSettings.enableFreeShipping && (
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold" className="text-right block">
                    סף למשלוח חינם (₪)
                  </Label>
                  <Input
                    id="freeShippingThreshold"
                    name="freeShippingThreshold"
                    type="number"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={handleShippingChange}
                    className="text-right"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={saveShippingSettings} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "שומר..." : "שמור הגדרות"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

