/**
 * Shipping Adapters Registry
 * 
 * This module registers all shipping adapters with the ShippingGateway
 */

import { getShippingGateway, ShippingGateway } from '../ShippingGateway';
import { BaldarAdapter, getBaldarAdapter } from './BaldarAdapter';
import { ShippingProviderType, StoreShippingIntegration } from '@/types/payment';

// ============================================
// ADAPTER EXPORTS
// ============================================

export { BaldarAdapter, getBaldarAdapter };

// ============================================
// REGISTER ALL ADAPTERS
// ============================================

let isRegistered = false;

export function registerAllShippingAdapters(): ShippingGateway {
  const gateway = getShippingGateway();

  if (!isRegistered) {
    // Register Baldar adapter
    gateway.registerAdapter(getBaldarAdapter());

    // Register other adapters here as they are implemented:
    // gateway.registerAdapter(getChitaAdapter());
    // gateway.registerAdapter(getDhlAdapter());
    // gateway.registerAdapter(getUpsAdapter());

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
export function getShippingAdapter(provider: ShippingProviderType) {
  const gateway = registerAllShippingAdapters();
  return gateway.getAdapter(provider);
}

/**
 * Check if a provider is supported
 */
export function isShippingProviderSupported(provider: ShippingProviderType): boolean {
  const supportedProviders: ShippingProviderType[] = [
    'baldar',
    // Add more as they are implemented
  ];
  
  return supportedProviders.includes(provider);
}

/**
 * Get list of supported shipping providers
 */
export function getSupportedShippingProviders(): Array<{
  provider: ShippingProviderType;
  displayName: string;
  description: string;
  logo?: string;
}> {
  return [
    {
      provider: 'baldar',
      displayName: 'Baldar / Focus Delivery',
      description: 'משלוחים עם Baldar / Focus Delivery',
      logo: '/images/providers/baldar.png',
    },
    // Add more providers here
  ];
}

