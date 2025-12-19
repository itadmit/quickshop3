/**
 * Baldar/RunCom Shipping Adapter
 * 
 * Implementation of ShippingAdapter for Baldar/RunCom/Focus shipping providers
 * 
 * This adapter works with the RunCom ERP system used by:
 * - Focus Delivery (https://focusdelivery.co.il)
 * - Baldar
 * - And other shipping companies using RunCom
 */

import {
  ShippingProviderType,
  CreateShipmentResult,
  ShipmentTrackingResult,
  CancelShipmentResult,
  PrintLabelResult,
  GetPickupPointsResult,
} from '@/types/payment';
import {
  CreateShipmentParams,
  GetTrackingParams,
  CancelShipmentParams,
  PrintLabelParams,
  GetPickupPointsParams,
} from '../ShippingGateway';
import { BaseShippingAdapter } from './base';
import { ShippingAdapterConfig } from '../factory';

// ============================================
// BALDAR CONSTANTS
// ============================================

// Default API URL for Focus Delivery
const DEFAULT_API_URL = 'https://focusdelivery.co.il';

// Shipment types
const SHIPMENT_TYPE = {
  DELIVERY: 'מסירה',
  PICKUP: 'איסוף',
} as const;

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  '0': 'שגיאה לא ידועה',
  '100': 'שם ישוב שגוי',
  '200': 'שם רחוב שגוי',
  '300': 'נקודת חלוקה יעד לא תקינה',
  '400': 'נקודת חלוקה מקור לא תקינה',
  '500': 'אסמכתא כבר נקלטה במשלוח',
  '600': 'אסמכתא 2 כבר נקלטה במשלוח',
  '700': 'שדה איסוף/מסירה שגוי',
  '800': 'חסר שם',
  '900': 'לא נמצאה נקודת חלוקה יעד',
  '1000': 'לא נמצאה נקודת חלוקה - טעות בישוב',
  '1200': 'כמות אריזות הלוך גדולה מהמותר',
  '1300': 'כמות אריזות חזור גדולה מהמותר',
  '1500': 'לקוח לא רשאי להזמין',
  '1600': 'אזור הובלה - מחיר לא נמצא',
  '1700': 'מחיר-משך לא נמצא',
  '1800': 'כתובת שגויה',
};

// ============================================
// BALDAR ADAPTER
// ============================================

export class BaldarAdapter extends BaseShippingAdapter {
  readonly provider: ShippingProviderType = 'baldar';

  constructor(config: ShippingAdapterConfig) {
    super(config);
  }

  /**
   * Get API base URL
   */
  private getBaseUrl(): string {
    return this.getCredential('api_base_url') || DEFAULT_API_URL;
  }

  /**
   * Get customer number
   */
  private getCustomerNumber(): string {
    return this.getCredential('customer_number');
  }

  /**
   * Build the argument string for RunCom API
   * Format: -N<numeric> or -A<string>
   */
  private buildArgument(value: string | number | undefined, isNumeric: boolean): string {
    const val = value !== undefined && value !== null ? String(value) : '';
    return isNumeric ? `-N${val}` : `-A${val}`;
  }

