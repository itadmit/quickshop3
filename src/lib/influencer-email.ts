import { sendEmail } from './email';
import { queryOne } from './db';

/**
 * Send welcome email to new influencer with login credentials
 */
export async function sendInfluencerWelcomeEmail(
  storeId: number,
  influencer: {
    email: string;
    name: string;
    password: string;
  }
): Promise<void> {
  try {
    // Get store name
    const store = await queryOne<{ name: string }>(
      'SELECT name FROM stores WHERE id = $1',
      [storeId]
    );

    const storeName = store?.name || 'החנות';
    
    // Get base URL from environment or use default
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:3099';
    
    const loginUrl = `${baseUrl}/influencer/login`;

    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ברוכים הבאים לדשבורד המשפיענים</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; background-color: #f5f5f5; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                      ברוכים הבאים לדשבורד המשפיענים!
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      שלום ${influencer.name},
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      נוצר עבורך חשבון בדשבורד המשפיענים של <strong>${storeName}</strong>.
                    </p>
                    
                    <div style="background-color: #f9fafb; border-right: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">
                        פרטי התחברות:
                      </p>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>אימייל:</strong> ${influencer.email}
                      </p>
                      <p style="color: #666666; font-size: 14px; margin: 5px 0;">
                        <strong>סיסמה:</strong> ${influencer.password}
                      </p>
                    </div>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
                      תוכל להתחבר לדשבורד שלך דרך הקישור הבא:
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${loginUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                            התחבר לדשבורד
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                      או העתק את הקישור הבא לדפדפן שלך:<br>
                      <a href="${loginUrl}" style="color: #10b981; text-decoration: underline; word-break: break-all;">${loginUrl}</a>
                    </p>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                      בדשבורד תוכל לראות:
                    </p>
                    <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 10px 0; padding-right: 20px;">
                      <li>סטטיסטיקות מכירות בזמן אמת</li>
                      <li>רשימת הקופונים שלך</li>
                      <li>פירוט הזמנות שנעשו עם הקופונים שלך</li>
                      <li>גרפים ומדדים</li>
                    </ul>
                    
                    <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      אם לא יצרת חשבון זה, אנא התעלם ממייל זה.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${storeName}. כל הזכויות שמורות.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Plain text version
    const text = `
ברוכים הבאים לדשבורד המשפיענים!

שלום ${influencer.name},

נוצר עבורך חשבון בדשבורד המשפיענים של ${storeName}.

פרטי התחברות:
אימייל: ${influencer.email}
סיסמה: ${influencer.password}

קישור להתחברות: ${loginUrl}

בדשבורד תוכל לראות:
- סטטיסטיקות מכירות בזמן אמת
- רשימת הקופונים שלך
- פירוט הזמנות שנעשו עם הקופונים שלך
- גרפים ומדדים

© ${new Date().getFullYear()} ${storeName}. כל הזכויות שמורות.
    `.trim();

    await sendEmail({
      to: influencer.email,
      subject: `ברוכים הבאים לדשבורד המשפיענים של ${storeName}`,
      html,
      text,
      storeId,
    });

    console.log(`✅ Welcome email sent to influencer: ${influencer.email}`);
  } catch (error: any) {
    console.error('❌ Error sending influencer welcome email:', error);
    // Don't throw - email failure shouldn't break influencer creation
    throw error; // But we can throw if needed
  }
}

