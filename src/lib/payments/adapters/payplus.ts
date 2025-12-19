/**
 * PayPlus Adapter
 * 
 * התממשקות ל-PayPlus - ספק סליקה ישראלי מוביל.
 * 
 * Documentation: https://restapi.payplus.co.il/api/v1.0/
 * 
 * Flow:
 * 1. initPayment() - קורא ל-generateLink ומקבל URL לדף תשלום
 * 2. לקוח מופנה לדף התשלום של PayPlus
 * 3. לקוח ממלא פרטי כרטיס ומאשר
 * 4. PayPlus מפנה חזרה ל-refURL_success ושולח callback ל-refURL_callback
 * 5. validateCallback() - מעבד את הcallback ומעדכן סטטוס
 * 
 * Test Cards (Sandbox):
 * - Success: 5326-1402-8077-9844 (EXP: 05/26) CVV: 000
 * - Reject: 5326-1402-0001-0120 (EXP: 05/26) CVV: 000
 */

import { PaymentProviderType } from '@/types/payment';
import { BasePaymentAdapter } from './base';
import {
  PaymentInitParams,
  PaymentInitResult,
  CallbackParams,
  CallbackValidationResult,
  RefundParams,
  RefundResult,
  TransactionDetails,
} from '../gateway';
import crypto from 'crypto';

// PayPlus API URLs
const PAYPLUS_URLS = {
  sandbox: {
    base: 'https://restapidev.payplus.co.il/api/v1.0',
    generateLink: 'https://restapidev.payplus.co.il/api/v1.0/PaymentPages/generateLink',
    ipn: 'https://restapidev.payplus.co.il/api/v1.0/PaymentPages/ipn',
    ipnFull: 'https://restapidev.payplus.co.il/api/v1.0/PaymentPages/ipn-full',
    refund: 'https://restapidev.payplus.co.il/api/v1.0/Transactions/RefundByTransactionUID',
    cancel: 'https://restapidev.payplus.co.il/api/v1.0/Transactions/CancelTransaction',
  },
  production: {
    base: 'https://restapi.payplus.co.il/api/v1.0',
    generateLink: 'https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink',
    ipn: 'https://restapi.payplus.co.il/api/v1.0/PaymentPages/ipn',
    ipnFull: 'https://restapi.payplus.co.il/api/v1.0/PaymentPages/ipn-full',
    refund: 'https://restapi.payplus.co.il/api/v1.0/Transactions/RefundByTransactionUID',
    cancel: 'https://restapi.payplus.co.il/api/v1.0/Transactions/CancelTransaction',
  },
};

// Charge methods
const CHARGE_METHODS = {
  check: 0,      // J2 - בדיקה
  charge: 1,     // J4 - חיוב
  approval: 2,   // J5 - אישור
  recurring: 3,  // תשלומים חוזרים
  refund: 4,     // J4 - זיכוי
  token: 5,      // J2 - טוקניזציה
} as const;

interface PayPlusGenerateLinkResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data?: {
    page_request_uid: string;
    payment_page_link: string;
    qr_code_image?: string;
  };
}

interface PayPlusIPNResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data?: {
    transaction_uid?: string;
    page_request_uid?: string;
    type?: string;
    status?: string;
    status_code?: string;
    status_description?: string;
    amount?: number;
    currency_code?: string;
    number?: string;
    date?: string;
    approval_number?: string;
    voucher_id?: string;
    card_information?: {
      card_holder_name?: string;
      four_digits?: string;
      expiry_month?: string;
      expiry_year?: string;
      brand_name?: string;
      issuer_name?: string;
      card_foreign?: number;
      identification_number?: string;
    };
    customer?: {
      customer_uid?: string;
      customer_name?: string;
      email?: string;
      phone?: string;
    };
    token?: string;
    more_info?: string;
    more_info_2?: string;
    more_info_3?: string;
    more_info_4?: string;
    more_info_5?: string;
    secure3D?: {
      eci?: string;
      xid?: string;
      cavv?: string;
    } | null;
    related_transactions?: Array<{
      transaction_uid: string;
      type: string;
      amount: number;
      status: string;
    }>;
  };
}

