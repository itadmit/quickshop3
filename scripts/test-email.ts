/**
 * סקריפט בדיקה לשליחת מייל
 * שימוש: npx tsx scripts/test-email.ts
 */

import { EmailEngine } from '../src/lib/services/email-engine';

async function testEmails() {
  const testEmail = 'itadmit@gmail.com';
  const storeId = 1; // Change to your store ID if needed

  console.log('📧 Starting email test...');
  console.log(`📬 Sending to: ${testEmail}`);
  console.log(`🏪 Store ID: ${storeId}\n`);

  try {
    // Test 1: Welcome Email
    console.log('1️⃣ Testing Welcome Email...');
    const welcomeEngine = new EmailEngine(storeId);
    await welcomeEngine.send('WELCOME', testEmail, {
      customer_first_name: 'טד',
      customer_last_name: 'אדמיט',
      customer_email: testEmail,
    });
    console.log('✅ Welcome email sent successfully!\n');

    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Order Confirmation Email
    console.log('2️⃣ Testing Order Confirmation Email...');
    const orderEngine = new EmailEngine(storeId);
    await orderEngine.send('ORDER_CONFIRMATION', testEmail, {
      customer_first_name: 'טד',
      customer_email: testEmail,
      order_name: '#0001',
      order_status_url: 'https://quickshop.co.il/orders/1',
      items_rows: `
        <tr>
          <td width="60">
            <img src="https://via.placeholder.com/60" class="product-img" alt="מוצר בדיקה">
          </td>
          <td>
            <div style="font-weight: bold;">מוצר בדיקה</div>
            <div style="color: #666; font-size: 12px;">מידה: 40</div>
          </td>
          <td>1</td>
          <td>₪299.90</td>
        </tr>
      `,
      subtotal_price: '₪299.90',
      shipping_price: 'חינם',
      discounts: false,
      total_price: '₪299.90',
      shipping_address_name: 'טד אדמיט',
      shipping_address_street: 'רחוב בדיקה 123',
      shipping_address_city: 'תל אביב',
      shipping_address_zip: '12345',
      shipping_address_phone: '050-1234567',
      shipping_method: 'משלוח רגיל',
    });
    console.log('✅ Order confirmation email sent successfully!\n');

    console.log('🎉 All emails sent successfully!');
    console.log(`📬 Check your inbox at: ${testEmail}`);
  } catch (error: any) {
    console.error('❌ Error sending emails:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testEmails()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

