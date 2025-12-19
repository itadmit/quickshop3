/**
 * Base Payment Adapter
 * 
 * מחלקת בסיס לכל ה-Adapters.
 * מספקת פונקציות עזר משותפות.
 */

import { PaymentProviderType } from '@/types/payment';
import {
  PaymentGateway,
  AdapterConfig,
  PaymentInitParams,
  PaymentInitResult,
  CallbackParams,
  CallbackValidationResult,
  RefundParams,
  RefundResult,
  TransactionDetails,
} from '../gateway';

export abstract class BasePaymentAdapter implements PaymentGateway {
  abstract readonly provider: PaymentProviderType;
  
  protected config: AdapterConfig;
  
  constructor(config: AdapterConfig) {
    this.config = config;
  }
  
  // ============================================
  // ABSTRACT METHODS - חייבים לממש בכל Adapter
  // ============================================
  
  abstract initPayment(params: PaymentInitParams): Promise<PaymentInitResult>;
  abstract validateCallback(params: CallbackParams): Promise<CallbackValidationResult>;
  abstract refund(params: RefundParams): Promise<RefundResult>;
  abstract getTransaction(externalTransactionId: string): Promise<TransactionDetails>;
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;
  
  // ============================================
  // HELPER METHODS - פונקציות עזר משותפות
  // ============================================
  
  /**
   * Get credential value
   */
  protected getCredential(key: string): string {
    return this.config.credentials[key] || '';
  }
  
  /**
   * Get setting value
   */
  protected getSetting<T>(key: string, defaultValue: T): T {
    return (this.config.settings[key] as T) ?? defaultValue;
  }
  
  /**
   * Check if sandbox mode
   */
  protected get isSandbox(): boolean {
    return this.config.isSandbox;
  }
  
  /**
   * Get store ID
   */
  protected get storeId(): number {
    return this.config.storeId;
  }
  
  /**
   * Get integration ID
   */
  protected get integrationId(): number {
    return this.config.integrationId;
  }
  
  /**
   * Make HTTP request with error handling
   */
  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; statusCode?: number }> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      const text = await response.text();
      let data: T | undefined;
      
      try {
        data = JSON.parse(text);
      } catch {
        // Response is not JSON
        data = text as unknown as T;
      }
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          data,
        };
      }
      
      return { success: true, data, statusCode: response.status };
    } catch (error: any) {
      console.error(`[${this.provider}] Request failed:`, error);
      return {
        success: false,
        error: error.message || 'Network request failed',
      };
    }
  }
  
  /**
   * Log for debugging (only in development)
   */
  protected log(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.provider}] ${message}`, data || '');
    }
  }
  
  /**
   * Log error
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.provider}] ${message}`, error || '');
  }
  
  /**
   * Generate unique user key for validation
   */
  protected generateUserKey(): string {
    return `${this.storeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Format amount for display
   */
  protected formatAmount(amount: number, currency: string = 'ILS'): string {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency,
    }).format(amount);
  }
  
  /**
   * Convert amount to cents/agorot
   */
  protected toCents(amount: number): number {
    return Math.round(amount * 100);
  }
  
  /**
   * Convert cents/agorot to amount
   */
  protected fromCents(cents: number): number {
    return cents / 100;
  }
  
  /**
   * Get card brand from card number prefix
   */
  protected getCardBrand(cardNumber: string): string {
    const firstDigit = cardNumber.charAt(0);
    const firstTwo = cardNumber.substring(0, 2);
    
    if (firstDigit === '4') return 'visa';
    if (['51', '52', '53', '54', '55'].includes(firstTwo)) return 'mastercard';
    if (['34', '37'].includes(firstTwo)) return 'amex';
    if (cardNumber.startsWith('36') || cardNumber.startsWith('38')) return 'diners';
    if (cardNumber.startsWith('9')) return 'isracard';
    
    return 'unknown';
  }
}

