'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrderWithDetails } from '@/types/order';
import { HiPrinter } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

interface OrderQuickViewProps {
  order: OrderWithDetails | null;
  open: boolean;
  onClose: () => void;
  onMarkAsRead?: (orderId: number) => void;
}

export function OrderQuickView({ order, open, onClose, onMarkAsRead }: OrderQuickViewProps) {
  const router = useRouter();

  if (!order) return null;

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

  const getFulfillmentStatusBadgeColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusLabel = (status: string | null) => {
    if (!status) return 'לא בוצע';
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

  const handleViewFullOrder = () => {
    router.push(`/orders/${order.id}`);
    onClose();
  };

  const handlePrint = () => {
    window.open(`/orders/${order.id}?print=true`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle>
                הזמנה {order.order_name || `#${order.order_number || order.id}`}
              </DialogTitle>
            </div>
            {!order.is_read && onMarkAsRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onMarkAsRead(order.id);
                  onClose();
                }}
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 flex-shrink-0 whitespace-nowrap"
              >
                <span>✓</span>
                <span className="mr-1">סמן כנקרא</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6 pt-4">
          {/* Order Status */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-sm text-gray-500">סטטוס תשלום:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.financial_status)}`}>
                {order.financial_status === 'paid' ? 'שולם' : order.financial_status === 'pending' ? 'ממתין' : order.financial_status}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">סטטוס ביצוע:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs font-medium ${getFulfillmentStatusBadgeColor(order.fulfillment_status)}`}>
                {getFulfillmentStatusLabel(order.fulfillment_status)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              תאריך: {new Date(order.created_at).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Customer Info */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">פרטי לקוח</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">שם:</span>{' '}
                  <span className="font-medium">{order.name || order.customer?.first_name || 'לקוח אורח'}</span>
                </div>
                <div>
                  <span className="text-gray-500">אימייל:</span>{' '}
                  <span className="font-medium">{order.email || '-'}</span>
                </div>
                {order.phone && (
                  <div>
                    <span className="text-gray-500">טלפון:</span>{' '}
                    <span className="font-medium">{order.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <Card>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">פריטי הזמנה</h3>
              <div className="space-y-3">
                {order.line_items?.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 pb-3 border-b border-gray-200 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      {item.variant_title && item.variant_title !== 'Default Title' && (
                        <div className="text-sm text-gray-500">{item.variant_title}</div>
                      )}
                      {item.sku && (
                        <div className="text-xs text-gray-400 mt-1">מקט: {item.sku}</div>
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
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {order.subtotal_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">סה"כ ביניים:</span>
                    <span className="font-medium">₪{parseFloat(order.subtotal_price).toLocaleString('he-IL')}</span>
                  </div>
                )}
                {parseFloat(order.total_tax) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">מע"מ:</span>
                    <span className="font-medium">₪{parseFloat(order.total_tax).toLocaleString('he-IL')}</span>
                  </div>
                )}
                {parseFloat(order.total_shipping_price) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">משלוח:</span>
                    <span className="font-medium">₪{parseFloat(order.total_shipping_price).toLocaleString('he-IL')}</span>
                  </div>
                )}
                {parseFloat(order.total_discounts) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>הנחה:</span>
                    <span className="font-medium">-₪{parseFloat(order.total_discounts).toLocaleString('he-IL')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>סה"כ:</span>
                  <span>₪{parseFloat(order.total_price).toLocaleString('he-IL')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Addresses */}
          {(order.shipping_address || order.billing_address) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.shipping_address && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">כתובת משלוח</h3>
                    <div className="text-sm text-gray-600">
                      {order.shipping_address.first_name && `${order.shipping_address.first_name} `}
                      {order.shipping_address.last_name}
                      {order.shipping_address.address1 && (
                        <>
                          <br />
                          {order.shipping_address.address1}
                        </>
                      )}
                      {order.shipping_address.city && (
                        <>
                          <br />
                          {order.shipping_address.city}
                          {order.shipping_address.zip && ` ${order.shipping_address.zip}`}
                        </>
                      )}
                      {order.shipping_address.country && (
                        <>
                          <br />
                          {order.shipping_address.country}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )}
              {order.billing_address && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">כתובת חיוב</h3>
                    <div className="text-sm text-gray-600">
                      {order.billing_address.first_name && `${order.billing_address.first_name} `}
                      {order.billing_address.last_name}
                      {order.billing_address.address1 && (
                        <>
                          <br />
                          {order.billing_address.address1}
                        </>
                      )}
                      {order.billing_address.city && (
                        <>
                          <br />
                          {order.billing_address.city}
                          {order.billing_address.zip && ` ${order.billing_address.zip}`}
                        </>
                      )}
                      {order.billing_address.country && (
                        <>
                          <br />
                          {order.billing_address.country}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={handleViewFullOrder}>
              צפה בהזמנה המלאה
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <HiPrinter className="w-4 h-4 ml-2" />
              הדפס
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

