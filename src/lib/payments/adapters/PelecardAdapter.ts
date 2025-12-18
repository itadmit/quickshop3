/**
 * PeleCard Payment Adapter
 * 
 * Implementation of PaymentAdapter for PeleCard payment gateway
 * 
 * Documentation:
 * - Iframe/Redirect: https://gateway21.pelecard.biz/sandbox
 * - REST API: https://gateway21.pelecard.biz/services
 */

import {
  PaymentProviderType,
  StorePaymentIntegration,
  PaymentInitResult,
  PaymentValidationResult,
  PaymentTransactionDetails,
  RefundResult,
  PaymentTransactionStatus,
} from '@/types/payment';
import { PaymentAdapter, InitPaymentParams, ValidatePaymentParams } from '../PaymentGateway';

// ============================================
// PELECARD CONSTANTS
// ============================================

const PELECARD_SANDBOX_URL = 'https://gateway21.pelecard.biz';
const PELECARD_PRODUCTION_URL = 'https://gateway21.pelecard.biz';

// Action Types
const ACTION_TYPES = {
  DEBIT: 'J4',           // חיוב רגיל
  AUTHORIZE: 'J5',       // אישור בלבד
  CREATE_TOKEN: 'J2',    // יצירת טוקן בלבד
} as const;

// Currency Codes
const CURRENCY_CODES = {
  ILS: '1',
  USD: '2',
  EUR: '3',
  GBP: '4',
} as const;

// ============================================
// PELECARD TYPES
// ============================================

interface PelecardInitRequest {
  terminal: string;
  user: string;
  password: string;
  ActionType: string;
  Currency: string;
  Total: string;
  GoodURL: string;
  ErrorURL: string;
  NotificationURL?: string;
  UserKey?: string;
  ParamX?: string;
  CreateToken?: string;
  Language?: string;
  FeedbackOnTop?: string;
  FeedbackDataTransferMethod?: string;
  ApplePay?: {
    Enabled: string;
    Label: string;
  };
  GooglePay?: {
    Enabled: string;
    MerchantName: string;
  };
  // Optional fields for customer info
  CustomerIdField?: string;
  Cvv2Field?: string;
  Email?: string;
  Tel?: string;
  CardHolderName?: string;
}

interface PelecardInitResponse {
  URL?: string;
  Error?: {
    ErrCode: number;
    ErrMsg: string;
  };
}

interface PelecardValidateRequest {
  ConfirmationKey: string;
  UniqueKey: string;
  TotalX100: string;
}

interface PelecardGetTransactionRequest {
  terminal: string;
  user: string;
  password: string;
  TransactionId: string;
}

interface PelecardTransactionResponse {
  ResultData?: {
    DebitTotal?: string;
    DebitCurrency?: string;
    DebitApproveNumber?: string;
    CreditCardNumber?: string;
    CreditCardExpDate?: string;
    CreditCardCompanyIssuer?: string;
    Token?: string;
    StatusCode?: string;
  };
  Error?: {
    ErrCode: number;
    ErrMsg: string;
  };
}

// ============================================
// PELECARD ADAPTER
// ============================================

export class PelecardAdapter implements PaymentAdapter {
  readonly provider: PaymentProviderType = 'pelecard';
  
  private integration: StorePaymentIntegration | null = null;

  /**
   * Get base URL based on environment
   */
  private getBaseUrl(isSandbox: boolean): string {
    // PeleCard uses the same URL for both environments
    // The difference is in the terminal/credentials
    return isSandbox ? PELECARD_SANDBOX_URL : PELECARD_PRODUCTION_URL;
  }

  /**
   * Get credentials from integration
   */
  private getCredentials(integration: StorePaymentIntegration): {
    terminal: string;
    user: string;
    password: string;
  } {
    // In production, you would decrypt the password here
    return {
      terminal: integration.terminal_number || '',
      user: integration.username || '',
      password: integration.password_encrypted || '', // Should be decrypted
    };
  }

