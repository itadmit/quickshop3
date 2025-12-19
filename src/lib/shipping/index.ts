/**
 * Shipping Module
 * 
 * Unified shipping system for multiple providers
 */

import { queryOne } from '@/lib/db';
import { ShippingGateway } from './ShippingGateway';
import { BaldarAdapter } from './adapters/BaldarAdapter';

export * from './ShippingGateway';
export * from './adapters';

interface StoreShippingIntegration {
  id: number;
  store_id: number;
  provider: string;
  customer_number?: string;
  api_key_encrypted?: string;
  is_sandbox: boolean;
  is_active: boolean;
  settings: Record<string, any>;
}

/**
 * Get active shipping gateway for a store
 */
export async function getStoreShippingGateway(storeId: number): Promise<ShippingGateway | null> {
  const integration = await queryOne<StoreShippingIntegration>(
    `SELECT * FROM store_shipping_integrations 
     WHERE store_id = $1 AND is_active = true
     ORDER BY is_default DESC LIMIT 1`,
    [storeId]
  );

  if (!integration) {
    return null;
  }

  return createShippingGateway(integration);
}

/**
 * Create shipping gateway from integration settings
 */
export function createShippingGateway(integration: StoreShippingIntegration): ShippingGateway | null {
  const settings = integration.settings || {};
  
  switch (integration.provider) {
    case 'baldar':
    case 'focus':
    case 'runcom':
      return new BaldarAdapter({
        customer_number: integration.customer_number || settings.customer_number || '',
        api_key: integration.api_key_encrypted || settings.api_key || '',
        ...settings,
      }, integration.is_sandbox);
    
    // Add more shipping providers here:
    // case 'cargo':
    //   return new CargoAdapter(settings, integration.is_sandbox);
    // case 'lionwheel':
    //   return new LionwheelAdapter(settings, integration.is_sandbox);
    
    default:
      console.warn(`Unknown shipping provider: ${integration.provider}`);
      return null;
  }
}

