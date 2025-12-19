/**
 * Shipping System - Main Export
 * 
 * ייבוא מרכזי לכל מערכת המשלוחים.
 * 
 * Usage:
 * import { getStoreShippingAdapter, ShippingAdapter } from '@/lib/shipping';
 */

// Gateway Interface & Types
export * from './ShippingGateway';

// Factory
export {
  createShippingAdapter,
  getStoreShippingAdapter,
  getShippingAdapterById,
  getShippingAdapterByProvider,
  getStoreShippingAdapters,
  hasActiveShippingAdapter,
  getStoreShippingIntegration,
  type ShippingAdapterConfig,
} from './factory';

// Provider Configuration
export {
  SHIPPING_PROVIDERS,
  getShippingProviderConfig,
  getAvailableShippingProviders,
  getAllShippingProviders,
  getRecommendedShippingProvider,
  getShippingProviderDisplayName,
  getShippingFeatureDisplayName,
  type ShippingProviderConfig,
  type ShippingProviderField,
} from './providers';

// Adapters (for direct use if needed)
export { BaseShippingAdapter } from './adapters/base';
export { BaldarAdapter } from './adapters/BaldarAdapter';