interface PayPlusRefundResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data?: {
    transaction_uid?: string;
    amount?: number;
    approval_number?: string;
    voucher_id?: string;
    status?: string;
    status_code?: string;
    status_description?: string;
  };
}

interface PayPlusCallbackData {
  transaction_uid?: string;
  page_request_uid?: string;
  type?: string;
  status?: string;
  status_code?: string;
  status_description?: string;
  amount?: number;
  currency_code?: string;
  more_info?: string;
  approval_num?: string;
  voucher_num?: string;
  number_of_payments?: number;
  card_information?: {
    four_digits?: string;
    brand_name?: string;
    card_holder_name?: string;
    expiry_month?: string;
    expiry_year?: string;
  };
  customer?: {
    customer_uid?: string;
    customer_name?: string;
    email?: string;
  };
  token?: string;
  secure3D?: {
    eci?: string;
    xid?: string;
    cavv?: string;
  } | null;
}

export class PayPlusAdapter extends BasePaymentAdapter {
  readonly provider: PaymentProviderType = 'payplus';
  
  private get urls() {
    return this.isSandbox ? PAYPLUS_URLS.sandbox : PAYPLUS_URLS.production;
  }
  
  private get apiKey(): string {
    return this.getCredential('api_key');
  }
  
  private get secretKey(): string {
    return this.getCredential('secret_key');
  }
  
  private get paymentPageUid(): string {
    return this.getCredential('terminal_uid') || this.getCredential('payment_page_uid');
  }
  
  /**
   * Get default headers for PayPlus API
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'api-key': this.apiKey,
      'secret-key': this.secretKey,
    };
  }
  
  /**
   * Verify hash from PayPlus callback
   */
  private verifyHash(body: string, hash: string): boolean {
    try {
      const genHash = crypto
        .createHmac('sha256', this.secretKey)
        .update(body)
        .digest('base64');
      return genHash === hash;
    } catch {
      return false;
    }
  }
  
  /**
   * Initialize payment - generate payment page link
   */
  async initPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    this.log('initPayment', { orderId: params.orderId, amount: params.amount });
    
    // Build PayPlus request
    const payPlusParams: Record<string, any> = {
      // Payment page identification
      payment_page_uid: this.paymentPageUid,
      
      // Charge method (1 = J4 regular charge)
      charge_method: CHARGE_METHODS.charge,
      
      // Amount (PayPlus expects full amount, not agorot)
      amount: params.amount,
      currency_code: params.currency.toUpperCase(),
      
      // Email settings
      sendEmailApproval: true,
      sendEmailFailure: false,
      
      // URLs
      refURL_success: params.successUrl,
      refURL_failure: params.cancelUrl,
      refURL_cancel: params.cancelUrl,
      refURL_callback: params.callbackUrl,
      send_failure_callback: true,
      
      // Language
      language_code: params.options?.language === 'en' ? 'en' : 'he',
      
      // Expiry (in minutes)
      expiry_datetime: '60', // 1 hour
      
      // Customer info
      customer: {
        customer_name: `${params.customer.firstName || ''} ${params.customer.lastName || ''}`.trim() || params.customer.email,
        email: params.customer.email,
        phone: params.customer.phone || '',
      },
      
      // Order reference
      more_info: String(params.orderId),
      more_info_2: params.orderNumber,
      
      // Installments
      payments: params.options?.maxInstallments || 12,
      
      // Tokenization
      create_token: false,
    };
    
    // Add items if available
    if (params.options?.description) {
      payPlusParams.items = [{
        name: params.options.description,
        quantity: 1,
        price: params.amount,
      }];
    }
    
