import { queryOne } from '@/lib/db';
import { sendEmail, getShopEmailSettings } from '@/lib/email';

interface GiftCard {
  id: number;
  code: string;
  initial_value: number;
  current_value: number;
  currency: string;
  expires_at: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  sender_name: string | null;
  message: string | null;
}

/**
 * קבלת הגדרות עיצוב גיפט קארד מהחנות
 */
async function getGiftCardSettings(storeId: number) {
  try {
    const settingsResult = await queryOne<{ settings: any }>(
      'SELECT settings FROM store_settings WHERE store_id = $1',
      [storeId]
    );

    if (!settingsResult) {
      return {
        backgroundType: 'gradient',
        gradientColor1: '#ff9a9e',
        gradientColor2: '#fecfef',
        backgroundImage: null,
        backgroundPosition: 'center',
        textPosition: 'right',
      };
    }

    const settings = typeof settingsResult.settings === 'string'
      ? JSON.parse(settingsResult.settings)
      : settingsResult.settings;

    const giftCardSettings = settings.giftCardSettings || {};

    return {
      backgroundType: giftCardSettings.backgroundType || 'gradient',
      gradientColor1: giftCardSettings.gradientColor1 || '#ff9a9e',
      gradientColor2: giftCardSettings.gradientColor2 || '#fecfef',
      backgroundImage: giftCardSettings.backgroundImage || null,
      backgroundPosition: giftCardSettings.backgroundPosition || 'center',
      textPosition: giftCardSettings.textPosition || 'right',
    };
  } catch (error) {
    console.error('Error fetching gift card settings:', error);
    return {
      backgroundType: 'gradient',
      gradientColor1: '#ff9a9e',
      gradientColor2: '#fecfef',
      backgroundImage: null,
      backgroundPosition: 'center',
      textPosition: 'right',
    };
  }
}

/**
 * יצירת תבנית מייל גיפט קארד
 */
