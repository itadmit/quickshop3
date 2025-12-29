"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Textarea } from "@/components/ui/Textarea"
import { useOptimisticToast } from "@/hooks/useOptimisticToast"
import {
  HiUser,
  HiShoppingBag,
  HiHeart,
  HiLocationMarker,
  HiLogout,
  HiArchive,
  HiCalendar,
  HiCurrencyDollar,
  HiRefresh,
  HiTrash,
  HiPlus,
  HiPencil,
  HiX,
  HiTruck,
  HiGift,
} from "react-icons/hi"
import Link from "next/link"
import { Skeleton, TextSkeleton } from "@/components/ui/Skeleton"
import { emitTrackingEvent } from "@/lib/tracking/events"
import { useWishlist, WishlistItem } from "@/hooks/useWishlist"

interface Store {
  id: number
  name: string
  description: string | null
  logo: string | null
  settings?: {
    show_id_number?: boolean
    show_birth_date?: boolean
  }
}

interface Customer {
  tier?: string | null
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  id_number?: string | null
  birth_date?: string | null
  premium_club_tier?: string | null
}

interface Order {
  id: number
  orderNumber: number
  status: string
  paymentStatus?: string
  total: number
  createdAt: string
  trackingNumber?: string | null
  items?: Array<{
    id: number
    quantity: number
    name: string
    price: number
  }>
}

