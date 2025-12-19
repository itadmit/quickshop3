/**
 * Payment Gateway - Unified Interface
 * 
 * כל ספקי התשלום חייבים לממש את הממשק הזה.
 * הקוד שלנו (Checkout, Orders) עובד רק עם הממשק הזה
 * ולא יודע מי הספק בפועל.
 */

import { PaymentProviderType } from '@/types/payment';

// ============================================
// INPUT TYPES - מה אנחנו שולחים לספק
// ============================================

export interface PaymentInitParams {
  /** מזהה הזמנה פנימי */
  orderId: number;
  /** מספר הזמנה להצגה */
  orderNumber: string;
  /** סכום לתשלום */
  amount: number;
  /** מטבע (ILS, USD, etc.) */
  currency: string;
  /** כתובת להפניה בהצלחה */
  successUrl: string;
  /** כתובת להפניה בביטול */
  cancelUrl: string;
  /** כתובת לעדכונים (webhook) */
  callbackUrl: string;
  
  // פרטי לקוח
  customer: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  
  // הגדרות תשלום
  options?: {
    /** מספר תשלומים מקסימלי */
    maxInstallments?: number;
    /** מספר תשלומים מינימלי */
    minInstallments?: number;
    /** האם לאפשר Bit */
    allowBit?: boolean;
    /** האם לאפשר Apple Pay */
    allowApplePay?: boolean;
    /** האם לאפשר Google Pay */
    allowGooglePay?: boolean;
    /** שפת הממשק */
    language?: 'he' | 'en' | 'ar';
    /** תיאור להצגה */
    description?: string;
  };
  
  /** מידע נוסף לשמירה */
  metadata?: Record<string, any>;
}

export interface RefundParams {
  /** מזהה עסקה מקורית */
  transactionId: string;
  /** מזהה עסקה חיצוני (מהספק) */
  externalTransactionId: string;
  /** סכום לזיכוי (ריק = זיכוי מלא) */
  amount?: number;
  /** סיבת הזיכוי */
  reason?: string;
}

export interface CallbackParams {
  /** כל הפרמטרים שהגיעו מהספק */
  queryParams: Record<string, string>;
  /** גוף הבקשה (אם יש) */
  body?: Record<string, any>;
  /** Headers */
  headers?: Record<string, string>;
}

// ============================================
// OUTPUT TYPES - מה אנחנו מקבלים מהספק
// ============================================

export interface PaymentInitResult {
  success: boolean;
  /** כתובת דף התשלום להפניה */
  paymentUrl?: string;
  /** מזהה עסקה פנימי שיצרנו */
  transactionId?: string;
  /** מזהה עסקה מהספק */
  externalTransactionId?: string;
  /** שגיאה */
  error?: string;
  errorCode?: string;
}

export interface CallbackValidationResult {
  success: boolean;
  /** האם התשלום הצליח */
  paymentSuccess: boolean;
  /** מזהה עסקה מהספק */
  externalTransactionId?: string;
  /** מספר אישור */
  approvalNumber?: string;
  /** 4 ספרות אחרונות של הכרטיס */
  cardLastFour?: string;
  /** סוג כרטיס */
  cardBrand?: string;
  /** תוקף כרטיס */
  cardExpiry?: string;
  /** טוקן לשימוש עתידי */
  token?: string;
  /** מפתח אימות (לולידציה) */
  confirmationKey?: string;
  /** שגיאה */
  error?: string;
  errorCode?: string;
  /** תשובה גולמית מהספק */
  rawResponse?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  /** מזהה זיכוי */
  refundId?: string;
  /** סכום שזוכה */
  amount?: number;
  /** שגיאה */
  error?: string;
  errorCode?: string;
  /** תשובה גולמית */
  rawResponse?: Record<string, any>;
}

export interface TransactionDetails {
  success: boolean;
  /** מזהה עסקה מהספק */
  externalTransactionId?: string;
  /** סכום */
  amount?: number;
  /** מטבע */
  currency?: string;
  /** סטטוס */
  status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'voided';
  /** 4 ספרות אחרונות */
  cardLastFour?: string;
  /** סוג כרטיס */
  cardBrand?: string;
  /** מספר אישור */
  approvalNumber?: string;
  /** תאריך עסקה */
  createdAt?: Date;
  /** שגיאה */
  error?: string;
  /** תשובה גולמית */
  rawResponse?: Record<string, any>;
}

// ============================================
// GATEWAY INTERFACE - הממשק שכל ספק מממש
// ============================================

export interface PaymentGateway {
  /** שם הספק */
  readonly provider: PaymentProviderType;
  
  /**
   * יצירת דף תשלום והפניה אליו
   * @param params פרטי התשלום
   * @returns כתובת דף התשלום ומזהה עסקה
   */
  initPayment(params: PaymentInitParams): Promise<PaymentInitResult>;
  
  /**
   * אימות חזרה מדף התשלום
   * נקרא כאשר הלקוח חוזר מדף התשלום
   * @param params פרמטרים שהגיעו מהספק
   * @returns תוצאת האימות
   */
  validateCallback(params: CallbackParams): Promise<CallbackValidationResult>;
  
  /**
   * זיכוי עסקה (מלא או חלקי)
   * @param params פרטי הזיכוי
   * @returns תוצאת הזיכוי
   */
  refund(params: RefundParams): Promise<RefundResult>;
  
  /**
   * קבלת פרטי עסקה
   * @param externalTransactionId מזהה עסקה מהספק
   * @returns פרטי העסקה
   */
  getTransaction(externalTransactionId: string): Promise<TransactionDetails>;
  
  /**
   * בדיקת חיבור ואימות credentials
   * @returns האם החיבור תקין
   */
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

// ============================================
// ADAPTER CONFIGURATION
// ============================================

export interface AdapterConfig {
  /** מזהה האינטגרציה בDB */
  integrationId: number;
  /** מזהה החנות */
  storeId: number;
  /** סוג הספק */
  provider: PaymentProviderType;
  /** האם סביבת בדיקה */
  isSandbox: boolean;
  /** פרטי התחברות */
  credentials: Record<string, string>;
  /** הגדרות נוספות */
  settings: Record<string, any>;
}

