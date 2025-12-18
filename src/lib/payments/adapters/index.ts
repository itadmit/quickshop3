/**
 * Payment Adapters Registry
 * 
 * This module registers all payment adapters with the PaymentGateway
 */

import { getPaymentGateway, PaymentGateway } from '../PaymentGateway';
import { PelecardAdapter, getPelecardAdapter } from './PelecardAdapter';
import { PaymentProviderType, StorePaymentIntegration } from '@/types/payment';

// ============================================
// ADAPTER EXPORTS
// ============================================

export { PelecardAdapter, getPelecardAdapter };

// ============================================
// REGISTER ALL ADAPTERS
// ============================================

let isRegistered = false;

export function registerAllPaymentAdapters(): PaymentGateway {
  const gateway = getPaymentGateway();

  if (!isRegistered) {
    // Register PeleCard adapter
    gateway.registerAdapter(getPelecardAdapter());

    // Register other adapters here as they are implemented:
    // gateway.registerAdapter(getMeshulamAdapter());
    // gateway.registerAdapter(getCardcomAdapter());
    // gateway.registerAdapter(getStripeAdapter());

    isRegistered = true;
  }

  return gateway;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get adapter instance for a specific provider
 */
export function getPaymentAdapter(provider: PaymentProviderType, integration: StorePaymentIntegration) {
  const gateway = registerAllPaymentAdapters();
  const adapter = gateway.getAdapter(provider);
  
  // Set integration on adapter if it supports it
  if ('setIntegration' in adapter && typeof adapter.setIntegration === 'function') {
    (adapter as PelecardAdapter).setIntegration(integration);
  }
  
  return adapter;
}

/**
 * Check if a provider is supported
 */
export function isPaymentProviderSupported(provider: PaymentProviderType): boolean {
  const supportedProviders: PaymentProviderType[] = [
    'pelecard',
    // Add more as they are implemented
  ];
  
  return supportedProviders.includes(provider);
}

/**
 * Get list of supported payment providers
 */
export function getSupportedPaymentProviders(): Array<{
  provider: PaymentProviderType;
  displayName: string;
  description: string;
  logo?: string;
}> {
  return [
    {
      provider: 'pelecard',
      displayName: 'PeleCard',
      description: 'סליקה באמצעות כרטיס אשראי - PeleCard',
      logo: '/images/providers/pelecard.png',
    },
    // Add more providers here
  ];
}

