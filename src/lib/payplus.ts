/**
 * PayPlus API Client
 * 
 * Client library for PayPlus payment gateway integration
 * Used for QuickShop billing (subscriptions & commissions)
 * 
 * @see https://restapi.payplus.co.il/api/v1.0
 */

// ============================================
// Types
// ============================================

export interface PayPlusConfig {
  apiKey: string;
  secretKey: string;
  terminalUid: string;
  cashierUid: string;
  paymentPageUid: string;
  apiUrl: string;
}

export interface PayPlusCustomer {
  customer_name: string;
  email: string;
  phone?: string;
  vat_number?: string;
  address?: string;
  city?: string;
  country_iso?: string;
}

export interface PayPlusItem {
  name: string;
  quantity: number;
  price: number;
  vat_type?: number; // 0 = included, 1 = not included, 2 = exempt
}

export interface GeneratePaymentLinkParams {
  amount: number;
  currency_code?: string;
  description?: string;
  customer?: PayPlusCustomer;
  items?: PayPlusItem[];
  more_info?: string;
  more_info_2?: string;
  more_info_3?: string;
  create_token?: boolean;
  refURL_success: string;
  refURL_failure: string;
  refURL_cancel?: string;
  refURL_callback?: string;
  send_failure_callback?: boolean;
  expiry_datetime?: number; // minutes
  language_code?: string;
  sendEmailApproval?: boolean;
  sendEmailFailure?: boolean;
}

export interface GeneratePaymentLinkResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data: {
    page_request_uid: string;
    payment_page_link: string;
    qr_code_image?: string;
  };
}

export interface ChargeFromTokenParams {
  amount: number;
  currency_code?: string;
  token: string;
  customer_uid?: string;
  customer?: PayPlusCustomer;
  products?: PayPlusItem[];
  more_info?: string;
  more_info_2?: string;
  create_token?: boolean;
  initial_invoice?: boolean;
}

export interface ChargeResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data: {
    transaction_uid: string;
    approval_num?: string;
    voucher_num?: string;
    token?: string;
    customer_uid?: string;
    four_digits?: string;
    brand_id?: number;
    brand_name?: string;
    amount: number;
    payments?: number;
  };
}

export interface TokenInfo {
  token_uid: string;
  customer_uid: string;
  four_digits: string;
  expiry_month: string;
  expiry_year: string;
  brand_id: number;
  brand_name?: string;
}

export interface CheckTokenResponse {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data: TokenInfo;
}

export interface IPNPayload {
  transaction_uid: string;
  page_request_uid?: string;
  type: string; // 'Charge', 'Approval', etc.
  status: string;
  status_code: string;
  amount: number;
  currency_code: string;
  number_of_payments?: number;
  approval_number?: string;
  voucher_number?: string;
  token?: string;
  customer_uid?: string;
  four_digits?: string;
  brand_id?: number;
  brand_name?: string;
  expiry_month?: string;
  expiry_year?: string;
  more_info?: string;
  more_info_2?: string;
  more_info_3?: string;
  more_info_4?: string;
  more_info_5?: string;
  customer?: {
    customer_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
}

// ============================================
// PayPlus Client Class
// ============================================

export class PayPlusClient {
  private config: PayPlusConfig;
  
  constructor(config?: Partial<PayPlusConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.PAYPLUS_API_KEY || '',
      secretKey: config?.secretKey || process.env.PAYPLUS_SECRET_KEY || '',
      terminalUid: config?.terminalUid || process.env.PAYPLUS_TERMINAL_UID || '',
      cashierUid: config?.cashierUid || process.env.PAYPLUS_CASHIER_UID || '',
      paymentPageUid: config?.paymentPageUid || process.env.PAYPLUS_PAYMENT_PAGE_UID || '',
      // Default to Staging for safety - change to production URL when ready
      apiUrl: config?.apiUrl || process.env.PAYPLUS_API_URL || 'https://restapidev.payplus.co.il/api/v1.0',
    };
    
    if (!this.config.apiKey || !this.config.secretKey) {
      console.warn('[PayPlus] Missing API credentials');
    }
  }
  
