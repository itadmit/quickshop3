/**
 * Grow / Meshulam Adapter
 * 
 * התממשקות ל-Grow (לשעבר משולם) - ספק סליקה ישראלי.
 * 
 * Documentation: https://docs.grow.link/
 * 
 * Flow:
 * 1. initPayment() - קורא ל-createPaymentProcess ומקבל URL לדף תשלום
 * 2. לקוח מופנה לדף התשלום של Grow
 * 3. לקוח ממלא פרטי כרטיס ומאשר
 * 4. Grow שולח callback ל-notifyUrl
 * 5. validateCallback() - מעבד את הcallback
 * 6. approveTransaction() - מאשר קבלת העסקה (חובה!)
 * 
 * Test Cards (Sandbox):
 * - 4580458045804580 - Valid for regular transactions
 * - 4580000000000000
 * - 4580111111111121
 * 
 * Important Notes:
 * - Bit, GooglePay, ApplePay don't have sandbox - real transactions!
 * - Each pageCode is for specific payment method
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

// Grow/Meshulam API URLs
const GROW_URLS = {
  sandbox: {
    base: 'https://sandbox.meshulam.co.il/api/light/server/1.0',
    createPayment: 'https://sandbox.meshulam.co.il/api/light/server/1.0/createPaymentProcess',
    createPaymentLink: 'https://sandboxapi.grow.link/api/light/server/1.0/CreatePaymentLink',
    approveTransaction: 'https://sandbox.meshulam.co.il/api/light/server/1.0/approveTransaction',
    getTransactionInfo: 'https://sandbox.meshulam.co.il/api/light/server/1.0/getTransactionInfo',
    refund: 'https://sandbox.meshulam.co.il/api/light/server/1.0/refundTransaction',
  },
  production: {
    base: 'https://secure.meshulam.co.il/api/light/server/1.0',
    createPayment: 'https://secure.meshulam.co.il/api/light/server/1.0/createPaymentProcess',
    createPaymentLink: 'https://api.grow.link/api/light/server/1.0/CreatePaymentLink',
    approveTransaction: 'https://secure.meshulam.co.il/api/light/server/1.0/approveTransaction',
    getTransactionInfo: 'https://secure.meshulam.co.il/api/light/server/1.0/getTransactionInfo',
    refund: 'https://secure.meshulam.co.il/api/light/server/1.0/refundTransaction',
  },
};

// Transaction type IDs
const TRANSACTION_TYPES = {
  creditCard: 1,
  bit: 6,
  applePay: 13,
  googlePay: 14,
} as const;

// Card brand codes
const CARD_BRANDS: Record<string, string> = {
  '2': 'mastercard',
  '3': 'visa',
  '5': 'isracard',
  '7': 'discover',
  '8': 'diners',
};

// Status codes
const STATUS_CODES = {
  paid: '2',
  pending: '1',
  failed: '0',
} as const;

interface GrowCreatePaymentResponse {
  status: number; // 1 = success, 0 = failure
  err: string | { id: number; message: string };
  data?: {
    processId: string;
    processToken: string;
    url: string;
  };
}

interface GrowCallbackData {
  status?: string; // "1" = success
  err?: string;
  data?: {
    asmachta?: string;
    cardSuffix?: string;
    cardType?: string;
    cardTypeCode?: string;
    cardBrand?: string;
    cardBrandCode?: string;
    cardExp?: string;
    firstPaymentSum?: string;
    periodicalPaymentSum?: string;
    status?: string; // "שולם"
    statusCode?: string; // "2" = paid
    transactionTypeId?: string;
    paymentType?: string;
    sum?: string;
    paymentsNum?: string;
    allPaymentsNum?: string;
    paymentDate?: string;
    description?: string;
    fullName?: string;
    payerPhone?: string;
    payerEmail?: string;
    transactionId?: string;
    transactionToken?: string;
    processId?: string;
    processToken?: string;
    paymentLinkProcessId?: string;
    paymentLinkProcessToken?: string;
    customFields?: Record<string, string>;
    productData?: Array<{
      product_id: string;
      name: string;
      quantity: string;
      price: string;
    }>;
  };
}

interface GrowApproveResponse {
  status: number;
  err: string | { id: number; message: string };
  data?: Record<string, any>;
}

interface GrowRefundResponse {
  status: number;
  err: string | { id: number; message: string };
  data?: {
    status?: string; // "תשלום שזוכה"
    statusCode?: number; // 3 = refunded
    transactionTypeId?: string;
    paymentType?: string;
    sum?: string;
    paymentDate?: string;
    description?: string;
    fullName?: string;
    payerPhone?: string;
    payerEmail?: string;
    transactionId?: string;
    asmachta?: string;
    cardSuffix?: string;
    cardType?: string;
    cardBrand?: string;
    refundedTransactionId?: number;
  };
}

export class MeshulamAdapter extends BasePaymentAdapter {
  readonly provider: PaymentProviderType = 'meshulam';
  
  private get urls() {
    return this.isSandbox ? GROW_URLS.sandbox : GROW_URLS.production;
  }
  
  private get userId(): string {
    return this.getCredential('user_id') || this.getCredential('userId');
  }
  
  private get pageCode(): string {
    return this.getCredential('page_code') || this.getCredential('pageCode') || this.getCredential('page_id');
  }
  
  private get apiKey(): string {
    return this.getCredential('api_key') || this.getCredential('apiKey') || '';
  }
  
  /**
   * Build form data for Grow API (they use application/x-www-form-urlencoded)
   */
  private buildFormData(params: Record<string, any>): string {
    const formData: string[] = [];
    
    const addParam = (key: string, value: any) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    };
    
    const processObject = (obj: Record<string, any>, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          processObject(value, fullKey);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              processObject(item, `${fullKey}[${index}]`);
            } else {
              addParam(`${fullKey}[${index}]`, item);
            }
          });
        } else {
          addParam(fullKey, value);
        }
      }
    };
    
    processObject(params);
    return formData.join('&');
  }
  
  /**
   * Initialize payment - create payment process
   */
  async initPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    this.log('initPayment', { orderId: params.orderId, amount: params.amount });
    
    // Build Grow request
    const growParams: Record<string, any> = {
      // Authentication
      pageCode: this.pageCode,
      userId: this.userId,
      
      // Transaction details
      sum: params.amount,
      chargeType: 1, // Regular charge
      
      // Description (no special characters!)
      description: this.sanitizeText(params.options?.description || `הזמנה ${params.orderNumber}`),
      
      // URLs
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      notifyUrl: params.callbackUrl,
      
      // Customer info (pageField format)
      pageField: {
        fullName: this.sanitizeText(`${params.customer.firstName || ''} ${params.customer.lastName || ''}`.trim() || 'לקוח'),
        phone: params.customer.phone || '0500000000',
        email: params.customer.email || '',
      },
      
      // Custom field for order reference
      cField1: String(params.orderId),
      cField2: params.orderNumber,
    };
    
    // Add API key if available (for multi-business)
    if (this.apiKey) {
      growParams.apiKey = this.apiKey;
    }
    
    // Handle installments
    if (params.options?.maxInstallments && params.options.maxInstallments > 1) {
      growParams.maxPaymentNum = params.options.maxInstallments;
    }
    
    // Make request
    const result = await this.makeRequest<GrowCreatePaymentResponse>(this.urls.createPayment, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: this.buildFormData(growParams),
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
    if (response.status !== 1 || !response.data) {
      const errorMessage = typeof response.err === 'object' 
        ? response.err.message 
        : response.err || 'Unknown error';
      const errorCode = typeof response.err === 'object' 
        ? String(response.err.id) 
        : undefined;
      
      return {
        success: false,
        error: errorMessage,
        errorCode,
      };
    }
    
    // Success
    return {
      success: true,
      paymentUrl: response.data.url,
      transactionId: String(params.orderId),
      externalTransactionId: response.data.processId,
    };
  }
  
  /**
   * Validate callback from Grow
   * After validation, must call approveTransaction!
   */
  async validateCallback(params: CallbackParams): Promise<CallbackValidationResult> {
    const data = (params.body || params.queryParams) as GrowCallbackData;
    
    this.log('validateCallback', data);
    
    // Check if callback indicates success
    if (data.status !== '1' || !data.data) {
      return {
        success: true,
        paymentSuccess: false,
        error: data.err?.toString() || 'Payment callback failed',
        rawResponse: data as Record<string, any>,
      };
    }
    
    const txnData = data.data;
    const statusCode = txnData.statusCode;
    const paymentSuccess = statusCode === STATUS_CODES.paid;
    
    // Map card brand
    const cardBrandCode = txnData.cardBrandCode || '';
    const cardBrand = CARD_BRANDS[cardBrandCode] || txnData.cardBrand?.toLowerCase() || 'unknown';
    
    if (!paymentSuccess) {
      return {
        success: true,
        paymentSuccess: false,
        error: txnData.status || 'Payment failed',
        externalTransactionId: txnData.transactionId || txnData.processId,
        rawResponse: data as Record<string, any>,
      };
    }
    
    // Payment succeeded - now approve the transaction
    await this.approveTransaction(txnData);
    
    return {
      success: true,
      paymentSuccess: true,
      externalTransactionId: txnData.transactionId || txnData.processId,
      approvalNumber: txnData.asmachta,
      cardLastFour: txnData.cardSuffix,
      cardBrand,
      cardExpiry: txnData.cardExp,
      rawResponse: data as Record<string, any>,
    };
  }
  
  /**
   * Approve transaction - MUST be called after successful payment
   */
  private async approveTransaction(txnData: GrowCallbackData['data']): Promise<boolean> {
    if (!txnData) return false;
    
    this.log('approveTransaction', { transactionId: txnData.transactionId });
    
    const approveParams: Record<string, any> = {
      pageCode: this.pageCode,
      transactionId: txnData.transactionId,
      transactionToken: txnData.transactionToken,
      transactionTypeId: txnData.transactionTypeId,
      paymentType: txnData.paymentType,
      sum: txnData.sum,
      firstPaymentSum: txnData.firstPaymentSum || '0',
      periodicalPaymentSum: txnData.periodicalPaymentSum || '0',
      paymentsNum: txnData.paymentsNum || '0',
      allPaymentsNum: txnData.allPaymentsNum || '1',
      paymentDate: txnData.paymentDate,
      asmachta: txnData.asmachta,
      description: txnData.description,
      fullName: txnData.fullName,
      payerPhone: txnData.payerPhone,
      payerEmail: txnData.payerEmail || '',
      cardSuffix: txnData.cardSuffix,
      cardType: txnData.cardType,
      cardTypeCode: txnData.cardTypeCode,
      cardBrand: txnData.cardBrand,
      cardBrandCode: txnData.cardBrandCode,
      cardExp: txnData.cardExp,
      processId: txnData.processId,
      processToken: txnData.processToken,
    };
    
    // Add payment link fields if present
    if (txnData.paymentLinkProcessId) {
      approveParams.paymentLinkProcessId = txnData.paymentLinkProcessId;
      approveParams.paymentLinkProcessToken = txnData.paymentLinkProcessToken;
    }
    
    // Add API key if available
    if (this.apiKey) {
      approveParams.apiKey = this.apiKey;
    }
    
    try {
      const result = await this.makeRequest<GrowApproveResponse>(this.urls.approveTransaction, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this.buildFormData(approveParams),
      });
      
      if (result.success && result.data?.status === 1) {
        this.log('approveTransaction success');
        return true;
      }
      
      this.logError('approveTransaction failed', result.error || result.data?.err);
      return false;
    } catch (error) {
      this.logError('approveTransaction error', error);
      return false;
    }
  }
  
  /**
   * Refund a transaction
   * 
   * Important Notes:
   * - Refunds only work for transactions that have been charged (not same day - that's cancellation)
   * - Same day = cancellation (full amount only)
   * - Max 2 refunds via API, then contact customer service
   * - No invoice is generated for refunds
   * - Direct debit: each payment must be refunded separately
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    this.log('refund', { transactionId: params.transactionId, amount: params.amount });
    
    // Check if we have transaction token (required for refund)
    const transactionToken = params.metadata?.transactionToken as string || '';
    
    const refundParams: Record<string, any> = {
      userId: this.userId,
      transactionId: params.externalTransactionId,
      transactionToken: transactionToken,
      refundSum: params.amount || 0, // Full refund if 0
    };
    
    // Optional: page code
    if (this.pageCode) {
      refundParams.pageCode = this.pageCode;
    }
    
    // Optional: stop direct debit if this is a recurring payment
    if (params.metadata?.stopDirectDebit) {
      refundParams.stopDirectDebit = 1;
    }
    
    const result = await this.makeRequest<GrowRefundResponse>(this.urls.refund, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: this.buildFormData(refundParams),
    });
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Refund request failed',
      };
    }
    
    if (result.data.status !== 1) {
      const errorMessage = typeof result.data.err === 'object'
        ? result.data.err.message
        : result.data.err || 'Refund failed';
      
      return {
        success: false,
        error: errorMessage,
        rawResponse: result.data as Record<string, any>,
      };
    }
    
    return {
      success: true,
      refundId: result.data.data?.refundedTransactionId?.toString(),
      amount: result.data.data?.sum ? parseFloat(result.data.data.sum) : params.amount,
      rawResponse: result.data as Record<string, any>,
    };
  }
  
  /**
   * Get transaction details
   */
  async getTransaction(externalTransactionId: string): Promise<TransactionDetails> {
    this.log('getTransaction', { externalTransactionId });
    
    const params: Record<string, any> = {
      pageCode: this.pageCode,
      userId: this.userId,
      transactionId: externalTransactionId,
    };
    
    if (this.apiKey) {
      params.apiKey = this.apiKey;
    }
    
    const result = await this.makeRequest<GrowApproveResponse>(this.urls.getTransactionInfo, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: this.buildFormData(params),
    });
    
    if (!result.success || !result.data || result.data.status !== 1) {
      return {
        success: false,
        error: result.error || 'Transaction not found',
      };
    }
    
    const txn = result.data.data as Record<string, any> | undefined;
    if (!txn) {
      return {
        success: false,
        error: 'No transaction data',
      };
    }
    
    // Map status
    let status: 'pending' | 'completed' | 'failed' | 'refunded' | 'voided' = 'pending';
    const statusCode = txn.statusCode;
    if (statusCode === '2') status = 'completed';
    else if (statusCode === '3') status = 'refunded';
    else if (statusCode === '0') status = 'failed';
    
    const cardBrandCode = txn.cardBrandCode || '';
    
    return {
      success: true,
      externalTransactionId: txn.transactionId || externalTransactionId,
      amount: parseFloat(txn.sum) || 0,
      currency: 'ILS',
      status,
      cardLastFour: txn.cardSuffix,
      cardBrand: CARD_BRANDS[cardBrandCode] || txn.cardBrand?.toLowerCase(),
      approvalNumber: txn.asmachta,
      createdAt: txn.paymentDate ? new Date(txn.paymentDate) : undefined,
      rawResponse: txn,
    };
  }
  
  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to create a test payment with minimal amount
      const result = await this.initPayment({
        orderId: 0,
        orderNumber: 'TEST-CONNECTION',
        amount: 1,
        currency: 'ILS',
        successUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel',
        callbackUrl: 'https://test.com/callback',
        customer: { 
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          phone: '0500000000',
        },
      });
      
      if (result.success && result.paymentUrl) {
        return { success: true };
      }
      
      // Check if error indicates invalid credentials
      if (result.error?.includes('pageCode') || result.error?.includes('userId')) {
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Remove special characters from text (Grow requirement)
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, '') // Keep Hebrew, English, numbers, spaces
      .trim()
      .slice(0, 100);
  }
}

// Alias for backward compatibility
export { MeshulamAdapter as GrowAdapter };

