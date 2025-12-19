/**
 * Payment System - Main Export
 * 
 * ייבוא מרכזי לכל מערכת התשלומים.
 * 
 * Usage:
 * import { getStorePaymentGateway, PaymentGateway } from '@/lib/payments';
 */

// Gateway Interface & Types
export * from './gateway';

// Factory
export {
  createPaymentGateway,
  getStorePaymentGateway,
  getPaymentGatewayById,
  getPaymentGatewayByProvider,
  getStorePaymentGateways,
  hasActivePaymentGateway,
} from './factory';

// Provider Configuration
export {
  PAYMENT_PROVIDERS,
  getProviderConfig,
  getAvailableProviders,
  getAllProviders,
  getRecommendedProvider,
  getProviderDisplayName,
  getFeatureDisplayName,
} from './providers';

// Adapters (for direct use if needed)
export { BasePaymentAdapter } from './adapters/base';
export { PelecardAdapter } from './adapters/pelecard';
