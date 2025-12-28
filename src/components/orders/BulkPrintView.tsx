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
            <div style={{ borderBottom: '3px solid #000', paddingBottom: '20px', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>
                פרטי הזמנה {order.order_name || `#${order.order_number || order.id}`}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                תאריך: {new Date(order.created_at).toLocaleDateString('he-IL', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
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
                מוצרים בהזמנה
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'right', padding: '12px', width: '80px' }}>תמונה</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>מוצר</th>
                    <th style={{ textAlign: 'center', padding: '12px', width: '80px' }}>כמות</th>
                    <th style={{ textAlign: 'left', padding: '12px', width: '120px' }}>מחיר</th>
                    <th style={{ textAlign: 'left', padding: '12px', width: '120px' }}>סה"כ</th>
                  </tr>
                </thead>
                <tbody>
                  {order.line_items?.map((item) => {
                    let title = item.title || '';
                    if (title.includes('Default Title')) {
                      title = title.replace(/ - Default Title/g, '').replace(/Default Title - /g, '').replace(/Default Title/g, '').trim();
                    }
                    const variantTitle = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : null;
                    
                    // ✅ בדיקה אם זה מוצר מתנה
                    const parsedProperties = item.properties 
                      ? (typeof item.properties === 'string' ? JSON.parse(item.properties) : item.properties)
                      : null;
                    const isGiftProduct = parsedProperties && Array.isArray(parsedProperties)
                      ? parsedProperties.some((prop: { name: string; value: string }) => prop.name === 'מתנה')
                      : parsedProperties && typeof parsedProperties === 'object' && !Array.isArray(parsedProperties)
                      ? Object.keys(parsedProperties).some(key => key === 'מתנה' || parsedProperties[key]?.name === 'מתנה')
                      : false;
                    const giftDiscountName = parsedProperties && Array.isArray(parsedProperties)
                      ? parsedProperties.find((prop: { name: string; value: string }) => prop.name === 'מתנה')?.value
                      : null;
                    
                    // ✅ חילוץ תמונה מ-properties או מ-image
                    let imageUrl = null;
                    if ((item as any).image) {
                      imageUrl = (item as any).image;
                    } else if (parsedProperties && Array.isArray(parsedProperties)) {
                      const imageProperty = parsedProperties.find((p: any) => p.name === '_image');
                      if (imageProperty) {
                        imageUrl = imageProperty.value;
                      }
                    }
                    
                    // ✅ חישוב מחיר מקורי ומחיר אחרי הנחה
                    const itemPrice = parseFloat(item.price || '0');
                    const itemDiscount = parseFloat(item.total_discount || '0');
                    const originalPricePerUnit = itemDiscount > 0 ? itemPrice + (itemDiscount / item.quantity) : itemPrice;
                    const hasDiscount = itemDiscount > 0;
                    
                    // ✅ חילוץ ארציה מ-properties אם יש
                    let originCountry = null;
                    if (parsedProperties && Array.isArray(parsedProperties)) {
                      const originProperty = parsedProperties.find((p: any) => 
                        p.name === 'ארציה' || p.name === 'origin' || p.name === 'country' || p.name === 'Country of Origin'
                      );
                      if (originProperty) {
                        originCountry = originProperty.value;
                      }
                    }
                    
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: isGiftProduct ? '#f0fdf4' : 'white' }}>
                        {/* תמונה */}
                        <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={title}
                              style={{ 
                                width: '60px', 
                                height: '60px', 
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #e5e7eb'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div style={{ 
                              width: '60px', 
                              height: '60px', 
                              backgroundColor: '#f3f4f6',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              fontSize: '10px',
                              border: '1px solid #e5e7eb'
                            }}>
                              אין תמונה
                            </div>
                          )}
                        </td>
                        
                        {/* פרטי המוצר */}
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#111827' }}>
                            {title}
                            {isGiftProduct && (
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: '600', 
                                backgroundColor: '#16a34a', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '8px',
                                display: 'inline-block',
                                marginRight: '6px',
                                verticalAlign: 'middle'
                              }}>
                                מתנה
                              </span>
                            )}
                          </div>
                          
                          {/* וריאציה */}
                          {variantTitle && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                              {variantTitle}
                            </div>
                          )}
                          
                          {/* מקט */}
                          {item.sku && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>
                              מקט: {item.sku}
                            </div>
                          )}
                          
                          {/* ארציה */}
                          {originCountry && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>
                              ארציה: {originCountry}
                            </div>
                          )}
                          
                          {/* הודעת מתנה */}
                          {isGiftProduct && giftDiscountName && (
                            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '500', marginTop: '4px' }}>
                              מתנה מהנחת {giftDiscountName}
                            </div>
                          )}
                        </td>
                        
                        {/* כמות */}
                        <td style={{ textAlign: 'center', padding: '12px', verticalAlign: 'middle', fontWeight: '500' }}>
                          {item.quantity}
                        </td>
                        
                        {/* מחיר */}
                        <td style={{ textAlign: 'left', padding: '12px', verticalAlign: 'middle' }}>
                          {hasDiscount ? (
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through', marginBottom: '2px' }}>
                                ₪{originalPricePerUnit.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                                ₪{itemPrice.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                              ₪{itemPrice.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                        
                        {/* סה"כ */}
                        <td style={{ textAlign: 'left', padding: '12px', verticalAlign: 'middle', fontWeight: '600' }}>
                          {hasDiscount ? (
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through', marginBottom: '2px' }}>
                                ₪{(originalPricePerUnit * item.quantity).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div style={{ fontSize: '14px', color: '#059669' }}>
                                ₪{(itemPrice * item.quantity).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '14px' }}>
                              ₪{(itemPrice * item.quantity).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <div style={{ width: '300px', fontSize: '14px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: '500', color: '#374151' }}>סה"כ פריטים:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>₪{subtotal.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#059669' }}>
                    <span style={{ fontWeight: '500' }}>הנחה:</span>
                    <span style={{ fontWeight: '600' }}>-₪{totalDiscount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {shippingPrice > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>משלוח:</span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>₪{shippingPrice.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {shippingPrice === 0 && totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e5e7eb', color: '#059669' }}>
                    <span style={{ fontWeight: '500' }}>סה"כ משלוח:</span>
                    <span style={{ fontWeight: '600' }}>₪0.00</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: '8px', fontWeight: 'bold', fontSize: '20px', borderTop: '2px solid #000', color: '#111827' }}>
                  <span>סה"כ הזמנה:</span>
                  <span>₪{total.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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



