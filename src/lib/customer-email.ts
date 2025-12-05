import { EmailEngine } from './services/email-engine';

/**
 * שליחת מייל ברוכים הבאים ללקוח חדש
 */
export async function sendWelcomeEmail(storeId: number, customer: { 
  email: string; 
  firstName: string; 
  lastName?: string 
}) {
  try {
    const engine = new EmailEngine(storeId);
    
    await engine.send('WELCOME', customer.email, {
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName || '',
      customer_email: customer.email
    });
    
    console.log(`✅ Welcome email sent to ${customer.email}`);
    return { success: true };
  } catch (error: any) {
    console.warn(`⚠️ Failed to send welcome email:`, error?.message || error);
    return { success: false, error: error?.message };
  }
}

