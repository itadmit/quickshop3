'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiCheckCircle, HiClock } from 'react-icons/hi';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';
import { Truck } from 'lucide-react';

interface Order {
  id: number;
  order_name: string;
  order_number: string;
  email: string;
  phone?: string;
  name: string;
  total_price: string;
  subtotal_price: string;
  total_shipping_price: string;
  total_discounts: string;
  financial_status: string;
  fulfillment_status: string;
  billing_address?: {
    first_name?: string;
    last_name?: string;
    address1?: string;
    city?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    address1?: string;
    city?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  delivery_method?: 'shipping' | 'pickup';
  payment_method?: 'credit_card' | 'bank_transfer' | 'cash';
  line_items: Array<{
    id: number;
    title: string;
    variant_title: string;
    quantity: number;
    price: string;
    image?: string;
    properties?: Array<{ name: string; value: string }>;
  }>;
}

interface CheckoutSuccessProps {
  orderId?: number;
  orderHandle?: string;
  storeSlug: string;
  storeName: string;
  storeLogo?: string | null;
}

export function CheckoutSuccess({ orderId, orderHandle, storeSlug, storeName, storeLogo }: CheckoutSuccessProps) {
  const { t, loading: translationsLoading } = useTranslation('storefront');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        
        // שימוש ב-handle אם קיים, אחרת orderId (legacy support)
        const identifier = orderHandle || (orderId ? orderId.toString() : null);
        if (!identifier) {
          if (!cancelled) {
            setError(t('order_success.order_not_found'));
            setLoading(false);
          }
          return;
        }

        const url = `/api/orders/${identifier}${orderHandle ? `?byHandle=true&storeSlug=${encodeURIComponent(storeSlug)}` : `?storeSlug=${encodeURIComponent(storeSlug)}`}`;
        
        const response = await fetch(url, {
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (cancelled) return;
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[CheckoutSuccess] API error:', { status: response.status, error: errorData });
          throw new Error(errorData.error || 'Failed to fetch order');
        }
        
        const data = await response.json();
        
        if (!cancelled) {
          // Handle both response formats: {order: {...}} or direct order object
          const orderData = data.order || data;
          // Ensure line_items exists and is an array
          if (!orderData.line_items) {
            orderData.line_items = [];
          }
          setOrder(orderData);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[CheckoutSuccess] Error fetching order:', err);
          setError(err.message || t('order_success.error_loading'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (orderId || orderHandle) {
      fetchOrder();
    } else {
      setLoading(false);
      setError(t('order_success.order_not_found'));
    }
    
    return () => {
      cancelled = true;
    };
  }, [orderId, orderHandle, storeSlug]); // הסרת t מה-dependencies כדי למנוע לולאה אינסופית

  const isOrderConfirmed = order?.financial_status === 'paid' || order?.financial_status === 'pending';

  return (
    <div 
      className="min-h-screen w-full" 
      dir="rtl"
      style={{ 
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header - כמו בצ'ק אאוט */}
      <div className="w-full bg-white border-b border-gray-200">
        {/* Mobile: Logo and Back in same row */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4">
          <Link 
            href={`/shops/${storeSlug}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>→</span>
            <span>{translationsLoading ? <TextSkeleton width="w-24" height="h-4" /> : t('order_success.back_to_store')}</span>
          </Link>
          <div className="flex items-center gap-3">
            {storeLogo && (
              <img
                src={storeLogo}
                alt={storeName}
                className="h-8 w-8 object-contain"
              />
            )}
            <h1 className="text-xl font-bold uppercase">{storeName}</h1>
          </div>
        </div>
        
        {/* Desktop: Same layout as before */}
        <div className="hidden lg:grid grid-cols-5 gap-0">
          <div className="col-span-3 flex justify-end">
            <div className="w-full max-w-3xl pl-8 pr-4 py-4 flex items-center">
              <Link 
                href={`/shops/${storeSlug}`}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>→</span>
                <span>{translationsLoading ? <TextSkeleton width="w-24" height="h-4" /> : t('order_success.back_to_store')}</span>
              </Link>
            </div>
          </div>
          <div className="col-span-2 border-b border-gray-200 flex justify-start" style={{ backgroundColor: '#fafafa' }}>
            <div className="w-full max-w-md px-8 py-4 flex items-center justify-end gap-3">
              {storeLogo && (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="h-8 w-8 object-contain"
                />
              )}
              <h1 className="text-xl font-bold uppercase">{storeName}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Left Side - Order Confirmation (כמו הטופס בצ'ק אאוט) */}
          <div 
            className="lg:col-span-3 min-h-screen flex justify-end"
            style={{
              backgroundColor: '#ffffff',
            }}
          >
            <div className="w-full max-w-3xl pl-8 pr-4 py-8 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {translationsLoading ? (
                        <TextSkeleton width="w-32" height="h-6" className="mx-auto" />
                      ) : (
                        t('order_success.loading_order')
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {translationsLoading ? (
                        <TextSkeleton width="w-48" height="h-4" className="mx-auto" />
                      ) : (
                        t('order_success.loading_message')
                      )}
                    </div>
                  </div>
                </div>
              ) : order ? (
                <>
                  {/* Order Status */}
                  <div className="text-center py-8">
                    {isOrderConfirmed ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                          <HiCheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          {translationsLoading ? (
                            <TextSkeleton width="w-64" height="h-10" />
                          ) : (
                            t('order_success.title')
                          )}
                        </h1>
                        <p className="text-gray-600 text-lg">
                          {translationsLoading ? (
                            <TextSkeleton width="w-48" height="h-6" />
                          ) : (
                            t('order_success.confirmation_message', { 
                              name: order.name?.split(' ')[0] || order.email?.split('@')[0] || 'לקוח יקר'
                            })
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                          <HiClock className="w-12 h-12 text-yellow-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          {translationsLoading ? (
                            <TextSkeleton width="w-64" height="h-10" />
                          ) : (
                            t('order_success.processing')
                          )}
                        </h1>
                        <p className="text-gray-600 text-lg">
                          {translationsLoading ? (
                            <TextSkeleton width="w-48" height="h-6" />
                          ) : (
                            t('order_success.processing_message')
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {translationsLoading ? (
                          <TextSkeleton width="w-24" height="h-4" />
                        ) : (
                          t('order_success.order_number')
                        )}
                      </p>
                      <p className="text-xl font-bold">{order.order_name || `#${order.order_number || order.id}`}</p>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">פרטי המזמין</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">שם: </span>
                          <span className="font-medium">{order.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">אימייל: </span>
                          <span className="font-medium">{order.email}</span>
                        </div>
                        {order.phone && (
                          <div>
                            <span className="text-gray-500">טלפון: </span>
                            <span className="font-medium">{order.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Shipping Address */}
                    {order.shipping_address && (
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">כתובת משלוח</h3>
                        <div className="space-y-1 text-sm text-gray-700">
                          {order.shipping_address.first_name && order.shipping_address.last_name && (
                            <div>{order.shipping_address.first_name} {order.shipping_address.last_name}</div>
                          )}
                          {order.shipping_address.address1 && (
                            <div>{order.shipping_address.address1}</div>
                          )}
                          {order.shipping_address.city && (
                            <div>{order.shipping_address.city}{order.shipping_address.zip ? ` ${order.shipping_address.zip}` : ''}</div>
                          )}
                          {order.shipping_address.country && (
                            <div>{order.shipping_address.country}</div>
                          )}
                          {order.shipping_address.phone && (
                            <div className="text-gray-500">{order.shipping_address.phone}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Delivery & Payment Methods */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">שיטת משלוח: </span>
                          <span className="font-medium">
                            {order.delivery_method === 'pickup' ? 'איסוף עצמי' : 'משלוח'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">שיטת תשלום: </span>
                          <span className="font-medium">
                            {order.payment_method === 'credit_card' ? 'כרטיס אשראי' :
                             order.payment_method === 'bank_transfer' ? 'העברה בנקאית' :
                             order.payment_method === 'cash' ? 'מזומן' :
                             'כרטיס אשראי'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-4">
                        {translationsLoading ? (
                          <TextSkeleton width="w-full" height="h-4" />
                        ) : (
                          t('order_success.email_sent')
                        )}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                          href={`/shops/${storeSlug}/products`}
                          className="inline-block bg-black hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-center"
                        >
                          {translationsLoading ? (
                            <TextSkeleton width="w-32" height="h-5" className="mx-auto" />
                          ) : (
                            t('order_success.continue_shopping')
                          )}
                        </Link>
                        <Link
                          href={`/shops/${storeSlug}`}
                          className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-lg transition-colors text-center"
                        >
                          {translationsLoading ? (
                            <TextSkeleton width="w-32" height="h-5" className="mx-auto" />
                          ) : (
                            t('order_success.back_to_home')
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">
                      {translationsLoading ? (
                        <TextSkeleton width="w-48" height="h-4" className="mx-auto" />
                      ) : (
                        t('order_success.error_loading')
                      )}
                    </p>
                  </div>
                ) : null}
            </div>
          </div>

          {/* Right Side - Order Summary (כמו סיכום הזמנה בצ'ק אאוט) */}
          <div 
            className="lg:col-span-2 min-h-screen flex justify-start"
            style={{
              backgroundColor: '#fafafa',
            }}
          >
            <div className="w-full max-w-md px-8 py-8">
              <div 
                className="p-6 sticky top-24"
                style={{ 
                  backgroundColor: '#fafafa',
                }}
              >
                <h2 className="text-lg font-semibold mb-6">
                  {translationsLoading ? (
                    <TextSkeleton width="w-32" height="h-6" />
                  ) : (
                    t('order_success.order_summary')
                  )}
                </h2>
                
                {loading ? (
                  <div className="space-y-4">
                    <TextSkeleton width="w-full" height="h-20" />
                    <TextSkeleton width="w-full" height="h-20" />
                  </div>
                ) : order ? (
                  <>
                    {/* Order Items */}
                    <div className="space-y-4 mb-6">
                      {order.line_items && order.line_items.length > 0 ? order.line_items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          {item.image ? (
                            <div className="relative">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                                {item.quantity}
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded flex items-center justify-center relative bg-gray-100">
                              <Truck className="w-8 h-8 text-gray-400" />
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                                {item.quantity}
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm line-clamp-2">
                              {item.title}
                            </div>
                            {item.properties && item.properties.length > 0 && (
                              <div className="text-xs mt-0.5 text-gray-500 space-y-0.5">
                                {item.properties.map((prop, idx) => (
                                  <div key={idx}>
                                    {prop.name}: {prop.value}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="font-medium text-base">
                            ₪{parseFloat(item.price).toFixed(2)}
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                          {translationsLoading ? (
                            <TextSkeleton width="w-32" height="h-4" className="mx-auto" />
                          ) : (
                            t('order_success.no_items')
                          )}
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span>{t('order_success.subtotal')}</span>
                        <span>₪{parseFloat(order.subtotal_price).toFixed(2)}</span>
                      </div>
                      {parseFloat(order.total_shipping_price) > 0 ? (
                        <div className="flex justify-between text-sm">
                          <span>{t('order_success.shipping')}</span>
                          <span>₪{parseFloat(order.total_shipping_price).toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>{t('order_success.shipping')}</span>
                          <span>{t('order_success.shipping_free')}</span>
                        </div>
                      )}
                      {parseFloat(order.total_discounts) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>{t('order_success.discount')}</span>
                          <span>-₪{parseFloat(order.total_discounts).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                        <span>{t('order_success.total')}</span>
                        <span>₪{parseFloat(order.total_price).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : error ? (
                  <div className="text-red-600 text-sm">{error}</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

