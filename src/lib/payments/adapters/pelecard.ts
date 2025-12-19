/**
 * Pelecard Payment Adapter
 * 
 * התממשקות לפלאקארד - ספק סליקה ישראלי.
 * 
 * Documentation: https://www.pelecard.com/
 * 
 * Flow:
 * 1. initPayment() - קורא ל-PaymentGW/init ומקבל URL לדף תשלום
 * 2. לקוח מופנה לדף התשלום של פלאקארד
 * 3. לקוח ממלא פרטי כרטיס ומאשר
 * 4. פלאקארד מפנה חזרה ל-GoodUrl עם פרמטרים
 * 5. validateCallback() - מאמת את הפרמטרים ומקבל פרטי עסקה
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

// Pelecard API URLs
const PELECARD_URLS = {
  sandbox: {
    init: 'https://gateway20.pelecard.biz/PaymentGW/init',
    validate: 'https://gateway20.pelecard.biz/PaymentGW/ValidateByUniqueKey',
    getTransaction: 'https://gateway20.pelecard.biz/PaymentGW/GetTransaction',
    refund: 'https://gateway20.pelecard.biz/services/DeleteTran',
  },
  production: {
    init: 'https://gateway20.pelecard.biz/PaymentGW/init',
    validate: 'https://gateway20.pelecard.biz/PaymentGW/ValidateByUniqueKey',
    getTransaction: 'https://gateway20.pelecard.biz/PaymentGW/GetTransaction',
    refund: 'https://gateway20.pelecard.biz/services/DeleteTran',
  },
};

// Pelecard response codes
const PELECARD_SUCCESS_CODES = ['000', '0'];

// Pelecard error codes translation
const PELECARD_ERRORS: Record<string, string> = {
  '001': 'כרטיס חסום',
  '002': 'כרטיס גנוב',
  '003': 'התקשר לחברת האשראי',
  '004': 'סירוב',
  '005': 'כרטיס מזויף',
  '006': 'CVV שגוי',
  '010': 'תוקף לא תקין',
  '033': 'כרטיס לא קיים',
  '036': 'כרטיס פג תוקף',
  '039': 'מספר כרטיס שגוי',
  '057': 'עסקה לא מאושרת לבית העסק',
  '058': 'עסקה לא מאושרת',
  // Add more as needed
};

interface PelecardInitResponse {
  URL?: string;
  Error?: { ErrCode?: string; ErrMsg?: string };
  ConfirmationKey?: string;
  UniqueKey?: string;
}

interface PelecardValidateResponse {
  ResultCode?: string;
  ErrorMessage?: string;
  PelecardTransactionId?: string;
  ApprovalNo?: string;
  Token?: string;
  CreditCardNumber?: string;
  CreditCardExpDate?: string;
  CreditCardCompanyIssuer?: string;
  ParamX?: string;
}

interface PelecardGetTransactionResponse {
  ResultCode?: string;
  ErrorMessage?: string;
  PelecardTransactionId?: string;
  DebitTotal?: number;
  Currency?: string;
  ApprovalNo?: string;
  CreditCardNumber?: string;
  CreditCardExpDate?: string;
  CreditType?: string;
  CreditCardCompanyIssuer?: string;
  DebitDate?: string;
}

interface PelecardRefundResponse {
  ResultCode?: string;
  ErrorMessage?: string;
}

export class PelecardAdapter extends BasePaymentAdapter {
  readonly provider: PaymentProviderType = 'pelecard';
  
  private get urls() {
    return this.isSandbox ? PELECARD_URLS.sandbox : PELECARD_URLS.production;
  }
  
  private get terminal(): string {
    return this.getCredential('terminal_number');
  }
  
  private get username(): string {
    return this.getCredential('username');
  }
  
  private get password(): string {
    return this.getCredential('password');
  }
  
  /**
   * Initialize payment - create payment page URL
   */
  async initPayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    this.log('initPayment', { orderId: params.orderId, amount: params.amount });
    
    // Generate unique user key for validation
    const userKey = this.generateUserKey();
    
    // Build Pelecard request
    const pelecardParams = {
      // Terminal credentials
      terminal: this.terminal,
      user: this.username,
      password: this.password,
      
      // URLs
      GoodURL: params.successUrl,
      ErrorURL: params.cancelUrl,
      CancelURL: params.cancelUrl,
      
      // Transaction details
      Total: this.toCents(params.amount), // Pelecard expects Agorot
      Currency: this.getCurrencyCode(params.currency),
      
      // Order info
      ParamX: userKey, // Our unique key for validation
      
      // Customer info
      Email: params.customer.email,
      CustomerName: `${params.customer.firstName || ''} ${params.customer.lastName || ''}`.trim(),
      PhoneNumber: params.customer.phone || '',
      
      // Payment options
      ActionType: 'J4', // Regular debit
      MaxPayments: params.options?.maxInstallments || 1,
      MinPayments: params.options?.minInstallments || 1,
      
      // Language
      Language: this.getLanguageCode(params.options?.language || 'he'),
      
      // Description
      FreeText: params.options?.description || `הזמנה ${params.orderNumber}`,
      
      // Card holder ID requirement
      RequiredFields: 'cvv',
      
      // Logo and styling (optional)
      LogoUrl: this.getSetting('logo_url', ''),
      TopText: this.getSetting('top_text', ''),
      BottomText: this.getSetting('bottom_text', ''),
    };
    
    // Make request to Pelecard
    const result = await this.makeRequest<PelecardInitResponse>(this.urls.init, {
      method: 'POST',
      body: JSON.stringify(pelecardParams),
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
    if (response.Error?.ErrCode && response.Error.ErrCode !== '000') {
      return {
        success: false,
        error: response.Error.ErrMsg || 'Pelecard error',
        errorCode: response.Error.ErrCode,
      };
    }
    
    // Success - return payment URL
    if (response.URL) {
      return {
        success: true,
        paymentUrl: response.URL,
        transactionId: userKey, // Our internal reference
        externalTransactionId: response.ConfirmationKey,
      };
    }
    
    return {
      success: false,
      error: 'No payment URL received',
    };
  }
  
  /**
   * Validate callback from Pelecard
   */
  async validateCallback(params: CallbackParams): Promise<CallbackValidationResult> {
    const { queryParams } = params;
    
    this.log('validateCallback', queryParams);
    
    // Extract parameters from callback
    const confirmationKey = queryParams.ConfirmationKey || queryParams.confirmationKey;
    const uniqueKey = queryParams.UniqueKey || queryParams.uniqueKey;
    const paramX = queryParams.ParamX || queryParams.paramX; // Our user key
    
    if (!confirmationKey) {
      return {
        success: false,
        paymentSuccess: false,
        error: 'Missing confirmation key',
      };
    }
    
    // Validate with Pelecard
    const validateParams = {
      terminal: this.terminal,
      user: this.username,
      password: this.password,
      UniqueKey: uniqueKey || confirmationKey,
    };
    
    const result = await this.makeRequest<PelecardValidateResponse>(this.urls.validate, {
      method: 'POST',
      body: JSON.stringify(validateParams),
    });
    
    if (!result.success || !result.data) {
      this.logError('validateCallback failed', result.error);
      return {
        success: false,
        paymentSuccess: false,
        error: result.error || 'Validation request failed',
        rawResponse: result.data as Record<string, any>,
      };
    }
    
    const response = result.data;
    
    // Check if payment succeeded
    const isSuccess = PELECARD_SUCCESS_CODES.includes(response.ResultCode || '');
    
    if (!isSuccess) {
      const errorMessage = PELECARD_ERRORS[response.ResultCode || ''] || response.ErrorMessage || 'Payment failed';
      return {
        success: true, // Validation succeeded, but payment failed
        paymentSuccess: false,
        error: errorMessage,
        errorCode: response.ResultCode,
        rawResponse: response as Record<string, any>,
      };
    }
    
    // Payment succeeded
    return {
      success: true,
      paymentSuccess: true,
      externalTransactionId: response.PelecardTransactionId,
      approvalNumber: response.ApprovalNo,
      cardLastFour: response.CreditCardNumber?.slice(-4),
      cardExpiry: response.CreditCardExpDate,
      cardBrand: this.mapCardBrand(response.CreditCardCompanyIssuer),
      token: response.Token,
      confirmationKey,
      rawResponse: response as Record<string, any>,
    };
  }
  
  /**
   * Refund a transaction
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    this.log('refund', { transactionId: params.transactionId, amount: params.amount });
    
    // First, get the transaction details
    const transactionDetails = await this.getTransaction(params.externalTransactionId);
    if (!transactionDetails.success) {
      return {
        success: false,
        error: transactionDetails.error || 'Could not find transaction',
      };
    }
    
    // Build refund request
    const refundParams = {
      user: this.username,
      password: this.password,
      terminalNumber: this.terminal,
      shopNumber: this.terminal, // Usually same as terminal
      PelecardTransactionId: params.externalTransactionId,
      TotalX100: params.amount ? this.toCents(params.amount) : undefined, // For partial refund
    };
    
    const result = await this.makeRequest<PelecardRefundResponse>(this.urls.refund, {
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
    const isSuccess = PELECARD_SUCCESS_CODES.includes(response.ResultCode || '');
    
    if (!isSuccess) {
      return {
        success: false,
        error: response.ErrorMessage || 'Refund failed',
        errorCode: response.ResultCode,
        rawResponse: response as Record<string, any>,
      };
    }
    
    return {
      success: true,
      refundId: params.externalTransactionId, // Pelecard uses same ID
      amount: params.amount || transactionDetails.amount,
      rawResponse: response as Record<string, any>,
    };
  }
  
  /**
   * Get transaction details
   */
  async getTransaction(externalTransactionId: string): Promise<TransactionDetails> {
    this.log('getTransaction', { externalTransactionId });
    
    const params = {
      terminal: this.terminal,
      user: this.username,
      password: this.password,
      PelecardTransactionId: externalTransactionId,
    };
    
    const result = await this.makeRequest<PelecardGetTransactionResponse>(this.urls.getTransaction, {
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
    const isSuccess = PELECARD_SUCCESS_CODES.includes(response.ResultCode || '');
    
    if (!isSuccess) {
      return {
        success: false,
        error: response.ErrorMessage || 'Transaction not found',
        rawResponse: response as Record<string, any>,
      };
    }
    
    return {
      success: true,
      externalTransactionId: response.PelecardTransactionId,
      amount: response.DebitTotal ? this.fromCents(response.DebitTotal) : undefined,
      currency: response.Currency === '1' ? 'ILS' : response.Currency,
      status: 'completed',
      cardLastFour: response.CreditCardNumber?.slice(-4),
      cardBrand: this.mapCardBrand(response.CreditCardCompanyIssuer),
      approvalNumber: response.ApprovalNo,
      createdAt: response.DebitDate ? new Date(response.DebitDate) : undefined,
      rawResponse: response as Record<string, any>,
    };
  }
  
  /**
   * Test connection to Pelecard
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    // Try to initialize a test payment with minimal amount
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
      
      if (result.success || result.errorCode === '000') {
        return { success: true };
      }
      
      // Some error codes indicate valid credentials but other issues
      if (['057', '058'].includes(result.errorCode || '')) {
        return { success: true }; // Credentials work, just transaction not allowed
      }
      
      return { success: false, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  private getCurrencyCode(currency: string): string {
    const codes: Record<string, string> = {
      ILS: '1',
      USD: '2',
      EUR: '3',
      GBP: '4',
    };
    return codes[currency.toUpperCase()] || '1';
  }
  
  private getLanguageCode(language: string): string {
    const codes: Record<string, string> = {
      he: 'HE',
      en: 'EN',
      ar: 'AR',
    };
    return codes[language] || 'HE';
  }
  
  private mapCardBrand(issuer?: string): string {
    if (!issuer) return 'unknown';
    
    const lowerIssuer = issuer.toLowerCase();
    if (lowerIssuer.includes('visa')) return 'visa';
    if (lowerIssuer.includes('master')) return 'mastercard';
    if (lowerIssuer.includes('amex') || lowerIssuer.includes('american')) return 'amex';
    if (lowerIssuer.includes('diners')) return 'diners';
    if (lowerIssuer.includes('isracard')) return 'isracard';
    
    return 'unknown';
  }
}

