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
  HiExclamationCircle
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
    if (!confirm('האם אתה בטוח שברצונך להחזיר את ההזמנה?')) return;
    
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to create refund');
      await loadOrder();
      alert('ההחזר בוצע בהצלחה');
    } catch (error) {
      console.error('Error creating refund:', error);
      alert('שגיאה ביצירת החזר');
    } finally {
      setUpdatingStatus(false);
    }
  };

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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {order.order_name || `#${order.order_number || order.id}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            נוצר ב-{new Date(order.created_at).toLocaleString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            חזרה
          </Button>
          <Button variant="ghost">
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">פריטי הזמנה</h2>
              <div className="space-y-4">
                {order.line_items?.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xs">תמונה</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      {item.variant_title && (
                        <div className="text-sm text-gray-500">{item.variant_title}</div>
                      )}
                      {item.sku && (
                        <div className="text-xs text-gray-400 mt-1">SKU: {item.sku}</div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {item.quantity} × ₪{parseFloat(item.price).toLocaleString('he-IL')}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₪{(parseFloat(item.price) * item.quantity).toLocaleString('he-IL')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">סה"כ ביניים</span>
                  <span className="text-gray-900">₪{parseFloat(order.subtotal_price || '0').toLocaleString('he-IL')}</span>
                </div>
                {parseFloat(order.total_shipping_price || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">משלוח</span>
                    <span className="text-gray-900">₪{parseFloat(order.total_shipping_price || '0').toLocaleString('he-IL')}</span>
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
                    <span>הנחה</span>
                    <span>-₪{parseFloat(order.total_discounts || '0').toLocaleString('he-IL')}</span>
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
          {order.fulfillments && order.fulfillments.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">ביצועים</h2>
                <div className="space-y-4">
                  {order.fulfillments.map((fulfillment) => (
                    <div key={fulfillment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getFulfillmentStatusBadgeColor(fulfillment.status)}`}>
                          {fulfillment.status === 'success' ? 'בוצע' :
                           fulfillment.status === 'pending' ? 'ממתין' :
                           fulfillment.status}
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
              </div>
            </Card>
          )}

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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">לקוח</h2>
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
            </div>
          </Card>

          {/* Shipping Address */}
          {order.shipping_address && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">כתובת משלוח</h2>
                <div className="text-sm text-gray-600 space-y-1">
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
                </div>
              </div>
            </Card>
          )}

          {/* Billing Address */}
          {order.billing_address && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">כתובת חיוב</h2>
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
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">פעולות</h2>
              <div className="space-y-2">
                {order.financial_status !== 'refunded' && order.financial_status !== 'voided' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={createRefund}
                    disabled={updatingStatus}
                  >
                    <HiRefresh className="w-5 h-5 ml-2" />
                    החזר הזמנה
                  </Button>
                )}
                {order.financial_status !== 'voided' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => updateStatus('voided')}
                    disabled={updatingStatus}
                  >
                    <HiBan className="w-5 h-5 ml-2" />
                    בטל הזמנה
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isFraudOrRisk() ? 'text-orange-600 hover:text-orange-700' : 'text-gray-700 hover:text-gray-900'}`}
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
          {order.note && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">הערות</h2>
                <p className="text-sm text-gray-600">{order.note}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Timeline */}
      <OrderTimeline orderId={order.id} />

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