  /**
   * Get authorization headers for PayPlus API
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify({
        api_key: this.config.apiKey,
        secret_key: this.config.secretKey,
      }),
    };
  }
  
  /**
   * Make API request to PayPlus
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };
    
    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }
    
    console.log(`[PayPlus] ${method} ${endpoint}`);
    console.log(`[PayPlus] URL: ${url}`);
    console.log(`[PayPlus] API Key (first 8 chars): ${this.config.apiKey?.substring(0, 8)}...`);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[PayPlus] API Error:', data);
      throw new PayPlusError(
        data?.results?.description || 'PayPlus API error',
        data?.results?.code || response.status,
        data
      );
    }
    
    if (data?.results?.status === 'error') {
      console.error('[PayPlus] Request failed:', data);
      throw new PayPlusError(
        data.results.description,
        data.results.code,
        data
      );
    }
    
    return data as T;
  }
  
  // ============================================
  // Payment Page Methods
  // ============================================
  
  /**
   * Generate a payment link for subscription
   */
  async generatePaymentLink(params: GeneratePaymentLinkParams): Promise<GeneratePaymentLinkResponse> {
    return this.request<GeneratePaymentLinkResponse>('/PaymentPages/generateLink', 'POST', {
      payment_page_uid: this.config.paymentPageUid,
      currency_code: params.currency_code || 'ILS',
      amount: params.amount,
      more_info: params.more_info,
      more_info_2: params.more_info_2,
      more_info_3: params.more_info_3,
      create_token: params.create_token ?? true,
      refURL_success: params.refURL_success,
      refURL_failure: params.refURL_failure,
      refURL_cancel: params.refURL_cancel,
      refURL_callback: params.refURL_callback,
      send_failure_callback: params.send_failure_callback ?? true,
      expiry_datetime: params.expiry_datetime || 60, // 60 minutes default
      language_code: params.language_code || 'he',
      sendEmailApproval: params.sendEmailApproval ?? true,
      sendEmailFailure: params.sendEmailFailure ?? false,
      customer: params.customer,
      items: params.items,
    });
  }
  
  // ============================================
  // Token Methods
  // ============================================
  
  /**
   * Check if a token is valid
   */
  async checkToken(tokenUid: string): Promise<CheckTokenResponse> {
    return this.request<CheckTokenResponse>(`/Token/Check/${tokenUid}`, 'GET');
  }
  
  /**
   * View token details
   */
  async viewToken(tokenUid: string, mask: boolean = true): Promise<CheckTokenResponse> {
    return this.request<CheckTokenResponse>(`/Token/View/${tokenUid}?mask=${mask}`, 'GET');
  }
  
  /**
   * Remove a token
   */
  async removeToken(tokenUid: string): Promise<{ results: { status: string } }> {
    return this.request(`/Token/Remove/${tokenUid}`, 'POST', {});
  }
  
  // ============================================
  // Transaction Methods
  // ============================================
  
  /**
   * Charge a customer using their saved token
   * Used for subscription renewals and commission charges
   */
  async chargeFromToken(params: ChargeFromTokenParams): Promise<ChargeResponse> {
    return this.request<ChargeResponse>('/Transactions/Charge', 'POST', {
      terminal_uid: this.config.terminalUid,
      cashier_uid: this.config.cashierUid,
      amount: params.amount,
      currency_code: params.currency_code || 'ILS',
      credit_terms: 1, // Regular charge
      use_token: true,
      token: params.token,
      customer_uid: params.customer_uid,
      customer: params.customer,
      create_token: params.create_token ?? false,
      initial_invoice: params.initial_invoice ?? true,
      more_info: params.more_info,
      more_info_2: params.more_info_2,
      products: params.products,
    });
  }
  
  /**
   * Refund a transaction
   */
  async refundTransaction(
    transactionUid: string,
    amount?: number,
    partialRefund: boolean = false
  ): Promise<ChargeResponse> {
    const body: Record<string, unknown> = {
      terminal_uid: this.config.terminalUid,
      transaction_uid: transactionUid,
    };
    
    if (partialRefund && amount) {
      body.amount = amount;
      body.partial_refund = true;
    }
    
    return this.request<ChargeResponse>('/Transactions/RefundByTransactionUID', 'POST', body);
  }
  
  // ============================================
  // Customer Methods
  // ============================================
  
  /**
   * Create a customer in PayPlus
   */
  async createCustomer(customer: PayPlusCustomer & { terminal_uid?: string }): Promise<{
    results: { status: string };
    data: { customer_uid: string };
  }> {
    return this.request('/Customers/Add', 'POST', {
      terminal_uid: this.config.terminalUid,
      ...customer,
    });
  }
  
  // ============================================
  // Utility Methods
  // ============================================
  
  /**
   * Calculate amount with VAT
   */
  static calculateWithVat(amount: number, vatPercentage: number = 18): {
    amount: number;
    vat: number;
    total: number;
  } {
    const vat = Math.round(amount * (vatPercentage / 100) * 100) / 100;
    const total = Math.round((amount + vat) * 100) / 100;
    return { amount, vat, total };
  }
  
  /**
   * Verify IPN signature (if PayPlus implements this)
   */
  verifyIpnSignature(payload: unknown, signature: string): boolean {
    // PayPlus doesn't use signature verification currently
    // This is a placeholder for future implementation
    return true;
  }
}

// ============================================
// Error Class
// ============================================

export class PayPlusError extends Error {
  code: number;
  data: unknown;
  
  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'PayPlusError';
    this.code = code;
    this.data = data;
  }
}

// ============================================
// Singleton Instance
// ============================================

let payplusClient: PayPlusClient | null = null;

export function getPayPlusClient(): PayPlusClient {
  if (!payplusClient) {
    payplusClient = new PayPlusClient();
  }
  return payplusClient;
}

export default PayPlusClient;

