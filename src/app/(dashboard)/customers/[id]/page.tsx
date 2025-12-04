'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiArrowRight, HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { CustomerWithDetails } from '@/types/customer';
import { OrderWithDetails } from '@/types/order';
import { CustomerTagsCard } from '@/components/customers/CustomerTagsCard';
import { CustomerSegmentsCard } from '@/components/customers/CustomerSegmentsCard';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (customerId) {
      const abortController = new AbortController();
      const signal = abortController.signal;

      // Load both in parallel
      Promise.all([
        loadCustomer(signal),
        loadCustomerOrders(signal),
      ]);

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
      
      if (!response.ok) throw new Error('Failed to load customer');
      const data = await response.json();
      setCustomer(data.customer);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading customer:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const loadCustomerOrders = async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/orders?customer_id=${customerId}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading orders:', error);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;

    try {
      const response = await fetch(`/api/customers/${customerId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: noteText, staff_only: true }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      setNoteText('');
      await loadCustomer();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('שגיאה בהוספת הערה');
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
            {customer.first_name || customer.last_name
              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
              : 'לקוח ללא שם'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{customer.email}</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          חזרה
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי לקוח</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <Input value={customer.email || ''} readOnly />
                </div>
                {customer.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                    <Input value={customer.phone} readOnly />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    customer.state === 'enabled' ? 'bg-green-100 text-green-800' :
                    customer.state === 'disabled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.state === 'enabled' ? 'פעיל' :
                     customer.state === 'disabled' ? 'מושבת' :
                     customer.state === 'invited' ? 'הוזמן' :
                     customer.state}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Orders History */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית הזמנות</h2>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">אין הזמנות</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.order_name || `#${order.order_number || order.id}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">
                          ₪{parseFloat(order.total_price).toLocaleString('he-IL')}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.financial_status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.financial_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.financial_status === 'paid' ? 'שולם' :
                           order.financial_status === 'pending' ? 'ממתין' :
                           order.financial_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">הערות</h2>
              <div className="space-y-4">
                {customer.notes && customer.notes.length > 0 ? (
                  <div className="space-y-3">
                    {customer.notes.map((note) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{note.note}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(note.created_at).toLocaleString('he-IL')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">אין הערות</p>
                )}
                <div className="flex gap-2">
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="הוסף הערה..."
                    onKeyPress={(e) => e.key === 'Enter' && addNote()}
                  />
                  <Button onClick={addNote}>הוסף</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">סטטיסטיקות</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">סה"כ הזמנות</div>
                  <div className="text-2xl font-bold text-gray-900">{customer.orders_count || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">סה"כ הוצאות</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₪{parseFloat(customer.total_spent || '0').toLocaleString('he-IL')}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">כתובות</h2>
                <div className="space-y-3">
                  {customer.addresses.map((address) => (
                    <div key={address.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {address.first_name} {address.last_name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {address.address1}
                        {address.address2 && `, ${address.address2}`}
                        <br />
                        {address.city}, {address.zip}
                        <br />
                        {address.country}
                      </div>
                      {address.default_address && (
                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          כתובת ברירת מחדל
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Tags */}
          <CustomerTagsCard
            customerId={parseInt(customerId)}
            initialTags={customer.tags ? customer.tags.split(',').map(t => t.trim()).filter(Boolean) : []}
            onTagsChange={() => loadCustomer()}
          />

          {/* Segments */}
          <CustomerSegmentsCard customerId={parseInt(customerId)} />
        </div>
      </div>
    </div>
  );
}