    // Allow Bit if enabled
    if (params.options?.allowBit) {
      payPlusParams.allowed_charge_methods = ['credit-card', 'bit'];
      payPlusParams.charge_default = 'credit-card';
    }
    
    // Make request to PayPlus
    const result = await this.makeRequest<PayPlusGenerateLinkResponse>(this.urls.generateLink, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payPlusParams),
    });
    
    if (!result.success || !result.data) {
      this.logError('initPayment failed', result.error);
      return {
        success: false,
        error: result.error || 'Failed to initialize payment',
      };
    }
    
    const response = result.data;
    
    // Check for errors
    if (response.results.status !== 'success' || response.results.code !== 0) {
      return {
        success: false,
        error: response.results.description || `PayPlus error code: ${response.results.code}`,
        errorCode: String(response.results.code),
      };
    }
    
    // Success - return payment URL
    if (response.data?.payment_page_link) {
      return {
        success: true,
        paymentUrl: response.data.payment_page_link,
        transactionId: String(params.orderId),
        externalTransactionId: response.data.page_request_uid,
      };
    }
    
    return {
      success: false,
      error: 'No payment URL received',
    };
  }
  
  /**
   * Validate callback from PayPlus
   * 
   * PayPlus sends data in two formats:
   * 1. POST with JSON body (server callback) - includes hash header
   * 2. GET with query params (redirect) - flat structure
   * 
   * Headers include 'hash' for verification and 'user-agent': 'PayPlus'
   */
  async validateCallback(params: CallbackParams): Promise<CallbackValidationResult> {
    const data = (params.body || params.queryParams || {}) as Record<string, any>;
    const headers = params.headers || {};
    
    this.log('validateCallback', data);
    
    // Verify hash if present (POST callback)
    if (headers['hash'] && params.rawBody) {
      const isValid = this.verifyHash(params.rawBody, headers['hash']);
      if (!isValid) {
        this.logError('Invalid hash in callback');
        return {
          success: false,
          paymentSuccess: false,
          error: 'Invalid callback hash',
        };
      }
    }
    
    // Check status - support both nested and flat formats
    // Flat format (URL redirect): status, status_code
    // Nested format (POST callback): status, status_code, card_information.four_digits
    const status = (data.status || '')?.toLowerCase?.() || '';
    const statusCode = data.status_code || '';
    const paymentSuccess = status === 'approved' || statusCode === '000';
    
    // Extract card info - support both formats
    // Flat: four_digits, expiry_month, expiry_year, brand_name
    // Nested: card_information.four_digits, etc.
    const cardInfo = data.card_information || {};
    const fourDigits = data.four_digits || cardInfo.four_digits;
    const brandName = data.brand_name || cardInfo.brand_name || 'unknown';
    const expiryMonth = data.expiry_month || cardInfo.expiry_month;
    const expiryYear = data.expiry_year || cardInfo.expiry_year;
    const cardHolderName = data.card_holder_name || cardInfo.card_holder_name;
    
    // Transaction identifiers
    const transactionUid = data.transaction_uid;
    const pageRequestUid = data.page_request_uid;
    const approvalNum = data.approval_num;
    const voucherNum = data.voucher_num;
    const token = data.token;
    const statusDescription = data.status_description;
    
    if (!paymentSuccess) {
      return {
        success: true,
        paymentSuccess: false,
        error: statusDescription || `Payment failed: ${status}`,
        errorCode: statusCode,
        externalTransactionId: transactionUid || pageRequestUid,
        rawResponse: data,
      };
    }
    
    return {
      success: true,
      paymentSuccess: true,
      externalTransactionId: transactionUid || pageRequestUid,
      approvalNumber: approvalNum || voucherNum,
      cardLastFour: fourDigits,
      cardBrand: brandName.toLowerCase(),
      cardExpiry: expiryMonth && expiryYear 
        ? `${expiryMonth}/${String(expiryYear).slice(-2)}`
        : undefined,
      token,
      rawResponse: data,
    };
  }
  
  /**
   * Refund a transaction (full or partial)
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    this.log('refund', { transactionId: params.transactionId, amount: params.amount });
    
    const refundParams: Record<string, any> = {
      transaction_uid: params.externalTransactionId,
      amount: params.amount || 0, // 0 = full refund
    };
    
    // Add reason if provided
    if (params.reason) {
      refundParams.more_info = params.reason;
    }
    
    const result = await this.makeRequest<PayPlusRefundResponse>(this.urls.refund, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(refundParams),
    });
    
    if (!result.success || !result.data) {
      this.logError('refund failed', result.error);
      return {
        success: false,
        error: result.error || 'Refund request failed',
      };
    }
    
    const response = result.data;
    
    if (response.results.status !== 'success' || response.results.code !== 0) {
      return {
        success: false,
        error: response.results.description || `Refund failed: ${response.results.code}`,
        errorCode: String(response.results.code),
        rawResponse: response as Record<string, any>,
      };
    }
    
    return {
      success: true,
      refundId: response.data?.transaction_uid,
      amount: response.data?.amount || params.amount,
      rawResponse: response as Record<string, any>,
    };
  }
  
  /**
   * Get transaction details using IPN
   */
  async getTransaction(externalTransactionId: string): Promise<TransactionDetails> {
    this.log('getTransaction', { externalTransactionId });
    
    // Determine if it's a page_request_uid or transaction_uid
    const isPageRequest = externalTransactionId.length > 30;
    
    const ipnParams: Record<string, any> = isPageRequest
      ? { payment_request_uid: externalTransactionId }
      : { transaction_uid: externalTransactionId };
    
    const result = await this.makeRequest<PayPlusIPNResponse>(this.urls.ipnFull, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(ipnParams),
    });
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to get transaction',
      };
    }
    
    const response = result.data;
    
    if (response.results.status !== 'success' || response.results.code !== 0) {
      return {
        success: false,
        error: response.results.description || 'Transaction not found',
        rawResponse: response as Record<string, any>,
      };
    }
    
    const txn = response.data;
    if (!txn) {
      return {
        success: false,
        error: 'No transaction data',
      };
    }
    
    // Map status
    let status: 'pending' | 'completed' | 'failed' | 'refunded' | 'voided' = 'pending';
    const txnStatus = txn.status?.toLowerCase();
    if (txnStatus === 'approved' || txn.status_code === '000') status = 'completed';
    else if (txn.type?.toLowerCase() === 'refund') status = 'refunded';
    else if (txnStatus === 'cancelled' || txnStatus === 'voided') status = 'voided';
    else if (txnStatus === 'declined' || txnStatus === 'failed') status = 'failed';
    
    return {
      success: true,
      externalTransactionId: txn.transaction_uid || txn.page_request_uid,
      amount: txn.amount,
      currency: txn.currency_code,
      status,
      cardLastFour: txn.card_information?.four_digits,
      cardBrand: txn.card_information?.brand_name?.toLowerCase(),
      approvalNumber: txn.approval_number || txn.voucher_id,
      createdAt: txn.date ? new Date(txn.date) : undefined,
      rawResponse: txn as Record<string, any>,
    };
  }
  
  /**
   * Test connection to PayPlus
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to generate a test link with minimal amount
      const result = await this.initPayment({
        orderId: 0,
        orderNumber: 'TEST-CONNECTION',
        amount: 1,
        currency: 'ILS',
        successUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel',
        callbackUrl: 'https://test.com/callback',
        customer: { email: 'test@test.com' },
      });
      
      if (result.success && result.paymentUrl) {
        return { success: true };
      }
      
      // Some errors indicate valid credentials but invalid request
      if (result.errorCode && !['1', '2', '401', '403'].includes(result.errorCode)) {
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

