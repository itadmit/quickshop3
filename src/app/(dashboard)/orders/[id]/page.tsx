'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { 
  HiArrowRight, 
  HiCheckCircle, 
  HiXCircle,
  HiClock,
  HiPrinter,
  HiMail,
  HiRefresh,
  HiBan,
  HiDotsVertical,
  HiExclamationCircle,
  HiPencil
} from 'react-icons/hi';
import { OrderWithDetails } from '@/types/order';
import { OrderTimeline } from '@/components/orders/OrderTimeline';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [showFraudDialog, setShowFraudDialog] = useState(false);
  const [fraudReason, setFraudReason] = useState('');
  const [riskLevel, setRiskLevel] = useState<'fraud' | 'risk' | 'high-risk' | 'none'>('none');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipment, setShipment] = useState<any>(null);
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    if (orderId) {
      const abortController = new AbortController();
      const signal = abortController.signal;

      loadOrder(signal);

      return () => {
        abortController.abort();
      };
    }
  }, [orderId]);

  const loadOrder = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load order');
      const data = await response.json();
      setOrder(data.order);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading order:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const updateStatus = async (financialStatus?: string, fulfillmentStatus?: string) => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          financial_status: financialStatus,
          fulfillment_status: fulfillmentStatus,
        }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      await loadOrder();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('שגיאה בעדכון הסטטוס');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const createRefund = async () => {
    if (!confirm('האם אתה בטוח שברצונך להחזיר את ההזמנה? זה יזכה את העסקה בחברת הסליקה.')) return;
    
    try {
      setProcessingRefund(true);
      
      // Try the new payment refund API first
      const paymentResponse = await fetch(`/api/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          reason: 'ביטול הזמנה מדשבורד',
        }),
      });

      if (paymentResponse.ok) {
        const data = await paymentResponse.json();
        if (data.success) {
          await loadOrder();
          alert(`ההחזר בוצע בהצלחה! סכום: ₪${data.amount}`);
          return;
        }
      }

      // Fallback to the old refund API
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to create refund');
      await loadOrder();
      alert('ההחזר בוצע בהצלחה (עדכון סטטוס בלבד)');
    } catch (error) {
      console.error('Error creating refund:', error);
      alert('שגיאה ביצירת החזר');
    } finally {
      setProcessingRefund(false);
    }
  };

  const createShipment = async () => {
    if (!confirm('האם לשלוח את ההזמנה לחברת השליחויות?')) return;
    
    try {
      setCreatingShipment(true);
      const response = await fetch(`/api/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: parseInt(orderId),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create shipment');
      }

      if (data.results && data.results[0]) {
        if (data.results[0].success) {
          setShipment(data.results[0].shipment);
          await loadOrder();
          alert(`משלוח נוצר בהצלחה! מספר מעקב: ${data.results[0].shipment?.tracking_number || 'לא זמין'}`);
        } else {
          throw new Error(data.results[0].error || 'Failed to create shipment');
        }
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      alert(error.message || 'שגיאה ביצירת משלוח');
    } finally {
      setCreatingShipment(false);
    }
  };

  const loadShipmentInfo = async () => {
    try {
      const response = await fetch(`/api/shipments?orderId=${orderId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.shipments && data.shipments.length > 0) {
          setShipment(data.shipments[0]);
        }
      }
    } catch (error) {
      console.error('Error loading shipment:', error);
    }
  };

  // Load shipment info when order loads
  useEffect(() => {
    if (order && orderId) {
      loadShipmentInfo();
    }
  }, [order?.id]);

  const sendReceipt = async () => {
    if (!order?.email) {
      alert('להזמנה אין כתובת אימייל');
      return;
    }

    if (!confirm(`האם לשלוח קבלה/חשבונית ל-${order.email}?`)) return;

    try {
      setSendingReceipt(true);
      const response = await fetch(`/api/orders/${orderId}/send-receipt`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send receipt');
      }

      const data = await response.json();
      alert(`קבלה נשלחה בהצלחה ל-${order.email}`);
    } catch (error: any) {
      console.error('Error sending receipt:', error);
      alert(error.message || 'שגיאה בשליחת קבלה');
    } finally {
      setSendingReceipt(false);
    }
  };

  const markAsFraud = async () => {
    if (!fraudReason.trim()) {
      alert('נא להזין סיבה');
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/orders/${orderId}/mark-fraud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          risk_level: riskLevel,
          reason: fraudReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark as fraud');
      }

      await loadOrder();
      setShowFraudDialog(false);
      setFraudReason('');
      setRiskLevel('none');
      alert('ההזמנה סומנה בהצלחה');
    } catch (error: any) {
      console.error('Error marking as fraud:', error);
      alert(error.message || 'שגיאה בסימון ההזמנה');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isFraudOrRisk = () => {
    if (!order?.tags) return false;
    const tags = order.tags.toLowerCase();
    return tags.includes('fraud') || tags.includes('risk') || tags.includes('high-risk');
  };

  const getFulfillmentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-cyan-100 text-cyan-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'restocked':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'ממתין',
      'approved': 'מאושר',
      'paid': 'שולם',
      'processing': 'מעובד',
      'shipped': 'נשלח',
      'delivered': 'נמסר',
      'canceled': 'בוטל',
      'returned': 'הוחזר',
      'fulfilled': 'בוצע',
      'partial': 'חלקי',
      'restocked': 'הוחזר למלאי',
    };
    return labels[status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
      case 'voided':
        return 'bg-red-100 text-red-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-20 bg-gray-200 rounded"></div>
              <div className="h-10 w-20 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Status Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <p className="text-gray-500">הזמנה לא נמצאה</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-after: always;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {order.order_name || `#${order.order_number || order.id}`}
              </h1>
              {/* Payment method badges */}
              {(order as any).note_attributes?.payment_method === 'bank_transfer' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  העברה בנקאית
                </span>
              )}
              {(order as any).note_attributes?.payment_method === 'cash' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                  מזומן
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              נוצר ב-{new Date(order.created_at).toLocaleString('he-IL')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            חזרה
          </Button>
          <Button 
            variant="ghost"
            onClick={() => {
              window.print();
            }}
          >
            <HiPrinter className="w-5 h-5" />
            הדפס
          </Button>
          <Button 
            variant="ghost"
            onClick={sendReceipt}
            disabled={sendingReceipt || !order?.email}
          >
            <HiMail className="w-5 h-5" />
            {sendingReceipt ? 'שולח...' : 'שלח קבלה'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-2">סטטוס תשלום</div>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusBadgeColor(order.financial_status)}`}>
                {order.financial_status === 'paid' ? 'שולם' :
                 order.financial_status === 'pending' ? 'ממתין לתשלום' :
                 order.financial_status === 'refunded' ? 'הוחזר' :
                 order.financial_status === 'voided' ? 'בוטל' :
                 order.financial_status}
              </span>
              {order.financial_status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => updateStatus('paid')}
                  disabled={updatingStatus}
                >
                  סמן כשולם
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-2">סטטוס ביצוע</div>
            <div className="flex items-center justify-between">
              {order.fulfillment_status ? (
                <span className={`px-3 py-1 rounded text-sm font-medium ${getFulfillmentStatusBadgeColor(order.fulfillment_status)}`}>
                  {getFulfillmentStatusLabel(order.fulfillment_status)}
                </span>
              ) : (
                <span className="text-gray-400 text-sm">לא בוצע</span>
              )}
              {order.fulfillment_status !== 'fulfilled' && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(undefined, 'fulfilled')}
                  disabled={updatingStatus}
                >
                  סמן כבוצע
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">פריטי הזמנה</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="no-print"
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        ...editData,
                        line_items: order.line_items?.map(item => ({
                          id: item.id,
                          quantity: item.quantity,
                          price: item.price,
                        })) || [],
                      });
                    }}
                  >
                    <HiPencil className="w-4 h-4 ml-1" />
                    ערוך
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {order.line_items?.map((item) => {
                  // Filter out "Default Title" from variant_title and title
                  const variantTitle = item.variant_title && item.variant_title !== 'Default Title' 
                    ? item.variant_title 
                    : null;
                  
                  // Remove "Default Title" from product title if it's appended
                  let productTitle = item.title || '';
                  if (productTitle.includes('Default Title')) {
                    productTitle = productTitle.replace(/ - Default Title/g, '').replace(/Default Title - /g, '').replace(/Default Title/g, '').trim();
                  }
                  
                  // Get image from item.image or from properties
                  const itemImage = (item as any).image || null;
                  
                  const isEditingItem = isEditing && editData.line_items?.find((li: any) => li.id === item.id);
                  
                  return (
                    <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                      {/* Image - Always show placeholder if no image */}
                      <div className="w-16 h-16 flex-shrink-0 relative">
                        {itemImage ? (
                          <img
                            src={itemImage}
                            alt={productTitle}
                            className="w-full h-full object-cover rounded border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-gray-100 rounded flex items-center justify-center ${itemImage ? 'hidden' : ''}`}>
                          <span className="text-gray-400 text-xs">תמונה</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditingItem ? (
                          <div className="space-y-2">
                            <div className="font-medium text-gray-900">{productTitle}</div>
                            {variantTitle && (
                              <div className="text-sm text-gray-500">{variantTitle}</div>
                            )}
                            <div className="flex gap-2 items-center">
                              <div className="flex-1">
                                <Label className="text-xs">כמות</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={isEditingItem.quantity}
                                  onChange={(e) => {
                                    const newLineItems = editData.line_items.map((li: any) => 
                                      li.id === item.id 
                                        ? { ...li, quantity: parseInt(e.target.value) || 1 }
                                        : li
                                    );
                                    setEditData({ ...editData, line_items: newLineItems });
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs">מחיר</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={isEditingItem.price}
                                  onChange={(e) => {
                                    const newLineItems = editData.line_items.map((li: any) => 
                                      li.id === item.id 
                                        ? { ...li, price: e.target.value }
                                        : li
                                    );
                                    setEditData({ ...editData, line_items: newLineItems });
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-gray-900">{productTitle}</div>
                            {variantTitle && (
                              <div className="text-sm text-gray-500">{variantTitle}</div>
                            )}
                            {item.sku && (
                              <div className="text-xs text-gray-400 mt-1">מקט: {item.sku}</div>
                            )}
                          </>
                        )}
                      </div>
                      {!isEditingItem && (
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {item.quantity} × ₪{parseFloat(item.price).toLocaleString('he-IL')}
                          </div>
                          <div className="text-sm text-gray-500">
                            ₪{(parseFloat(item.price) * item.quantity).toLocaleString('he-IL')}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isEditing && editData.line_items && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200 no-print">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          setSaving(true);
                          const response = await fetch(`/api/orders/${orderId}/line-items`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              line_items: editData.line_items,
                            }),
                          });
                          if (!response.ok) throw new Error('Failed to update');
                          await loadOrder();
                          setIsEditing(false);
                          setEditData({});
                        } catch (error) {
                          console.error('Error updating line items:', error);
                          alert('שגיאה בעדכון פריטי ההזמנה');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      שמור שינויים
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">סה"כ ביניים</span>
                  <span className="text-gray-900">₪{parseFloat(order.subtotal_price || '0').toLocaleString('he-IL')}</span>
                </div>
                {parseFloat(order.total_shipping_price || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      משלוח
                      {(order as any).note_attributes?.shipping_method_name && (
                        <span className="mr-1 text-xs text-gray-500">
                          ({(order as any).note_attributes.shipping_method_name})
                        </span>
                      )}
                    </span>
                    <span className="text-gray-900">₪{parseFloat(order.total_shipping_price || '0').toLocaleString('he-IL')}</span>
                  </div>
                )}
                {parseFloat(order.total_shipping_price || '0') === 0 && (order as any).note_attributes?.shipping_method_name && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      משלוח ({(order as any).note_attributes.shipping_method_name})
                    </span>
                    <span>חינם</span>
                  </div>
                )}
                {parseFloat(order.total_tax || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">מס</span>
                    <span className="text-gray-900">₪{parseFloat(order.total_tax || '0').toLocaleString('he-IL')}</span>
                  </div>
                )}
                {parseFloat(order.total_discounts || '0') > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      {order.discount_codes && order.discount_codes.length > 0 
                        ? `קופון: ${Array.isArray(order.discount_codes) 
                            ? order.discount_codes.join(', ')
                            : typeof order.discount_codes === 'string' 
                              ? JSON.parse(order.discount_codes).join(', ')
                              : ''}`
                        : 'הנחה אוטומטית'}
                    </span>
                    <span>-₪{parseFloat(order.total_discounts || '0').toLocaleString('he-IL')}</span>
                  </div>
                )}
                {/* הצגת קודי קופון גם אם אין הנחה כספית (למשל משלוח חינם) */}
                {order.discount_codes && order.discount_codes.length > 0 && parseFloat(order.total_discounts || '0') === 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>קופון: {Array.isArray(order.discount_codes) 
                      ? order.discount_codes.join(', ')
                      : typeof order.discount_codes === 'string' 
                        ? JSON.parse(order.discount_codes).join(', ')
                        : ''}</span>
                    <span>משלוח חינם</span>
                  </div>
                )}
                {/* גיפט קארד */}
                {(order as any).note_attributes?.gift_card_amount > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>גיפט קארד: {(order as any).note_attributes.gift_card_code}</span>
                    <span>-₪{parseFloat((order as any).note_attributes.gift_card_amount || '0').toLocaleString('he-IL')}</span>
                  </div>
                )}
                {/* קרדיט בחנות */}
                {(order as any).note_attributes?.store_credit_amount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>קרדיט בחנות</span>
                    <span>-₪{parseFloat((order as any).note_attributes.store_credit_amount || '0').toLocaleString('he-IL')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>סה"כ</span>
                  <span>₪{parseFloat(order.total_price).toLocaleString('he-IL')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Fulfillments */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ביצועים</h2>
              {order.fulfillments && order.fulfillments.length > 0 ? (
                <div className="space-y-4">
                  {order.fulfillments.map((fulfillment) => (
                    <div key={fulfillment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getFulfillmentStatusBadgeColor(fulfillment.status)}`}>
                          {fulfillment.status === 'success' ? 'בוצע' :
                           fulfillment.status === 'pending' ? 'ממתין' :
                           fulfillment.status === 'open' ? 'פתוח' :
                           fulfillment.status === 'cancelled' ? 'בוטל' :
                           fulfillment.status === 'error' ? 'שגיאה' :
                           fulfillment.status === 'failure' ? 'נכשל' :
                           'בוצע'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(fulfillment.created_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      {fulfillment.tracking_number && (
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">מספר מעקב:</span> {fulfillment.tracking_number}
                        </div>
                      )}
                      {fulfillment.tracking_url && (
                        <a
                          href={fulfillment.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-700 mt-1 block"
                        >
                          צפה במעקב →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  אין ביצועים להצגה
                </div>
              )}
            </div>
          </Card>

          {/* Refunds */}
          {order.refunds && order.refunds.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">החזרים</h2>
                <div className="space-y-4">
                  {order.refunds.map((refund) => (
                    <div key={refund.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          הוחזר
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(refund.created_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      {refund.note && (
                        <div className="text-sm text-gray-600 mt-2">{refund.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">לקוח</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="no-print"
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        name: order.name || '',
                        email: order.email || '',
                        phone: order.phone || '',
                      });
                    }}
                  >
                    <HiPencil className="w-4 h-4 ml-1" />
                    ערוך
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>שם</Label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>אימייל</Label>
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>טלפון</Label>
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 no-print">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          setSaving(true);
                          const response = await fetch(`/api/orders/${orderId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              name: editData.name,
                              email: editData.email,
                              phone: editData.phone,
                            }),
                          });
                          if (!response.ok) throw new Error('Failed to update');
                          await loadOrder();
                          setIsEditing(false);
                          setEditData({});
                        } catch (error) {
                          console.error('Error updating order:', error);
                          alert('שגיאה בעדכון ההזמנה');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      שמור
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-500">שם</div>
                    <div className="font-medium text-gray-900">
                      {order.name || order.customer?.first_name || 'לקוח אורח'}
                    </div>
                  </div>
                  {order.email && (
                    <div>
                      <div className="text-sm text-gray-500">אימייל</div>
                      <div className="text-gray-900">{order.email}</div>
                    </div>
                  )}
                  {order.phone && (
                    <div>
                      <div className="text-sm text-gray-500">טלפון</div>
                      <div className="text-gray-900">{order.phone}</div>
                    </div>
                  )}
                  {order.customer_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => router.push(`/customers/${order.customer_id}`)}
                    >
                      צפה בפרופיל הלקוח
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Payment Info */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">פרטי תשלום</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="no-print"
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        ...editData,
                        gateway: order.gateway || '',
                        payment_method: (order as any).note_attributes?.payment_method || order.gateway || '',
                      });
                    }}
                  >
                    <HiPencil className="w-4 h-4 ml-1" />
                    ערוך
                  </Button>
                )}
              </div>
              {isEditing && editData.gateway !== undefined ? (
                <div className="space-y-4">
                  <div>
                    <Label>שיטת תשלום / אמצעי תשלום</Label>
                    <Select
                      value={editData.gateway || editData.payment_method || 'credit_card'}
                      onValueChange={(value) => setEditData({ ...editData, gateway: value, payment_method: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                        <SelectItem value="cash_on_delivery">מזומן בעת המשלוח</SelectItem>
                        <SelectItem value="cash">מזומן</SelectItem>
                        <SelectItem value="store_credit">קרדיט בחנות</SelectItem>
                        <SelectItem value="bit">ביט</SelectItem>
                        <SelectItem value="other">אחר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 no-print">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          setSaving(true);
                          const noteAttributes = (order as any).note_attributes || {};
                          noteAttributes.payment_method = editData.payment_method || editData.gateway;
                          
                          const response = await fetch(`/api/orders/${orderId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              gateway: editData.gateway,
                              note_attributes: noteAttributes,
                            }),
                          });
                          if (!response.ok) throw new Error('Failed to update');
                          await loadOrder();
                          setIsEditing(false);
                          setEditData({});
                        } catch (error) {
                          console.error('Error updating order:', error);
                          alert('שגיאה בעדכון ההזמנה');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      שמור
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">שיטת תשלום / אמצעי תשלום</div>
                    <div className="font-medium text-gray-900">
                      {(order as any).note_attributes?.payment_method 
                        ? ((order as any).note_attributes.payment_method === 'credit_card' ? 'כרטיס אשראי' :
                           (order as any).note_attributes.payment_method === 'paypal' ? 'PayPal' :
                           (order as any).note_attributes.payment_method === 'bank_transfer' ? 'העברה בנקאית' :
                           (order as any).note_attributes.payment_method === 'cash_on_delivery' ? 'מזומן בעת המשלוח' :
                           (order as any).note_attributes.payment_method === 'cash' ? 'מזומן' :
                           (order as any).note_attributes.payment_method === 'store_credit' ? 'קרדיט בחנות' :
                           (order as any).note_attributes.payment_method === 'bit' ? 'ביט' :
                           (order as any).note_attributes.payment_method)
                        : (order.gateway === 'credit_card' ? 'כרטיס אשראי' :
                           order.gateway === 'paypal' ? 'PayPal' :
                           order.gateway === 'bank_transfer' ? 'העברה בנקאית' :
                           order.gateway === 'cash_on_delivery' ? 'מזומן בעת המשלוח' :
                           order.gateway === 'cash' ? 'מזומן' :
                           order.gateway === 'store_credit' ? 'קרדיט בחנות' :
                           order.gateway === 'bit' ? 'ביט' :
                           order.gateway || 'לא צוין')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">סטטוס תשלום</div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.financial_status)}`}>
                      {order.financial_status === 'paid' ? 'שולם' :
                       order.financial_status === 'pending' ? 'ממתין לתשלום' :
                       order.financial_status === 'refunded' ? 'הוחזר' :
                       order.financial_status === 'voided' ? 'בוטל' :
                       order.financial_status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Shipping Address */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">כתובת משלוח</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="no-print"
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        ...editData,
                        shipping_address: order.shipping_address || {},
                      });
                    }}
                  >
                    <HiPencil className="w-4 h-4 ml-1" />
                    ערוך
                  </Button>
                )}
              </div>
                {isEditing && editData.shipping_address ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>שם פרטי</Label>
                        <Input
                          value={editData.shipping_address.first_name || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            shipping_address: { ...editData.shipping_address, first_name: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>שם משפחה</Label>
                        <Input
                          value={editData.shipping_address.last_name || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            shipping_address: { ...editData.shipping_address, last_name: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>כתובת</Label>
                      <Input
                        value={editData.shipping_address.address1 || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          shipping_address: { ...editData.shipping_address, address1: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>עיר</Label>
                        <Input
                          value={editData.shipping_address.city || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            shipping_address: { ...editData.shipping_address, city: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>מיקוד</Label>
                        <Input
                          value={editData.shipping_address.zip || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            shipping_address: { ...editData.shipping_address, zip: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 no-print">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            setSaving(true);
                            const response = await fetch(`/api/orders/${orderId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({
                                shipping_address: editData.shipping_address,
                              }),
                            });
                            if (!response.ok) throw new Error('Failed to update');
                            await loadOrder();
                            setIsEditing(false);
                            setEditData({});
                          } catch (error) {
                            console.error('Error updating order:', error);
                            alert('שגיאה בעדכון ההזמנה');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                      >
                        שמור
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({});
                        }}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 space-y-1">
                    {order.shipping_address ? (
                      <>
                        {order.shipping_address.first_name && (
                          <div>{order.shipping_address.first_name} {order.shipping_address.last_name}</div>
                        )}
                        {order.shipping_address.address1 && (
                          <div>{order.shipping_address.address1}</div>
                        )}
                        {order.shipping_address.address2 && (
                          <div>{order.shipping_address.address2}</div>
                        )}
                        {order.shipping_address.city && (
                          <div>{order.shipping_address.city}</div>
                        )}
                        {order.shipping_address.zip && (
                          <div>{order.shipping_address.zip}</div>
                        )}
                        {order.shipping_address.country && (
                          <div>{order.shipping_address.country}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-400">לא צוינה כתובת משלוח</div>
                    )}
                  </div>
                )}
              </div>
            </Card>

          {/* Billing Address */}
          {order.billing_address && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">כתובת חיוב</h2>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="no-print"
                      onClick={() => {
                        setIsEditing(true);
                        setEditData({
                          ...editData,
                          billing_address: order.billing_address || {},
                        });
                      }}
                    >
                      <HiPencil className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                  )}
                </div>
                {isEditing && editData.billing_address ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>שם פרטי</Label>
                        <Input
                          value={editData.billing_address.first_name || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            billing_address: { ...editData.billing_address, first_name: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>שם משפחה</Label>
                        <Input
                          value={editData.billing_address.last_name || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            billing_address: { ...editData.billing_address, last_name: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>כתובת</Label>
                      <Input
                        value={editData.billing_address.address1 || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          billing_address: { ...editData.billing_address, address1: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>עיר</Label>
                        <Input
                          value={editData.billing_address.city || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            billing_address: { ...editData.billing_address, city: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>מיקוד</Label>
                        <Input
                          value={editData.billing_address.zip || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            billing_address: { ...editData.billing_address, zip: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 no-print">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            setSaving(true);
                            const response = await fetch(`/api/orders/${orderId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({
                                billing_address: editData.billing_address,
                              }),
                            });
                            if (!response.ok) throw new Error('Failed to update');
                            await loadOrder();
                            setIsEditing(false);
                            setEditData({});
                          } catch (error) {
                            console.error('Error updating order:', error);
                            alert('שגיאה בעדכון ההזמנה');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                      >
                        שמור
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({});
                        }}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 space-y-1">
                    {order.billing_address.first_name && (
                      <div>{order.billing_address.first_name} {order.billing_address.last_name}</div>
                    )}
                    {order.billing_address.address1 && (
                      <div>{order.billing_address.address1}</div>
                    )}
                    {order.billing_address.address2 && (
                      <div>{order.billing_address.address2}</div>
                    )}
                    {order.billing_address.city && (
                      <div>{order.billing_address.city}</div>
                    )}
                    {order.billing_address.zip && (
                      <div>{order.billing_address.zip}</div>
                    )}
                    {order.billing_address.country && (
                      <div>{order.billing_address.country}</div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Shipment Info */}
          {shipment && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי משלוח</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">סטטוס: </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      shipment.status === 'created' ? 'bg-yellow-100 text-yellow-800' :
                      shipment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shipment.status === 'delivered' ? 'נמסר' :
                       shipment.status === 'in_transit' ? 'בדרך' :
                       shipment.status === 'created' ? 'נוצר' :
                       shipment.status === 'cancelled' ? 'בוטל' :
                       shipment.status}
                    </span>
                  </div>
                  {shipment.tracking_number && (
                    <div>
                      <span className="text-gray-500">מספר מעקב: </span>
                      <span className="font-medium">{shipment.tracking_number}</span>
                    </div>
                  )}
                  {shipment.tracking_url && (
                    <a 
                      href={shipment.tracking_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 block"
                    >
                      צפה במעקב →
                    </a>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">פעולות</h2>
              <div className="space-y-0 no-print">
                {/* שליחה למשלוח */}
                {!shipment && order.fulfillment_status !== 'fulfilled' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start border-b border-gray-200 rounded-none text-blue-600 hover:text-blue-700"
                    onClick={createShipment}
                    disabled={creatingShipment}
                  >
                    <HiArrowRight className="w-5 h-5 ml-2" />
                    {creatingShipment ? 'שולח...' : 'שלח לחברת שליחויות'}
                  </Button>
                )}
                
                {order.financial_status !== 'refunded' && order.financial_status !== 'voided' && (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start border-b border-gray-200 rounded-none"
                      onClick={createRefund}
                      disabled={processingRefund || updatingStatus}
                    >
                      <HiRefresh className="w-5 h-5 ml-2" />
                      {processingRefund ? 'מזכה...' : 'זכה עסקה / החזר הזמנה'}
                    </Button>
                  </>
                )}
                {order.financial_status !== 'voided' && (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 border-b border-gray-200 rounded-none"
                      onClick={() => updateStatus('voided')}
                      disabled={updatingStatus}
                    >
                      <HiBan className="w-5 h-5 ml-2" />
                      בטל הזמנה
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-none ${isFraudOrRisk() ? 'text-orange-600 hover:text-orange-700' : 'text-gray-700 hover:text-gray-900'}`}
                  onClick={() => setShowFraudDialog(true)}
                  disabled={updatingStatus}
                >
                  <HiExclamationCircle className="w-5 h-5 ml-2" />
                  {isFraudOrRisk() ? 'ערוך סימון הונאה/סיכון' : 'סמן כהונאה/סיכון'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">הערות</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="no-print"
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        ...editData,
                        note: order.note || '',
                      });
                    }}
                  >
                    <HiPencil className="w-4 h-4 ml-1" />
                    ערוך
                  </Button>
                )}
              </div>
              {isEditing && editData.note !== undefined ? (
                <div className="space-y-4">
                  <textarea
                    value={editData.note}
                    onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={4}
                    placeholder="הוסף הערה..."
                  />
                  <div className="flex gap-2 no-print">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          setSaving(true);
                          const response = await fetch(`/api/orders/${orderId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              note: editData.note,
                            }),
                          });
                          if (!response.ok) throw new Error('Failed to update');
                          await loadOrder();
                          setIsEditing(false);
                          setEditData({});
                        } catch (error) {
                          console.error('Error updating order:', error);
                          alert('שגיאה בעדכון ההזמנה');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      שמור
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({});
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">{order.note || 'אין הערות'}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <div className="no-print">
        <OrderTimeline orderId={order.id} />
      </div>

      {/* Fraud/Risk Dialog */}
      <Dialog open={showFraudDialog} onOpenChange={setShowFraudDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>סמן הזמנה כהונאה/סיכון</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div>
              <Label>רמת סיכון</Label>
              <Select
                value={riskLevel}
                onValueChange={(value) => setRiskLevel(value as typeof riskLevel)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue>
                    {riskLevel === 'fraud' ? 'הונאה' :
                     riskLevel === 'risk' ? 'סיכון' :
                     riskLevel === 'high-risk' ? 'סיכון גבוה' :
                     'ללא סיכון'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא סיכון</SelectItem>
                  <SelectItem value="risk">סיכון</SelectItem>
                  <SelectItem value="high-risk">סיכון גבוה</SelectItem>
                  <SelectItem value="fraud">הונאה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סיבה</Label>
              <textarea
                value={fraudReason}
                onChange={(e) => setFraudReason(e.target.value)}
                placeholder="תאר את הסיבה לסימון..."
                className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowFraudDialog(false);
              setFraudReason('');
              setRiskLevel('none');
            }}>
              ביטול
            </Button>
            <Button onClick={markAsFraud} disabled={updatingStatus || !fraudReason.trim()}>
              {updatingStatus ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