export default function StorefrontAccountPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useOptimisticToast()
  const storeSlug = params.storeSlug as string
  
  // Get tab from URL or default to "profile"
  const urlTab = searchParams.get('tab') as "profile" | "orders" | "addresses" | "wishlist" | "returns" | "credits" | null;
  const validTabs = ["profile", "orders", "addresses", "wishlist", "returns", "credits"];
  const initialTab = urlTab && validTabs.includes(urlTab) ? urlTab : "profile";

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [returns, setReturns] = useState<any[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [storeCredit, setStoreCredit] = useState<any>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses" | "wishlist" | "returns" | "credits">(initialTab)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('paid') // ✅ ברירת מחדל: רק הזמנות ששולמו
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any | null>(null)
  const [addressForm, setAddressForm] = useState({
    first_name: "",
    last_name: "",
    address: "",
    houseNumber: "",
    apartment: "",
    floor: "",
    city: "",
    zip: "",
  })
  const [savingAddress, setSavingAddress] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [returnForm, setReturnForm] = useState({
    reason: "",
    notes: "",
    items: [] as Array<{ orderItemId: number; quantity: number; reason?: string }>,
  })
  const [creatingReturn, setCreatingReturn] = useState(false)
  const [trackingStatuses, setTrackingStatuses] = useState<Record<string, any>>({})
  const [loadingTracking, setLoadingTracking] = useState<Record<string, boolean>>({})
  const [monthlyGift, setMonthlyGift] = useState<any>(null)
  const [loadingMonthlyGift, setLoadingMonthlyGift] = useState(false)
  const [claimingGift, setClaimingGift] = useState(false)
  const [premiumProgress, setPremiumProgress] = useState<any>(null)
  const [loadingPremiumProgress, setLoadingPremiumProgress] = useState(false)

  // פונקציה לבדיקת שגיאות אימות (לקוח נמחק)
  const handleAuthError = (response: Response) => {
    if (response.status === 401) {
      // לקוח נמחק או אימות נכשל
      localStorage.removeItem(`storefront_token_${storeSlug}`)
      localStorage.removeItem(`storefront_customer_${storeSlug}`)
      toast({
        title: "החשבון לא נמצא",
        description: "החשבון נמחק או לא קיים יותר במערכת",
        variant: "destructive",
      })
      router.push(`/shops/${storeSlug}`)
      return true
    }
    return false
  }

  // פונקציה לתרגום סטטוס לעברית
  const getStatusText = (status: string, paymentStatus?: string) => {
    // אם התשלום שולם, נציג "שולם" במקום "ממתין"
    if (status === "paid") {
      return "שולם"
    }
    
    const statusMap: Record<string, string> = {
      pending: "ממתין לתשלום",
      authorized: "מאושר",
      paid: "שולם",
      partially_paid: "שולם חלקית",
      refunded: "הוחזר",
      partially_refunded: "הוחזר חלקית",
      voided: "בוטל",
    }
    return statusMap[status.toLowerCase()] || status
  }

  // פונקציה לקביעת צבע סטטוס
  const getStatusColor = (status: string, paymentStatus?: string) => {
    // אם הוזמן ביקרוק ובוטל - אדום
    if (status === "voided" || status === "refunded") {
      return "bg-red-100 text-red-700 border-red-200"
    }
    // אם הוזמן ביקרוק - ירוק
    if (status === "paid") {
      return "bg-green-100 text-green-700 border-green-200"
    }
    // פנדינג - צהוב
    if (status === "pending") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    }
    // סטטוסים אחרים - כחול פסטל
    return "bg-blue-100 text-blue-700 border-blue-200"
  }

  useEffect(() => {
    fetchShopInfo()
    fetchCartCount()
    
    const token = localStorage.getItem(`storefront_token_${storeSlug}`)
    const customerData = localStorage.getItem(`storefront_customer_${storeSlug}`)

    if (!token || !customerData) {
      router.push(`/shops/${storeSlug}/login`)
      return
    }

    try {
      const parsed = JSON.parse(customerData)
      setCustomer(parsed)
      
      // טעינת נתונים במקביל אבל עם try-catch נפרד לכל אחד
      Promise.all([
        fetchOrders(parsed.id).catch(err => console.error('Error fetching orders:', err)),
        fetchReturns(parsed.id).catch(err => console.error('Error fetching returns:', err)),
        fetchAddresses(parsed.id).catch(err => console.error('Error fetching addresses:', err)),
        fetchStoreCredit(parsed.id).catch(err => console.error('Error fetching store credit:', err))
      ])
    } catch (error) {
      console.error("Error parsing customer data:", error)
      router.push(`/shops/${storeSlug}/login`)
    } finally {
      setLoading(false)
    }
  }, [storeSlug, router])

  // רענון קרדיט בחנות כשעוברים לטאב פרטים אישיים או קרדיט
  useEffect(() => {
    if ((activeTab === "profile" || activeTab === "credits") && customer) {
      fetchStoreCredit(customer.id)
    }
  }, [activeTab, customer])

  useEffect(() => {
    console.log('[Account Page] useEffect triggered', { 
      hasCustomer: !!customer?.id, 
      hasStore: !!store?.id,
      hasTier: !!customer?.premium_club_tier 
    })
    
    // ✅ טעינת מועדון פרימיום גם אם הלקוח עדיין לא חבר
    if (customer?.id && store?.id) {
      console.log('[Account Page] Calling fetchPremiumProgress')
      fetchPremiumProgress()
      if (customer?.premium_club_tier) {
        console.log('[Account Page] Calling fetchMonthlyGift')
        fetchMonthlyGift()
      }
    }
  }, [customer?.id, store?.id])

  const fetchPremiumProgress = async () => {
    if (!customer?.id || !store?.id) return
    
    setLoadingPremiumProgress(true)
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      if (!token) {
        setPremiumProgress(null)
        return
      }

      const response = await fetch(`/api/storefront/${storeSlug}/premium-club/progress`, {
        headers: {
          'x-customer-id': token,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.enabled) {
          setPremiumProgress({
            enabled: true,
            currentTier: data.currentTier ? {
              name: data.currentTier.name,
              color: data.currentTier.color,
              discount: data.currentTier.discount,
            } : null,
            nextTier: data.nextTier ? {
              name: data.nextTier.name,
              color: data.nextTier.color,
              discount: data.nextTier.discount,
              minSpent: data.nextTier.minSpent,
              minOrders: data.nextTier.minOrders,
            } : null,
            progress: data.progress,
            totalSpent: data.stats.totalSpent,
            totalOrders: data.stats.totalOrders,
            allTiers: data.allTiers || [],
          })
        } else {
          setPremiumProgress(null)
        }
      } else {
        setPremiumProgress(null)
      }
    } catch (error) {
      console.error("Error fetching premium progress:", error)
      setPremiumProgress(null)
    } finally {
      setLoadingPremiumProgress(false)
    }
  }

  // Monthly gift functionality - לא מיושם כרגע
  const fetchMonthlyGift = async () => {
    // TODO: Implement monthly gift API endpoint
    setMonthlyGift(null)
  }

  const claimMonthlyGift = async () => {
    toast({
      title: "לא זמין",
      description: "תכונה זו תזמין בקרוב",
      variant: "destructive",
    })
  }

  const fetchShopInfo = async () => {
    try {
      const response = await fetch(`/api/storefront/${storeSlug}/info`)
      if (response.ok) {
        const data = await response.json()
        setStore(data)
        
        // Fetch store settings for showing/hiding fields
        if (data.id) {
          try {
            const settingsResponse = await fetch(`/api/storefront/stores/${data.id}/settings`)
            if (settingsResponse.ok) {
              const settingsData = await settingsResponse.json()
              setStore(prev => prev ? { ...prev, settings: settingsData.settings } : null)
            }
          } catch (err) {
            // If settings fetch fails, use defaults
            console.error('Error fetching store settings:', err)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching shop info:", error)
    }
  }

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      const headers: HeadersInit = {}
      if (token) {
        headers["x-customer-id"] = token
      }

      const response = await fetch(`/api/storefront/${storeSlug}/cart/count`, {
        headers,
      })
      
      if (response.ok) {
        const data = await response.json()
        setCartItemCount(data.count || 0)
      } else {
        setCartItemCount(0)
      }
    } catch (error) {
      console.error("Error fetching cart count:", error)
    }
  }

  const fetchOrders = async (customerId: number) => {
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      const response = await fetch(`/api/storefront/${storeSlug}/orders`, {
        headers: {
          "x-customer-id": token || customerId.toString(),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  const fetchTrackingStatus = async (orderId: number) => {
    if (loadingTracking[orderId]) return
    
    setLoadingTracking(prev => ({ ...prev, [orderId]: true }))
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      
      // Try the new shipments tracking API first
      const shipmentResponse = await fetch(`/api/shipments/track-public?orderId=${orderId}&storeSlug=${storeSlug}`)
      
      if (shipmentResponse.ok) {
        const shipmentData = await shipmentResponse.json()
        if (shipmentData.shipment || shipmentData.tracking) {
          setTrackingStatuses(prev => ({ 
            ...prev, 
            [orderId]: {
              status: shipmentData.tracking?.status || shipmentData.shipment?.status || 'unknown',
              statusText: shipmentData.tracking?.statusText || '',
              trackingNumber: shipmentData.shipment?.tracking_number,
              trackingUrl: shipmentData.shipment?.tracking_url,
              estimatedDelivery: shipmentData.tracking?.estimatedDelivery,
              events: shipmentData.tracking?.events || [],
            }
          }))
          return
        }
      }
      
      // Fallback to order details endpoint
      const response = await fetch(`/api/storefront/${storeSlug}/orders/${orderId}`, {
        headers: {
          "x-customer-id": token || "",
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        // Extract tracking info from fulfillments
        if (data.fulfillments && data.fulfillments.length > 0) {
          const fulfillment = data.fulfillments[0]
          setTrackingStatuses(prev => ({ 
            ...prev, 
            [orderId]: {
              status: fulfillment.status,
              trackingNumber: fulfillment.trackingNumber,
              trackingCompany: fulfillment.trackingCompany,
              trackingUrl: fulfillment.trackingUrl,
              events: [],
            }
          }))
        }
      } else {
        const error = await response.json()
        toast({
          title: "שגיאה",
          description: error.error || "לא הצלחנו לקבל את סטטוס המעקב",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching tracking status:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בקבלת סטטוס המעקב",
        variant: "destructive",
      })
    } finally {
      setLoadingTracking(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const getTrackingStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "ממתין",
      sent: "נשלח",
      in_transit: "בדרך",
      delivered: "נמסר",
      cancelled: "בוטל",
      failed: "נכשל",
      returned: "הוחזר",
    }
    return statusMap[status] || status
  }

  const getTrackingStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      sent: "bg-blue-100 text-blue-700 border-blue-200",
      in_transit: "bg-purple-100 text-purple-700 border-purple-200",
      delivered: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      returned: "bg-orange-100 text-orange-700 border-orange-200",
    }
    return colorMap[status] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const fetchReturns = async (customerId: number) => {
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      if (!token) {
        console.log("No token found for returns")
        setReturns([])
        return
      }
      
      const response = await fetch(`/api/storefront/${storeSlug}/returns`, {
        headers: {
          "x-customer-id": token,
        },
      })
      
      // בדיקה אם הלקוח נמחק
      if (handleAuthError(response)) {
        setReturns([])
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setReturns(data.returns || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error fetching returns:", errorData)
        setReturns([])
      }
    } catch (error) {
      console.error("Error fetching returns:", error)
      setReturns([]) // ✅ איפוס לרשימה ריקה במקרה של שגיאה
    }
  }

  const fetchAddresses = async (customerId: number) => {
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      if (!token) {
        console.log("No token found for addresses")
        return
      }

      const response = await fetch(`/api/storefront/${storeSlug}/addresses`, {
        headers: {
          "x-customer-id": token,
        },
      })

      if (handleAuthError(response)) {
        return
      }

      if (response.ok) {
        const data = await response.json()
        // המרת הנתונים לפורמט שמתאים לתצוגה
        const formattedAddresses = data.map((addr: any) => ({
          id: addr.id,
          first_name: addr.first_name,
          last_name: addr.last_name,
          address: addr.address1?.split(' ').slice(0, -1).join(' ') || '', // רחוב ללא מספר בית
          houseNumber: addr.address1?.split(' ').pop() || '', // מספר בית
          apartment: addr.address2?.match(/דירה (\d+)/)?.[1] || '',
          floor: addr.address2?.match(/קומה (\d+)/)?.[1] || '',
          city: addr.city,
          zip: addr.zip,
          phone: addr.phone,
          default_address: addr.default_address,
        }))
        setAddresses(formattedAddresses)
      } else {
        const errorData = await response.json()
        console.error("Error fetching addresses:", errorData)
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    }
  }

  const fetchStoreCredit = async (customerId: number) => {
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      if (!token) {
        console.log("No token found for store credit")
        return
      }

      const response = await fetch(`/api/storefront/${storeSlug}/store-credit`, {
        headers: {
          "x-customer-id": token,
        },
      })
      
      // בדיקה אם הלקוח נמחק
      if (handleAuthError(response)) {
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log("Store credit data:", data)
        setStoreCredit(data)
      } else {
        const errorData = await response.json()
        console.error("Error fetching store credit:", errorData)
      }
    } catch (error) {
      console.error("Error fetching store credit:", error)
    }
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setAddressForm({
      first_name: customer?.first_name || "",
      last_name: customer?.last_name || "",
      address: "",
      houseNumber: "",
      apartment: "",
      floor: "",
      city: "",
      zip: "",
    })
    setAddressDialogOpen(true)
  }

  const handleEditAddress = (address: any) => {
    setEditingAddress(address)
    setAddressForm({
      first_name: address.first_name || "",
      last_name: address.last_name || "",
      address: address.address || "",
      houseNumber: address.houseNumber || "",
      apartment: address.apartment || "",
      floor: address.floor || "",
      city: address.city || "",
      zip: address.zip || "",
    })
    setAddressDialogOpen(true)
  }

  const handleSaveAddress = async () => {
    if (!addressForm.first_name || !addressForm.address || !addressForm.houseNumber || !addressForm.city) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive",
      })
      return
    }

    setSavingAddress(true)
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      if (!token) {
        toast({
          title: "שגיאה",
          description: "אימות נדרש",
          variant: "destructive",
        })
        return
      }

      const url = editingAddress
        ? `/api/storefront/${storeSlug}/addresses/${editingAddress.id}`
        : `/api/storefront/${storeSlug}/addresses`
      const method = editingAddress ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          "x-customer-id": token,
        },
        body: JSON.stringify({
          first_name: addressForm.first_name,
          last_name: addressForm.last_name,
          address: addressForm.address,
          houseNumber: addressForm.houseNumber,
          apartment: addressForm.apartment,
          floor: addressForm.floor,
          city: addressForm.city,
          zip: addressForm.zip,
          phone: addressForm.phone,
          default_address: addresses.length === 0, // אם זו הכתובת הראשונה, נסמן אותה כברירת מחדל
        }),
      })

      if (handleAuthError(response)) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save address')
      }

      toast({
        title: "הצלחה",
        description: editingAddress ? "הכתובת עודכנה בהצלחה" : "הכתובת נוספה בהצלחה",
        variant: "success",
      })

      // רענון רשימת הכתובות
      if (customer) {
        await fetchAddresses(customer.id)
      }

      setAddressDialogOpen(false)
      setEditingAddress(null)
      setAddressForm({
        first_name: customer?.first_name || "",
        last_name: customer?.last_name || "",
        address: "",
        houseNumber: "",
        apartment: "",
        floor: "",
        city: "",
        zip: "",
      })
    } catch (error: any) {
      console.error("Error saving address:", error)
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בשמירת הכתובת",
        variant: "destructive",
      })
    } finally {
      setSavingAddress(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הכתובת הזו?")) {
      return
    }

    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      if (!token) {
        toast({
          title: "שגיאה",
          description: "אימות נדרש",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/storefront/${storeSlug}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          "x-customer-id": token,
        },
      })

      if (handleAuthError(response)) {
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete address')
      }

      toast({
        title: "הצלחה",
        description: "הכתובת נמחקה בהצלחה",
        variant: "success",
      })

      // רענון רשימת הכתובות
      if (customer) {
        await fetchAddresses(customer.id)
      }
    } catch (error: any) {
      console.error("Error deleting address:", error)
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה במחיקת הכתובת",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    // Track Logout event
    emitTrackingEvent({
      event: 'Logout',
      user_id: customer?.id ? String(customer.id) : undefined,
    })
    
    localStorage.removeItem(`storefront_token_${storeSlug}`)
    localStorage.removeItem(`storefront_customer_${storeSlug}`)
    // מחיקת cookie
    document.cookie = `storefront_customer_${storeSlug}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    // עדכון ההדר מיד
    window.dispatchEvent(new Event('customerDataChanged'))
    router.push(`/shops/${storeSlug}`)
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      
      if (!token) {
        toast({
          title: "שגיאה",
          description: "אימות נדרש",
          variant: "destructive",
        })
        return
      }

      // TODO: Implement account deletion API endpoint
      toast({
        title: "לא זמין",
        description: "תכונה זו תזמין בקרוב",
        variant: "destructive",
      })
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת החשבון",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">חשבון שלי</h1>
            <p className="text-gray-600 mt-1">
              שלום, {customer.first_name || customer.email}!
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <HiLogout className="w-4 h-4 ml-2" />
            התנתק
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1 p-2">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "profile"
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <HiUser className="w-4 h-4 inline ml-2" />
                    פרטים אישיים
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "orders"
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <HiShoppingBag className="w-4 h-4 inline ml-2" />
                    הזמנות שלי
                  </button>
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "addresses"
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <HiLocationMarker className="w-4 h-4 inline ml-2" />
                    כתובות
                  </button>
                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "wishlist"
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <HiHeart className="w-4 h-4 inline ml-2" />
                    רשימת משאלות
                  </button>
                  <button
                    onClick={() => setActiveTab("returns")}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "returns"
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <HiRefresh className="w-4 h-4 inline ml-2" />
                    החזרות והחלפות
                  </button>
                  <button
                    onClick={() => setActiveTab("credits")}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "credits"
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <HiCurrencyDollar className="w-4 h-4 inline ml-2" />
                    קרדיט בחנות
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <>
              <Card>
                <CardHeader>
                  <CardTitle>פרטים אישיים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>שם פרטי</Label>
                      <p className="font-medium">{customer.first_name || "-"}</p>
                    </div>
                    <div>
                      <Label>שם משפחה</Label>
                      <p className="font-medium">{customer.last_name || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <Label>אימייל</Label>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <p className="font-medium">{customer.phone || "-"}</p>
                  </div>
                  
                  {/* תעודת זהות ותאריך לידה - אם מוגדר להצגה */}
                  {store?.settings?.show_id_number && (
                    <div>
                      <Label>מספר תעודת זהות</Label>
                      <p className="font-medium">{customer.id_number || "-"}</p>
                    </div>
                  )}
                  
                  {store?.settings?.show_birth_date && customer.birth_date && (
                    <div>
                      <Label>תאריך לידה</Label>
                      <p className="font-medium">
                        {new Date(customer.birth_date).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  
                  {/* רמת מועדון פרימיום עם פרוגרס בר */}
                  {loadingPremiumProgress ? (
                    <div className="mt-4 pt-4 border-t">
                      <div className="rounded-lg p-4 border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                        {/* Skeleton - כותרת */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-32" />
                              <Skeleton className="h-5 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                        
                        {/* Skeleton - סטטיסטיקות */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/50 rounded-lg p-2">
                            <Skeleton className="h-8 w-24 mx-auto mb-1" />
                            <Skeleton className="h-3 w-16 mx-auto" />
                          </div>
                          <div className="bg-white/50 rounded-lg p-2">
                            <Skeleton className="h-8 w-12 mx-auto mb-1" />
                            <Skeleton className="h-3 w-16 mx-auto" />
                          </div>
                        </div>
                        
                        {/* Skeleton - פרוגרס בר */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <Skeleton className="h-3 w-full rounded-full" />
                          <div className="mt-3 flex gap-2">
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <Skeleton className="h-6 w-28 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : premiumProgress?.enabled ? (
                    <div className="mt-4 pt-4 border-t">
                      <div 
                        className="rounded-lg p-4 border-2"
                        style={{
                          background: premiumProgress.currentTier 
                            ? `linear-gradient(135deg, ${premiumProgress.currentTier.color}15, ${premiumProgress.currentTier.color}30)`
                            : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                          borderColor: premiumProgress.currentTier?.color || premiumProgress.nextTier?.color || '#d1d5db'
                        }}
                      >
                        {/* כותרת ורמה נוכחית */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <HiGift 
                              className="w-8 h-8" 
                              style={{ color: premiumProgress.currentTier?.color || premiumProgress.nextTier?.color || '#d1d5db' }}
                            />
                            <div>
                              <Label className="text-sm text-gray-600">מועדון פרימיום</Label>
                              <p 
                                className="text-xl font-bold"
                                style={{ color: premiumProgress.currentTier?.color || premiumProgress.nextTier?.color || '#374151' }}
                              >
                                {premiumProgress.currentTier?.name || 'עדיין לא חבר'}
                              </p>
                            </div>
                          </div>
                          {premiumProgress.currentTier?.discount && (
                            <div className="text-center px-3 py-1 rounded-full bg-white/50">
                              <span className="text-lg font-bold" style={{ color: premiumProgress.currentTier.color }}>
                                {premiumProgress.currentTier.discount.type === 'PERCENTAGE' 
                                  ? `${premiumProgress.currentTier.discount.value}%`
                                  : `₪${premiumProgress.currentTier.discount.value}`
                                }
                              </span>
                              <span className="text-xs text-gray-600 mr-1">הנחה</span>
                            </div>
                          )}
                          {!premiumProgress.currentTier && premiumProgress.nextTier?.discount && (
                            <div className="text-center px-3 py-1 rounded-full bg-white/50">
                              <span className="text-lg font-bold" style={{ color: premiumProgress.nextTier.color }}>
                                {premiumProgress.nextTier.discount.type === 'PERCENTAGE' 
                                  ? `${premiumProgress.nextTier.discount.value}%`
                                  : `₪${premiumProgress.nextTier.discount.value}`
                                }
                              </span>
                              <span className="text-xs text-gray-600 mr-1">הנחה ברמה הבאה</span>
                            </div>
                          )}
                        </div>

                        {/* סטטיסטיקות */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                          <div className="bg-white/50 rounded-lg p-2">
                            <p className="text-2xl font-bold text-gray-800">₪{premiumProgress.totalSpent?.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">סה"כ רכישות</p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-2">
                            <p className="text-2xl font-bold text-gray-800">{premiumProgress.totalOrders}</p>
                            <p className="text-xs text-gray-500">הזמנות</p>
                          </div>
                        </div>

                        {/* פרוגרס לרמה הבאה */}
                        {premiumProgress.nextTier && premiumProgress.progress && (
                          <div className="mt-4 pt-4 border-t border-white/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">
                                {premiumProgress.currentTier 
                                  ? `התקדמות לרמת ${premiumProgress.nextTier.name}`
                                  : `הצטרפות לרמת ${premiumProgress.nextTier.name}`
                                }
                              </span>
                              <span className="text-sm font-bold" style={{ color: premiumProgress.nextTier.color }}>
                                {Math.round(premiumProgress.progress.percentage)}%
                              </span>
                            </div>
                            
                            {/* פרוגרס בר */}
                            <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${premiumProgress.progress.percentage}%`,
                                  backgroundColor: premiumProgress.nextTier.color 
                                }}
                              />
                            </div>

                            {/* מה נותר */}
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              {premiumProgress.nextTier.minSpent && (
                                <span className="bg-white/50 px-2 py-1 rounded-full">
                                  {premiumProgress.stats.totalSpent >= premiumProgress.nextTier.minSpent ? (
                                    <span className="text-green-600">✓ ₪{premiumProgress.stats.totalSpent.toLocaleString()} / ₪{premiumProgress.nextTier.minSpent.toLocaleString()}</span>
                                  ) : (
                                    <span>חסרים עוד ₪{(premiumProgress.nextTier.minSpent - premiumProgress.stats.totalSpent).toLocaleString()}</span>
                                  )}
                                </span>
                              )}
                              {premiumProgress.nextTier.minOrders && (
                                <span className="bg-white/50 px-2 py-1 rounded-full">
                                  {premiumProgress.stats.totalOrders >= premiumProgress.nextTier.minOrders ? (
                                    <span className="text-green-600">✓ {premiumProgress.stats.totalOrders} / {premiumProgress.nextTier.minOrders} הזמנות</span>
                                  ) : (
                                    <span>חסרות עוד {premiumProgress.nextTier.minOrders - premiumProgress.stats.totalOrders} הזמנות</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* אם הגיע לרמה הגבוהה ביותר */}
                        {!premiumProgress.nextTier && premiumProgress.currentTier && (
                          <div className="mt-4 pt-4 border-t border-white/30 text-center">
                            <p className="text-sm text-gray-600">
                              🎉 הגעת לרמה הגבוהה ביותר!
                            </p>
                          </div>
                        )}

                        {/* הטבות הרמה */}
                        {premiumProgress.currentTier?.benefits && (
                          <div className="mt-4 pt-4 border-t border-white/30">
                            <p className="text-xs text-gray-500 mb-2">הטבות הרמה שלך:</p>
                            <div className="flex flex-wrap gap-1">
                              {premiumProgress.currentTier.benefits.freeShipping && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">משלוח חינם</span>
                              )}
                              {premiumProgress.currentTier.benefits.earlyAccess && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">גישה מוקדמת</span>
                              )}
                              {premiumProgress.currentTier.benefits.exclusiveProducts && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">מוצרים בלעדיים</span>
                              )}
                              {premiumProgress.currentTier.benefits.birthdayGift && (
                                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">מתנת יום הולדת</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  
                  {/* קרדיט בחנות */}
                  {storeCredit && (
                    <div className="mt-6 pt-6 border-t">
                      <div className={`rounded-lg p-4 ${
                        storeCredit.balance > 0 
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50" 
                          : "bg-gray-50"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-600">קרדיט בחנות</Label>
                            <p className={`text-2xl font-bold mt-1 ${
                              storeCredit.balance > 0 
                                ? "text-blue-700" 
                                : "text-gray-500"
                            }`}>
                              ₪{storeCredit.balance.toFixed(2)}
                            </p>
                            {storeCredit.expiresAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                תאריך תפוגה: {new Date(storeCredit.expiresAt).toLocaleDateString("he-IL")}
                              </p>
                            )}
                            {storeCredit.reason && (
                              <p className="text-xs text-gray-500 mt-1">
                                {storeCredit.reason}
                              </p>
                            )}
                          </div>
                          <HiCurrencyDollar className={`w-12 h-12 ${
                            storeCredit.balance > 0 
                              ? "text-blue-500" 
                              : "text-gray-400"
                          }`} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      size="sm"
                    >
                      <HiTrash className="w-4 h-4 ml-2" />
                      מחק חשבון
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* מתנה חודשית - רק אם יש מתנה זמינה */}
              {customer?.premium_club_tier && monthlyGift?.available && (
                <Card className="mt-6 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HiGift className="w-5 h-5 text-yellow-600" />
                      מתנה חודשית זמינה!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-yellow-200">
                      <HiGift className="w-8 h-8 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">יש לך מתנה חודשית!</p>
                        <p className="text-sm text-gray-600">
                          כחבר מועדון פרימיום ברמה {premiumProgress?.currentTier?.name || customer.premium_club_tier || 'לא קיים'}, אתה זכאי למתנה חודשית
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={claimMonthlyGift}
                      disabled={claimingGift}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      {claimingGift ? "מקבל מתנה..." : "🎁 קבל מתנה חודשית"}
                    </Button>
                  </CardContent>
                </Card>
              )}
              </>
            )}

            {activeTab === "orders" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>הזמנות שלי</CardTitle>
                    <div className="flex items-center gap-2">
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      >
                        <option value="all">כל ההזמנות</option>
                        <option value="paid">ששולמו</option>
                        <option value="pending">ממתינות לתשלום</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // סינון הזמנות לפי סטטוס
                    const filteredOrders = orderStatusFilter === 'all' 
                      ? orders 
                      : orders.filter(order => {
                          if (orderStatusFilter === 'paid') {
                            return order.status === 'paid' || order.paymentStatus === 'paid';
                          }
                          if (orderStatusFilter === 'pending') {
                            return order.status === 'pending' || order.paymentStatus === 'pending';
                          }
                          return true;
                        });
                    
                    if (filteredOrders.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <HiShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">
                            {orderStatusFilter === 'all' ? 'אין הזמנות עדיין' : 
                             orderStatusFilter === 'paid' ? 'אין הזמנות ששולמו' :
                             'אין הזמנות ממתינות לתשלום'}
                          </p>
                          {orderStatusFilter === 'all' && (
                            <Link href={`/shops/${storeSlug}`}>
                              <Button className="mt-4 bg-green-500 hover:bg-green-600 text-white">
                                התחל לקנות
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-4">
                        {filteredOrders.map((order: any) => {
                        const hasTracking = order.trackingNumber || order.trackingNumber
                        const trackingStatus = trackingStatuses[order.id]
                        const isLoadingTracking = loadingTracking[order.id]
                        
                        return (
                          <div
                            key={order.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <HiArchive className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold">
                                    הזמנה #{order.orderNumber}
                                  </span>
                                  <Badge className={getStatusColor(order.status, order.paymentStatus)}>
                                    {getStatusText(order.status, order.paymentStatus)}
                                  </Badge>
                                  {trackingStatus && (
                                    <Badge className={getTrackingStatusColor(trackingStatus.status)}>
                                      {getTrackingStatusText(trackingStatus.status)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <HiCalendar className="w-4 h-4" />
                                    {new Date(order.createdAt).toLocaleDateString("he-IL")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <HiCurrencyDollar className="w-4 h-4" />
                                    ₪{order.total.toFixed(2)}
                                  </div>
                                  {hasTracking && (
                                    <div className="flex items-center gap-1">
                                      <HiTruck className="w-4 h-4" />
                                      <span className="text-xs">
                                        {order.trackingNumber || order.trackingNumber}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {trackingStatus?.events && trackingStatus.events.length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="text-xs text-gray-600 mb-2">היסטוריית מעקב:</div>
                                    <div className="space-y-1">
                                      {trackingStatus.events.slice(0, 2).map((event: any, idx: number) => {
                                        // בדיקה שהתאריך תקין
                                        let eventDate: Date
                                        try {
                                          eventDate = event.date instanceof Date ? event.date : new Date(event.date)
                                          if (isNaN(eventDate.getTime())) {
                                            eventDate = new Date()
                                          }
                                        } catch {
                                          eventDate = new Date()
                                        }
                                        
                                        return (
                                          <div key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            <span>
                                              {eventDate.toLocaleDateString("he-IL")} {eventDate.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            <span>-</span>
                                            <span>{event.description || "אירוע מעקב"}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {hasTracking && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchTrackingStatus(order.id)}
                                    disabled={isLoadingTracking}
                                  >
                                    <HiRefresh className={`w-4 h-4 ml-2 ${isLoadingTracking ? "animate-spin" : ""}`} />
                                    רענון מעקב
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/shops/${storeSlug}/orders/${order.id}`)}
                                >
                                  צפה בהזמנה
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  );
                  })()}
                </CardContent>
              </Card>
            )}

            {activeTab === "addresses" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>כתובות משלוח</CardTitle>
                    <Button onClick={handleAddAddress} size="sm" variant="outline">
                      <HiPlus className="w-4 h-4 ml-2" />
                      הוסף כתובת
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <HiLocationMarker className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">אין כתובות שמורות</p>
                      <Button className="mt-4" variant="outline" onClick={handleAddAddress}>
                        הוסף כתובת
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address: any) => (
                        <div
                          key={address.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <HiLocationMarker className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold">
                                  {address.first_name} {address.last_name}
                                </span>
                              </div>
                              <p className="text-gray-700">
                                {address.address} {address.houseNumber}
                                {address.apartment && `, דירה ${address.apartment}`}
                                {address.floor && `, קומה ${address.floor}`}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {address.city} {address.zip && `, ${address.zip}`}
                              </p>
                              {address.phone && (
                                <p className="text-gray-600 text-sm">
                                  טלפון: {address.phone}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAddress(address)}
                              >
                                <HiPencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <HiTrash className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "wishlist" && (
              <WishlistSection storeSlug={storeSlug} />
            )}

            {activeTab === "returns" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>החזרות והחלפות</CardTitle>
                    <Button
                      onClick={() => {
                        // נציג רק הזמנות ששולמו
                        const paidOrders = orders.filter(o => o.status === "paid")
                        if (paidOrders.length === 0) {
                          toast({
                            title: "אין הזמנות זמינות",
                            description: "רק הזמנות ששולמו יכולות להיות מוחזרות",
                            variant: "destructive",
                          })
                          return
                        }
                        setReturnDialogOpen(true)
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <HiPlus className="w-4 h-4 ml-2" />
                      צור החזרה חדשה
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {returns.length === 0 ? (
                    <div className="text-center py-12">
                      <HiRefresh className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">אין החזרות או החלפות</p>
                      <Button
                        onClick={() => {
                          const paidOrders = orders.filter(o => o.status === "paid")
                          if (paidOrders.length === 0) {
                            toast({
                              title: "אין הזמנות זמינות",
                              description: "רק הזמנות ששולמו יכולות להיות מוחזרות",
                              variant: "destructive",
                            })
                            return
                          }
                          setReturnDialogOpen(true)
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <HiPlus className="w-4 h-4 ml-2" />
                        צור החזרה חדשה
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {returns.map((returnItem) => (
                        <div
                          key={returnItem.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <HiRefresh className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold">
                                  החזרה #{returnItem.id.toString().slice(-6)}
                                </span>
                                <Badge
                                  className={
                                    returnItem.status === "APPROVED" || returnItem.status === "COMPLETED"
                                      ? "bg-green-100 text-green-800"
                                      : returnItem.status === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {returnItem.status === "PENDING"
                                    ? "ממתין"
                                    : returnItem.status === "APPROVED"
                                    ? "אושר"
                                    : returnItem.status === "REJECTED"
                                    ? "נדחה"
                                    : returnItem.status === "PROCESSING"
                                    ? "בטיפול"
                                    : returnItem.status === "COMPLETED"
                                    ? "הושלם"
                                    : "בוטל"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <HiArchive className="w-4 h-4" />
                                  הזמנה #{returnItem.orderNumber || returnItem.order?.orderNumber || "N/A"}
                                </div>
                                <div className="flex items-center gap-1">
                                  <HiCalendar className="w-4 h-4" />
                                  {new Date(returnItem.createdAt).toLocaleDateString("he-IL")}
                                </div>
                                {returnItem.refundAmount && (
                                  <div className="flex items-center gap-1">
                                    <HiCurrencyDollar className="w-4 h-4" />
                                    ₪{returnItem.refundAmount.toFixed(2)}
                                  </div>
                                )}
                              </div>
                              {returnItem.reason && (
                                <p className="text-sm text-gray-500 mt-2">
                                  סיבה: {returnItem.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "credits" && (
              <Card>
                <CardHeader>
                  <CardTitle>קרדיט בחנות</CardTitle>
                </CardHeader>
                <CardContent>
                  {storeCredit ? (
                    <div className="space-y-6">
                      {/* יתרה נוכחית */}
                      <div className={`rounded-lg p-6 ${
                        storeCredit.balance > 0 
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200" 
                          : "bg-gray-50 border-2 border-gray-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm text-gray-600 mb-2 block">יתרה נוכחית</Label>
                            <p className={`text-4xl font-bold ${
                              storeCredit.balance > 0 
                                ? "text-blue-700" 
                                : "text-gray-500"
                            }`}>
                              ₪{storeCredit.balance.toFixed(2)}
                            </p>
                          </div>
                          <HiCurrencyDollar className={`w-16 h-16 ${
                            storeCredit.balance > 0 
                              ? "text-blue-500" 
                              : "text-gray-400"
                          }`} />
                        </div>
                        {storeCredit.expiresAt && (
                          <p className="text-sm text-gray-600 mt-4">
                            <HiCalendar className="w-4 h-4 inline ml-1" />
                            תאריך תפוגה: {new Date(storeCredit.expiresAt).toLocaleDateString("he-IL")}
                          </p>
                        )}
                        {storeCredit.reason && (
                          <p className="text-sm text-gray-600 mt-2">
                            סיבה: {storeCredit.reason}
                          </p>
                        )}
                      </div>

                      {/* היסטוריית קרדיט */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">היסטוריית קרדיט</h3>
                        <div className="space-y-3">
                          {/* נציג החזרות שהקרדיט נוצר מהן */}
                          {returns
                            .filter((r: any) => r.refundMethod === "STORE_CREDIT" && (r.status === "APPROVED" || r.status === "COMPLETED"))
                            .map((returnItem: any) => (
                              <div
                                key={returnItem.id}
                                className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <HiCurrencyDollar className="w-4 h-4 text-green-600" />
                                      <span className="font-semibold text-green-700">
                                        קרדיט מהחזרה #{returnItem.id.toString().slice(-6)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <HiCalendar className="w-4 h-4" />
                                        {new Date(returnItem.createdAt).toLocaleDateString("he-IL")}
                                      </div>
                                      {returnItem.refundAmount && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-green-700 font-semibold">
                                            +₪{returnItem.refundAmount.toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {(returnItem.orderNumber || returnItem.order?.orderNumber) && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        מהזמנה #{returnItem.orderNumber || returnItem.order?.orderNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          
                          {/* ✅ הצגת היסטוריית עסקאות אם יש */}
                          {storeCredit.transactions && storeCredit.transactions.length > 0 && (
                            <>
                              {storeCredit.transactions.map((transaction: any) => (
                                <div
                                  key={transaction.id}
                                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <HiCurrencyDollar className={`w-4 h-4 ${
                                          transaction.transactionType === 'earned' || transaction.transactionType === 'manual_adjustment'
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`} />
                                        <span className={`font-semibold ${
                                          transaction.transactionType === 'earned' || transaction.transactionType === 'manual_adjustment'
                                            ? "text-green-700"
                                            : "text-red-700"
                                        }`}>
                                          {transaction.transactionType === 'earned' ? 'צבירה' :
                                           transaction.transactionType === 'used' ? 'שימוש' :
                                           transaction.transactionType === 'refunded' ? 'החזר' :
                                           transaction.transactionType === 'expired' ? 'פג תוקף' :
                                           transaction.transactionType === 'manual_adjustment' ? 'עדכון ידני' : 'עסקה'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <HiCalendar className="w-4 h-4" />
                                          {new Date(transaction.createdAt).toLocaleDateString("he-IL")}
                                        </div>
                                        <div className={`flex items-center gap-1 font-semibold ${
                                          transaction.transactionType === 'earned' || transaction.transactionType === 'manual_adjustment'
                                            ? "text-green-700"
                                            : "text-red-700"
                                        }`}>
                                          {transaction.transactionType === 'earned' || transaction.transactionType === 'manual_adjustment' ? '+' : '-'}₪{Math.abs(transaction.amount).toFixed(2)}
                                        </div>
                                      </div>
                                      {transaction.description && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {transaction.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                          
                          {(!storeCredit.transactions || storeCredit.transactions.length === 0) && 
                           returns.filter((r: any) => r.refundMethod === "STORE_CREDIT" && (r.status === "APPROVED" || r.status === "COMPLETED")).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <HiCurrencyDollar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                              <p>אין היסטוריית קרדיט עדיין</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <HiCurrencyDollar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">אין קרדיט בחנות זמין</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? "ערוך כתובת" : "הוסף כתובת"}</DialogTitle>
            <DialogDescription>
              הזן את פרטי הכתובת למשלוח
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressFirstName">שם פרטי *</Label>
                <Input
                  id="addressFirstName"
                  value={addressForm.first_name}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLastName">שם משפחה</Label>
                <Input
                  id="addressLastName"
                  value={addressForm.last_name}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressCity">עיר *</Label>
                <Input
                  id="addressCity"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="הקלד עיר..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressZip">מיקוד</Label>
                <Input
                  id="addressZip"
                  value={addressForm.zip}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, zip: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressStreet">רחוב *</Label>
              <Input
                id="addressStreet"
                value={addressForm.address}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="הקלד רחוב..."
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="houseNumber">מספר בית *</Label>
                <Input
                  id="houseNumber"
                  value={addressForm.houseNumber}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, houseNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apartment">דירה</Label>
                <Input
                  id="apartment"
                  value={addressForm.apartment}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, apartment: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">קומה</Label>
                <Input
                  id="floor"
                  value={addressForm.floor}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, floor: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddressDialogOpen(false)}
              disabled={savingAddress}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveAddress}
              disabled={savingAddress}
            >
              {savingAddress ? "שומר..." : editingAddress ? "עדכן" : "הוסף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת חשבון</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את החשבון שלך? פעולה זו אינה ניתנת לביטול.
              כל הנתונים שלך, כולל הזמנות והיסטוריית רכישות, יימחקו לצמיתות.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? "מוחק..." : "מחק חשבון"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>צור החזרה חדשה</DialogTitle>
            <DialogDescription>
              בחר הזמנה ופריטים להחזרה
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-8 py-6">
            {/* בחירת הזמנה */}
            {!selectedOrderForReturn ? (
              <div className="space-y-2">
                <Label>בחר הזמנה</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orders
                    .filter(o => o.status === "paid")
                    .map((order: any) => {
                      // בדיקה אם יש החזרות מאושרות/הושלמות להזמנה הזו
                      const approvedReturns = returns.filter(
                        (r: any) => r.orderId === order.id && 
                        (r.status === "APPROVED" || r.status === "COMPLETED")
                      )
                      
                      // חישוב כמה כבר הוחזר מכל פריט
                      let allItemsFullyReturned = false
                      const orderItems = (order as any).items || []
                      
                      if (approvedReturns.length > 0) {
                        if (orderItems.length > 0) {
                          // יש items בהזמנה - נבדוק אם כל הפריטים הוחזרו במלואם
                          const returnedQuantities = new Map<number, number>()
                          for (const ret of approvedReturns) {
                            const retItems = (ret.items as Array<{ orderItemId: number; quantity: number }>) || []
                            for (const retItem of retItems) {
                              const currentQty = returnedQuantities.get(retItem.orderItemId) || 0
                              returnedQuantities.set(retItem.orderItemId, currentQty + retItem.quantity)
                            }
                          }
                          
                          // בדיקה אם כל הפריטים כבר הוחזרו במלואם
                          allItemsFullyReturned = orderItems.every((item: any) => {
                            const returnedQty = returnedQuantities.get(item.id) || 0
                            return returnedQty >= item.quantity
                          })
                        } else {
                          // אין items בהזמנה אבל יש החזרה מאושרת - נניח שהכל הוחזר
                          // (למקרה שההזמנה לא נטענה עם items)
                          allItemsFullyReturned = true
                        }
                      }
                      
                      return (
                        <div
                          key={order.id}
                          className={`border rounded-lg p-3 ${
                            allItemsFullyReturned 
                              ? "opacity-50 cursor-not-allowed bg-gray-100" 
                              : "cursor-pointer hover:bg-gray-50"
                          }`}
                          onClick={async () => {
                            if (allItemsFullyReturned) {
                              toast({
                                title: "לא ניתן להחזיר",
                                description: "כל הפריטים בהזמנה זו כבר הוחזרו במלואם",
                                variant: "destructive",
                              })
                              return
                            }
                            
                            setSelectedOrderForReturn(order)
                            // טעינת פרטי ההזמנה
                            try {
                              const token = localStorage.getItem(`storefront_token_${storeSlug}`)
                              const response = await fetch(`/api/storefront/${storeSlug}/orders/${order.id}`, {
                                headers: {
                                  "x-customer-id": token || "",
                                },
                              })
                              if (response.ok) {
                                const data = await response.json()
                                setOrderDetails(data)
                                // איפוס הטופס
                                setReturnForm({
                                  reason: "",
                                  notes: "",
                                  items: [],
                                })
                              }
                            } catch (error) {
                              console.error("Error fetching order details:", error)
                              toast({
                                title: "שגיאה",
                                description: "לא הצלחנו לטעון את פרטי ההזמנה",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">הזמנה #{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString("he-IL")} - ₪{order.total.toFixed(2)}
                              </p>
                              {allItemsFullyReturned && (
                                <p className="text-xs text-red-600 mt-1">
                                  כל הפריטים בהזמנה זו כבר הוחזרו במלואם
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ) : (
              <>
                {/* פרטי ההזמנה */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">הזמנה #{selectedOrderForReturn.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedOrderForReturn.createdAt).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOrderForReturn(null)
                        setOrderDetails(null)
                        setReturnForm({ reason: "", notes: "", items: [] })
                      }}
                    >
                      <HiX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* בחירת פריטים */}
                {orderDetails && (() => {
                  // חישוב כמה כבר הוחזר מכל פריט (מהחזרות מאושרות/הושלמות)
                  const returnedQuantities = new Map<number, number>()
                  const approvedReturns = returns.filter(
                    (r: any) => r.orderId === selectedOrderForReturn.id && 
                    (r.status === "APPROVED" || r.status === "COMPLETED")
                  )
                  
                  for (const ret of approvedReturns) {
                    const retItems = (ret.items as Array<{ orderItemId: number; quantity: number }>) || []
                    for (const retItem of retItems) {
                      const currentQty = returnedQuantities.get(retItem.orderItemId) || 0
                      returnedQuantities.set(retItem.orderItemId, currentQty + retItem.quantity)
                    }
                  }

                  // בדיקה אילו פריטים יש להם החזרה ממתינה (PENDING)
                  const pendingReturns = returns.filter(
                    (r: any) => r.orderId === selectedOrderForReturn.id && 
                    r.status === "PENDING"
                  )
                  
                  const pendingItemIds = new Set<number>()
                  for (const ret of pendingReturns) {
                    const retItems = (ret.items as Array<{ orderItemId: number; quantity: number }>) || []
                    for (const retItem of retItems) {
                      pendingItemIds.add(retItem.orderItemId)
                    }
                  }

                  return (
                    <div className="space-y-2">
                      <Label>בחר פריטים להחזרה</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {orderDetails.items.map((item: any) => {
                          const selectedItem = returnForm.items.find(i => i.orderItemId === item.id)
                          const selectedQty = selectedItem?.quantity || 0
                          const alreadyReturnedQty = returnedQuantities.get(item.id) || 0
                          const availableQty = item.quantity - alreadyReturnedQty
                          const isFullyReturned = alreadyReturnedQty >= item.quantity
                          const hasPendingReturn = pendingItemIds.has(item.id)
                          const isDisabled = isFullyReturned || hasPendingReturn
                          
                          return (
                            <div 
                              key={item.id} 
                              className={`border rounded-lg p-3 ${
                                isDisabled ? "opacity-50 bg-gray-50" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedQty > 0}
                                  disabled={isDisabled}
                                  onChange={(e) => {
                                    if (e.target.checked && !isDisabled) {
                                      setReturnForm(prev => ({
                                        ...prev,
                                        items: [...prev.items, { orderItemId: item.id, quantity: 1 }],
                                      }))
                                    } else {
                                      setReturnForm(prev => ({
                                        ...prev,
                                        items: prev.items.filter(i => i.orderItemId !== item.id),
                                      }))
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  {item.variant && (
                                    <p className="text-sm text-gray-600">{item.variant.name}</p>
                                  )}
                                  <p className="text-sm text-gray-600">
                                    כמות שהוזמנה: {item.quantity}
                                    {alreadyReturnedQty > 0 && (
                                      <span className="text-red-600"> (הוחזר: {alreadyReturnedQty})</span>
                                    )}
                                  </p>
                                  {hasPendingReturn && (
                                    <p className="text-xs text-orange-600 mt-1">
                                      יש בקשת החזרה ממתינה לפריט זה
                                    </p>
                                  )}
                                  {isFullyReturned && !hasPendingReturn && (
                                    <p className="text-xs text-red-600 mt-1">
                                      פריט זה כבר הוחזר במלואו
                                    </p>
                                  )}
                                  {selectedQty > 0 && !isDisabled && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <Label className="text-sm">כמות להחזרה:</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max={availableQty}
                                        value={selectedQty}
                                        onChange={(e) => {
                                          const inputValue = e.target.value
                                          if (inputValue === "") {
                                            // אפשר למחוק את הערך
                                            setReturnForm(prev => ({
                                              ...prev,
                                              items: prev.items.filter(i => i.orderItemId !== item.id),
                                            }))
                                            return
                                          }
                                          const qty = parseInt(inputValue)
                                          if (!isNaN(qty) && qty > 0 && qty <= availableQty) {
                                            setReturnForm(prev => ({
                                              ...prev,
                                              items: prev.items.map(i =>
                                                i.orderItemId === item.id ? { ...i, quantity: qty } : i
                                              ),
                                            }))
                                          }
                                        }}
                                        className="w-20"
                                      />
                                      {availableQty < item.quantity && (
                                        <span className="text-xs text-gray-500">
                                          (זמין: {availableQty})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* סיבת ההחזרה */}
                <div className="space-y-2">
                  <Label htmlFor="returnReason">סיבת ההחזרה *</Label>
                  <select
                    id="returnReason"
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">בחר סיבה</option>
                    <option value="לא מתאים">לא מתאים</option>
                    <option value="פגם במוצר">פגם במוצר</option>
                    <option value="שינוי דעה">שינוי דעה</option>
                    <option value="נשלח מוצר שגוי">נשלח מוצר שגוי</option>
                    <option value="אחר">אחר</option>
                  </select>
                </div>

                {/* הערות */}
                <div className="space-y-2">
                  <Label htmlFor="returnNotes">הערות (אופציונלי)</Label>
                  <Textarea
                    id="returnNotes"
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReturnDialogOpen(false)
                setSelectedOrderForReturn(null)
                setOrderDetails(null)
                setReturnForm({ reason: "", notes: "", items: [] })
              }}
              disabled={creatingReturn}
            >
              ביטול
            </Button>
            {selectedOrderForReturn && (
              <Button
                onClick={async () => {
                  if (!returnForm.reason || returnForm.items.length === 0) {
                    toast({
                      title: "שגיאה",
                      description: "אנא בחר סיבת החזרה ולפחות פריט אחד",
                      variant: "destructive",
                    })
                    return
                  }

                  setCreatingReturn(true)
                  try {
                    const token = localStorage.getItem(`storefront_token_${storeSlug}`)
                    const response = await fetch(`/api/storefront/${storeSlug}/returns`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-customer-id": token || "",
                      },
                      body: JSON.stringify({
                        orderId: selectedOrderForReturn.id,
                        reason: returnForm.reason,
                        items: returnForm.items,
                        notes: returnForm.notes || undefined,
                      }),
                    })

                    if (response.ok) {
                      toast({
                        title: "הצלחה",
                        description: "החזרה נוצרה בהצלחה",
                      })
                      setReturnDialogOpen(false)
                      setSelectedOrderForReturn(null)
                      setOrderDetails(null)
                      setReturnForm({ reason: "", notes: "", items: [] })
                      // רענון רשימת החזרות
                      if (customer) {
                        fetchReturns(customer.id)
                      }
                    } else {
                      const error = await response.json()
                      toast({
                        title: "שגיאה",
                        description: error.error || "אירעה שגיאה ביצירת החזרה",
                        variant: "destructive",
                      })
                    }
                  } catch (error) {
                    console.error("Error creating return:", error)
                    toast({
                      title: "שגיאה",
                      description: "אירעה שגיאה ביצירת החזרה",
                      variant: "destructive",
                    })
                  } finally {
                    setCreatingReturn(false)
                  }
                }}
                disabled={creatingReturn || !returnForm.reason || returnForm.items.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {creatingReturn ? "יוצר..." : "צור החזרה"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} {store?.name || "חנות"}. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Wishlist Section Component
function WishlistSection({ storeSlug }: { storeSlug: string }) {
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    await removeFromWishlist(productId);
    setRemovingId(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>רשימת משאלות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>רשימת משאלות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <HiHeart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">רשימת המשאלות שלך ריקה</p>
            <Link href={`/shops/${storeSlug}`}>
              <Button className="mt-4 bg-green-500 hover:bg-green-600 text-white">
                המשך לקניות
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>רשימת משאלות ({wishlistItems.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <div 
              key={item.id} 
              className="border rounded-lg overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <Link href={`/shops/${storeSlug}/products/${item.product_handle}`}>
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.product_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <HiShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </Link>
              
              <div className="p-3">
                <Link href={`/shops/${storeSlug}/products/${item.product_handle}`}>
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-green-600 transition-colors">
                    {item.product_title}
                  </h3>
                </Link>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(item.price)}
                    </span>
                    {item.compare_price && item.compare_price > item.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(item.compare_price)}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    disabled={removingId === item.product_id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    aria-label="הסר מרשימת המשאלות"
                  >
                    {removingId === item.product_id ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiTrash className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

