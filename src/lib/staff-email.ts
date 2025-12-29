import { sendEmail } from './email';
import { queryOne } from './db';

/**
 * Send invitation email to staff member
 */
export async function sendStaffInvitationEmail(
  storeId: number,
  invitation: {
    email: string;
    storeName: string;
    inviterName: string;
    role: string;
    token: string;
  }
): Promise<void> {
  try {
    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:3099';
    
    const acceptUrl = `${baseUrl}/staff/accept-invitation?token=${invitation.token}`;

    // Role labels in Hebrew
    const roleLabels: Record<string, string> = {
      owner: 'בעלים',
      admin: 'מנהל',
      staff: 'צוות',
      limited_staff: 'צוות מוגבל',
    };
    const roleLabel = roleLabels[invitation.role] || invitation.role;

    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>הזמנה להצטרף לצוות ${invitation.storeName}</title>
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
                      🎉 הוזמנת להצטרף לצוות!
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      שלום,
                    </p>
                    
                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      <strong>${invitation.inviterName}</strong> הזמין אותך להצטרף לצוות הניהול של <strong>${invitation.storeName}</strong>.
                    </p>

                    <div style="background-color: #f9fafb; border-right: 4px solid #10b981; padding: 15px 20px; margin: 20px 0;">
                      <p style="color: #666666; font-size: 14px; margin: 0;">
                        <strong>תפקיד:</strong> ${roleLabel}
                      </p>
                    </div>
                    
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      לחץ על הכפתור למטה כדי לקבל את ההזמנה ולהגדיר סיסמה:
                    </p>
                    
                    <p style="text-align: center; margin: 30px 0;">
                      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(16,185,129,0.3);">
                        קבל הזמנה והגדר סיסמה
                      </a>
                    </p>

                    <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                      אם הכפתור אינו עובד, העתק והדבק את הקישור הבא בדפדפן:
                    </p>
                    <p style="color: #10b981; font-size: 12px; word-break: break-all; margin: 10px 0;">
                      ${acceptUrl}
                    </p>
                    
                    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                      כחבר צוות תוכל:
                    </p>
                    <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 10px 0; padding-right: 20px;">
                      <li>לנהל את החנות והמוצרים</li>
                      <li>לעקוב אחר הזמנות ולקוחות</li>
                      <li>לצפות בדו"חות ואנליטיקס</li>
                      <li>לשתף פעולה עם שאר הצוות</li>
                    </ul>
                    
                    <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px 20px; margin: 30px 0;">
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                        <strong>⏰ שים לב:</strong> קישור ההזמנה תקף ל-7 ימים בלבד.
                      </p>
                    </div>
                    
                    <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 40px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      אם לא ביקשת הזמנה זו, אנא התעלם ממייל זה.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${invitation.storeName}. כל הזכויות שמורות.
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
הזמנה להצטרף לצוות ${invitation.storeName}

שלום,

${invitation.inviterName} הזמין אותך להצטרף לצוות הניהול של ${invitation.storeName}.

תפקיד: ${roleLabel}

לחץ על הקישור למטה כדי לקבל את ההזמנה ולהגדיר סיסמה:
${acceptUrl}

כחבר צוות תוכל:
- לנהל את החנות והמוצרים
- לעקוב אחר הזמנות ולקוחות
- לצפות בדו"חות ואנליטיקס
- לשתף פעולה עם שאר הצוות

⏰ שים לב: קישור ההזמנה תקף ל-7 ימים בלבד.

אם לא ביקשת הזמנה זו, אנא התעלם ממייל זה.

© ${new Date().getFullYear()} ${invitation.storeName}. כל הזכויות שמורות.
    `.trim();

    await sendEmail({
      to: invitation.email,
      subject: `הוזמנת להצטרף לצוות ${invitation.storeName}`,
      html,
      text,
      storeId,
    });

    console.log(`✅ Staff invitation email sent to: ${invitation.email}`);
  } catch (error: any) {
    console.error('❌ Error sending staff invitation email:', error);
    // Don't throw - email failure shouldn't break invitation creation
    throw error;
  }
}

