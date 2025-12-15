'use client';

import { OrderWithDetails } from '@/types/order';

interface BulkPrintViewProps {
  orders: OrderWithDetails[];
}

export function BulkPrintView({ orders }: BulkPrintViewProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'שולם';
      case 'pending':
        return 'ממתין לתשלום';
      case 'refunded':
        return 'הוחזר';
      case 'voided':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getFulfillmentStatusLabel = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return 'בוצע';
      case 'pending':
        return 'ממתין';
      case 'shipped':
        return 'נשלח';
      default:
        return status || 'לא בוצע';
    }
  };

  return (
    <div className="print-view-container" dir="rtl">
      <style jsx global>{`
        @media print {
          /* Reset */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide everything except print view */
          .orders-page-content,
          header,
          aside,
          footer,
          nav,
          .no-print {
            display: none !important;
          }
          
          /* Show print view */
          .print-view-container {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Page breaks */
          .print-order-page {
            page-break-after: always;
            padding: 20px;
          }
          .print-order-page:last-child {
            page-break-after: avoid;
          }
        }
        
        @media screen {
          .print-view-container {
            display: none !important;
          }
        }
      `}</style>
      
      {orders.map((order, index) => {
        const subtotal = order.line_items?.reduce((sum, item) => {
          return sum + (parseFloat(item.price) * item.quantity);
        }, 0) || 0;

        const totalDiscount = order.discount_codes?.reduce((sum, discount) => {
          return sum + (parseFloat(discount.amount || '0'));
        }, 0) || 0;

        const shippingPrice = parseFloat(order.shipping_price || '0');
        const total = subtotal - totalDiscount + shippingPrice;

        return (
          <div key={order.id} className="print-order-page">
            {/* Order Header */}
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                הזמנה {order.order_name || `#${order.order_number || order.id}`}
              </h1>
              <p style={{ color: '#666', fontSize: '14px' }}>
                תאריך: {new Date(order.created_at).toLocaleString('he-IL')}
              </p>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              {/* Customer Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
                  פרטי לקוח
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {order.name && <div><strong>שם:</strong> {order.name}</div>}
                  {order.email && <div><strong>אימייל:</strong> {order.email}</div>}
                  {order.phone && <div><strong>טלפון:</strong> {order.phone}</div>}
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
                    כתובת משלוח
                  </h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    {order.shipping_address.first_name && (
                      <div>{order.shipping_address.first_name} {order.shipping_address.last_name}</div>
                    )}
                    {order.shipping_address.address1 && <div>{order.shipping_address.address1}</div>}
                    {order.shipping_address.address2 && <div>{order.shipping_address.address2}</div>}
                    {order.shipping_address.city && (
                      <div>{order.shipping_address.city}{order.shipping_address.zip && `, ${order.shipping_address.zip}`}</div>
                    )}
                    {order.shipping_address.country && <div>{order.shipping_address.country}</div>}
                  </div>
                </div>
              )}

              {/* Status */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
                  סטטוס
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div><strong>תשלום:</strong> {getStatusLabel(order.financial_status)}</div>
                  <div><strong>ביצוע:</strong> {getFulfillmentStatusLabel(order.fulfillment_status)}</div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
                פריטי הזמנה
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>מוצר</th>
                    <th style={{ textAlign: 'center', padding: '8px 0' }}>כמות</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>מחיר</th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>סה"כ</th>
                  </tr>
                </thead>
                <tbody>
                  {order.line_items?.map((item) => {
                    let title = item.title || '';
                    if (title.includes('Default Title')) {
                      title = title.replace(/ - Default Title/g, '').replace(/Default Title - /g, '').replace(/Default Title/g, '').trim();
                    }
                    const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : null;
                    
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 0' }}>
                          <div style={{ fontWeight: '500' }}>{title}</div>
                          {variantTitle && <div style={{ fontSize: '12px', color: '#666' }}>{variantTitle}</div>}
                          {item.sku && <div style={{ fontSize: '12px', color: '#999' }}>SKU: {item.sku}</div>}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 0' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'left', padding: '12px 0' }}>₪{parseFloat(item.price).toLocaleString('he-IL')}</td>
                        <td style={{ textAlign: 'left', padding: '12px 0', fontWeight: '500' }}>
                          ₪{(parseFloat(item.price) * item.quantity).toLocaleString('he-IL')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '250px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span>סה"כ פריטים:</span>
                  <span>₪{subtotal.toLocaleString('he-IL')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', color: '#059669' }}>
                    <span>הנחה:</span>
                    <span>-₪{totalDiscount.toLocaleString('he-IL')}</span>
                  </div>
                )}
                {shippingPrice > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <span>משלוח:</span>
                    <span>₪{shippingPrice.toLocaleString('he-IL')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid #000' }}>
                  <span>סה"כ לתשלום:</span>
                  <span>₪{total.toLocaleString('he-IL')}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.note && (
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>הערות:</h4>
                <p style={{ fontSize: '14px', color: '#374151' }}>{order.note}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
