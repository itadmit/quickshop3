import { sendEmail, getEmailTemplate, getShopEmailSettings } from './email';
import { query, queryOne } from './db';
import { Order, OrderLineItem } from '@/types/order';

/**
 * Send order confirmation/receipt email to customer
 */
export async function sendOrderReceiptEmail(orderId: number, storeId: number) {
  try {
    // Get order details
    const order = await queryOne<Order>(
      'SELECT * FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, storeId]
    );

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.email) {
      throw new Error('Order has no email address');
    }

    // Get line items
    const lineItems = await query<OrderLineItem>(
      'SELECT * FROM order_line_items WHERE order_id = $1 ORDER BY id',
      [orderId]
    );

    // Get store name
    const store = await queryOne<{ name: string }>(
      'SELECT name FROM stores WHERE id = $1',
      [storeId]
    );

    const storeName = store?.name || 'Quick Shop';

    // Build items list HTML
    const itemsList = lineItems.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; direction: rtl; text-align: right;">${item.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; direction: rtl; text-align: right;">₪${parseFloat(item.price).toFixed(2)}</td>
      </tr>`
    ).join('');

    const subtotal = parseFloat(order.subtotal_price || '0');
    const shipping = parseFloat(order.total_shipping_price || '0');
    const tax = parseFloat(order.total_tax || '0');
    const discounts = parseFloat(order.total_discounts || '0');
    const total = parseFloat(order.total_price);

    const emailContent = `
      <h2>תודה על ההזמנה שלך! 🎉</h2>
      <p>שלום ${order.name || 'לקוח יקר'},</p>
      <p>הזמנתך התקבלה בהצלחה! מספר ההזמנה שלך הוא: <strong>${order.order_name || `#${order.order_number || order.id}`}</strong></p>
      
      <h3>פרטי ההזמנה:</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; direction: rtl;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; direction: rtl;">מוצר</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">כמות</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; direction: rtl;">מחיר</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; direction: rtl; text-align: right;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; direction: rtl;">
          <span>סכום ביניים:</span>
          <strong>₪${subtotal.toFixed(2)}</strong>
        </div>
        ${discounts > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #059669; direction: rtl;">
          <span>הנחה:</span>
          <strong>-₪${discounts.toFixed(2)}</strong>
        </div>
        ` : ''}
        ${shipping > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; direction: rtl;">
          <span>משלוח:</span>
          <strong>₪${shipping.toFixed(2)}</strong>
        </div>
        ` : ''}
        ${tax > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px; direction: rtl;">
          <span>מס:</span>
          <strong>₪${tax.toFixed(2)}</strong>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd; font-size: 18px; direction: rtl;">
          <strong>סה"כ ששולם:</strong>
          <strong style="color: #059669;">₪${total.toFixed(2)}</strong>
        </div>
      </div>

      ${order.note ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #fff7ed; border-radius: 8px;">
        <h3 style="margin-top: 0; margin-bottom: 10px;">הערות:</h3>
        <p>${order.note}</p>
      </div>
      ` : ''}

      <p style="margin-top: 30px;">נשלח אליך עדכון נוסף כשההזמנה תישלח.</p>
      <p>תודה שקנית אצלנו!</p>
    `;

    const emailSettings = await getShopEmailSettings(storeId);
    
    await sendEmail({
      to: order.email,
      subject: `אישור הזמנה ותשלום ${order.order_name || `#${order.order_number || order.id}`} - ${storeName}`,
      storeId: storeId,
      html: getEmailTemplate({
        title: `אישור הזמנה ${order.order_name || `#${order.order_number || order.id}`}`,
        content: emailContent,
        footer: `הודעה זו נשלחה מ-${emailSettings.senderName}`,
        color1: emailSettings.color1,
        color2: emailSettings.color2,
        senderName: emailSettings.senderName,
      }),
    });
    
    console.log(`✅ Order receipt email sent to ${order.email} for order ${order.order_name || order.id}`);
    return { success: true };
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    if (errorMessage.includes('not configured') || errorMessage.includes('לא מוגדר')) {
      console.warn(`⚠️ SendGrid not configured. Order receipt email not sent.`);
    } else {
      console.warn(`⚠️ Failed to send order receipt email:`, errorMessage);
    }
    throw error;
  }
}

