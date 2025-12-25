'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { OrderWithDetails } from '@/types/order';
import { HiPrinter } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { OrderDetailsContent } from './OrderDetailsContent';

interface OrderQuickViewProps {
  order: OrderWithDetails | null;
  open: boolean;
  onClose: () => void;
  onMarkAsRead?: (orderId: number) => void;
}

export function OrderQuickView({ order, open, onClose, onMarkAsRead }: OrderQuickViewProps) {
  const router = useRouter();

  if (!order) return null;

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
          {/* ✅ שימוש בקומפוננטה משותפת */}
          <OrderDetailsContent order={order} />

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

