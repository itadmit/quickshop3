/**
 * Payment Gateway - Unified interface for all payment providers
 * 
 * This module provides a single API that works with multiple payment providers
 * (PeleCard, Meshulam, Cardcom, Stripe, etc.)
 */

import {
  PaymentProviderType,
  StorePaymentIntegration,
  PaymentInitResult,
  PaymentCallbackData,
  PaymentValidationResult,
  PaymentTransactionDetails,
  RefundResult,
} from '@/types/payment';
import { Order } from '@/types/order';

// ============================================
// PAYMENT ADAPTER INTERFACE
// ============================================

/**
 * Interface that all payment adapters must implement
 */
export interface PaymentAdapter {
  /**
   * Provider name
   */
  readonly provider: PaymentProviderType;

  /**
   * Initialize a payment page and get URL for redirect
   */
  initPayment(params: InitPaymentParams): Promise<PaymentInitResult>;

  /**
   * Validate a payment callback (anti-fraud)
   */
  validatePayment(params: ValidatePaymentParams): Promise<PaymentValidationResult>;

  /**
   * Get transaction details from provider
   */
  getTransaction(transactionId: string): Promise<PaymentTransactionDetails>;

  /**
   * Refund a transaction
   */
  refundTransaction(transactionId: string, amount?: number): Promise<RefundResult>;

  /**
   * Void/Cancel a transaction (before settlement)
   */
  voidTransaction(transactionId: string): Promise<RefundResult>;
}

// ============================================
// PAYMENT GATEWAY PARAMS
// ============================================

export interface InitPaymentParams {
  order: {
    id: number;
    order_name: string;
    total_price: string;
    email?: string;
    phone?: string;
    name?: string;
  };
  storeId: number;
  storeSlug: string;
  integration: StorePaymentIntegration;
  
  // URLs
  successUrl: string;
  errorUrl: string;
  callbackUrl?: string;
  
  // Options
  createToken?: boolean;
  language?: 'he' | 'en';
  
  // Apple/Google Pay
  applePay?: {
    enabled: boolean;
    label: string;
  };
  googlePay?: {
    enabled: boolean;
    merchantName: string;
  };
}

export interface ValidatePaymentParams {
  integration: StorePaymentIntegration;
  confirmationKey: string;
  userKey: string;
  totalX100: number;
}

// ============================================
// PAYMENT GATEWAY CLASS
// ============================================

export class PaymentGateway {
  private adapters: Map<PaymentProviderType, PaymentAdapter> = new Map();

  /**
   * Register a payment adapter
   */
  registerAdapter(adapter: PaymentAdapter): void {
    this.adapters.set(adapter.provider, adapter);
  }

  /**
   * Get adapter for a provider
   */
  getAdapter(provider: PaymentProviderType): PaymentAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Payment adapter not found for provider: ${provider}`);
    }
    return adapter;
  }

  /**
   * Initialize a payment page
   */
  async initPayment(
    provider: PaymentProviderType,
    params: InitPaymentParams
  ): Promise<PaymentInitResult> {
    const adapter = this.getAdapter(provider);
    return adapter.initPayment(params);
  }

  /**
   * Validate a payment callback
   */
  async validatePayment(
    provider: PaymentProviderType,
    params: ValidatePaymentParams
  ): Promise<PaymentValidationResult> {
    const adapter = this.getAdapter(provider);
    return adapter.validatePayment(params);
  }

  /**
   * Get transaction details
   */
  async getTransaction(
    provider: PaymentProviderType,
    integration: StorePaymentIntegration,
    transactionId: string
  ): Promise<PaymentTransactionDetails> {
    const adapter = this.getAdapter(provider);
    return adapter.getTransaction(transactionId);
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(
    provider: PaymentProviderType,
    integration: StorePaymentIntegration,
    transactionId: string,
    amount?: number
  ): Promise<RefundResult> {
    const adapter = this.getAdapter(provider);
    return adapter.refundTransaction(transactionId, amount);
  }

  /**
   * Void/Cancel a transaction
   */
  async voidTransaction(
    provider: PaymentProviderType,
    integration: StorePaymentIntegration,
    transactionId: string
  ): Promise<RefundResult> {
    const adapter = this.getAdapter(provider);
    return adapter.voidTransaction(transactionId);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let paymentGatewayInstance: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (!paymentGatewayInstance) {
    paymentGatewayInstance = new PaymentGateway();
    
    // Register adapters here
    // Will be done in adapters/index.ts
  }
  return paymentGatewayInstance;
}

