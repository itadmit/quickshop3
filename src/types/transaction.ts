// Transaction Types based on schema.sql

export interface Transaction {
  id: number;
  store_id: number;
  order_id: number;
  kind: 'sale' | 'capture' | 'authorization' | 'void' | 'refund';
  status: 'pending' | 'success' | 'failure' | 'error';
  amount: string;
  currency: string;
  gateway: string | null;
  source_name: string | null;
  message: string | null;
  test: boolean;
  authorization_code: string | null;
  location_id: number | null;
  parent_id: number | null;
  device_id: number | null;
  receipt: Record<string, any> | null;
  error_code: string | null;
  created_at: Date;
  updated_at: Date;
}

// API Request/Response types
export interface CreateTransactionRequest {
  order_id: number;
  kind: Transaction['kind'];
  amount: string;
  gateway?: string;
  authorization_code?: string;
  receipt?: Record<string, any>;
}

