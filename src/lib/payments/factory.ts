/**
 * Payment Gateway Factory
 * 
 * יוצר את ה-Adapter הנכון לפי סוג הספק.
 * הקוד שלנו משתמש רק ב-Factory ולא יודע על הספקים עצמם.
 */

import { query, queryOne } from '@/lib/db';
import { StorePaymentIntegration, PaymentProviderType } from '@/types/payment';
import { PaymentGateway, AdapterConfig } from './gateway';
import { PelecardAdapter } from './adapters/pelecard';
import { PayMeAdapter } from './adapters/payme';
import { PayPlusAdapter } from './adapters/payplus';
import { MeshulamAdapter } from './adapters/meshulam';
// Import other adapters as they are created:
// import { HypAdapter } from './adapters/hyp';

/**
 * Create payment gateway adapter for a specific integration
 */
export function createPaymentGateway(config: AdapterConfig): PaymentGateway {
  switch (config.provider) {
    case 'pelecard':
      return new PelecardAdapter(config);
    
    case 'quickpay':
      return new PayMeAdapter(config);
    
    case 'payplus':
      return new PayPlusAdapter(config);
    
    case 'meshulam':
      return new MeshulamAdapter(config);
    
    // Add more adapters as they are implemented:
    // case 'hyp':
    //   return new HypAdapter(config);
    
    default:
      throw new Error(`Unsupported payment provider: ${config.provider}`);
  }
}

/**
 * Get payment gateway for a store (uses default integration)
 */
export async function getStorePaymentGateway(storeId: number): Promise<PaymentGateway | null> {
  // Get default active integration for the store
  const integration = await queryOne<StorePaymentIntegration>(
    `SELECT * FROM store_payment_integrations 
     WHERE store_id = $1 AND is_active = true 
     ORDER BY is_default DESC, created_at ASC 
     LIMIT 1`,
    [storeId]
  );
  
  if (!integration) {
    return null;
  }
  
  return createGatewayFromIntegration(integration);
}

/**
 * Get payment gateway by integration ID
 */
export async function getPaymentGatewayById(integrationId: number, storeId: number): Promise<PaymentGateway | null> {
  const integration = await queryOne<StorePaymentIntegration>(
    'SELECT * FROM store_payment_integrations WHERE id = $1 AND store_id = $2',
    [integrationId, storeId]
  );
  
  if (!integration) {
    return null;
  }
  
  return createGatewayFromIntegration(integration);
}

/**
 * Get payment gateway by provider type
 */
export async function getPaymentGatewayByProvider(
  storeId: number, 
  provider: PaymentProviderType
): Promise<PaymentGateway | null> {
  const integration = await queryOne<StorePaymentIntegration>(
    'SELECT * FROM store_payment_integrations WHERE store_id = $1 AND provider = $2 AND is_active = true',
    [storeId, provider]
  );
  
  if (!integration) {
    return null;
  }
  
  return createGatewayFromIntegration(integration);
}

/**
 * Create gateway from database integration record
 */
function createGatewayFromIntegration(integration: StorePaymentIntegration): PaymentGateway {
  // Build credentials from integration fields
  const credentials: Record<string, string> = {};
  
  if (integration.terminal_number) {
    credentials.terminal_number = integration.terminal_number;
  }
  if (integration.username) {
    credentials.username = integration.username;
  }
  if (integration.password_encrypted) {
    // TODO: Decrypt password
    credentials.password = integration.password_encrypted;
  }
  if (integration.api_key_encrypted) {
    // TODO: Decrypt API key
    credentials.api_key = integration.api_key_encrypted;
  }
  
  // Add credentials from settings (for providers like PayPlus, Meshulam that use custom fields)
  const settings = (integration.settings || {}) as Record<string, any>;
  
  // Merge settings into credentials (for api_key, secret_key, terminal_uid, etc.)
  if (settings.api_key) credentials.api_key = settings.api_key;
  if (settings.secret_key) credentials.secret_key = settings.secret_key;
  if (settings.terminal_uid) credentials.terminal_uid = settings.terminal_uid;
  if (settings.payment_page_uid) credentials.payment_page_uid = settings.payment_page_uid;
  if (settings.seller_payme_id) credentials.seller_payme_id = settings.seller_payme_id;
  if (settings.payme_client_key) credentials.payme_client_key = settings.payme_client_key;
  if (settings.user_id) credentials.user_id = settings.user_id;
  if (settings.page_code) credentials.page_code = settings.page_code;
  
  // Build config
  const config: AdapterConfig = {
    integrationId: integration.id,
    storeId: integration.store_id,
    provider: integration.provider as PaymentProviderType,
    isSandbox: integration.is_sandbox,
    credentials,
    settings,
  };
  
  return createPaymentGateway(config);
}

/**
 * List all active payment gateways for a store
 */
export async function getStorePaymentGateways(storeId: number): Promise<PaymentGateway[]> {
  const integrations = await query<StorePaymentIntegration>(
    'SELECT * FROM store_payment_integrations WHERE store_id = $1 AND is_active = true ORDER BY is_default DESC',
    [storeId]
  );
  
  return integrations.map(integration => createGatewayFromIntegration(integration));
}

/**
 * Check if store has any active payment gateway
 */
export async function hasActivePaymentGateway(storeId: number): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*)::int as count FROM store_payment_integrations WHERE store_id = $1 AND is_active = true',
    [storeId]
  );
  
  return (result?.count || 0) > 0;
}

