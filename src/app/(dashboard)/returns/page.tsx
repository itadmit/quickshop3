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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>פרטי החזרה #{selectedReturn?.id}</DialogTitle>
          </DialogHeader>
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
          <div className="space-y-4">
            <div>
              <Label>סטטוס</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
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
    </>
  );
}
