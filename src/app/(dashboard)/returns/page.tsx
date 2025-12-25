'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/badge';
import { 
  HiRefresh, 
  HiCheckCircle, 
  HiXCircle,
  HiClock,
  HiEye,
  HiCurrencyDollar,
  HiShoppingBag,
  HiUser,
  HiPlus,
  HiSearch,
} from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface ReturnItem {
  id: number;
  orderId: number;
  orderNumber: number;
  orderName: string;
  orderTotal: number;
  orderFinancialStatus: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  items: Array<{ orderItemId: number; quantity: number; reason?: string }>;
  refundAmount: number | null;
  refundMethod: 'STORE_CREDIT' | 'ORIGINAL_PAYMENT_METHOD' | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  id: number;
  title: string;
  variantTitle: string | null;
  quantity: number;
  price: number;
}

interface OrderOption {
  id: number;
  orderNumber: number;
  orderName: string;
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  customerId: number;
  items: OrderItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ReturnsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturns, setSelectedReturns] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Return details dialog
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [returnDetails, setReturnDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Update status dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');

  // Add return dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addingReturn, setAddingReturn] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSearchResults, setOrderSearchResults] = useState<OrderOption[]>([]);
  const [searchingOrders, setSearchingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderOption | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{ orderItemId: number; quantity: number; maxQuantity: number }>>([]);
  const [addReason, setAddReason] = useState('');
  const [addRefundAmount, setAddRefundAmount] = useState<string>('');
  const [addRefundMethod, setAddRefundMethod] = useState<string>('');
  const [addNotes, setAddNotes] = useState('');
  const [addStatus, setAddStatus] = useState<string>('PENDING');
  const debouncedOrderSearch = useDebounce(orderSearch, 300);

  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    loadReturns(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, statusFilter, pagination.page]);

  const loadReturns = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', pagination.limit.toString());
      params.append('page', pagination.page.toString());

      const response = await fetch(`/api/returns?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      // Don't update state if request was aborted
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load returns');
      const data = await response.json();
      setReturns(data.returns || []);
      
      // Update pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') return;
      console.error('Error loading returns:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת ההחזרות',
        variant: 'destructive',
      });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const loadReturnDetails = async (returnId: number) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/returns/${returnId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load return details');
      const data = await response.json();
      setReturnDetails(data);
    } catch (error: any) {
      console.error('Error loading return details:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת פרטי ההחזרה',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (returnItem: ReturnItem) => {
    setSelectedReturn(returnItem);
    setIsDetailsDialogOpen(true);
    await loadReturnDetails(returnItem.id);
  };

  const handleOpenUpdateDialog = (returnItem: ReturnItem) => {
    setSelectedReturn(returnItem);
    setNewStatus(returnItem.status);
    setRefundAmount(returnItem.refundAmount?.toString() || '');
    setRefundMethod(returnItem.refundMethod || '');
    setUpdateNotes(returnItem.notes || '');
    setIsUpdateDialogOpen(true);
  };

  // Search orders for adding a return
  useEffect(() => {
    if (debouncedOrderSearch && debouncedOrderSearch.length >= 2) {
      searchOrders(debouncedOrderSearch);
    } else {
      setOrderSearchResults([]);
    }
  }, [debouncedOrderSearch]);

  const searchOrders = async (searchQuery: string) => {
    try {
      setSearchingOrders(true);
      const response = await fetch(`/api/orders?search=${encodeURIComponent(searchQuery)}&limit=10`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to search orders');
      const data = await response.json();
      
      // Transform orders to our format
      const orders: OrderOption[] = (data.orders || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        orderName: o.order_name || `#${o.order_number}`,
        totalPrice: parseFloat(o.total_price || '0'),
        customerName: o.customer 
          ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() || 'לקוח אנונימי'
          : o.name || 'לקוח אנונימי',
        customerEmail: o.customer?.email || o.email || '',
        customerId: o.customer_id,
        items: (o.line_items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          variantTitle: item.variant_title,
          quantity: item.quantity,
          price: parseFloat(item.price || '0'),
        })),
      }));
      
      setOrderSearchResults(orders);
    } catch (error: any) {
      console.error('Error searching orders:', error);
    } finally {
      setSearchingOrders(false);
    }
  };

  const handleSelectOrder = (order: OrderOption) => {
    setSelectedOrder(order);
    setOrderSearchResults([]);
    setOrderSearch('');
    // Pre-select all items with max quantity
    setSelectedItems(order.items.map(item => ({
      orderItemId: item.id,
      quantity: item.quantity,
      maxQuantity: item.quantity,
    })));
  };

  const handleItemQuantityChange = (orderItemId: number, quantity: number) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.orderItemId === orderItemId 
          ? { ...item, quantity: Math.min(Math.max(0, quantity), item.maxQuantity) }
          : item
      )
    );
  };

  const handleToggleItem = (orderItemId: number, checked: boolean) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.orderItemId === orderItemId 
          ? { ...item, quantity: checked ? item.maxQuantity : 0 }
          : item
      )
    );
  };

  const handleAddReturn = async () => {
    if (!selectedOrder) return;

    const itemsToReturn = selectedItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות פריט אחד להחזרה',
        variant: 'destructive',
      });
      return;
    }

    if (!addReason.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין סיבה להחזרה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAddingReturn(true);
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          customerId: selectedOrder.customerId,
          reason: addReason,
          items: itemsToReturn.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
          refundAmount: addRefundAmount ? parseFloat(addRefundAmount) : null,
          refundMethod: addRefundMethod || null,
          notes: addNotes || null,
          status: addStatus,
        }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'ההחזרה נוספה בהצלחה',
        });
        setIsAddDialogOpen(false);
        resetAddForm();
        loadReturns();
        window.dispatchEvent(new Event('returnStatusChanged'));
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא הצלחנו להוסיף את ההחזרה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error adding return:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהוספת ההחזרה',
        variant: 'destructive',
      });
    } finally {
      setAddingReturn(false);
    }
  };

  const resetAddForm = () => {
    setSelectedOrder(null);
    setSelectedItems([]);
    setOrderSearch('');
    setOrderSearchResults([]);
    setAddReason('');
    setAddRefundAmount('');
    setAddRefundMethod('');
    setAddNotes('');
    setAddStatus('PENDING');
  };

  const handleUpdateStatus = async () => {
    if (!selectedReturn) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/returns/${selectedReturn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          refundAmount: refundAmount ? parseFloat(refundAmount) : null,
          refundMethod: refundMethod || null,
          notes: updateNotes || null,
        }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'ההחזרה עודכנה בהצלחה',
        });
        setIsUpdateDialogOpen(false);
        setSelectedReturn(null);
        setNewStatus('');
        setRefundAmount('');
        setRefundMethod('');
        setUpdateNotes('');
        loadReturns();
        // ✅ שליחת event לרענון הספירה בתפריט
        window.dispatchEvent(new Event('returnStatusChanged'));
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא הצלחנו לעדכן את ההחזרה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating return:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון ההחזרה',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      PENDING: 'ממתין',
      APPROVED: 'אושר',
      REJECTED: 'נדחה',
      PROCESSING: 'מעבד',
      COMPLETED: 'הושלם',
      CANCELLED: 'בוטל',
    };
    return statusLabels[status] || 'ממתין';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'ממתין', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'אושר', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'נדחה', className: 'bg-red-100 text-red-800' },
      PROCESSING: { label: 'מעבד', className: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: 'הושלם', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'בוטל', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const columns: TableColumn<ReturnItem>[] = [
    {
      key: 'order',
      label: 'הזמנה',
      render: (returnItem) => (
        <div>
          <div className="font-medium text-gray-900">#{returnItem.orderNumber}</div>
          <div className="text-sm text-gray-600">{returnItem.orderName}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'לקוח',
      render: (returnItem) => (
        <div>
          <div className="font-medium text-gray-900">{returnItem.customerName || 'אין שם'}</div>
          <div className="text-sm text-gray-600">{returnItem.customerEmail}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'סיבה',
      render: (returnItem) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">{returnItem.reason}</div>
      ),
    },
    {
      key: 'items',
      label: 'פריטים',
      render: (returnItem) => (
        <div className="text-sm text-gray-600">
          {returnItem.items.length} פריט{returnItem.items.length !== 1 ? 'ים' : ''}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: (returnItem) => getStatusBadge(returnItem.status),
    },
    {
      key: 'refund',
      label: 'החזר',
      render: (returnItem) => (
        <div>
          {returnItem.refundAmount ? (
            <>
              <div className="text-sm font-medium text-gray-900">
                ₪{returnItem.refundAmount.toFixed(2)}
              </div>
              {returnItem.refundMethod && (
                <div className="text-xs text-gray-600">
                  {returnItem.refundMethod === 'STORE_CREDIT' ? 'קרדיט בחנות' : 'החזר לתשלום'}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'תאריך',
      render: (returnItem) => (
        <div className="text-sm text-gray-600">
          {new Date(returnItem.createdAt).toLocaleDateString('he-IL')}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'פעולות',
      render: (returnItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(returnItem)}
          >
            <HiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenUpdateDialog(returnItem)}
          >
            <HiRefresh className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="החזרות והחלפות"
        description="נהל החזרות והחלפות מלקוחות"
        searchPlaceholder="חיפוש לפי מספר הזמנה, לקוח..."
        onSearch={setSearchTerm}
        columns={columns}
        data={returns}
        keyExtractor={(returnItem) => returnItem.id}
        selectable
        selectedItems={selectedReturns}
        onSelectionChange={(selected) => setSelectedReturns(selected as Set<number>)}
        loading={loading}
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <HiPlus className="w-4 h-4 ml-2" />
            הוסף החזרה
          </Button>
        }
        filters={[
          {
            type: 'select',
            label: 'סטטוס',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: '', label: 'כל הסטטוסים' },
              { value: 'PENDING', label: 'ממתין' },
              { value: 'APPROVED', label: 'אושר' },
              { value: 'REJECTED', label: 'נדחה' },
              { value: 'PROCESSING', label: 'מעבד' },
              { value: 'COMPLETED', label: 'הושלם' },
              { value: 'CANCELLED', label: 'בוטל' },
            ],
          },
        ]}
        emptyState={
          <div className="text-center py-12">
            <HiRefresh className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">אין החזרות</p>
          </div>
        }
      />

      {/* Return Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>פרטי החזרה #{selectedReturn?.id}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-8 py-6">
            {loadingDetails ? (
              <div className="py-8 text-center">
                <HiRefresh className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : returnDetails ? (
              <div className="space-y-6">
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HiShoppingBag className="w-5 h-5" />
                    פרטי הזמנה
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">מספר הזמנה</Label>
                      <p className="font-medium">#{returnDetails.orderNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">סך ההזמנה</Label>
                      <p className="font-medium">₪{returnDetails.orderTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HiUser className="w-5 h-5" />
                    פרטי לקוח
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">שם</Label>
                      <p className="font-medium">{returnDetails.customerName || 'אין שם'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">אימייל</Label>
                      <p className="font-medium">{returnDetails.customerEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Return Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HiClock className="w-5 h-5" />
                    פרטי החזרה
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">סטטוס</Label>
                      <div className="mt-1">{getStatusBadge(returnDetails.status)}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">תאריך יצירה</Label>
                      <p className="text-sm">{new Date(returnDetails.createdAt).toLocaleString('he-IL')}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">סיבה</Label>
                    <p className="text-sm text-gray-900 mt-1">{returnDetails.reason}</p>
                  </div>
                  {returnDetails.notes && (
                    <div>
                      <Label className="text-gray-600">הערות</Label>
                      <p className="text-sm text-gray-900 mt-1">{returnDetails.notes}</p>
                    </div>
                  )}
                  {returnDetails.refundAmount && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">סכום החזר</Label>
                        <p className="font-medium text-green-600">₪{returnDetails.refundAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">אמצעי החזר</Label>
                        <p className="font-medium">
                          {returnDetails.refundMethod === 'STORE_CREDIT' ? 'קרדיט בחנות' : 'החזר לתשלום'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Return Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">פריטים להחזרה</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {returnDetails.items.map((item: any, index: number) => {
                      const orderItem = returnDetails.orderItems?.find((oi: any) => oi.id === item.orderItemId);
                      return (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{orderItem?.title || 'פריט לא נמצא'}</p>
                              {orderItem?.variantTitle && (
                                <p className="text-sm text-gray-600">{orderItem.variantTitle}</p>
                              )}
                              <p className="text-sm text-gray-600 mt-1">
                                כמות: {item.quantity} / מחיר: ₪{orderItem?.price?.toFixed(2) || '0.00'}
                              </p>
                              {item.reason && (
                                <p className="text-sm text-gray-500 mt-1">סיבה: {item.reason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>סגור</Button>
            {selectedReturn && (
              <Button onClick={() => {
                setIsDetailsDialogOpen(false);
                handleOpenUpdateDialog(selectedReturn);
              }}>
                עדכן סטטוס
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>עדכן סטטוס החזרה</DialogTitle>
            <DialogDescription>
              עדכן את סטטוס ההחזרה והגדר החזר כספי אם נדרש
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-8 py-6">
            <div>
              <Label>סטטוס</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue>
                    {newStatus ? getStatusLabel(newStatus) : 'בחר סטטוס'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">ממתין</SelectItem>
                  <SelectItem value="APPROVED">אושר</SelectItem>
                  <SelectItem value="REJECTED">נדחה</SelectItem>
                  <SelectItem value="PROCESSING">מעבד</SelectItem>
                  <SelectItem value="COMPLETED">הושלם</SelectItem>
                  <SelectItem value="CANCELLED">בוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'APPROVED' && (
              <>
                <div>
                  <Label>סכום החזר (₪)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>אמצעי החזר</Label>
                  <Select value={refundMethod} onValueChange={setRefundMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר אמצעי החזר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STORE_CREDIT">קרדיט בחנות</SelectItem>
                      <SelectItem value="ORIGINAL_PAYMENT_METHOD">החזר לתשלום המקורי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label>הערות</Label>
              <Textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="הוסף הערות..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUpdateDialogOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'מעדכן...' : 'עדכן'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Return Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetAddForm();
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>הוספת החזרה/החלפה ידנית</DialogTitle>
            <DialogDescription>
              הוסף החזרה או החלפה חדשה עבור הזמנה קיימת
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-8 py-6 space-y-6">
            {/* Order Search */}
            {!selectedOrder ? (
              <div className="space-y-4">
                <div>
                  <Label>חיפוש הזמנה</Label>
                  <div className="relative mt-2">
                    <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="חפש לפי מספר הזמנה, שם לקוח או אימייל..."
                      className="pr-10"
                    />
                  </div>
                </div>

                {searchingOrders && (
                  <div className="text-center py-4">
                    <HiRefresh className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">מחפש הזמנות...</p>
                  </div>
                )}

                {orderSearchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {orderSearchResults.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => handleSelectOrder(order)}
                        className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">#{order.orderNumber}</div>
                            <div className="text-sm text-gray-600">{order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customerEmail}</div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ₪{order.totalPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.items.length} פריטים
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {orderSearch.length >= 2 && !searchingOrders && orderSearchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    לא נמצאו הזמנות
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selected Order Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">הזמנה #{selectedOrder.orderNumber}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedOrder(null);
                        setSelectedItems([]);
                      }}>
                        שנה הזמנה
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{selectedOrder.customerName}</span>
                      <span className="font-medium">₪{selectedOrder.totalPrice.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Select Items */}
                <div>
                  <Label className="text-base font-medium">בחר פריטים להחזרה</Label>
                  <div className="mt-3 border rounded-lg divide-y">
                    {selectedOrder.items.map((item) => {
                      const selectedItem = selectedItems.find(si => si.orderItemId === item.id);
                      const isSelected = selectedItem && selectedItem.quantity > 0;
                      return (
                        <div key={item.id} className="p-4 flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.title}</div>
                            {item.variantTitle && (
                              <div className="text-sm text-gray-600">{item.variantTitle}</div>
                            )}
                            <div className="text-sm text-gray-500">
                              ₪{item.price.toFixed(2)} × {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600">כמות:</Label>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={selectedItem?.quantity || 0}
                              onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <span className="text-sm text-gray-500">/ {item.quantity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return Reason */}
                <div>
                  <Label>סיבת ההחזרה *</Label>
                  <Select value={addReason} onValueChange={setAddReason}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="בחר סיבה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="לא מתאים">לא מתאים</SelectItem>
                      <SelectItem value="פגם במוצר">פגם במוצר</SelectItem>
                      <SelectItem value="מוצר לא מתאים">מוצר לא מתאים</SelectItem>
                      <SelectItem value="הזמנה שגויה">הזמנה שגויה</SelectItem>
                      <SelectItem value="מוצר לא כמתואר">מוצר לא כמתואר</SelectItem>
                      <SelectItem value="איחור באספקה">איחור באספקה</SelectItem>
                      <SelectItem value="שינוי דעה">שינוי דעה</SelectItem>
                      <SelectItem value="אחר">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label>סטטוס התחלתי</Label>
                  <Select value={addStatus} onValueChange={setAddStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">ממתין</SelectItem>
                      <SelectItem value="APPROVED">אושר</SelectItem>
                      <SelectItem value="PROCESSING">בטיפול</SelectItem>
                      <SelectItem value="COMPLETED">הושלם</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refund Details (optional) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>סכום החזר (אופציונלי)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={addRefundAmount}
                      onChange={(e) => setAddRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>אמצעי החזר</Label>
                    <Select value={addRefundMethod} onValueChange={setAddRefundMethod}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="בחר..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STORE_CREDIT">קרדיט בחנות</SelectItem>
                        <SelectItem value="ORIGINAL_PAYMENT_METHOD">החזר לתשלום המקורי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>הערות</Label>
                  <Textarea
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="הוסף הערות (אופציונלי)..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setIsAddDialogOpen(false);
              resetAddForm();
            }}>
              ביטול
            </Button>
            {selectedOrder && (
              <Button
                onClick={handleAddReturn}
                disabled={addingReturn || !addReason || selectedItems.filter(i => i.quantity > 0).length === 0}
              >
                {addingReturn ? 'מוסיף...' : 'הוסף החזרה'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
