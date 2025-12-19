/**
 * Base Shipping Adapter
 * 
 * מחלקת בסיס לכל ה-adapters של המשלוחים.
 * מספקת פונקציונליות משותפת ומבנה אחיד.
 */

import { ShippingProviderType } from '@/types/payment';
import { ShippingAdapterConfig } from '../factory';
import {
  ShippingAdapter,
  CreateShipmentParams,
  GetTrackingParams,
  CancelShipmentParams,
  PrintLabelParams,
  GetPickupPointsParams,
} from '../ShippingGateway';
import {
  CreateShipmentResult,
  ShipmentTrackingResult,
  CancelShipmentResult,
  PrintLabelResult,
  GetPickupPointsResult,
} from '@/types/payment';

export abstract class BaseShippingAdapter implements ShippingAdapter {
  abstract readonly provider: ShippingProviderType;
  
  protected config: ShippingAdapterConfig;
  protected isSandbox: boolean;
  
  constructor(config: ShippingAdapterConfig) {
    this.config = config;
    this.isSandbox = config.isSandbox;
  }
  
  /**
   * Get a credential value
   */
  protected getCredential(key: string): string {
    return this.config.credentials[key] || '';
  }
  
  /**
   * Get a setting value
   */
  protected getSetting<T = any>(key: string, defaultValue?: T): T {
    return this.config.settings[key] ?? defaultValue;
  }
  
  /**
   * Log debug message
   */
  protected debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development' || this.isSandbox) {
      console.log(`[${this.provider}Adapter] ${message}`, data || '');
    }
  }
  
  /**
   * Log error message
   */
  protected logError(message: string, error?: any): void {
    console.error(`[${this.provider}Adapter] ${message}`, error || '');
  }
  
  /**
   * Make HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
          },
        });
        return response;
      } catch (error: any) {
        lastError = error;
        this.debug(`Request failed (attempt ${i + 1}/${retries}):`, error.message);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }
  
  // ============================================
  // ABSTRACT METHODS - Must be implemented
  // ============================================
  
  abstract createShipment(params: CreateShipmentParams): Promise<CreateShipmentResult>;
  abstract getTracking(params: GetTrackingParams): Promise<ShipmentTrackingResult>;
  abstract cancelShipment(params: CancelShipmentParams): Promise<CancelShipmentResult>;
  abstract printLabel(params: PrintLabelParams): Promise<PrintLabelResult>;
  abstract getPickupPoints(params: GetPickupPointsParams): Promise<GetPickupPointsResult>;
  
  /**
   * Test connection to the shipping provider
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Default implementation - try to get pickup points as a simple test
      const result = await this.getPickupPoints({
        integration: {
          id: this.config.integrationId,
          store_id: this.config.storeId,
          provider: this.config.provider,
          is_sandbox: this.config.isSandbox,
          is_active: true,
          settings: this.config.settings,
        } as any,
      });
      
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection test failed',
      };
    }
  }
}

