/**
 * PayMe / QuickShop Payments Adapter
 * 
 * התממשקות ל-PayMe - הבסיס לקוויק שופ פיימנטס (White Label).
 * 
 * Documentation: https://payme.stoplight.io/
 * 
 * Flow:
 * 1. initPayment() - קורא ל-generate-sale ומקבל URL לדף תשלום
 * 2. לקוח מופנה לדף התשלום של PayMe/QuickPay
 * 3. לקוח ממלא פרטי כרטיס ומאשר
 * 4. PayMe מפנה חזרה ל-sale_return_url ושולח callback ל-sale_callback_url
 * 5. validateCallback() - מעבד את הcallback ומעדכן סטטוס
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

// PayMe API URLs
const PAYME_URLS = {
  sandbox: {
    base: 'https://sandbox.payme.io',
    generateSale: 'https://sandbox.payme.io/api/generate-sale',
    refund: 'https://sandbox.payme.io/api/refund-sale',
    getSales: 'https://sandbox.payme.io/api/get-sales',
    getTransactions: 'https://sandbox.payme.io/api/get-transactions',
  },
  production: {
    base: 'https://ng.payme.io',
    generateSale: 'https://ng.payme.io/api/generate-sale',
    refund: 'https://ng.payme.io/api/refund-sale',
    getSales: 'https://ng.payme.io/api/get-sales',
    getTransactions: 'https://ng.payme.io/api/get-transactions',
  },
};

// PayMe payment methods
const PAYME_PAYMENT_METHODS = {
  credit_card: 'credit-card',
  bit: 'bit',
  apple_pay: 'apple-pay',
  google_pay: 'google-pay',
  paypal: 'paypal',
} as const;

interface PayMeGenerateSaleResponse {
  status_code: number;
  sale_url?: string;
  payme_sale_id?: string;
  payme_sale_code?: number;
  price?: number;
  transaction_id?: string;
  currency?: string;
  sale_payment_method?: string;
  session?: string;
  status_error_code?: number;
  status_error_details?: string;
}

interface PayMeCallbackData {
  sale_status?: string;
  payme_sale_id?: string;
  payme_sale_code?: string;
  sale_price?: number;
  sale_currency?: string;
  transaction_id?: string;
  sale_auth_number?: string;
  sale_first_payment?: number;
  sale_installments?: number;
  buyer_card_mask?: string;
  buyer_card_exp?: string;
  buyer_card_brand?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_key?: string; // Token for future use
  status_error_code?: number;
  status_error_details?: string;
}

interface PayMeRefundResponse {
  status_code: number;
  payme_sale_id?: string;
  sale_refund_amount?: number;
  sale_status?: string;
  status_error_code?: number;
  status_error_details?: string;
}

interface PayMeGetSalesResponse {
  status_code: number;
  items_count?: number;
  items?: Array<{
    payme_sale_id: string;
    payme_sale_code: number;
    sale_created: string;
    sale_status: string;
    sale_price: number;
    sale_currency: string;
    sale_auth_number?: string;
    sale_buyer_details?: {
      buyer_card_mask?: string;
      buyer_card_expiry?: string;
      buyer_card_brand?: string;
      buyer_name?: string;
      buyer_email?: string;
    };
  }>;
}

export class PayMeAdapter extends BasePaymentAdapter {
  readonly provider: PaymentProviderType = 'quickpay'; // QuickShop Payments (PayMe White Label)
  
  private get urls() {
    return this.isSandbox ? PAYME_URLS.sandbox : PAYME_URLS.production;
  }
  
  private get sellerPaymeId(): string {
    // MPL key - the main merchant identifier
    return this.getCredential('seller_payme_id') || this.getCredential('api_key');
  }
  
  private get clientKey(): string {
    // Partner key (for marketplace features)
    return this.getCredential('payme_client_key') || this.getCredential('client_key') || '';
  }
  
  /**
   * Initialize payment - create payment page URL
   */
  async initPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    this.log('initPayment', { orderId: params.orderId, amount: params.amount });
    
    // Build PayMe request
    const paymeParams: Record<string, any> = {
      // Seller identification
      seller_payme_id: this.sellerPaymeId,
      
      // Transaction details - PayMe expects price in agorot/cents
      sale_price: this.toCents(params.amount),
      currency: params.currency.toUpperCase(),
      
      // Product/order info
      product_name: params.options?.description || `הזמנה ${params.orderNumber}`,
      transaction_id: String(params.orderId), // Our reference
      
      // Installments
      installments: params.options?.maxInstallments?.toString() || '12',
      
      // URLs
      sale_callback_url: params.callbackUrl,
      sale_return_url: params.successUrl,
      
      // Customer info
      sale_email: params.customer.email,
      sale_name: `${params.customer.firstName || ''} ${params.customer.lastName || ''}`.trim() || params.customer.email,
      sale_mobile: params.customer.phone || '',
      
      // Payment settings
      sale_payment_method: 'credit-card', // Default to credit card
      capture_buyer: params.options?.allowBit ? '1' : '0', // Capture token for future use
      sale_send_notification: true,
      
      // Language
      language: params.options?.language === 'en' ? 'en' : 'he',
      
      // Sale type
      sale_type: 'sale', // Regular sale (not authorization)
    };
    
    // Add Bit support if enabled
    if (params.options?.allowBit) {
      paymeParams.sale_payment_method = 'credit-card,bit';
    }
    
    // Make request to PayMe
    const result = await this.makeRequest<PayMeGenerateSaleResponse>(this.urls.generateSale, {
      method: 'POST',
      body: JSON.stringify(paymeParams),
    });
    
    if (!result.success || !result.data) {
      this.logError('initPayment failed', result.error);
      return {
        success: false,
        error: result.error || 'Failed to initialize payment',
      };
    }
    
    const response = result.data;
    
    // Check for errors (status_code 0 = success)
    if (response.status_code !== 0) {
      return {
        success: false,
        error: response.status_error_details || `PayMe error code: ${response.status_code}`,
        errorCode: String(response.status_error_code || response.status_code),
      };
    }
    
    // Success - return payment URL
    if (response.sale_url) {
      return {
        success: true,
        paymentUrl: response.sale_url,
        transactionId: String(params.orderId), // Our internal reference
        externalTransactionId: response.payme_sale_id,
      };
    }
    
    return {
      success: false,
      error: 'No payment URL received',
    };
  }
  
  /**
   * Validate callback from PayMe
   * PayMe sends callback as POST with form data or JSON
   */
  async validateCallback(params: CallbackParams): Promise<CallbackValidationResult> {
    const data = { ...params.queryParams, ...(params.body || {}) } as PayMeCallbackData;
    
    this.log('validateCallback', data);
    
    const saleStatus = data.sale_status?.toLowerCase();
    const paymentSuccess = saleStatus === 'completed' || saleStatus === 'success';
    
    // Extract card info
    const cardMask = data.buyer_card_mask || '';
    const cardLastFour = cardMask.slice(-4);
    
    // Map card brand
    let cardBrand = 'unknown';
    if (data.buyer_card_brand) {
      const brand = data.buyer_card_brand.toLowerCase();
      if (brand.includes('visa')) cardBrand = 'visa';
      else if (brand.includes('master')) cardBrand = 'mastercard';
      else if (brand.includes('amex') || brand.includes('american')) cardBrand = 'amex';
      else if (brand.includes('diners')) cardBrand = 'diners';
      else if (brand.includes('isracard')) cardBrand = 'isracard';
      else cardBrand = brand;
    }
    
    if (!paymentSuccess) {
      return {
        success: true, // Callback processing succeeded
        paymentSuccess: false,
        error: data.status_error_details || `Payment failed: ${saleStatus}`,
        errorCode: data.status_error_code?.toString(),
        externalTransactionId: data.payme_sale_id,
        rawResponse: data as Record<string, any>,
      };
    }
    
    return {
      success: true,
      paymentSuccess: true,
      externalTransactionId: data.payme_sale_id,
      approvalNumber: data.sale_auth_number,
      cardLastFour,
      cardBrand,
      cardExpiry: data.buyer_card_exp,
      token: data.buyer_key, // Token for recurring payments
      rawResponse: data as Record<string, any>,
    };
  }
  
  /**
   * Refund a transaction (full or partial)
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    this.log('refund', { transactionId: params.transactionId, amount: params.amount });
    
    const refundParams: Record<string, any> = {
      seller_payme_id: this.sellerPaymeId,
      payme_sale_id: params.externalTransactionId,
      language: 'he',
    };
    
    // Add client key if available (for marketplace)
    if (this.clientKey) {
      refundParams.payme_client_key = this.clientKey;
    }
    
    // Partial refund - amount in agorot
    if (params.amount) {
      refundParams.sale_refund_amount = this.toCents(params.amount);
    }
    
    const result = await this.makeRequest<PayMeRefundResponse>(this.urls.refund, {
      method: 'POST',
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
    
    if (response.status_code !== 0) {
      return {
        success: false,
        error: response.status_error_details || `Refund failed: ${response.status_code}`,
        errorCode: String(response.status_error_code || response.status_code),
        rawResponse: response as Record<string, any>,
      };
    }
    
    return {
      success: true,
      refundId: response.payme_sale_id,
      amount: response.sale_refund_amount ? this.fromCents(response.sale_refund_amount) : params.amount,
      rawResponse: response as Record<string, any>,
    };
  }
  
  /**
   * Get transaction details
   */
  async getTransaction(externalTransactionId: string): Promise<TransactionDetails> {
    this.log('getTransaction', { externalTransactionId });
    
    const params: Record<string, any> = {
      seller_payme_id: this.sellerPaymeId,
      payme_sale_id: externalTransactionId,
      page_size: 1,
      page: 1,
    };
    
    if (this.clientKey) {
      params.payme_client_key = this.clientKey;
    }
    
    const result = await this.makeRequest<PayMeGetSalesResponse>(this.urls.getSales, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to get transaction',
      };
    }
    
    const response = result.data;
    
    if (response.status_code !== 0 || !response.items || response.items.length === 0) {
      return {
        success: false,
        error: 'Transaction not found',
        rawResponse: response as Record<string, any>,
      };
    }
    
    const sale = response.items[0];
    
    // Map status
    let status: 'pending' | 'completed' | 'failed' | 'refunded' | 'voided' = 'pending';
    const saleStatus = sale.sale_status?.toLowerCase();
    if (saleStatus === 'completed' || saleStatus === 'success') status = 'completed';
    else if (saleStatus === 'refunded') status = 'refunded';
    else if (saleStatus === 'voided' || saleStatus === 'cancelled') status = 'voided';
    else if (saleStatus === 'failed' || saleStatus === 'declined') status = 'failed';
    
    return {
      success: true,
      externalTransactionId: sale.payme_sale_id,
      amount: this.fromCents(sale.sale_price),
      currency: sale.sale_currency,
      status,
      cardLastFour: sale.sale_buyer_details?.buyer_card_mask?.slice(-4),
      cardBrand: sale.sale_buyer_details?.buyer_card_brand?.toLowerCase(),
      approvalNumber: sale.sale_auth_number,
      createdAt: sale.sale_created ? new Date(sale.sale_created) : undefined,
      rawResponse: sale as Record<string, any>,
    };
  }
  
  /**
   * Test connection to PayMe
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    // Try to generate a test sale with minimal amount
    // PayMe will validate credentials without actually creating the sale
    try {
      const result = await this.initPayment({
        orderId: 0,
        orderNumber: 'TEST',
        amount: 1,
        currency: 'ILS',
        successUrl: 'https://test.com/success',
        cancelUrl: 'https://test.com/cancel',
        callbackUrl: 'https://test.com/callback',
        customer: { email: 'test@test.com' },
      });
      
      // If we get a sale URL, credentials are valid
      if (result.success && result.paymentUrl) {
        return { success: true };
      }
      
      // Some errors indicate valid credentials but invalid request
      // For test connection, we just need to verify credentials work
      if (result.errorCode && !['1', '2'].includes(result.errorCode)) {
        return { success: true }; // Credentials work
      }
      
      return { success: false, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export alias for QuickShop Payments
export { PayMeAdapter as QuickPayAdapter };

