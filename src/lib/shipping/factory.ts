/**
 * Shipping Gateway Factory
 * 
 * יוצר את ה-Adapter הנכון לפי סוג הספק.
 * הקוד שלנו משתמש רק ב-Factory ולא יודע על הספקים עצמם.
 */

import { query, queryOne } from '@/lib/db';
import { ShippingProviderType, StoreShippingIntegration } from '@/types/payment';
import {
  ShippingAdapter,
  CreateShipmentParams,
  GetTrackingParams,
  CancelShipmentParams,
  PrintLabelParams,
  GetPickupPointsParams,
} from './ShippingGateway';
import { BaldarAdapter } from './adapters/BaldarAdapter';
// Import other adapters as they are created:
// import { CargoAdapter } from './adapters/CargoAdapter';
// import { LionwheelAdapter } from './adapters/LionwheelAdapter';

/**
 * Adapter Configuration
 */
export interface ShippingAdapterConfig {
  /** מזהה האינטגרציה בDB */
  integrationId: number;
  /** מזהה החנות */
  storeId: number;
  /** סוג הספק */
  provider: ShippingProviderType;
  /** האם סביבת בדיקה */
  isSandbox: boolean;
  /** פרטי התחברות */
  credentials: Record<string, string>;
  /** הגדרות נוספות */
  settings: Record<string, any>;
}

/**
 * Create shipping adapter for a specific provider
 */
export function createShippingAdapter(config: ShippingAdapterConfig): ShippingAdapter {
  switch (config.provider) {
    case 'baldar':
    case 'focus':
    case 'runcom':
      return new BaldarAdapter(config);
    
    // Add more adapters as they are implemented:
    // case 'cargo':
    //   return new CargoAdapter(config);
    // case 'lionwheel':
    //   return new LionwheelAdapter(config);
    // case 'chita':
    //   return new ChitaAdapter(config);
    // case 'dhl':
    //   return new DHLAdapter(config);
    
    default:
      throw new Error(`Unsupported shipping provider: ${config.provider}`);
  }
}

/**
 * Get shipping adapter for a store (uses default integration)
 */
export async function getStoreShippingAdapter(storeId: number): Promise<ShippingAdapter | null> {
  // Get default active integration for the store
  const integration = await queryOne<StoreShippingIntegration>(
    `SELECT * FROM store_shipping_integrations 
     WHERE store_id = $1 AND is_active = true 
     ORDER BY is_default DESC, created_at ASC 
     LIMIT 1`,
    [storeId]
  );
  
  if (!integration) {
    return null;
  }
  
  return createAdapterFromIntegration(integration);
}

/**
 * Get shipping adapter by integration ID
 */
export async function getShippingAdapterById(integrationId: number, storeId: number): Promise<ShippingAdapter | null> {
  const integration = await queryOne<StoreShippingIntegration>(
    'SELECT * FROM store_shipping_integrations WHERE id = $1 AND store_id = $2',
    [integrationId, storeId]
  );
  
  if (!integration) {
    return null;
  }
  
  return createAdapterFromIntegration(integration);
}

/**
 * Get shipping adapter by provider type
 */
export async function getShippingAdapterByProvider(
  storeId: number, 
  provider: ShippingProviderType
): Promise<ShippingAdapter | null> {
  const integration = await queryOne<StoreShippingIntegration>(
    'SELECT * FROM store_shipping_integrations WHERE store_id = $1 AND provider = $2 AND is_active = true',
    [storeId, provider]
  );
  
  if (!integration) {
    return null;
  }
  
  return createAdapterFromIntegration(integration);
}

/**
 * Create adapter from database integration record
 */
function createAdapterFromIntegration(integration: StoreShippingIntegration): ShippingAdapter {
  // Build credentials from integration fields
  const credentials: Record<string, string> = {};
  
  if (integration.customer_number) {
    credentials.customer_number = integration.customer_number;
  }
  if (integration.api_key_encrypted) {
    // TODO: Decrypt API key
    credentials.api_key = integration.api_key_encrypted;
  }
  if (integration.api_token_encrypted) {
    // TODO: Decrypt API token
    credentials.api_token = integration.api_token_encrypted;
  }
  if (integration.api_base_url) {
    credentials.api_base_url = integration.api_base_url;
  }
  
  // Add credentials from settings
  const settings = (integration.settings || {}) as Record<string, any>;
  
  // Merge settings into credentials
  if (settings.customer_number) credentials.customer_number = settings.customer_number;
  if (settings.api_key) credentials.api_key = settings.api_key;
  if (settings.api_base_url) credentials.api_base_url = settings.api_base_url;
  if (settings.shipment_type_code) credentials.shipment_type_code = settings.shipment_type_code;
  if (settings.cargo_type_code) credentials.cargo_type_code = settings.cargo_type_code;
  if (settings.reference_prefix) credentials.reference_prefix = settings.reference_prefix;
  
  // Build config
  const config: ShippingAdapterConfig = {
    integrationId: integration.id,
    storeId: integration.store_id,
    provider: integration.provider as ShippingProviderType,
    isSandbox: integration.is_sandbox,
    credentials,
    settings,
  };
  
  return createShippingAdapter(config);
}

/**
 * List all active shipping adapters for a store
 */
export async function getStoreShippingAdapters(storeId: number): Promise<ShippingAdapter[]> {
  const integrations = await query<StoreShippingIntegration>(
    'SELECT * FROM store_shipping_integrations WHERE store_id = $1 AND is_active = true ORDER BY is_default DESC',
    [storeId]
  );
  
  return integrations.map(integration => createAdapterFromIntegration(integration));
}

/**
 * Check if store has any active shipping adapter
 */
export async function hasActiveShippingAdapter(storeId: number): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*)::int as count FROM store_shipping_integrations WHERE store_id = $1 AND is_active = true',
    [storeId]
  );
  
  return (result?.count || 0) > 0;
}

/**
 * Get integration record for a store
 */
export async function getStoreShippingIntegration(storeId: number): Promise<StoreShippingIntegration | null> {
  return queryOne<StoreShippingIntegration>(
    `SELECT * FROM store_shipping_integrations 
     WHERE store_id = $1 AND is_active = true 
     ORDER BY is_default DESC, created_at ASC 
     LIMIT 1`,
    [storeId]
  );
}