  /**
   * Initialize a payment page and get URL for redirect
   */
  async initPayment(params: InitPaymentParams): Promise<PaymentInitResult> {
    const { integration, order, successUrl, errorUrl, callbackUrl, createToken, language, applePay, googlePay } = params;
    
    try {
      const baseUrl = this.getBaseUrl(integration.is_sandbox);
      const credentials = this.getCredentials(integration);

      // Convert total to agorot (x100)
      const totalInAgorot = Math.round(parseFloat(order.total_price) * 100).toString();

      // Build request
      const request: PelecardInitRequest = {
        terminal: credentials.terminal,
        user: credentials.user,
        password: credentials.password,
        ActionType: ACTION_TYPES.DEBIT,
        Currency: CURRENCY_CODES.ILS,
        Total: totalInAgorot,
        GoodURL: successUrl,
        ErrorURL: errorUrl,
        UserKey: order.id.toString(),
        ParamX: JSON.stringify({ 
          orderId: order.id, 
          orderName: order.order_name,
          storeId: params.storeId,
        }),
        FeedbackOnTop: 'True',
        FeedbackDataTransferMethod: 'POST',
        Language: language === 'en' ? 'EN' : 'HE',
      };

      // Add callback URL if provided
      if (callbackUrl) {
        request.NotificationURL = callbackUrl;
      }

      // Create token for future use
      if (createToken) {
        request.CreateToken = 'True';
      }

      // Customer info
      if (order.email) {
        request.Email = order.email;
      }
      if (order.phone) {
        request.Tel = order.phone;
      }
      if (order.name) {
        request.CardHolderName = order.name;
      }

      // Apple Pay
      if (applePay?.enabled) {
        request.ApplePay = {
          Enabled: 'true',
          Label: applePay.label,
        };
      }

      // Google Pay
      if (googlePay?.enabled) {
        request.GooglePay = {
          Enabled: 'true',
          MerchantName: googlePay.merchantName,
        };
      }

      // Send request
      const response = await fetch(`${baseUrl}/PaymentGW/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: PelecardInitResponse = await response.json();

      if (data.Error) {
        return {
          success: false,
          transactionId: '',
          paymentUrl: '',
          error: `${data.Error.ErrCode}: ${data.Error.ErrMsg}`,
        };
      }

      if (!data.URL) {
        return {
          success: false,
          transactionId: '',
          paymentUrl: '',
          error: 'No payment URL received',
        };
      }

      // Extract transaction ID from URL
      // URL format: https://gateway21.pelecard.biz/PaymentGW/Process?transactionId=xxx
      const urlObj = new URL(data.URL);
      const transactionId = urlObj.searchParams.get('transactionId') || '';

      return {
        success: true,
        transactionId,
        paymentUrl: data.URL,
      };
    } catch (error: any) {
      console.error('[PelecardAdapter] initPayment error:', error);
      return {
        success: false,
        transactionId: '',
        paymentUrl: '',
        error: error.message || 'Failed to initialize payment',
      };
    }
  }

  /**
   * Validate a payment callback (anti-fraud)
   */
  async validatePayment(params: ValidatePaymentParams): Promise<PaymentValidationResult> {
    const { integration, confirmationKey, userKey, totalX100 } = params;
    
    try {
      const baseUrl = this.getBaseUrl(integration.is_sandbox);

      const request: PelecardValidateRequest = {
        ConfirmationKey: confirmationKey,
        UniqueKey: userKey,
        TotalX100: totalX100.toString(),
      };

      const response = await fetch(`${baseUrl}/PaymentGW/ValidateByUniqueKey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      // Response is 1 for success, 0 for error
      if (data === 1 || data === '1') {
        return {
          valid: true,
          transactionId: userKey,
        };
      }

      return {
        valid: false,
        error: 'Validation failed',
      };
    } catch (error: any) {
      console.error('[PelecardAdapter] validatePayment error:', error);
      return {
        valid: false,
        error: error.message || 'Validation failed',
      };
    }
  }

  /**
   * Get transaction details from PeleCard
   */
  async getTransaction(transactionId: string): Promise<PaymentTransactionDetails> {
    if (!this.integration) {
      throw new Error('Integration not set. Call setIntegration first.');
    }

    const baseUrl = this.getBaseUrl(this.integration.is_sandbox);
    const credentials = this.getCredentials(this.integration);

    const request: PelecardGetTransactionRequest = {
      terminal: credentials.terminal,
      user: credentials.user,
      password: credentials.password,
      TransactionId: transactionId,
    };

    const response = await fetch(`${baseUrl}/PaymentGW/GetTransaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data: PelecardTransactionResponse = await response.json();

    if (data.Error) {
      throw new Error(`${data.Error.ErrCode}: ${data.Error.ErrMsg}`);
    }

    const resultData = data.ResultData || {};
    
    // Map card company to brand
    const cardBrandMap: Record<string, string> = {
      '1': 'isracard',
      '2': 'visa',
      '3': 'mastercard',
      '4': 'amex',
      '5': 'diners',
    };

    return {
      transactionId,
      amount: parseInt(resultData.DebitTotal || '0') / 100,
      currency: resultData.DebitCurrency === '1' ? 'ILS' : 'USD',
      status: resultData.StatusCode === '000' ? 'completed' : 'failed',
      cardLastFour: resultData.CreditCardNumber?.slice(-4),
      cardBrand: cardBrandMap[resultData.CreditCardCompanyIssuer || ''] || undefined,
      approvalNumber: resultData.DebitApproveNumber,
      createdAt: new Date(),
      raw: data.ResultData,
    };
  }

  /**
   * Refund a transaction
   * Note: PeleCard refund requires direct API call to Services endpoint
   */
  async refundTransaction(transactionId: string, amount?: number): Promise<RefundResult> {
    if (!this.integration) {
      throw new Error('Integration not set. Call setIntegration first.');
    }

    try {
      const baseUrl = this.getBaseUrl(this.integration.is_sandbox);
      const credentials = this.getCredentials(this.integration);

      // First, get the transaction details
      const transaction = await this.getTransaction(transactionId);

      // For refund, we need to use the Services API (not PaymentGW)
      // This is a credit transaction
      const refundAmount = amount || transaction.amount;
      const refundAmountInAgorot = Math.round(refundAmount * 100);

      // Note: The actual refund API call depends on PeleCard's Services API
      // You'll need the token or card details from the original transaction
      // For now, we'll return a placeholder response
      
      // TODO: Implement actual refund using Services API
      // The endpoint would be: /services/DebitCreditType with negative amount
      // or a specific refund endpoint if available

      console.warn('[PelecardAdapter] Refund not fully implemented - requires Services API integration');

      return {
        success: false,
        error: 'Refund requires Services API integration - please contact PeleCard support',
      };
    } catch (error: any) {
      console.error('[PelecardAdapter] refundTransaction error:', error);
      return {
        success: false,
        error: error.message || 'Refund failed',
      };
    }
  }

  /**
   * Void/Cancel a transaction
   */
  async voidTransaction(transactionId: string): Promise<RefundResult> {
    if (!this.integration) {
      throw new Error('Integration not set. Call setIntegration first.');
    }

    try {
      // PeleCard void is done via Services API
      // Similar to refund - needs full implementation
      
      console.warn('[PelecardAdapter] Void not fully implemented - requires Services API integration');

      return {
        success: false,
        error: 'Void requires Services API integration - please contact PeleCard support',
      };
    } catch (error: any) {
      console.error('[PelecardAdapter] voidTransaction error:', error);
      return {
        success: false,
        error: error.message || 'Void failed',
      };
    }
  }

  /**
   * Set the integration for subsequent calls
   * This is needed for methods that don't receive integration as a parameter
   */
  setIntegration(integration: StorePaymentIntegration): void {
    this.integration = integration;
  }

  /**
   * Parse callback data from PeleCard
   */
  static parseCallback(data: Record<string, any>): {
    statusCode: string;
    transactionId: string;
    approvalNumber: string;
    token: string;
    confirmationKey: string;
    paramX: string;
    userKey: string;
    isSuccess: boolean;
  } {
    return {
      statusCode: data.PelecardStatusCode || '',
      transactionId: data.PelecardTransactionId || '',
      approvalNumber: data.ApprovalNo || '',
      token: data.Token || '',
      confirmationKey: data.ConfirmationKey || '',
      paramX: data.ParamX || '',
      userKey: data.UserKey || '',
      isSuccess: data.PelecardStatusCode === '000',
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let pelecardAdapterInstance: PelecardAdapter | null = null;

export function getPelecardAdapter(): PelecardAdapter {
  if (!pelecardAdapterInstance) {
    pelecardAdapterInstance = new PelecardAdapter();
  }
  return pelecardAdapterInstance;
}

