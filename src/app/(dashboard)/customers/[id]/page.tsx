'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { 
  HiArrowRight, 
  HiPencil,
  HiMail,
  HiPhone,
  HiOfficeBuilding,
  HiLocationMarker,
  HiShoppingBag,
  HiCheckCircle,
  HiXCircle,
  HiTag,
  HiUser,
  HiRefresh,
} from 'react-icons/hi';
import { CustomerWithDetails, CustomerAddress, CustomerNote } from '@/types/customer';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Order } from '@/types/order';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const customerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteStaffOnly, setNoteStaffOnly] = useState(false);

  useEffect(() => {
    if (customerId) {
      const abortController = new AbortController();
      const signal = abortController.signal;

      loadCustomer(signal);
      loadOrders();

      return () => {
        abortController.abort();
      };
    }
  }, [customerId]);

  const loadCustomer = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/orders');
          return;
        }
        throw new Error('Failed to load customer');
      }
      const data = await response.json();
      setCustomer(data.customer);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading customer:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת הלקוח',
        variant: 'destructive',
      });
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch(`/api/orders?customer_id=${customerId}&limit=20`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSave = async () => {
    if (!customer) return;

    try {
      setSaving(true);
      
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update customer');
      }

      toast({
        title: 'הצלחה',
        description: 'הלקוח עודכן בהצלחה',
      });
      
      await loadCustomer();
      setIsEditing(false);
      setEditData({});
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בעדכון הלקוח',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/customers/${customerId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          note: newNote,
          staff_only: noteStaffOnly,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add note');
      }

      toast({
        title: 'הצלחה',
        description: 'ההערה נוספה בהצלחה',
      });
      
      await loadCustomer();
      setShowNoteDialog(false);
      setNewNote('');
      setNoteStaffOnly(false);
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בהוספת ההערה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getCustomerName = (customer: CustomerWithDetails) => {
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    return customer.email || 'לקוח ללא שם';
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'paid': 'שולם',
      'pending': 'ממתין לתשלום',
      'refunded': 'הוחזר',
      'voided': 'בוטל',
    };
    return labels[status] || status;
  };

  const orderColumns: TableColumn<Order>[] = [
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
      key: 'financial_status',
      label: 'סטטוס תשלום',
      render: (order) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.financial_status)}`}>
          {getStatusLabel(order.financial_status)}
        </span>
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
          {new Date(order.created_at).toLocaleDateString('he-IL')}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-gray-500">לקוח לא נמצא</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getCustomerName(customer)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            נוצר ב-{new Date(customer.created_at).toLocaleString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            חזרה
          </Button>
          {!isEditing && (
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditing(true);
                setEditData({
                  email: customer.email || '',
                  first_name: customer.first_name || '',
                  last_name: customer.last_name || '',
                  phone: customer.phone || '',
                  accepts_marketing: customer.accepts_marketing,
                  tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : [],
                  note: customer.note || '',
                });
              }}
            >
              <HiPencil className="w-4 h-4 ml-1" />
              ערוך
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-2">מספר הזמנות</div>
            <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HiShoppingBag className="w-6 h-6" />
              {customer.orders_count || 0}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-2">סכום כולל</div>
            <div className="text-2xl font-bold text-gray-900">
              ₪{parseFloat(customer.total_spent || '0').toLocaleString('he-IL')}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-500 mb-2">אישור דיוור</div>
            <div className="flex items-center gap-2">
              {customer.accepts_marketing ? (
                <>
                  <HiCheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">מאושר</span>
                </>
              ) : (
                <>
                  <HiXCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">לא מאושר</span>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">פרטי לקוח</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({
                        email: customer.email || '',
                        first_name: customer.first_name || '',
                        last_name: customer.last_name || '',
                        phone: customer.phone || '',
                        accepts_marketing: customer.accepts_marketing,
                        tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : [],
                        note: customer.note || '',
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
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">אימייל *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      placeholder="example@email.com"
                    />
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">שם פרטי</Label>
                      <Input
                        id="first_name"
                        value={editData.first_name}
                        onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        placeholder="שם פרטי"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">שם משפחה</Label>
                      <Input
                        id="last_name"
                        value={editData.last_name}
                        onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        placeholder="שם משפחה"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">טלפון</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="050-1234567"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
                    <Input
                      id="tags"
                      value={Array.isArray(editData.tags) ? editData.tags.join(', ') : editData.tags || ''}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          tags: e.target.value
                            .split(',')
                            .map((t: string) => t.trim())
                            .filter((t: string) => t.length > 0),
                        })
                      }
                      placeholder="תגית1, תגית2, תגית3"
                    />
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label htmlFor="note">הערה</Label>
                    <Textarea
                      id="note"
                      value={editData.note || ''}
                      onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                      placeholder="הערות על הלקוח..."
                      rows={3}
                    />
                  </div>

                  {/* Accepts Marketing */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="accepts_marketing"
                      checked={editData.accepts_marketing || false}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          accepts_marketing: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="accepts_marketing" className="cursor-pointer">
                      אישור דיוור שיווקי
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'שומר...' : 'שמור שינויים'}
                    </Button>
                    <Button
                      variant="ghost"
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
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <HiMail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 mb-1">אימייל</div>
                      <div className="text-gray-900 font-medium">{customer.email || '-'}</div>
                    </div>
                  </div>

                  {/* Name */}
                  {(customer.first_name || customer.last_name) && (
                    <div className="flex items-start gap-3">
                      <HiUser className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">שם</div>
                        <div className="text-gray-900 font-medium">
                          {getCustomerName(customer)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {customer.phone && (
                    <div className="flex items-start gap-3">
                      <HiPhone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">טלפון</div>
                        <div className="text-gray-900">{customer.phone}</div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {customer.tags && (
                    <div className="flex items-start gap-3">
                      <HiTag className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">תגיות</div>
                        <div className="flex flex-wrap gap-2">
                          {customer.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {customer.note && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">הערה</div>
                        <div className="text-gray-900 whitespace-pre-wrap">{customer.note}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Orders */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">הזמנות</h2>
              {loadingOrders ? (
                <div className="text-center py-8">
                  <HiRefresh className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                </div>
              ) : orders.length > 0 ? (
                <DataTable
                  title=""
                  description=""
                  primaryAction={undefined}
                  secondaryActions={undefined}
                  searchPlaceholder=""
                  onSearch={undefined}
                  filters={undefined}
                  columns={orderColumns}
                  data={orders}
                  keyExtractor={(order) => order.id}
                  loading={false}
                  selectable={false}
                  onRowClick={(order) => router.push(`/orders/${order.id}`)}
                  noPadding={true}
                  emptyState={null}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  אין הזמנות להצגה
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">כתובות</h2>
                <div className="space-y-4">
                  {customer.addresses.map((address) => (
                    <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                      {address.default_address && (
                        <div className="text-xs text-green-600 font-medium mb-2">כתובת ברירת מחדל</div>
                      )}
                      <div className="text-sm text-gray-600 space-y-1">
                        {address.name && <div className="font-medium">{address.name}</div>}
                        {address.address1 && <div>{address.address1}</div>}
                        {address.address2 && <div>{address.address2}</div>}
                        {address.city && address.zip && (
                          <div>{address.city} {address.zip}</div>
                        )}
                        {address.country_name && <div>{address.country_name}</div>}
                        {address.phone && <div className="text-gray-500 mt-2">{address.phone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">הערות</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNoteDialog(true)}
                >
                  <HiPencil className="w-4 h-4 ml-1" />
                  הוסף הערה
                </Button>
              </div>
              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-4">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      {note.staff_only && (
                        <div className="text-xs text-orange-600 font-medium mb-2">רק לצוות</div>
                      )}
                      <div className="text-sm text-gray-900 whitespace-pre-wrap">{note.note}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(note.created_at).toLocaleString('he-IL')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  אין הערות
                </div>
              )}
            </div>
          </Card>

          {/* Customer Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">מידע נוסף</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500">סטטוס</div>
                  <div className="text-gray-900 font-medium">
                    {customer.state === 'enabled' ? 'פעיל' :
                     customer.state === 'disabled' ? 'מושבת' :
                     customer.state === 'invited' ? 'הוזמן' :
                     customer.state}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">אימייל מאומת</div>
                  <div className="flex items-center gap-2">
                    {customer.verified_email ? (
                      <>
                        <HiCheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">מאומת</span>
                      </>
                    ) : (
                      <>
                        <HiXCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">לא מאומת</span>
                      </>
                    )}
                  </div>
                </div>
                {customer.tax_exempt && (
                  <div>
                    <div className="text-gray-500">פטור ממס</div>
                    <div className="text-gray-900 font-medium">כן</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500">נוצר ב</div>
                  <div className="text-gray-900">
                    {new Date(customer.created_at).toLocaleString('he-IL')}
                  </div>
                </div>
                {customer.updated_at && customer.updated_at !== customer.created_at && (
                  <div>
                    <div className="text-gray-500">עודכן ב</div>
                    <div className="text-gray-900">
                      {new Date(customer.updated_at).toLocaleString('he-IL')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף הערה</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">הערה</Label>
              <Textarea
                id="note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="הזן הערה על הלקוח..."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="staff_only"
                checked={noteStaffOnly}
                onChange={(e) => setNoteStaffOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="staff_only" className="cursor-pointer">
                רק לצוות
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowNoteDialog(false);
              setNewNote('');
              setNoteStaffOnly(false);
            }}>
              ביטול
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={saving || !newNote.trim()}
            >
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