function createGiftCardEmailTemplate(
  giftCard: GiftCard,
  shopName: string,
  shopUrl: string | null,
  emailSettings: { senderName: string; color1: string; color2: string },
  giftCardSettings: {
    backgroundType: string;
    gradientColor1: string;
    gradientColor2: string;
    backgroundImage: string | null;
    backgroundPosition: string;
    textPosition: string;
  }
): string {
  // יצירת רקע
  const backgroundColor = giftCardSettings.backgroundType === 'gradient'
    ? 'transparent'
    : (giftCardSettings.gradientColor1 || '#ff9a9e');

  const backgroundImageUrl = giftCardSettings.backgroundType === 'image' && giftCardSettings.backgroundImage
    ? giftCardSettings.backgroundImage
    : '';

  const backgroundGradient = giftCardSettings.backgroundType === 'gradient'
    ? `linear-gradient(135deg, ${giftCardSettings.gradientColor1} 0%, ${giftCardSettings.gradientColor2} 100%)`
    : 'none';

  // מיקום הכיתוב - במייל RTL
  // כשמשתמש בוחר "ימין" → text-align: right (ימין ב-RTL)
  // כשמשתמש בוחר "שמאל" → text-align: left (שמאל ב-RTL)
  // כשמשתמש בוחר "מרכז" → text-align: center
  const textAlign = giftCardSettings.textPosition === 'right' ? 'right' : giftCardSettings.textPosition === 'left' ? 'left' : 'center';
  const cellAlign = giftCardSettings.textPosition === 'right' ? 'right' : giftCardSettings.textPosition === 'left' ? 'left' : 'center';

  const expiresAtText = giftCard.expires_at
    ? `תוקף עד: ${new Date(giftCard.expires_at).toLocaleDateString('he-IL')}`
    : 'ללא הגבלת זמן';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>גיפט קארד מ-${shopName}</title>
  <style>
    * {
      direction: rtl;
      text-align: right;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
      direction: rtl;
      text-align: right;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${emailSettings.color1} 0%, ${emailSettings.color2} 100%);
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
    .gift-card-wrapper {
      margin: 30px auto;
      width: 100%;
      max-width: 500px;
    }
    .card-table {
      width: 100%;
      max-width: 500px;
      height: 315px;
      border-collapse: collapse;
      background-color: ${backgroundColor};
      background-image: ${backgroundGradient !== 'none' ? backgroundGradient : 'none'};
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    }
    .card-content-cell {
      vertical-align: middle;
      padding: 25px;
      text-align: ${cellAlign};
      background-image: ${backgroundImageUrl ? `url('${backgroundImageUrl}')` : 'none'};
      background-size: cover;
      background-position: ${giftCardSettings.backgroundPosition.replace("-", " ")};
      background-repeat: no-repeat;
      direction: rtl;
    }
    .card-box {
      display: inline-block;
      background-color: rgba(255, 255, 255, 0.92);
      border-radius: 10px;
      padding: 15px;
      width: 200px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      text-align: ${textAlign};
      direction: rtl;
      ${cellAlign === 'right' ? 'margin-right: 0; margin-left: auto;' : cellAlign === 'left' ? 'margin-left: 0; margin-right: auto;' : 'margin: 0 auto;'}
    }
    .gift-card-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 8px 0;
      text-align: right;
      direction: rtl;
    }
    .gift-card-code {
      background: #f3f4f6;
      padding: 6px 10px;
      border-radius: 6px;
      margin: 0 0 8px 0;
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 0.5px;
      color: #1f2937;
      border: 1px dashed #d1d5db;
      display: block;
    }
    .gift-card-balance {
      font-size: 12px;
      color: #6b7280;
      text-align: right;
      direction: rtl;
      margin-top: 8px;
    }
    .gift-card-message-header {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 8px;
      direction: rtl;
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
      background: linear-gradient(135deg, ${emailSettings.color1} 0%, ${emailSettings.color2} 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 גיפט קארד מ-${shopName}</h1>
    </div>
    <div class="content">
      ${giftCard.recipient_name ? `<p>שלום ${giftCard.recipient_name},</p>` : '<p>שלום,</p>'}
      ${giftCard.sender_name ? `<p>נשלח אליך גיפט קארד מ${giftCard.sender_name}</p>` : '<p>קיבלת גיפט קארד!</p>'}
      
      ${giftCard.message ? `<div class="gift-card-message-header">${giftCard.message}</div>` : ''}
      
      <div class="gift-card-wrapper">
        <table class="card-table" cellpadding="0" cellspacing="0" border="0"${backgroundImageUrl ? ` background="${backgroundImageUrl}"` : ''}>
          <tr>
            <td class="card-content-cell" align="${cellAlign}">
              <div class="card-box">
                <div class="gift-card-title">גיפט קארד</div>
                <div class="gift-card-code">${giftCard.code}</div>
                <div class="gift-card-balance">יתרה נוכחית: ₪${giftCard.current_value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</div>
                <div class="gift-card-balance" style="font-size: 11px; margin-top: 4px;">${expiresAtText}</div>
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      ${shopUrl ? `<div style="text-align: center;"><a href="${shopUrl}" class="button">השתמש בגיפט קארד</a></div>` : ''}
      
      <p>תודה שבחרת ב-${shopName}!</p>
    </div>
    <div class="footer">
      <p>הודעה זו נשלחה אוטומטית מ-${emailSettings.senderName}</p>
      <p>${emailSettings.senderName} © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * שליחת מייל גיפט קארד
 */
export async function sendGiftCardEmail(storeId: number, giftCard: GiftCard): Promise<void> {
  if (!giftCard.recipient_email) {
    throw new Error('Recipient email is required');
  }

  // קבלת פרטי החנות
  const store = await queryOne<{
    name: string;
    slug: string;
    domain: string | null;
  }>(
    'SELECT name, slug, domain FROM stores WHERE id = $1',
    [storeId]
  );

  if (!store) {
    throw new Error('Store not found');
  }

  // קבלת הגדרות מייל
  const emailSettings = await getShopEmailSettings(storeId);

  // קבלת הגדרות עיצוב גיפט קארד
  const giftCardSettings = await getGiftCardSettings(storeId);

  // יצירת URL החנות
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shopUrl = store.domain
    ? `https://${store.domain}`
    : `${baseUrl}/shops/${store.slug}`;

  // יצירת תבנית המייל
  const html = createGiftCardEmailTemplate(
    giftCard,
    store.name,
    shopUrl,
    emailSettings,
    giftCardSettings
  );

  // שליחת המייל
  await sendEmail({
    to: giftCard.recipient_email,
    subject: `🎁 גיפט קארד מ-${store.name}`,
    html,
    storeId,
  });
}

