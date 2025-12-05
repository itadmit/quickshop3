
export const EMAIL_STYLES = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; direction: rtl; text-align: right; margin: 0; padding: 0; background-color: #f4f4f5; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { padding: 30px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo { max-height: 50px; margin-bottom: 10px; }
    .shop-name { font-size: 24px; font-weight: bold; color: #111; text-decoration: none; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; margin-bottom: 20px; color: #111; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #000000; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; }
    .order-info { margin: 30px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
    .order-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 15px; }
    .order-id { font-size: 18px; font-weight: bold; }
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { text-align: right; padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .items-table td { padding: 15px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .product-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; }
    .totals { margin-top: 20px; border-top: 2px solid #e5e7eb; padding-top: 20px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .final-total { font-size: 18px; font-weight: bold; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 10px; }
    .customer-info { margin-top: 40px; display: flex; gap: 20px; }
    .info-col { flex: 1; }
    .info-title { font-weight: bold; margin-bottom: 10px; color: #374151; }
    .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; background: #fafafa; }
    .social-links { margin-top: 15px; }
    .social-links a { margin: 0 10px; color: #6b7280; text-decoration: none; }
  </style>
`;

export const ORDER_CONFIRMATION_TEMPLATE = {
  subject: 'אישור הזמנה {{order_name}}',
  body: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>אישור הזמנה {{order_name}}</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="wrapper">
    <div class="header">
      {{shop_logo_or_name}}
    </div>
    
    <div class="content">
      <div class="greeting">שלום {{customer_first_name}},</div>
      <p>תודה על הרכישה! אנחנו מכינים את ההזמנה שלך למשלוח. נשלח לך עדכון נוסף ברגע שהיא תצא לדרך.</p>
      
      <div class="button-container">
        <a href="{{order_status_url}}" class="button">צפה בהזמנה שלך</a>
      </div>

      <div class="order-info">
        <div class="order-header">
          <div class="order-id">הזמנה {{order_name}}</div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th width="60">מוצר</th>
              <th>תיאור</th>
              <th>כמות</th>
              <th>מחיר</th>
            </tr>
          </thead>
          <tbody>
            {{items_rows}}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>סכום ביניים</span>
            <span>{{subtotal_price}}</span>
          </div>
          <div class="total-row">
            <span>משלוח</span>
            <span>{{shipping_price}}</span>
          </div>
          {{#if discounts}}
          <div class="total-row" style="color: #059669;">
            <span>הנחות</span>
            <span>-{{total_discounts}}</span>
          </div>
          {{/if}}
          <div class="total-row final-total">
            <span>סה"כ לתשלום</span>
            <span>{{total_price}}</span>
          </div>
        </div>
      </div>

      <div class="customer-info">
        <div class="info-col">
          <div class="info-title">כתובת למשלוח</div>
          <div>
            {{shipping_address_name}}<br>
            {{shipping_address_street}}<br>
            {{shipping_address_city}} {{shipping_address_zip}}<br>
            {{shipping_address_phone}}
          </div>
        </div>
        <div class="info-col">
          <div class="info-title">שיטת משלוח</div>
          <div>{{shipping_method}}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>אם יש לך שאלות, השב למייל זה או צור קשר ב- <a href="mailto:{{shop_email}}">{{shop_email}}</a></p>
      <p>© {{year}} {{shop_name}}. כל הזכויות שמורות.</p>
    </div>
  </div>
</body>
</html>
`
};

export const WELCOME_TEMPLATE = {
  subject: 'ברוכים הבאים ל-{{shop_name}}!',
  body: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ברוכים הבאים ל-{{shop_name}}</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="wrapper">
    <div class="header">
      {{shop_logo_or_name}}
    </div>
    
    <div class="content">
      <div class="greeting">ברוכים הבאים, {{customer_first_name}}! 🎉</div>
      <p>אנחנו שמחים שהצטרפת למועדון הלקוחות של <strong>{{shop_name}}</strong>.</p>
      <p>כאן תוכל למצוא את המוצרים הטובים ביותר, להתעדכן במבצעים חמים ולקבל הטבות בלעדיות.</p>
      
      <div class="button-container">
        <a href="{{shop_url}}" class="button">התחל לקנות</a>
      </div>

      <p>שמחים לראות אותך איתנו!</p>
    </div>

    <div class="footer">
      <p>אם יש לך שאלות, אנחנו כאן בשבילך.</p>
      <p>© {{year}} {{shop_name}}</p>
    </div>
  </div>
</body>
</html>
`
};

export const ORDER_SHIPPED_TEMPLATE = {
  subject: 'ההזמנה {{order_name}} נשלחה!',
  body: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ההזמנה {{order_name}} נשלחה</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="wrapper">
    <div class="header">
      {{shop_logo_or_name}}
    </div>
    
    <div class="content">
      <div class="greeting">שלום {{customer_first_name}},</div>
      <p>ההזמנה שלך נשלחה! 🚀</p>
      <p>ההזמנה <strong>{{order_name}}</strong> יצאה לדרך ותגיע אליך בקרוב.</p>
      
      {{#if tracking_number}}
      <div class="order-info">
        <div class="info-title">מספר מעקב</div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 10px;">{{tracking_number}}</div>
        {{#if tracking_url}}
        <div class="button-container">
          <a href="{{tracking_url}}" class="button">עקוב אחר המשלוח</a>
        </div>
        {{/if}}
      </div>
      {{/if}}

      <div class="button-container">
        <a href="{{order_status_url}}" class="button">צפה בהזמנה שלך</a>
      </div>

      <p>תודה שקנית אצלנו!</p>
    </div>

    <div class="footer">
      <p>אם יש לך שאלות, השב למייל זה או צור קשר ב- <a href="mailto:{{shop_email}}">{{shop_email}}</a></p>
      <p>© {{year}} {{shop_name}}. כל הזכויות שמורות.</p>
    </div>
  </div>
</body>
</html>
`
};

export const ORDER_CANCELLED_TEMPLATE = {
  subject: 'ההזמנה {{order_name}} בוטלה',
  body: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ההזמנה {{order_name}} בוטלה</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="wrapper">
    <div class="header">
      {{shop_logo_or_name}}
    </div>
    
    <div class="content">
      <div class="greeting">שלום {{customer_first_name}},</div>
      <p>אנו מודיעים לך שההזמנה <strong>{{order_name}}</strong> בוטלה.</p>
      
      {{#if cancellation_reason}}
      <div class="order-info">
        <div class="info-title">סיבת ביטול</div>
        <div style="margin-top: 10px;">{{cancellation_reason}}</div>
      </div>
      {{/if}}

      {{#if refund_amount}}
      <p>אם שולם תשלום עבור ההזמנה, הוא יוחזר לך תוך 5-10 ימי עסקים.</p>
      {{/if}}

      <div class="button-container">
        <a href="{{shop_url}}" class="button">עיין במוצרים נוספים</a>
      </div>

      <p>אם יש לך שאלות או אם ההזמנה לא הייתה אמורה להיות מבוטלת, אנא צור קשר איתנו.</p>
    </div>

    <div class="footer">
      <p>אם יש לך שאלות, השב למייל זה או צור קשר ב- <a href="mailto:{{shop_email}}">{{shop_email}}</a></p>
      <p>© {{year}} {{shop_name}}. כל הזכויות שמורות.</p>
    </div>
  </div>
</body>
</html>
`
};

/**
 * מחזיר את כל תבניות ברירת המחדל
 */
export function getDefaultTemplates() {
  return {
    ORDER_CONFIRMATION: ORDER_CONFIRMATION_TEMPLATE,
    WELCOME: WELCOME_TEMPLATE,
    ORDER_SHIPPED: ORDER_SHIPPED_TEMPLATE,
    ORDER_CANCELLED: ORDER_CANCELLED_TEMPLATE,
  };
}

