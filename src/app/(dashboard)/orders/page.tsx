'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  HiPlus, 
  HiEye, 
  HiTrash, 
  HiShoppingCart,
  HiDotsVertical,
  HiPrinter,
  HiRefresh,
  HiChevronLeft,
  HiChevronRight,
  HiSearch,
} from 'react-icons/hi';
import { OrderWithDetails } from '@/types/order';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string>('');
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Status change dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<number | null>(null);
  const [newFinancialStatus, setNewFinancialStatus] = useState<string>('');
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    loadOrders(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, financialStatusFilter, fulfillmentStatusFilter, pagination.page]);

  const loadOrders = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (financialStatusFilter) params.append('financial_status', financialStatusFilter);
      if (fulfillmentStatusFilter) params.append('fulfillment_status', fulfillmentStatusFilter);
      params.append('limit', pagination.limit.toString());
      params.append('page', pagination.page.toString());

      const response = await fetch(`/api/orders?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      // Don't update state if request was aborted
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data.orders || []);
      
      // Update pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      } else if (data.page_info) {
        // Handle cursor-based pagination
        setPagination(prev => ({
          ...prev,
          total: data.orders?.length || 0,
          totalPages: data.page_info?.has_next_page ? prev.page + 1 : prev.page,
        }));
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') return;
      console.error('Error loading orders:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת ההזמנות',
        variant: 'destructive',
      });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selectedOrders);
    if (selectedArray.length === 0) {
      toast({
        title: 'שים לב',
        description: 'לא נבחרו הזמנות למחיקה',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedArray.length} הזמנות?`)) {
      return;
    }

    try {
      for (const orderId of selectedArray) {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete order');
      }
      toast({
        title: 'הצלחה',
        description: `${selectedArray.length} הזמנות נמחקו בהצלחה`,
      });
      setSelectedOrders(new Set());
      loadOrders();
    } catch (error: any) {
      console.error('Error deleting orders:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת ההזמנות',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'ההזמנה נמחקה בהצלחה',
        });
        loadOrders();
      } else {
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו למחוק את ההזמנה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת ההזמנה',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async () => {
    if (!selectedOrderForStatus) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/orders/${selectedOrderForStatus}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financial_status: newFinancialStatus || undefined,
          fulfillment_status: newFulfillmentStatus || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'הסטטוס עודכן בהצלחה',
        });
        setIsStatusDialogOpen(false);
        setSelectedOrderForStatus(null);
        setNewFinancialStatus('');
        setNewFulfillmentStatus('');
        loadOrders();
      } else {
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לעדכן את הסטטוס',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בעדכון הסטטוס',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrintOrder = (orderId: number) => {
    window.open(`/orders/${orderId}?print=true`, '_blank');
  };

  const handlePrintMultipleOrders = () => {
    if (selectedOrders.size === 0) {
      toast({
        title: 'שים לב',
        description: 'אנא בחר לפחות הזמנה אחת להדפסה',
        variant: 'destructive',
      });
      return;
    }

    // Open each order in a separate tab for printing
    const orderIds = Array.from(selectedOrders);
    orderIds.forEach((orderId, index) => {
      // Small delay between opening tabs to avoid browser blocking
      setTimeout(() => {
        window.open(`/orders/${orderId}?print=true`, '_blank');
      }, index * 200);
    });

    toast({
      title: 'הצלחה',
      description: `${orderIds.length} הזמנות נפתחו להדפסה`,
    });
  };

  const handleRefund = async (orderId: number) => {
    if (!confirm('האם אתה בטוח שברצונך להחזיר את ההזמנה?')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'ההחזר בוצע בהצלחה',
        });
        loadOrders();
      } else {
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לבצע החזר',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating refund:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת החזר',
        variant: 'destructive',
      });
    }
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

  const columns: TableColumn<OrderWithDetails>[] = [
    {
      key: 'order_name',
      label: 'מספר הזמנה',
      render: (order) => (
        <div className="font-medium text-gray-900">
          {order.order_name || `#${order.order_number || order.id}`}
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'לקוח',
      render: (order) => (
        <div>
          <div className="font-medium text-gray-900">
            {order.name || order.customer?.first_name || 'לקוח אורח'}
          </div>
          {order.email && (
            <div className="text-sm text-gray-500">{order.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'financial_status',
      label: 'סטטוס תשלום',
      render: (order) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.financial_status)}`}>
          {order.financial_status === 'paid' ? 'שולם' :
           order.financial_status === 'pending' ? 'ממתין לתשלום' :
           order.financial_status === 'refunded' ? 'הוחזר' :
           order.financial_status === 'voided' ? 'בוטל' :
           order.financial_status}
        </span>
      ),
    },
    {
      key: 'fulfillment_status',
      label: 'סטטוס ביצוע',
      render: (order) => (
        order.fulfillment_status ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.fulfillment_status)}`}>
            {order.fulfillment_status === 'fulfilled' ? 'בוצע' :
             order.fulfillment_status === 'partial' ? 'חלקי' :
             order.fulfillment_status}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">לא בוצע</span>
        )
      ),
    },
    {
      key: 'total_price',
      label: 'סכום',
      render: (order) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(order.total_price).toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'תאריך',
      render: (order) => (
        <div className="text-sm text-gray-600">
          {new Date(order.created_at).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
  ];

  const filters = [
    {
      type: 'select' as const,
      label: 'סטטוס תשלום',
      options: [
        { value: '', label: 'הכל' },
        { value: 'pending', label: 'ממתין לתשלום' },
        { value: 'paid', label: 'שולם' },
        { value: 'refunded', label: 'הוחזר' },
        { value: 'voided', label: 'בוטל' },
      ],
      value: financialStatusFilter,
      onChange: (value: string) => {
        setFinancialStatusFilter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
    {
      type: 'select' as const,
      label: 'סטטוס ביצוע',
      options: [
        { value: '', label: 'הכל' },
        { value: 'fulfilled', label: 'בוצע' },
        { value: 'partial', label: 'חלקי' },
        { value: 'restocked', label: 'הוחזר למלאי' },
      ],
      value: fulfillmentStatusFilter,
      onChange: (value: string) => {
        setFulfillmentStatusFilter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      },
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">הזמנות</h1>
          <p className="text-sm md:text-base text-gray-600">נהל ועקוב אחר כל ההזמנות שלך</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedOrders.size > 0 && (
            <>
              <Button
                onClick={handlePrintMultipleOrders}
                variant="default"
                className="hidden md:flex"
              >
                <HiPrinter className="w-4 h-4 ml-2" />
                הדפס {selectedOrders.size} נבחרו
              </Button>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                className="hidden md:flex"
              >
                <HiTrash className="w-4 h-4 ml-2" />
                מחק {selectedOrders.size} נבחרו
              </Button>
            </>
          )}
          <Button 
            onClick={() => router.push('/orders/new')}
            className="whitespace-nowrap"
          >
            <HiPlus className="w-4 h-4 ml-2" />
            <span className="hidden md:inline">הזמנה חדשה</span>
            <span className="md:hidden">חדש</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש לפי מספר הזמנה, שם לקוח או אימייל..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="pr-10"
              />
            </div>

            {/* Financial Status Filter */}
            <select
              value={financialStatusFilter}
              onChange={(e) => {
                setFinancialStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all w-full md:w-[180px] flex-shrink-0"
            >
              <option value="">כל הסטטוסים</option>
              <option value="pending">ממתין לתשלום</option>
              <option value="paid">שולם</option>
              <option value="refunded">הוחזר</option>
              <option value="voided">בוטל</option>
            </select>

            {/* Fulfillment Status Filter */}
            <select
              value={fulfillmentStatusFilter}
              onChange={(e) => {
                setFulfillmentStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all w-full md:w-[160px] flex-shrink-0"
            >
              <option value="">כל הסטטוסים</option>
              <option value="fulfilled">בוצע</option>
              <option value="partial">חלקי</option>
              <option value="restocked">הוחזר למלאי</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <DataTable
        title=""
        description=""
        primaryAction={undefined}
        secondaryActions={undefined}
        searchPlaceholder=""
        onSearch={undefined}
        filters={undefined}
        columns={columns}
        data={orders}
        keyExtractor={(order) => order.id}
        loading={loading}
        selectable
        selectedItems={selectedOrders as Set<string | number>}
        onSelectionChange={(selected) => setSelectedOrders(selected as Set<number>)}
        onRowClick={(order) => router.push(`/orders/${order.id}`)}
        rowActions={(order) => {
          return (
            <>
              {/* Desktop: Dropdown Menu */}
              <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu
                  trigger={
                    <button 
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      <HiDotsVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  }
                  items={[
                    {
                      label: 'צפה בהזמנה',
                      icon: <HiEye className="w-4 h-4" />,
                      onClick: () => router.push(`/orders/${order.id}`),
                    },
                    {
                      label: 'הדפס הזמנה',
                      icon: <HiPrinter className="w-4 h-4" />,
                      onClick: () => handlePrintOrder(order.id),
                    },
                    {
                      label: 'החלף סטטוס',
                      icon: <HiRefresh className="w-4 h-4" />,
                      onClick: () => {
                        setSelectedOrderForStatus(order.id);
                        setNewFinancialStatus(order.financial_status);
                        setNewFulfillmentStatus(order.fulfillment_status || '');
                        setIsStatusDialogOpen(true);
                      },
                    },
                    {
                      label: 'החזר',
                      icon: <HiRefresh className="w-4 h-4" />,
                      onClick: () => handleRefund(order.id),
                    },
                    {
                      label: 'מחק',
                      icon: <HiTrash className="w-4 h-4" />,
                      onClick: () => handleDeleteOrder(order.id),
                      variant: 'destructive',
                    },
                  ]}
                  align="end"
                />
              </div>
              
              {/* Mobile: Action buttons */}
              <div className="md:hidden flex w-full gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <HiEye className="w-4 h-4 flex-shrink-0" />
                  <span>צפה</span>
                </button>
                <button 
                  onClick={() => handlePrintOrder(order.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <HiPrinter className="w-4 h-4 flex-shrink-0" />
                  <span>הדפס</span>
                </button>
                <button 
                  onClick={() => handleDeleteOrder(order.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <HiTrash className="w-4 h-4 flex-shrink-0" />
                  <span>מחק</span>
                </button>
              </div>
            </>
          );
        }}
        emptyState={
          <div className="text-center py-12">
            <HiShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין הזמנות להצגה</p>
            <button
              onClick={() => router.push('/orders/new')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור הזמנה חדשה
            </button>
          </div>
        }
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            מציג {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total} הזמנות
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <HiChevronRight className="w-4 h-4" />
              קודם
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              הבא
              <HiChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      {isStatusDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" dir="rtl">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">החלף סטטוס הזמנה</h2>
              <p className="text-gray-600 mb-4">בחר סטטוס חדש להזמנה</p>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס תשלום</label>
                  <select
                    value={newFinancialStatus}
                    onChange={(e) => setNewFinancialStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="">לא משנה</option>
                    <option value="pending">ממתין לתשלום</option>
                    <option value="paid">שולם</option>
                    <option value="refunded">הוחזר</option>
                    <option value="voided">בוטל</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס ביצוע</label>
                  <select
                    value={newFulfillmentStatus}
                    onChange={(e) => setNewFulfillmentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="">לא משנה</option>
                    <option value="fulfilled">בוצע</option>
                    <option value="partial">חלקי</option>
                    <option value="restocked">הוחזר למלאי</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => {
                  setIsStatusDialogOpen(false);
                  setSelectedOrderForStatus(null);
                  setNewFinancialStatus('');
                  setNewFulfillmentStatus('');
                }}>
                  ביטול
                </Button>
                <Button
                  onClick={handleStatusChange}
                  disabled={updatingStatus || (!newFinancialStatus && !newFulfillmentStatus)}
                >
                  {updatingStatus ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      מעדכן...
                    </>
                  ) : (
                    <>
                      <HiRefresh className="w-4 h-4 ml-2" />
                      עדכן סטטוס
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
