import { queryOne } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { ORDER_CONFIRMATION_TEMPLATE, WELCOME_TEMPLATE, ORDER_SHIPPED_TEMPLATE, ORDER_CANCELLED_TEMPLATE, ORDER_FULFILLED_TEMPLATE, ORDER_REFUNDED_TEMPLATE } from '@/lib/templates/default-emails';

export type EmailType = 'ORDER_CONFIRMATION' | 'WELCOME' | 'ORDER_SHIPPED' | 'ORDER_CANCELLED' | 'ORDER_FULFILLED' | 'ORDER_REFUNDED';

interface EmailVariables {
  [key: string]: string | number | boolean | undefined;
}

/**
 * מנוע המיילים המרכזי
 * אחראי על בניית ה-HTML, החלפת משתנים ושליחה
 */
export class EmailEngine {
  private storeId: number;
  private storeName: string = 'Quick Shop';
  private storeEmail: string = '';
  private storeUrl: string = '';
  private logoUrl?: string;

  constructor(storeId: number) {
    this.storeId = storeId;
  }

  /**
   * טעינת נתוני החנות והגדרות המייל
   */
  private async loadStoreSettings() {
    const store = await queryOne<{
      name: string;
      logo: string;
      slug: string;
      settings: any;
    }>(
      'SELECT name, logo, slug, settings FROM stores WHERE id = $1',
      [this.storeId]
    );

    if (store) {
      this.storeName = store.name;
      this.logoUrl = store.logo;
      // בייצור זה יהיה הדומיין האמיתי
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      this.storeUrl = `${baseUrl}/shops/${store.slug}`;
      
      // טעינת אימייל לתמיכה (אם הוגדר)
      const settings = store.settings || {};
      this.storeEmail = settings.supportEmail || settings.contactEmail || 'support@quickshop.com';
    }
  }

  /**
   * קבלת הטמפלייט (מותאם אישית או ברירת מחדל)
   */
  private async getTemplate(type: EmailType): Promise<{ subject: string; body: string }> {
    // נסה לטעון טמפלייט מותאם אישית מהמסד נתונים
    try {
      const customTemplate = await queryOne<{
        subject: string;
        body_html: string;
        is_active: boolean;
      }>(
        `SELECT subject, body_html, is_active 
         FROM email_templates 
         WHERE store_id = $1 AND template_type = $2 AND is_active = true
         LIMIT 1`,
        [this.storeId, type]
      );

      if (customTemplate) {
        return {
          subject: customTemplate.subject,
          body: customTemplate.body_html,
        };
      }
    } catch (error) {
      console.warn(`Failed to load custom template for ${type}, using default:`, error);
    }
    
    // אם אין טמפלייט מותאם אישית, השתמש בברירת מחדל
    switch (type) {
      case 'ORDER_CONFIRMATION':
        return ORDER_CONFIRMATION_TEMPLATE;
      case 'WELCOME':
        return WELCOME_TEMPLATE;
      case 'ORDER_SHIPPED':
        return ORDER_SHIPPED_TEMPLATE;
      case 'ORDER_CANCELLED':
        return ORDER_CANCELLED_TEMPLATE;
      case 'ORDER_FULFILLED':
        return ORDER_FULFILLED_TEMPLATE;
      case 'ORDER_REFUNDED':
        return ORDER_REFUNDED_TEMPLATE;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }

  /**
   * החלפת משתנים בטמפלייט
   */
  private replaceVariables(content: string, variables: EmailVariables): string {
    let result = content;
    
    // הוספת משתנים גלובליים
    const allVariables = {
      ...variables,
      shop_name: this.storeName,
      shop_url: this.storeUrl,
      shop_email: this.storeEmail,
      shop_logo_or_name: this.logoUrl 
        ? `<img src="${this.logoUrl}" alt="${this.storeName}" class="logo">` 
        : `<a href="${this.storeUrl}" class="shop-name">${this.storeName}</a>`,
      year: new Date().getFullYear(),
    };

    // החלפה פשוטה של {{variable}}
    for (const [key, value] of Object.entries(allVariables)) {
      // Regex גלובלי ו-case insensitive
      const regex = new RegExp(`{{${key}}}`, 'gi');
      result = result.replace(regex, String(value ?? ''));
    }

    // ניקוי בלוקים מותנים פשוטים (לדוגמה {{#if discounts}}...{{/if}})
    // הערה: זה מנוע פשוט מאוד, לא Handlebars מלא
    // אם המשתנה קיים ואמת -> תשאיר את התוכן. אחרת -> תמחק.
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variableName, content) => {
      return (allVariables as Record<string, any>)[variableName] ? content : '';
    });

    return result;
  }

  /**
   * שליחת מייל
   */
  public async send(type: EmailType, to: string, variables: EmailVariables) {
    await this.loadStoreSettings();
    const template = await this.getTemplate(type);
    
    const subject = this.replaceVariables(template.subject, variables);
    const html = this.replaceVariables(template.body, variables);

    await sendEmail({
      to,
      subject,
      html,
      storeId: this.storeId,
      from: `${this.storeName} <no-reply@my-quickshop.com>` // שימוש בשם החנות
    });
  }
}

