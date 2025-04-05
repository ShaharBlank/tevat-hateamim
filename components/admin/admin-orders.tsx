"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { he } from "date-fns/locale"
import { getOrders, updateOrderStatus, createNotification } from "@/lib/db-service" // Use db-service for consistent types
import type { Order } from "@/lib/db-service" // Ensure consistent type usage
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircleIcon, XCircleIcon, ClockIcon, PackageIcon, EyeIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">("all")
  const [notes, setNotes] = useState("")
  const [newStatus, setNewStatus] = useState<Order["status"]>("pending")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [hasPendingOrders, setHasPendingOrders] = useState(false);

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const checkPendingOrders = async () => {
      try {
        const fetchedOrders = await getOrders();
        const pendingExists = fetchedOrders.some((order) => order.status === "pending");
        setHasPendingOrders(pendingExists);

        // Update menu indicator dynamically
        const menuItem = document.querySelector("#admin-menu-orders");
        if (menuItem) {
          menuItem.classList.toggle("animate-pulse", pendingExists);
        }
      } catch (error) {
        console.error("Error checking pending orders:", error);
      }
    };

    checkPendingOrders();

    // Recheck every 30 seconds
    const interval = setInterval(checkPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true)
      const fetchedOrders = await getOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת ההזמנות",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter)

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            ממתין לאישור
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            אושר
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            נדחה
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            הושלם
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case "approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case "completed":
        return <PackageIcon className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsViewDialogOpen(true)
  }

  const openUpdateDialog = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setNotes(order.notes || "")
    setIsUpdateDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return

    try {
      // Update order status
      await updateOrderStatus(selectedOrder.id, newStatus, notes)

      // Create notification for the user
      let notificationTitle = ""
      let notificationMessage = ""

      switch (newStatus) {
        case "approved":
          notificationTitle = "ההזמנה שלך אושרה"
          notificationMessage = `ההזמנה מספר ${selectedOrder.id || selectedOrder.id} אושרה ונמצאת בהכנה. אנו נעדכן אותך כשהיא תהיה מוכנה.`
          break
        case "rejected":
          notificationTitle = "ההזמנה שלך נדחתה"
          notificationMessage = `לצערנו, ההזמנה מספר ${selectedOrder.id || selectedOrder.id} נדחתה. ${notes}`
          break
        case "completed":
          notificationTitle = "ההזמנה שלך מוכנה"
          notificationMessage = `ההזמנה מספר ${selectedOrder.id || selectedOrder.id} מוכנה לאיסוף/משלוח. ${notes}`
          break
        default:
          notificationTitle = "עדכון לגבי ההזמנה שלך"
          notificationMessage = `סטטוס ההזמנה מספר ${selectedOrder.id || selectedOrder.id} עודכן ל-${newStatus}.`
      }

      await createNotification({
        userid: selectedOrder.userid,
        title: notificationTitle,
        message: notificationMessage,
        orderid: selectedOrder.id,
      })

      // Reload orders
      await loadOrders()

      // Close dialog
      setIsUpdateDialogOpen(false)
      setSelectedOrder(null)

      toast({
        title: "הסטטוס עודכן בהצלחה",
        description: `סטטוס ההזמנה עודכן ל-${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת עדכון הסטטוס",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-6">טוען הזמנות...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          ניהול הזמנות
          {hasPendingOrders && <Badge className="bg-red-500 text-white">הזמנה חדשה</Badge>}
        </h2>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Order["status"] | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="סנן לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל ההזמנות</SelectItem>
            <SelectItem value="pending">ממתינות לאישור</SelectItem>
            <SelectItem value="approved">מאושרות</SelectItem>
            <SelectItem value="rejected">נדחו</SelectItem>
            <SelectItem value="completed">הושלמו</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מספר הזמנה</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    לא נמצאו הזמנות
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.orderNumber || order.id.substring(0, 8)}</TableCell>
                    <TableCell>{order.username}</TableCell>
                    <TableCell>{format(new Date(order.createdat), "dd/MM/yyyy", { locale: he })}</TableCell>
                    <TableCell>₪{order.total.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(order)}>
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openUpdateDialog(order)}>
                          {getStatusIcon(order.status)}
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

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>פרטי הזמנה #{selectedOrder?.orderNumber || selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              נוצר בתאריך{" "}
              {selectedOrder && format(new Date(selectedOrder.createdat), "dd/MM/yyyy HH:mm", { locale: he })}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">פרטי לקוח</h3>
                  <p>{selectedOrder.username}</p>
                  <p>{selectedOrder.useremail}</p>
                  <p>{selectedOrder.userphone}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">סטטוס הזמנה</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedOrder.status)}
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">פריטים</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>מוצר</TableHead>
                        <TableHead>משקל (ק"ג)</TableHead>
                        <TableHead>מחיר לק"ג</TableHead>
                        <TableHead>סה"כ מחיר</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.weight.toFixed(1)} ק"ג</TableCell>
                          <TableCell>₪{item.price.toFixed(2)}</TableCell>
                          <TableCell>₪{(item.price * item.weight).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between font-semibold pt-2">
                <span>סה"כ</span>
                <span>₪{selectedOrder.total.toFixed(2)}</span>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">הערות:</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>עדכון סטטוס הזמנה #{selectedOrder?.orderNumber || selectedOrder?.id}</DialogTitle>
            <DialogDescription>עדכן את סטטוס ההזמנה והוסף הערות ללקוח.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="font-medium">סטטוס חדש</label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Order["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">ממתין לאישור</SelectItem>
                  <SelectItem value="approved">מאושר</SelectItem>
                  <SelectItem value="rejected">נדחה</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="font-medium">הערות ללקוח</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הוסף הערות שיישלחו ללקוח"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleUpdateStatus}>עדכן סטטוס</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

