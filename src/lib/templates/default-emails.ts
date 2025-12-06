
export const EMAIL_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&display=swap');

    body { 
      font-family: 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      line-height: 1.6; 
      color: #333333; 
      direction: rtl; 
      text-align: right; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f5; 
      -webkit-font-smoothing: antialiased;
    }
    
    .wrapper { 
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    
    .email-container {
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
      border: 1px solid #e5e7eb;
    }
    
    .header { 
      padding: 40px 40px 20px 40px; 
      text-align: center; 
      background-color: #ffffff;
    }
    
    .logo { 
      max-height: 60px; 
      max-width: 200px;
      height: auto;
      margin-bottom: 10px; 
      border: 0;
    }
    
    .shop-name { 
      font-size: 24px; 
      font-weight: 700; 
      color: #111; 
      text-decoration: none; 
      letter-spacing: -0.5px;
      display: inline-block;
    }
    
    .content { 
      padding: 20px 40px 40px 40px; 
      background-color: #ffffff;
    }
    
    h1, h2, h3 {
      color: #1a1a1a;
      margin-top: 0;
    }
    
    .greeting { 
      font-size: 24px; 
      font-weight: 600;
      margin-bottom: 16px; 
      color: #1a1a1a; 
    }
    
    p {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
    }
    
    .button-container { 
      text-align: center; 
      margin: 32px 0; 
    }
    
    .button { 
      background-color: #000000; 
      color: #ffffff !important; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 16px;
      display: inline-block; 
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .order-info { 
      margin: 32px 0; 
      background-color: #fafafa;
      border: 1px solid #f3f4f6; 
      border-radius: 12px; 
      padding: 24px; 
    }
    
    .order-header { 
      border-bottom: 1px solid #e5e7eb; 
      padding-bottom: 16px; 
      margin-bottom: 16px;
    }
    
    .order-id { 
      font-size: 18px; 
      font-weight: 700; 
      color: #111;
    }
    
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 20px;
    }
    
    .items-table th { 
      text-align: right; 
      padding: 12px 0; 
      border-bottom: 1px solid #e5e7eb; 
      color: #6b7280; 
      font-size: 13px; 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table td { 
      padding: 16px 0; 
      border-bottom: 1px solid #f3f4f6; 
      vertical-align: top; 
      color: #374151;
      font-size: 15px;
    }
    
    .product-img { 
      width: 64px; 
      height: 64px; 
      object-fit: cover; 
      border-radius: 8px; 
      border: 1px solid #e5e7eb; 
      background-color: #ffffff;
    }
    
    .totals { 
      margin-top: 24px; 
      padding-top: 24px;
      border-top: 1px solid #e5e7eb; 
    }
    
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 12px; 
      font-size: 15px;
      color: #4b5563;
    }
    
    .final-total { 
      font-size: 20px; 
      font-weight: 700; 
      border-top: 2px solid #e5e7eb; 
      padding-top: 16px; 
      margin-top: 16px; 
      color: #111;
    }
    
    .customer-info { 
      margin-top: 40px; 
      border-top: 1px solid #f3f4f6;
      padding-top: 32px;
      display: table;
      width: 100%;
    }
    
    .info-col { 
      display: table-cell;
      width: 48%;
      vertical-align: top;
      padding-left: 4%;
    }
    
    .info-col:last-child {
      padding-left: 0;
    }
    
    .info-title { 
      font-weight: 600; 
      margin-bottom: 12px; 
      color: #111; 
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .footer { 
      padding: 32px 40px; 
      text-align: center; 
      color: #9ca3af; 
      font-size: 13px; 
      background: #fafafa; 
      border-top: 1px solid #f3f4f6;
    }
    
    .footer a {
      color: #6b7280;
      text-decoration: underline;
    }
    
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 0; background-color: #ffffff; }
      .email-container { width: 100%; border-radius: 0; box-shadow: none; border: none; }
      .header { padding: 30px 20px; }
      .content { padding: 20px; }
      .order-info { padding: 16px; margin: 24px 0; }
      .customer-info { display: block; }
      .info-col { display: block; width: 100%; padding-left: 0; margin-bottom: 24px; }
      .footer { padding: 30px 20px; }
      .button { width: 100%; box-sizing: border-box; text-align: center; }
    }
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
    <div class="email-container">
      <div class="header">
        {{shop_logo_or_name}}
      </div>
      
      <div class="content">
        <div class="greeting">שלום {{customer_first_name}},</div>
        <p>תודה שקנית אצלנו! אנחנו מכינים את ההזמנה שלך למשלוח כרגע. נשלח לך עדכון נוסף ברגע שהיא תצא לדרך.</p>
        
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
                <th width="80">מוצר</th>
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
            <div style="line-height: 1.6;">
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
    <div class="email-container">
      <div class="header">
        {{shop_logo_or_name}}
      </div>
      
      <div class="content">
        <div class="greeting">ברוכים הבאים, {{customer_first_name}}! 🎉</div>
        <p>אנחנו שמחים שהצטרפת למועדון הלקוחות של <strong>{{shop_name}}</strong>.</p>
        <p>מעכשיו תוכל/י למצוא אצלנו את המוצרים הטובים ביותר, להתעדכן ראשון/ה במבצעים חמים ולקבל הטבות בלעדיות לחברי מועדון.</p>
        
        <div class="button-container">
          <a href="{{shop_url}}" class="button">התחל לקנות</a>
        </div>

        <p>אנחנו כאן לכל שאלה, ושמחים לראות אותך איתנו!</p>
      </div>

      <div class="footer">
        <p>אם יש לך שאלות, אנחנו כאן בשבילך.</p>
        <p>© {{year}} {{shop_name}}</p>
      </div>
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
    <div class="email-container">
      <div class="header">
        {{shop_logo_or_name}}
      </div>
      
      <div class="content">
        <div class="greeting">שלום {{customer_first_name}},</div>
        <p>חדשות טובות! ההזמנה שלך נשלחה ונמצאת בדרך אליך 🚀</p>
        <p>ההזמנה <strong>{{order_name}}</strong> נאספה על ידי חברת המשלוחים.</p>
        
        {{#if tracking_number}}
        <div class="order-info">
          <div class="info-title">פרטי מעקב</div>
          <div style="font-size: 18px; font-weight: bold; margin-top: 10px; letter-spacing: 1px;">{{tracking_number}}</div>
          {{#if tracking_url}}
          <div class="button-container" style="margin: 20px 0 0 0;">
            <a href="{{tracking_url}}" class="button">עקוב אחר המשלוח</a>
          </div>
          {{/if}}
        </div>
        {{/if}}

        <div class="button-container">
          <a href="{{order_status_url}}" class="button">צפה בפרטי ההזמנה</a>
        </div>

        <p>תודה שקנית אצלנו!</p>
      </div>

      <div class="footer">
        <p>אם יש לך שאלות, השב למייל זה או צור קשר ב- <a href="mailto:{{shop_email}}">{{shop_email}}</a></p>
        <p>© {{year}} {{shop_name}}. כל הזכויות שמורות.</p>
      </div>
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
    <div class="email-container">
      <div class="header">
        {{shop_logo_or_name}}
      </div>
      
      <div class="content">
        <div class="greeting">שלום {{customer_first_name}},</div>
        <p>אנו מעדכנים אותך שההזמנה <strong>{{order_name}}</strong> בוטלה.</p>
        
        {{#if cancellation_reason}}
        <div class="order-info" style="background-color: #fff5f5; border-color: #fed7d7;">
          <div class="info-title" style="color: #c53030;">סיבת הביטול</div>
          <div style="margin-top: 10px; color: #742a2a;">{{cancellation_reason}}</div>
        </div>
        {{/if}}

        {{#if refund_amount}}
        <p>בוצע זיכוי מלא/חלקי עבור ההזמנה. הזיכוי צפוי להופיע בחשבונך תוך 5-10 ימי עסקים, בהתאם לחברת האשראי.</p>
        {{/if}}

        <div class="button-container">
          <a href="{{shop_url}}" class="button">חזרה לחנות</a>
        </div>

        <p>אם לדעתך נפלה טעות או שיש לך שאלות נוספות, אנחנו כאן בשבילך.</p>
      </div>

      <div class="footer">
        <p>אם יש לך שאלות, השב למייל זה או צור קשר ב- <a href="mailto:{{shop_email}}">{{shop_email}}</a></p>
        <p>© {{year}} {{shop_name}}. כל הזכויות שמורות.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
};

export const ORDER_FULFILLED_TEMPLATE = {
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
    <div class="email-container">
      <div class="header">
        {{shop_logo_or_name}}
      </div>
      
      <div class="content">
        <div class="greeting">שלום {{customer_first_name}},</div>
        <p>חדשות טובות! ההזמנה שלך נשלחה ונמצאת בדרך אליך 🚀</p>
        <p>ההזמנה <strong>{{order_name}}</strong> נאספה על ידי חברת המשלוחים.</p>
        
        {{#if tracking_number}}
        <div class="order-info">
          <div class="info-title">פרטי מעקב</div>
          <div style="font-size: 18px; font-weight: bold; margin-top: 10px; letter-spacing: 1px;">{{tracking_number}}</div>
          {{#if tracking_url}}
          <div class="button-container" style="margin: 20px 0 0 0;">
            <a href="{{tracking_url}}" class="button">עקוב אחר המשלוח</a>
          </div>
          {{/if}}
        </div>
        {{/if}}

        <div class="button-container">
          <a href="{{order_status_url}}" class="button">צפה בפרטי ההזמנה</a>
        </div>

        <p>תודה שקנית אצלנו!</p>
      </div>

      <div class="footer">
        <p>אם יש לך שאלות, השב למייל זה או צור קשר ב- <a href="mailto:{{shop_email}}">{{shop_email}}</a></p>
        <p>© {{year}} {{shop_name}}. כל הזכויות שמורות.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
};

export const ORDER_REFUNDED_TEMPLATE = {
  subject: 'החזר עבור ההזמנה {{order_name}}',
  body: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>החזר עבור ההזמנה {{order_name}}</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="header">
        {{shop_logo_or_name}}
      </div>
      
      <div class="content">
        <div class="greeting">שלום {{customer_first_name}},</div>
        <p>בוצע החזר עבור ההזמנה <strong>{{order_name}}</strong>.</p>
        
        {{#if refund_amount}}
        <div class="order-info" style="background-color: #f0fdf4; border-color: #bbf7d0;">
          <div class="info-title" style="color: #166534;">סכום ההחזר</div>
          <div style="font-size: 24px; font-weight: bold; margin-top: 10px; color: #166534;">{{refund_amount}}</div>
        </div>
        {{/if}}

        {{#if refund_reason}}
        <div class="order-info">
          <div class="info-title">סיבת ההחזר</div>
          <div style="margin-top: 10px;">{{refund_reason}}</div>
        </div>
        {{/if}}

        <p>ההחזר צפוי להופיע בחשבונך תוך 5-10 ימי עסקים, בהתאם לחברת האשראי.</p>

        <div class="button-container">
          <a href="{{order_status_url}}" class="button">צפה בפרטי ההזמנה</a>
        </div>

        <p>אם יש לך שאלות נוספות, אנחנו כאן בשבילך.</p>
      </div>

      <div class="footer">
        <p>אם יש לך שאלות, השב למייל זה או צור קשר ב- <a href="mailto:{{shop_email}}">{{shop_email}}</a></p>
        <p>© {{year}} {{shop_name}}. כל הזכויות שמורות.</p>
      </div>
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
    ORDER_FULFILLED: ORDER_FULFILLED_TEMPLATE,
    ORDER_REFUNDED: ORDER_REFUNDED_TEMPLATE,
  };
}