  /**
   * Create a shipment
   */
  async createShipment(params: CreateShipmentParams): Promise<CreateShipmentResult> {
    const { integration, shipment } = params;
    
    try {
      const baseUrl = this.getBaseUrl();
      const customerNumber = this.getCustomerNumber() || integration.customer_number || '';
      const shipmentTypeCode = this.getSetting('shipment_type_code', integration.shipment_type_code || '');
      const cargoTypeCode = this.getSetting('cargo_type_code', integration.cargo_type_code || '');
      const referencePrefix = this.getSetting('reference_prefix', integration.reference_prefix || '');

      // Build reference number
      const reference = `${referencePrefix}${shipment.orderName}`;

      this.debug('Creating shipment', { reference, customerNumber });

      // Build arguments array (P1-P42)
      const args = [
        this.buildArgument(customerNumber, true),                    // P1: Customer number
        this.buildArgument(SHIPMENT_TYPE.DELIVERY, false),           // P2: Delivery type
        this.buildArgument(shipmentTypeCode, true),                  // P3: Shipment type code
        this.buildArgument('', true),                                // P4: Shipment stage
        this.buildArgument('', false),                               // P5: Ordered by name
        this.buildArgument('', false),                               // P6: (blank)
        this.buildArgument(cargoTypeCode, true),                     // P7: Cargo type code
        this.buildArgument('', true),                                // P8: Return cargo type
        this.buildArgument('', true),                                // P9: Number of return packages
        this.buildArgument('', true),                                // P10: (blank)
        this.buildArgument(shipment.consigneeName, false),           // P11: Consignee name
        this.buildArgument('', false),                               // P12: City code (optional)
        this.buildArgument(shipment.city, false),                    // P13: City name
        this.buildArgument('', false),                               // P14: Street code (optional)
        this.buildArgument(shipment.street, false),                  // P15: Street name
        this.buildArgument(shipment.houseNumber || '', false),       // P16: Building number
        this.buildArgument(shipment.entrance || '', false),          // P17: Entrance
        this.buildArgument(shipment.floor || '', false),             // P18: Floor
        this.buildArgument(shipment.apartment || '', false),         // P19: Apartment
        this.buildArgument(shipment.phone, false),                   // P20: Primary phone
        this.buildArgument('', false),                               // P21: Secondary phone
        this.buildArgument('', false),                               // P22: Reference 1
        this.buildArgument(shipment.numberOfPackages || '', true),   // P23: Number of packages
        this.buildArgument(shipment.addressRemarks || '', false),    // P24: Address remarks
        this.buildArgument(shipment.shipmentRemarks || '', false),   // P25: Shipment remarks
        this.buildArgument(reference, false),                        // P26: Reference 2 (our order name)
        this.buildArgument('', false),                               // P27: Date
        this.buildArgument('', false),                               // P28: Time
        this.buildArgument('', true),                                // P29: (blank)
        this.buildArgument('', true),                                // P30: Payment type code
        this.buildArgument('', true),                                // P31: Sum to collect
        this.buildArgument('', false),                               // P32: Payment date
        this.buildArgument('', false),                               // P33: Payment notes
        this.buildArgument('', true),                                // P34: Source pickup point
        this.buildArgument(shipment.pickupPointCode || '', true),    // P35: Destination pickup point
        this.buildArgument('XML', false),                            // P36: Response type
        this.buildArgument('', false),                               // P37: Auto assign pickup point
        this.buildArgument('', false),                               // P38: (blank)
        this.buildArgument('', true),                                // P39: (blank)
        this.buildArgument(shipment.email || '', false),             // P40: Email
        this.buildArgument('', false),                               // P41: Parcel preparation date
        this.buildArgument('', false),                               // P42: Parcel preparation time
      ];

      // Build URL
      const url = `${baseUrl}/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_create_anonymous&ARGUMENTS=${args.join(',')}`;

      // Send request
      const response = await this.fetchWithRetry(url);
      const text = await response.text();

      this.debug('Create shipment response', text.substring(0, 500));

      // Check if response is XML or TXT
      if (text.includes('<?xml')) {
        // Parse XML response
        const result = this.parseXmlResponse(text);
        
        if (result.error) {
          return {
            success: false,
            error: result.error,
            errorCode: result.errorCode,
          };
        }

        return {
          success: true,
          shipmentId: result.shipmentId,
          randomId: result.randomId,
          trackingNumber: result.shipmentId,
        };
      } else {
        // Parse TXT response (comma-separated)
        const parts = text.split(',');
        const shipmentId = parts[0]?.trim();
        const errorMessage = parts[3]?.trim();

        if (shipmentId === '0' || !shipmentId) {
          return {
            success: false,
            error: errorMessage || 'Unknown error',
          };
        }

        return {
          success: true,
          shipmentId,
          trackingNumber: shipmentId,
        };
      }
    } catch (error: any) {
      this.logError('createShipment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create shipment',
      };
    }
  }

