import sgMail from '@sendgrid/mail';
import { query, queryOne } from './db';

/**
 * Get SendGrid settings from database or environment variables
 */
async function getSendGridSettings() {
  try {
    // First try to get from database
    const settings = await queryOne<{
      settings: any;
    }>(
      `SELECT settings FROM integrations 
       WHERE integration_type = 'email' 
       AND provider_name = 'sendgrid' 
       AND is_active = true
       LIMIT 1`
    );

    if (settings && settings.settings) {
      const sendgridSettings = settings.settings as any;
      if (sendgridSettings.apiKey) {
        return {
          apiKey: sendgridSettings.apiKey,
          fromEmail: sendgridSettings.fromEmail || process.env.SENDGRID_FROM_EMAIL || 'no-reply@my-quickshop.com',
          fromName: sendgridSettings.fromName || process.env.SENDGRID_FROM_NAME || 'Quick Shop',
        };
      }
    }

    // Fallback to environment variables
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      return {
        apiKey,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@my-quickshop.com',
        fromName: process.env.SENDGRID_FROM_NAME || 'Quick Shop',
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching SendGrid settings:', error);
    // Fallback to environment variables on error
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      return {
        apiKey,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@my-quickshop.com',
        fromName: process.env.SENDGRID_FROM_NAME || 'Quick Shop',
      };
    }
    return null;
  }
}

/**
 * Get email settings from store settings
 */
export async function getShopEmailSettings(storeId: number): Promise<{
  senderName: string;
  color1: string;
  color2: string;
}> {
  try {
    const store = await queryOne<{
      name: string;
      settings: any;
    }>(
      'SELECT name, settings FROM stores WHERE id = $1',
      [storeId]
    );

    if (!store) {
      return {
        senderName: 'Quick Shop',
        color1: '#15b981',
        color2: '#10b981',
      };
    }

    const storeSettings = (store.settings as any) || {};
    const themeSettings = storeSettings.themeSettings || {};
    
    return {
      senderName: themeSettings.emailSenderName || store.name || 'Quick Shop',
      color1: themeSettings.emailColor1 || '#15b981',
      color2: themeSettings.emailColor2 || '#10b981',
    };
  } catch (error) {
    console.error('Error fetching shop email settings:', error);
    return {
      senderName: 'Quick Shop',
      color1: '#15b981',
      color2: '#10b981',
    };
  }
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  attachments,
  storeId,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  storeId?: number;
}): Promise<void> {
  // Get SendGrid settings - required!
  const sendgridSettings = await getSendGridSettings();
  
  if (!sendgridSettings || !sendgridSettings.apiKey) {
    throw new Error('SendGrid is not configured. Please configure SendGrid in settings before sending emails.');
  }

  try {
    sgMail.setApiKey(sendgridSettings.apiKey);
    
    // Parse 'from' parameter or use SendGrid settings
    let fromEmail = sendgridSettings.fromEmail;
    let fromName = sendgridSettings.fromName;
    
    // If storeId provided, always use store name as sender name
    if (storeId) {
      try {
        const store = await queryOne<{ name: string }>(
          'SELECT name FROM stores WHERE id = $1',
          [storeId]
        );
        if (store && store.name) {
          fromName = store.name; // Always use store name as sender name
        }
      } catch (error) {
        console.warn('Failed to get store name, using default:', error);
      }
    }
    
    if (from) {
      // Parse "Name <email@example.com>" format
      const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);
      if (fromMatch) {
        fromName = fromMatch[1].trim();
        fromEmail = fromMatch[2].trim();
      } else if (from.includes('@')) {
        fromEmail = from;
      }
    }

    // Convert recipients to array
    const recipients = Array.isArray(to) ? to : [to];
    
    // Validate from email format
    if (!fromEmail || !fromEmail.includes('@')) {
      throw new Error('Invalid from email address. Please configure a valid email address in SendGrid settings.');
    }

    // Send email - SendGrid supports multiple recipients in 'to' field
    const msg: any = {
      to: recipients,
      from: {
        email: fromEmail,
        name: fromName || 'Quick Shop',
      },
      subject: subject || 'No Subject',
    };

    // Add content - SendGrid requires at least one of html or text
    if (html) {
      msg.html = html;
    }
    if (text) {
      msg.text = text;
    }
    // If no html or text provided, use empty string
    if (!html && !text) {
      msg.text = '';
      msg.html = '';
    }

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      msg.attachments = attachments.map(att => ({
        content: typeof att.content === 'string' 
          ? att.content 
          : Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : String(att.content),
        filename: att.filename,
        type: att.contentType || 'application/octet-stream',
        disposition: 'attachment',
      }));
    }

    await sgMail.send(msg);
    console.log('✅ Email sent successfully via SendGrid to', recipients.length, 'recipient(s)');
  } catch (error: any) {
    console.error('❌ Error sending email via SendGrid:', error?.message || error);
    
    // Log more details for debugging
    if (error.response) {
      console.error('SendGrid response body:', error.response.body);
      console.error('SendGrid response headers:', error.response.headers);
    }
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email via SendGrid';
    if (error.response?.body) {
      const body = typeof error.response.body === 'string' 
        ? JSON.parse(error.response.body) 
        : error.response.body;
      
      if (body.errors && Array.isArray(body.errors)) {
        errorMessage = body.errors.map((e: any) => e.message || e).join(', ');
      } else if (body.message) {
        errorMessage = body.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(`SendGrid error: ${errorMessage}. Please check your SendGrid API key, from email (must be verified in SendGrid), and settings.`);
  }
}

/**
 * Get email template with default styling
 */
export function getEmailTemplate({
  title,
  content,
  footer,
  color1 = '#15b981',
  color2 = '#10b981',
  senderName = 'Quick Shop',
}: {
  title: string;
  content: string;
  footer?: string;
  color1?: string;
  color2?: string;
  senderName?: string;
}): string {
  const gradient = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  const defaultFooter = footer || `הודעה זו נשלחה אוטומטית מ-${senderName}`;
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${title}</title>
  <style>
    * {
      direction: rtl;
      text-align: right;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      direction: rtl;
      text-align: right;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: ${gradient};
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
      color: #333;
      line-height: 1.6;
      direction: rtl;
      text-align: right;
    }
    .content h2 {
      direction: rtl;
      text-align: right;
    }
    .content p {
      direction: rtl;
      text-align: right;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #eee;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: ${gradient};
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>${defaultFooter}</p>
      <p>${senderName} © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Verify SendGrid connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const sendgridSettings = await getSendGridSettings();
    
    if (!sendgridSettings || !sendgridSettings.apiKey) {
      console.warn('⚠️ SendGrid is not configured');
      return false;
    }

    // Try to set the API key - if it's invalid, SendGrid will throw an error when we try to send
    sgMail.setApiKey(sendgridSettings.apiKey);
    console.log('✅ SendGrid is configured');
    return true;
  } catch (error) {
    console.error('❌ SendGrid connection failed:', error);
    return false;
  }
}

