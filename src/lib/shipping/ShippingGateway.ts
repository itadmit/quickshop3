/**
 * Shipping Gateway - Unified interface for all shipping providers
 * 
 * This module provides a single API that works with multiple shipping providers
 * (Baldar, Chita, DHL, UPS, etc.)
 */

import {
  ShippingProviderType,
  StoreShippingIntegration,
  CreateShipmentInput,
  CreateShipmentResult,
  ShipmentTrackingResult,
  CancelShipmentResult,
  PrintLabelResult,
  GetPickupPointsResult,
} from '@/types/payment';

// ============================================
// SHIPPING ADAPTER INTERFACE
// ============================================

/**
 * Interface that all shipping adapters must implement
 */
export interface ShippingAdapter {
  /**
   * Provider name
   */
  readonly provider: ShippingProviderType;

  /**
   * Create a shipment
   */
  createShipment(params: CreateShipmentParams): Promise<CreateShipmentResult>;

  /**
   * Get tracking information
   */
  getTracking(params: GetTrackingParams): Promise<ShipmentTrackingResult>;

  /**
   * Cancel a shipment
   */
  cancelShipment(params: CancelShipmentParams): Promise<CancelShipmentResult>;

  /**
   * Print shipping label
   */
  printLabel(params: PrintLabelParams): Promise<PrintLabelResult>;

  /**
   * Get pickup points
   */
  getPickupPoints(params: GetPickupPointsParams): Promise<GetPickupPointsResult>;
}

// ============================================
// SHIPPING GATEWAY PARAMS
// ============================================

export interface CreateShipmentParams {
  integration: StoreShippingIntegration;
  shipment: CreateShipmentInput;
}

export interface GetTrackingParams {
  integration: StoreShippingIntegration;
  shipmentId?: string;
  referenceNumber?: string;
}

export interface CancelShipmentParams {
  integration: StoreShippingIntegration;
  randomId: string; // ship_num_rand in Baldar
}

export interface PrintLabelParams {
  integration: StoreShippingIntegration;
  shipmentId: string;
  referenceNumber?: string;
}

export interface GetPickupPointsParams {
  integration: StoreShippingIntegration;
  city?: string;
  cityCode?: number;
}

// ============================================
// SHIPPING GATEWAY CLASS
// ============================================

export class ShippingGateway {
  private adapters: Map<ShippingProviderType, ShippingAdapter> = new Map();

  /**
   * Register a shipping adapter
   */
  registerAdapter(adapter: ShippingAdapter): void {
    this.adapters.set(adapter.provider, adapter);
  }

  /**
   * Get adapter for a provider
   */
  getAdapter(provider: ShippingProviderType): ShippingAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Shipping adapter not found for provider: ${provider}`);
    }
    return adapter;
  }

  /**
   * Create a shipment
   */
  async createShipment(
    provider: ShippingProviderType,
    params: CreateShipmentParams
  ): Promise<CreateShipmentResult> {
    const adapter = this.getAdapter(provider);
    return adapter.createShipment(params);
  }

  /**
   * Get tracking information
   */
  async getTracking(
    provider: ShippingProviderType,
    params: GetTrackingParams
  ): Promise<ShipmentTrackingResult> {
    const adapter = this.getAdapter(provider);
    return adapter.getTracking(params);
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(
    provider: ShippingProviderType,
    params: CancelShipmentParams
  ): Promise<CancelShipmentResult> {
    const adapter = this.getAdapter(provider);
    return adapter.cancelShipment(params);
  }

  /**
   * Print shipping label
   */
  async printLabel(
    provider: ShippingProviderType,
    params: PrintLabelParams
  ): Promise<PrintLabelResult> {
    const adapter = this.getAdapter(provider);
    return adapter.printLabel(params);
  }

  /**
   * Get pickup points
   */
  async getPickupPoints(
    provider: ShippingProviderType,
    params: GetPickupPointsParams
  ): Promise<GetPickupPointsResult> {
    const adapter = this.getAdapter(provider);
    return adapter.getPickupPoints(params);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let shippingGatewayInstance: ShippingGateway | null = null;

export function getShippingGateway(): ShippingGateway {
  if (!shippingGatewayInstance) {
    shippingGatewayInstance = new ShippingGateway();
    
    // Register adapters here
    // Will be done in adapters/index.ts
  }
  return shippingGatewayInstance;
}

