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
  HiCheckCircle,
} from 'react-icons/hi';
import { OrderWithDetails } from '@/types/order';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { OrderQuickView } from '@/components/orders/OrderQuickView';
import { BulkPrintView } from '@/components/orders/BulkPrintView';

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
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState<string>('paid');
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
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [customStatuses, setCustomStatuses] = useState<Array<{id: number, name: string, display_name: string, color: string}>>([]);
  const [quickViewOrder, setQuickViewOrder] = useState<OrderWithDetails | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [loadingQuickView, setLoadingQuickView] = useState<number | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [ordersToPrint, setOrdersToPrint] = useState<OrderWithDetails[]>([]);
  const [loadingPrint, setLoadingPrint] = useState(false);

  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    loadOrders(signal);
    loadCustomStatuses();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, fulfillmentStatusFilter, pagination.page]);

  // Handle print dialog close
  useEffect(() => {
    const handleAfterPrint = () => {
      setShowPrintView(false);
      setOrdersToPrint([]);
      setLoadingPrint(false);
    };

    // Listen for afterprint event
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const loadCustomStatuses = async () => {
    try {
      const response = await fetch('/api/order-statuses', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCustomStatuses(data.statuses || []);
      }
    } catch (error) {
      console.error('Error loading custom statuses:', error);
    }
  };

  const loadOrders = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
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
          fulfillment_status: newFulfillmentStatus || null,
        }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'הסטטוס עודכן בהצלחה',
        });
        setIsStatusDialogOpen(false);
        setSelectedOrderForStatus(null);
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

  const handlePrintOrder = async (orderId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    setLoadingPrint(true);
    
    try {
      // Load full order details
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to load order');
      }
      
      const data = await response.json();
      
      // Set order to print and show print view
      setOrdersToPrint([data.order]);
      setShowPrintView(true);
      
      // Wait for the print view to render, then trigger print
      setTimeout(() => {
        window.print();
        setLoadingPrint(false);
      }, 500);
    } catch (error) {
      console.error('Error loading order for print:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת ההזמנה להדפסה',
        variant: 'destructive',
      });
      setLoadingPrint(false);
    }
  };

  const handlePrintMultipleOrders = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    if (selectedOrders.size === 0) {
      toast({
        title: 'שים לב',
        description: 'אנא בחר לפחות הזמנה אחת להדפסה',
        variant: 'destructive',
      });
      return;
    }

    setLoadingPrint(true);

    // Get full details of selected orders
    const orderIds = Array.from(selectedOrders);
    const ordersToPrintData: OrderWithDetails[] = [];
    
    try {
      // Load full order details for each selected order
      for (const orderId of orderIds) {
        const response = await fetch(`/api/orders/${orderId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          ordersToPrintData.push(data.order);
        }
      }

      if (ordersToPrintData.length === 0) {
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לטעון את פרטי ההזמנות',
          variant: 'destructive',
        });
        setLoadingPrint(false);
        return;
      }

      // Set orders to print and show print view
      setOrdersToPrint(ordersToPrintData);
      setShowPrintView(true);

      // Wait for the print view to render, then trigger print
      setTimeout(() => {
        window.print();
        setLoadingPrint(false);
      }, 500);
    } catch (error) {
      console.error('Error loading orders for print:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת ההזמנות להדפסה',
        variant: 'destructive',
      });
      setLoadingPrint(false);
    }
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

  const handleMarkAsRead = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/mark-read`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'ההזמנה סומנה כנקראה',
        });
        loadOrders();
        // ✅ עדכן את המונה ב-Sidebar
        window.dispatchEvent(new CustomEvent('orderMarkedAsRead'));
        // Trigger custom event to update sidebar
        window.dispatchEvent(new CustomEvent('orderMarkedAsRead'));
      } else {
        toast({
          title: 'שגיאה',
          description: 'לא הצלחנו לסמן את ההזמנה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error marking order as read:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בסימון ההזמנה',
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

  const getFulfillmentStatusBadgeColor = (status: string) => {
    // First, check if it's a custom status with a color
    const customStatus = customStatuses.find(s => s.name === status);
    if (customStatus && customStatus.color) {
      // If color is a hex value or CSS color, return inline style compatible classes
      if (customStatus.color.startsWith('#') || customStatus.color.startsWith('rgb')) {
        return 'bg-gray-100'; // Will use inline style for custom colors
      }
      // If it's a tailwind-like color class
      return `bg-${customStatus.color}-100 text-${customStatus.color}-800`;
    }
    
    switch (status) {
      case 'pending':
      case 'unfulfilled':
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
    // First, check if it's a custom status
    const customStatus = customStatuses.find(s => s.name === status);
    if (customStatus) {
      return customStatus.display_name;
    }
    
    // Fallback to built-in labels
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
      'unfulfilled': 'ממתין לביצוע',
    };
    return labels[status] || status;
  };

  const columns: TableColumn<OrderWithDetails>[] = [
    {
      key: 'order_name',
      label: 'מספר הזמנה',
      render: (order) => (
        <div className="flex items-center gap-2">
          {!order.is_read && (
            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" title="הזמנה חדשה"></span>
          )}
          <div className={`font-medium ${!order.is_read ? 'text-gray-900 font-semibold' : 'text-gray-900'}`}>
            {order.order_name || `#${order.order_number || order.id}`}
          </div>
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
      key: 'fulfillment_status',
      label: 'סטטוס ביצוע',
      render: (order) => {
        const status = order.fulfillment_status;
        if (!status) {
          return <span className="text-gray-400 text-xs">לא בוצע</span>;
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getFulfillmentStatusBadgeColor(status)}`}>
            {getFulfillmentStatusLabel(status)}
          </span>
        );
      },
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


  return (
    <>
      <div className="space-y-4 md:space-y-6 orders-page-content" dir="rtl">
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
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintMultipleOrders(e);
                }}
                variant="default"
                className="hidden md:flex"
                disabled={loadingPrint}
              >
                {loadingPrint ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    טוען...
                  </>
                ) : (
                  <>
                    <HiPrinter className="w-4 h-4 ml-2" />
                    הדפס {selectedOrders.size} נבחרו
                  </>
                )}
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

            {/* Fulfillment Status Filter */}
            <select
              value={fulfillmentStatusFilter}
              onChange={(e) => {
                setFulfillmentStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all w-full md:w-[180px] flex-shrink-0"
            >
              <option value="">כל הסטטוסים</option>
              {/* ✅ מציג את הסטטוסים הסטנדרטיים */}
              <option value="pending">ממתין</option>
              <option value="paid">שולם</option>
              <option value="approved">מאושר</option>
              <option value="processing">מעובד</option>
              <option value="shipped">נשלח</option>
              <option value="delivered">נמסר</option>
              <option value="canceled">בוטל</option>
              <option value="returned">הוחזר</option>
              <option value="fulfilled">הושלם</option>
              <option value="partial">חלקי</option>
              <option value="restocked">הוחזר למלאי</option>
              {/* ✅ מציג את הסטטוסים המותאמים אישית */}
              {customStatuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.display_name}
                </option>
              ))}
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Load full order details for quick view
                          setLoadingQuickView(order.id);
                          try {
                            const response = await fetch(`/api/orders/${order.id}`, {
                              credentials: 'include',
                            });
                            if (response.ok) {
                              const data = await response.json();
                              setQuickViewOrder(data.order);
                              setQuickViewOpen(true);
                            }
                          } catch (error) {
                            console.error('Error loading order details:', error);
                          } finally {
                            setLoadingQuickView(null);
                          }
                        }}
                        disabled={loadingQuickView === order.id}
                        className="p-2 hover:bg-gray-100 rounded-r-none rounded-l transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="צפייה מהירה"
                      >
                        {loadingQuickView === order.id ? (
                          <HiRefresh className="w-5 h-5 text-gray-600 animate-spin" />
                        ) : (
                          <HiEye className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      <button 
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded-l-none rounded-r transition-colors"
                      >
                        <HiDotsVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  }
                  items={[
                    {
                      label: 'צפה בהזמנה',
                      icon: <HiEye className="w-4 h-4" />,
                      onClick: () => router.push(`/orders/${order.id}`),
                    },
                    ...(!order.is_read ? [{
                      label: 'סמן כנקרא',
                      icon: <HiCheckCircle className="w-4 h-4" />,
                      onClick: () => handleMarkAsRead(order.id),
                    }] : []),
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
                  <span>פרטים</span>
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">החלף סטטוס הזמנה</h2>
                  <p className="text-gray-600 text-sm">בחר סטטוס חדש להזמנה</p>
                </div>
                <button
                  onClick={() => {
                    setIsStatusDialogOpen(false);
                    setSelectedOrderForStatus(null);
                    setNewFulfillmentStatus('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="py-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">סטטוס ביצוע</label>
                
                {/* Status List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {[
                    { value: 'pending', label: 'ממתין', color: 'bg-orange-100 text-orange-800' },
                    { value: 'paid', label: 'שולם', color: 'bg-green-100 text-green-800' },
                    { value: 'approved', label: 'מאושר', color: 'bg-blue-100 text-blue-800' },
                    { value: 'processing', label: 'מעובד', color: 'bg-purple-100 text-purple-800' },
                    { value: 'shipped', label: 'נשלח', color: 'bg-cyan-100 text-cyan-800' },
                    { value: 'delivered', label: 'נמסר', color: 'bg-green-100 text-green-800' },
                    { value: 'canceled', label: 'בוטל', color: 'bg-red-100 text-red-800' },
                    { value: 'returned', label: 'הוחזר', color: 'bg-gray-100 text-gray-800' },
                  ].map((status) => {
                    const isSelected = newFulfillmentStatus === status.value;
                    const colorClass = status.color.split(' ')[0];
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setNewFulfillmentStatus(status.value)}
                        className={`w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-gray-50' : ''
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {!isSelected && <div className="w-5 h-5 flex-shrink-0"></div>}
                        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                        <span className="flex-1 text-sm text-gray-900">{status.label}</span>
                      </button>
                    );
                  })}
                  
                  {/* Custom Statuses */}
                  {customStatuses.map((status) => {
                    const isSelected = newFulfillmentStatus === status.name;
                    // Parse color - can be hex, rgb, or tailwind class name
                    const getDotColor = () => {
                      if (!status.color) return 'bg-gray-500';
                      // If it's a hex or rgb color
                      if (status.color.startsWith('#') || status.color.startsWith('rgb')) {
                        return status.color;
                      }
                      // Try to map common color names to tailwind classes
                      const colorMap: Record<string, string> = {
                        'orange': 'bg-orange-500',
                        'blue': 'bg-blue-500',
                        'green': 'bg-green-500',
                        'purple': 'bg-purple-500',
                        'cyan': 'bg-cyan-500',
                        'red': 'bg-red-500',
                        'gray': 'bg-gray-500',
                        'yellow': 'bg-yellow-500',
                      };
                      return colorMap[status.color.toLowerCase()] || 'bg-gray-500';
                    };
                    const dotColor = getDotColor();
                    const isHexOrRgb = dotColor.startsWith('#') || dotColor.startsWith('rgb');
                    
                    return (
                      <button
                        key={status.id}
                        type="button"
                        onClick={() => setNewFulfillmentStatus(status.name)}
                        className={`w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-gray-50' : ''
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {!isSelected && <div className="w-5 h-5 flex-shrink-0"></div>}
                        <div 
                          className={`w-3 h-3 rounded-full ${!isHexOrRgb ? dotColor : ''}`}
                          style={isHexOrRgb ? { backgroundColor: dotColor } : undefined}
                        ></div>
                        <span className="flex-1 text-sm text-gray-900">{status.display_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => {
                  setIsStatusDialogOpen(false);
                  setSelectedOrderForStatus(null);
                  setNewFulfillmentStatus('');
                }}>
                  ביטול
                </Button>
                <Button
                  onClick={handleStatusChange}
                  disabled={updatingStatus || !newFulfillmentStatus}
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

      {/* Quick View Modal */}
      <OrderQuickView
        order={quickViewOrder}
        open={quickViewOpen}
        onClose={() => {
          setQuickViewOpen(false);
          setQuickViewOrder(null);
        }}
        onMarkAsRead={handleMarkAsRead}
        onPrint={(order) => {
          // Use the smart print method
          setOrdersToPrint([order]);
          setShowPrintView(true);
          setQuickViewOpen(false);
          setTimeout(() => {
            window.print();
          }, 500);
        }}
      />

      </div>

      {/* Bulk Print View - Hidden on screen, visible when printing */}
      {showPrintView && ordersToPrint.length > 0 && (
        <BulkPrintView orders={ordersToPrint} />
      )}
    </>
  );
}
