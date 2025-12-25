"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import { useOptimisticToast } from "@/hooks/useOptimisticToast"
import {
  HiArrowRight,
  HiShoppingBag,
  HiTruck,
  HiCurrencyDollar,
  HiCalendar,
  HiLocationMarker,
  HiPhone,
  HiMail,
  HiRefresh,
  HiExternalLink,
  HiCheckCircle,
  HiClock,
  HiXCircle,
} from "react-icons/hi"
import Link from "next/link"
import { OrderDetailsContent } from "@/components/orders/OrderDetailsContent"
import { OrderWithDetails } from "@/types/order"

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
  variant?: string | null
  image?: string
  discount?: number | null
}

interface ShippingAddress {
  first_name?: string
  last_name?: string
  firstName?: string
  lastName?: string
  address1?: string
  address?: string
  city?: string
  zip?: string
  phone?: string
}

interface TrackingEvent {
  date: string
  description: string
  location?: string
}

interface TrackingStatus {
  status: string
  statusText?: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  events?: TrackingEvent[]
}

interface Fulfillment {
  id: number
  status: string
  trackingNumber?: string
  trackingCompany?: string
  trackingUrl?: string
  createdAt: string
}

interface Order {
  id: number
  orderNumber: number
  orderName?: string
  status: string
  fulfillmentStatus?: string
  total: number
  subtotal?: number | null
  shipping?: number | null
  discounts?: number | null
  tax?: number | null
  createdAt: string
  items: OrderItem[]
  shippingAddress?: ShippingAddress | null
  billingAddress?: ShippingAddress | null
  fulfillments?: Fulfillment[]
  notes?: string
  noteAttributes?: any
  discountCodes?: string[]
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useOptimisticToast()
  const storeSlug = params.storeSlug as string
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null)
  const [loadingTracking, setLoadingTracking] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem(`storefront_token_${storeSlug}`)
      
      if (!token) {
        router.push(`/shops/${storeSlug}/login`)
        return
      }

      const response = await fetch(`/api/storefront/${storeSlug}/orders/${orderId}`, {
        headers: {
          "x-customer-id": token,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push(`/shops/${storeSlug}/login`)
          return
        }
        throw new Error("Failed to load order")
      }

      const data = await response.json()
      setOrder(data)

      // ✅ המרת הנתונים ל-OrderWithDetails לשימוש ב-OrderDetailsContent
      const orderWithDetails: OrderWithDetails = {
        id: data.id,
        store_id: 0, // לא נדרש באזור אישי
        customer_id: null,
        email: null, // לא נדרש באזור אישי
        phone: data.shippingAddress?.phone || null,
        name: ((data.shippingAddress?.first_name || data.shippingAddress?.firstName || '') + ' ' + (data.shippingAddress?.last_name || data.shippingAddress?.lastName || '')).trim() || null,
        order_number: data.orderNumber,
        order_name: data.orderName || `#${data.orderNumber}`,
        order_handle: null,
        financial_status: data.status as any,
        fulfillment_status: data.fulfillmentStatus || null,
        total_price: data.total.toString(),
        subtotal_price: data.subtotal?.toString() || null,
        total_tax: data.tax?.toString() || '0',
        total_discounts: data.discounts?.toString() || '0',
        total_shipping_price: data.shipping?.toString() || '0',
        currency: 'ILS',
        current_total_discounts: null,
        current_total_price: null,
        current_subtotal_price: null,
        current_total_tax: null,
        buyer_accepts_marketing: false,
        cancel_reason: null,
        cancelled_at: null,
        cart_token: null,
        checkout_token: null,
        checkout_id: null,
        client_details: null,
        closed_at: null,
        confirmed: true,
        contact_email: null,
        discount_codes: data.discountCodes || null,
        gateway: null,
        landing_site: null,
        landing_site_ref: null,
        location_id: null,
        note: null,
        note_attributes: data.noteAttributes || null,
        number: null,
        processed_at: null,
        referring_site: null,
        source_name: null,
        tags: null,
        test: false,
        token: null,
        total_duties: null,
        total_line_items_price: null,
        total_outstanding: null,
        total_price_usd: null,
        total_weight: null,
        user_id: null,
        billing_address: data.billingAddress || null,
        shipping_address: data.shippingAddress || null,
        is_read: false,
        created_at: new Date(data.createdAt),
        updated_at: new Date(data.createdAt),
        line_items: data.items?.map((item: any) => ({
          id: item.id,
          order_id: data.id,
          product_id: null,
          variant_id: null,
          title: item.name,
          variant_title: item.variant || null,
          vendor: null,
          product_exists: true,
          quantity: item.quantity,
          sku: null,
          variant_inventory_management: null,
          fulfillment_service: null,
          fulfillment_status: null,
          requires_shipping: true,
          taxable: true,
          gift_card: false,
          name: item.name,
          variant_inventory_quantity: null,
          properties: null,
          product_properties: null,
          total_discount: item.discount?.toString() || '0',
          price: item.price.toString(),
          grams: null,
          tax_lines: null,
          duties: null,
          discount_allocations: null,
          image: item.image || null,
          created_at: new Date(data.createdAt),
          updated_at: new Date(data.createdAt),
        })) || [],
        fulfillments: data.fulfillments?.map((f: Fulfillment) => ({
          id: f.id,
          order_id: data.id,
          status: f.status as any,
          created_at: new Date(f.createdAt),
          updated_at: new Date(f.createdAt),
          tracking_company: f.trackingCompany || null,
          tracking_number: f.trackingNumber || null,
          tracking_url: f.trackingUrl || null,
          line_items: [],
        })) || [],
        refunds: [],
        customer: null,
      };
      setOrderForDetails(orderWithDetails);

      // Load tracking status if order has fulfillments with tracking
      const hasTracking = data.fulfillments?.some((f: Fulfillment) => f.trackingNumber)
      if (hasTracking) {
        fetchTrackingStatus()
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את פרטי ההזמנה",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTrackingStatus = async () => {
    setLoadingTracking(true)
    try {
      const response = await fetch(`/api/shipments/track-public?orderId=${orderId}&storeSlug=${storeSlug}`)

      if (response.ok) {
        const data = await response.json()
        if (data.shipment || data.tracking) {
          setTrackingStatus({
            status: data.tracking?.status || data.shipment?.status || "unknown",
            statusText: data.tracking?.statusText || "",
            trackingNumber: data.shipment?.tracking_number,
            trackingUrl: data.shipment?.tracking_url,
            estimatedDelivery: data.tracking?.estimatedDelivery,
            events: data.tracking?.events || [],
          })
        }
      }
    } catch (error) {
      console.error("Error fetching tracking:", error)
    } finally {
      setLoadingTracking(false)
    }
  }

  const getStatusText = (status: string) => {
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

  const getStatusColor = (status: string) => {
    if (status === "voided" || status === "refunded") {
      return "bg-red-100 text-red-700 border-red-200"
    }
    if (status === "paid") {
      return "bg-green-100 text-green-700 border-green-200"
    }
    if (status === "pending") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    }
    return "bg-blue-100 text-blue-700 border-blue-200"
  }

  const getFulfillmentStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      unfulfilled: "לא נשלח",
      partial: "נשלח חלקית",
      fulfilled: "נשלח",
      restocked: "הוחזר למלאי",
    }
    return statusMap[status.toLowerCase()] || status
  }

  const getFulfillmentStatusColor = (status: string) => {
    if (status === "fulfilled") {
      return "bg-green-100 text-green-700"
    }
    if (status === "partial") {
      return "bg-yellow-100 text-yellow-700"
    }
    if (status === "unfulfilled") {
      return "bg-gray-100 text-gray-700"
    }
    return "bg-blue-100 text-blue-700"
  }

  const getTrackingStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "ממתין לאיסוף",
      sent: "נשלח",
      in_transit: "בדרך אליך",
      out_for_delivery: "יוצא למשלוח",
      delivered: "נמסר",
      cancelled: "בוטל",
      failed: "נכשל",
      returned: "הוחזר",
    }
    return statusMap[status] || status
  }

  const getTrackingStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      sent: "bg-blue-100 text-blue-700",
      in_transit: "bg-purple-100 text-purple-700",
      out_for_delivery: "bg-cyan-100 text-cyan-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      failed: "bg-red-100 text-red-700",
      returned: "bg-orange-100 text-orange-700",
    }
    return colorMap[status] || "bg-gray-100 text-gray-700"
  }

  const getTrackingIcon = (status: string) => {
    if (status === "delivered") return <HiCheckCircle className="w-6 h-6 text-green-500" />
    if (status === "cancelled" || status === "failed") return <HiXCircle className="w-6 h-6 text-red-500" />
    return <HiClock className="w-6 h-6 text-blue-500" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <HiShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">ההזמנה לא נמצאה</h1>
          <Link href={`/shops/${storeSlug}/account`}>
            <Button className="mt-4">חזרה לחשבון שלי</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/shops/${storeSlug}/account`}>
            <Button variant="outline" size="sm">
              <HiArrowRight className="w-4 h-4 ml-2" />
              חזרה לחשבון שלי
            </Button>
          </Link>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                הזמנה #{order.orderNumber}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <HiCalendar className="w-4 h-4" />
                <span>{new Date(order.createdAt).toLocaleDateString("he-IL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
              {order.fulfillmentStatus && (
                <Badge className={getFulfillmentStatusColor(order.fulfillmentStatus)}>
                  {getFulfillmentStatusText(order.fulfillmentStatus)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tracking Status */}
        {(order.fulfillments?.some(f => f.trackingNumber) || trackingStatus) && (
          <Card className="mb-6 border-2 border-blue-100">
            <CardHeader className="bg-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HiTruck className="w-5 h-5 text-blue-600" />
                  מעקב משלוח
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTrackingStatus}
                  disabled={loadingTracking}
                >
                  <HiRefresh className={`w-4 h-4 ml-2 ${loadingTracking ? "animate-spin" : ""}`} />
                  רענון
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {trackingStatus ? (
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {getTrackingIcon(trackingStatus.status)}
                    <div className="flex-1">
                      <Badge className={getTrackingStatusColor(trackingStatus.status)}>
                        {getTrackingStatusText(trackingStatus.status)}
                      </Badge>
                      {trackingStatus.statusText && (
                        <p className="text-sm text-gray-600 mt-1">{trackingStatus.statusText}</p>
                      )}
                      {trackingStatus.estimatedDelivery && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>מועד משלוח משוער:</strong> {new Date(trackingStatus.estimatedDelivery).toLocaleDateString("he-IL")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tracking Number */}
                  {trackingStatus.trackingNumber && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">מספר מעקב</p>
                        <p className="font-mono font-semibold">{trackingStatus.trackingNumber}</p>
                      </div>
                      {trackingStatus.trackingUrl && (
                        <a
                          href={trackingStatus.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <span>עקוב באתר השליח</span>
                          <HiExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Tracking Events Timeline */}
                  {trackingStatus.events && trackingStatus.events.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">היסטוריית משלוח</h3>
                      <div className="relative">
                        <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                        <div className="space-y-4">
                          {trackingStatus.events.map((event, index) => {
                            let eventDate: Date
                            try {
                              eventDate = new Date(event.date)
                              if (isNaN(eventDate.getTime())) {
                                eventDate = new Date()
                              }
                            } catch {
                              eventDate = new Date()
                            }

                            return (
                              <div key={index} className="flex items-start gap-4 relative">
                                <div className={`w-4 h-4 rounded-full z-10 ${
                                  index === 0 ? "bg-blue-500" : "bg-gray-300"
                                }`} />
                                <div className="flex-1 pb-4">
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.description || "עדכון משלוח"}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {eventDate.toLocaleDateString("he-IL")} {eventDate.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                                    {event.location && ` • ${event.location}`}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HiTruck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>מידע מעקב לא זמין עדיין</p>
                  {order.fulfillments?.map(f => f.trackingNumber).filter(Boolean)[0] && (
                    <p className="text-sm mt-2">מספר מעקב: {order.fulfillments?.map(f => f.trackingNumber).filter(Boolean)[0]}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ✅ שימוש בקומפוננטה משותפת OrderDetailsContent */}
        {orderForDetails && (
          <div className="mb-6">
            <OrderDetailsContent order={orderForDetails} />
          </div>
        )}

        {/* Order Notes */}
        {order.notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>הערות להזמנה</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href={`/shops/${storeSlug}/account`} className="flex-1">
            <Button variant="outline" className="w-full">
              חזרה לחשבון שלי
            </Button>
          </Link>
          <Link href={`/shops/${storeSlug}`} className="flex-1">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
              המשך קניות
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