  /**
   * Get tracking information
   */
  async getTracking(params: GetTrackingParams): Promise<ShipmentTrackingResult> {
    const { integration, shipmentId, referenceNumber } = params;

    try {
      const baseUrl = this.getBaseUrl();

      // Build arguments
      let args: string;
      if (shipmentId) {
        args = this.buildArgument(shipmentId, true) + ',' + this.buildArgument('', false);
      } else if (referenceNumber) {
        args = this.buildArgument('', true) + ',' + this.buildArgument(referenceNumber, false);
      } else {
        return {
          success: false,
          error: 'Either shipmentId or referenceNumber is required',
        };
      }

      const url = `${baseUrl}/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_status_xml&ARGUMENTS=${args}`;

      const response = await this.fetchWithRetry(url);
      const text = await response.text();
      
      this.debug('Tracking response', text.substring(0, 500));

      // Parse XML tracking response
      return this.parseTrackingXml(text);
    } catch (error: any) {
      this.logError('getTracking error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get tracking',
      };
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(params: CancelShipmentParams): Promise<CancelShipmentResult> {
    const { integration, randomId } = params;

    try {
      const baseUrl = this.getBaseUrl();
      const customerNumber = this.getCustomerNumber() || integration.customer_number || '';

      // Build URL
      const url = `${baseUrl}/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=bitul_mishloah&ARGUMENTS=${this.buildArgument(randomId, false)},-A,-A,-A,${this.buildArgument(customerNumber, true)}`;

      const response = await this.fetchWithRetry(url);
      const text = await response.text();

      this.debug('Cancel shipment response', text);

      // Check for success
      if (text.toLowerCase().includes('success') || text.includes('בוטל בהצלחה')) {
        return { success: true };
      }

      return {
        success: false,
        error: text || 'Failed to cancel shipment',
      };
    } catch (error: any) {
      this.logError('cancelShipment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel shipment',
      };
    }
  }

  /**
   * Print shipping label
   */
  async printLabel(params: PrintLabelParams): Promise<PrintLabelResult> {
    const { integration, shipmentId, referenceNumber } = params;

    try {
      const baseUrl = this.getBaseUrl();

      // Build arguments - shipment ID and optional reference
      let args = this.buildArgument(shipmentId, true);
      args += ',-A,-A,-A,-A,-A,-A,-N';
      if (referenceNumber) {
        args += ',' + this.buildArgument(referenceNumber, false);
      }

      const url = `${baseUrl}/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=${args}`;

      const response = await this.fetchWithRetry(url);

      // The response should be a PDF
      if (response.headers.get('content-type')?.includes('application/pdf')) {
        const buffer = await response.arrayBuffer();
        return {
          success: true,
          pdfBuffer: Buffer.from(buffer),
        };
      }

      // If not PDF, return URL for redirect
      return {
        success: true,
        labelUrl: url,
      };
    } catch (error: any) {
      this.logError('printLabel error:', error);
      return {
        success: false,
        error: error.message || 'Failed to print label',
      };
    }
  }

  /**
   * Get pickup points
   */
  async getPickupPoints(params: GetPickupPointsParams): Promise<GetPickupPointsResult> {
    const { integration, city, cityCode } = params;

    try {
      const baseUrl = this.getBaseUrl();

      // Build arguments
      let args: string;
      if (city) {
        args = this.buildArgument(city, false) + ',-A,' + this.buildArgument('', true);
      } else if (cityCode) {
        args = this.buildArgument('', false) + ',-A,' + this.buildArgument(cityCode, true);
      } else {
        // Get all pickup points
        args = this.buildArgument('all', false) + ',-A,' + this.buildArgument('', true);
      }

      const url = `${baseUrl}/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ws_spotslist&ARGUMENTS=${args}`;

      const response = await this.fetchWithRetry(url);
      const text = await response.text();

      // Parse XML response
      return this.parsePickupPointsXml(text);
    } catch (error: any) {
      this.logError('getPickupPoints error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get pickup points',
      };
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Parse XML response from create shipment
   */
  private parseXmlResponse(xml: string): {
    shipmentId?: string;
    randomId?: string;
    error?: string;
    errorCode?: string;
  } {
    try {
      // Simple regex parsing (in production, use proper XML parser)
      const shipmentIdMatch = xml.match(/<ship_create_num><!\[CDATA\[(\d+)\]\]><\/ship_create_num>/);
      const randomIdMatch = xml.match(/<ship_num_rand><!\[CDATA\[(\d+)\]\]><\/ship_num_rand>/);
      const errorMatch = xml.match(/<shgiya_yn>y<\/shgiya_yn>.*?<message>(.*?)<\/message>/s);
      const errorCodeMatch = xml.match(/<error_code>(\d+)<\/error_code>/);

      if (errorMatch) {
        const errorCode = errorCodeMatch ? errorCodeMatch[1] : '';
        const errorMessage = errorMatch[1] || ERROR_MESSAGES[errorCode] || 'Unknown error';
        return {
          error: errorMessage,
          errorCode,
        };
      }

      return {
        shipmentId: shipmentIdMatch ? shipmentIdMatch[1] : undefined,
        randomId: randomIdMatch ? randomIdMatch[1] : undefined,
      };
    } catch (error) {
      this.logError('parseXmlResponse error:', error);
      return { error: 'Failed to parse response' };
    }
  }

  /**
   * Parse tracking XML response
   */
  private parseTrackingXml(xml: string): ShipmentTrackingResult {
    try {
      // Check for error
      const errorMatch = xml.match(/<shgiya_yn>y<\/shgiya_yn>/);
      if (errorMatch) {
        const messageMatch = xml.match(/<message>(.*?)<\/message>/);
        return {
          success: false,
          error: messageMatch ? messageMatch[1] : 'Unknown error',
        };
      }

      // Parse ship number
      const shipNoMatch = xml.match(/<ship_no>(\d+)<\/ship_no>/);
      
      // Parse delivery status
      const deliveredMatch = xml.match(/<ship_delivered_yn>y<\/ship_delivered_yn>/);
      
      // Parse driver info
      const driverNameMatch = xml.match(/<driver_name>(.*?)<\/driver_name>/);

      // Parse status history
      const statusHistory: Array<{
        statusCode: string;
        statusDescription: string;
        date: string;
        time: string;
      }> = [];

      const statusRegex = /<status>[\s\S]*?<status_code>(\d+)<\/status_code>[\s\S]*?<status_desc>(.*?)<\/status_desc>[\s\S]*?<status_date>(.*?)<\/status_date>[\s\S]*?<status_time>(.*?)<\/status_time>[\s\S]*?<\/status>/g;
      
      let statusMatch;
      while ((statusMatch = statusRegex.exec(xml)) !== null) {
        statusHistory.push({
          statusCode: statusMatch[1],
          statusDescription: statusMatch[2],
          date: statusMatch[3],
          time: statusMatch[4],
        });
      }

      // Get latest status
      const latestStatus = statusHistory[0];

      return {
        success: true,
        shipmentId: shipNoMatch ? shipNoMatch[1] : undefined,
        status: latestStatus?.statusCode,
        statusDescription: latestStatus?.statusDescription,
        isDelivered: !!deliveredMatch,
        deliveryDate: deliveredMatch ? latestStatus?.date : undefined,
        deliveryTime: deliveredMatch ? latestStatus?.time : undefined,
        driverName: driverNameMatch ? driverNameMatch[1] : undefined,
        statusHistory,
      };
    } catch (error) {
      this.logError('parseTrackingXml error:', error);
      return {
        success: false,
        error: 'Failed to parse tracking response',
      };
    }
  }

  /**
   * Parse pickup points XML response
   */
  private parsePickupPointsXml(xml: string): GetPickupPointsResult {
    try {
      // Check for error
      const errorMatch = xml.match(/<shgiya_yn>y<\/shgiya_yn>/);
      if (errorMatch) {
        const messageMatch = xml.match(/<message>(.*?)<\/message>/);
        return {
          success: false,
          error: messageMatch ? messageMatch[1] : 'Unknown error',
        };
      }

      // Parse pickup points
      const points: Array<{
        code: string;
        name: string;
        type: 'store' | 'locker';
        city: string;
        street: string;
        houseNumber: string;
        latitude: number;
        longitude: number;
        openingHours: string;
      }> = [];

      const pointRegex = /<spot_detail>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<city>(.*?)<\/city>[\s\S]*?<street>(.*?)<\/street>[\s\S]*?<house>(.*?)<\/house>[\s\S]*?<latitude>([\d.]+)<\/latitude>[\s\S]*?<longitude>([\d.]+)<\/longitude>[\s\S]*?<type>(.*?)<\/type>[\s\S]*?<remarks>(.*?)<\/remarks>[\s\S]*?<n_code>(\d+)<\/n_code>[\s\S]*?<\/spot_detail>/g;

      let pointMatch;
      while ((pointMatch = pointRegex.exec(xml)) !== null) {
        points.push({
          code: pointMatch[9],
          name: pointMatch[1],
          type: pointMatch[7].toLowerCase() === 'locker' ? 'locker' : 'store',
          city: pointMatch[2],
          street: pointMatch[3],
          houseNumber: pointMatch[4],
          latitude: parseFloat(pointMatch[5]),
          longitude: parseFloat(pointMatch[6]),
          openingHours: pointMatch[8],
        });
      }

      return {
        success: true,
        points,
      };
    } catch (error) {
      this.logError('parsePickupPointsXml error:', error);
      return {
        success: false,
        error: 'Failed to parse pickup points response',
      };
    }
  }
}
