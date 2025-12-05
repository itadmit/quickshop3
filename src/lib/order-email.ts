import { query, queryOne } from './db';
import { Order, OrderLineItem } from '@/types/order';
import { EmailEngine } from './services/email-engine';

/**
 * Send order confirmation/receipt email to customer
 * Uses the new EmailEngine for templating
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

    // Get customer details if exists
    let customerFirstName = '';
    let customerLastName = '';
    if (order.customer_id) {
      const customer = await queryOne<{ first_name: string | null; last_name: string | null }>(
        'SELECT first_name, last_name FROM customers WHERE id = $1',
        [order.customer_id]
      );
      if (customer) {
        customerFirstName = customer.first_name || '';
        customerLastName = customer.last_name || '';
      }
    }

    // Parse shipping address from JSON
    let shippingAddress = {
      name: order.name || '',
      street: '',
      city: '',
      zip: '',
      phone: order.phone || '',
    };

    if (order.shipping_address && typeof order.shipping_address === 'object') {
      const addr = order.shipping_address as any;
      shippingAddress = {
        name: `${addr.first_name || customerFirstName || ''} ${addr.last_name || customerLastName || ''}`.trim() || order.name || '',
        street: addr.address1 || addr.street || '',
        city: addr.city || '',
        zip: addr.zip || addr.postal_code || '',
        phone: addr.phone || order.phone || '',
      };
    }

    // Get line items
    const lineItems = await query<OrderLineItem>(
      'SELECT * FROM order_line_items WHERE order_id = $1 ORDER BY id',
      [orderId]
    );

    // Build items rows for template (with images)
    const itemsRowsPromises = lineItems.map(async (item) => {
      // Try to get product image
      let productImage = '';
      if (item.product_id) {
        try {
          const product = await queryOne<{ image: string | null }>(
            'SELECT image FROM products WHERE id = $1',
            [item.product_id]
          );
          if (product?.image) {
            productImage = product.image;
          }
        } catch {
          // Ignore errors
        }
      }

      // Parse properties if exists
      let propertiesHtml = '';
      if (item.properties && typeof item.properties === 'object') {
        const props = item.properties as any;
        if (Array.isArray(props)) {
          propertiesHtml = props.map((prop: any) => 
            `<div style="color: #666; font-size: 12px;">${prop.name || ''}: ${prop.value || ''}</div>`
          ).join('');
        }
      }

      return `
        <tr>
          <td width="60">
            ${productImage ? `<img src="${productImage}" class="product-img" alt="${item.title}">` : ''}
          </td>
          <td>
            <div style="font-weight: bold;">${item.title}</div>
            ${item.variant_title && item.variant_title !== 'Default Title' ? `<div style="color: #666; font-size: 12px;">${item.variant_title}</div>` : ''}
            ${propertiesHtml}
          </td>
          <td>${item.quantity}</td>
          <td>₪${parseFloat(item.price).toFixed(2)}</td>
        </tr>
      `;
    });
    
    const itemsRows = (await Promise.all(itemsRowsPromises)).join('');

    // Format prices
    const subtotal = parseFloat(order.subtotal_price || '0');
    const shipping = parseFloat(order.total_shipping_price || '0');
    const discounts = parseFloat(order.total_discounts || '0');
    const total = parseFloat(order.total_price);

    // Use Email Engine
    const engine = new EmailEngine(storeId);
    
    await engine.send('ORDER_CONFIRMATION', order.email!, {
      // Customer
      customer_first_name: customerFirstName || order.name?.split(' ')[0] || 'לקוח יקר',
      customer_email: order.email!,
      
      // Order
      order_name: order.order_name || `#${order.order_number || order.id}`,
      order_status_url: `https://${process.env.NEXT_PUBLIC_APP_URL || 'quickshop.co.il'}/orders/${order.id}`, // Needs real status page logic
      
      // Items
      items_rows: itemsRows,
      
      // Financials
      subtotal_price: `₪${subtotal.toFixed(2)}`,
      shipping_price: shipping > 0 ? `₪${shipping.toFixed(2)}` : 'חינם',
      discounts: discounts > 0,
      total_discounts: `₪${discounts.toFixed(2)}`,
      total_price: `₪${total.toFixed(2)}`,
      
      // Shipping Info
      shipping_address_name: shippingAddress.name,
      shipping_address_street: shippingAddress.street,
      shipping_address_city: shippingAddress.city,
      shipping_address_zip: shippingAddress.zip,
      shipping_address_phone: shippingAddress.phone,
      shipping_method: 'משלוח רגיל' // Can be dynamic
    });
    
    console.log(`✅ Order receipt email sent to ${order.email} for order ${order.order_name || order.id}`);
    return { success: true };
  } catch (error: any) {
    console.warn(`⚠️ Failed to send order receipt email:`, error?.message || error);
    // Don't throw - we don't want to fail the order process just because email failed
    return { success: false, error: error?.message };
  }
}
