// Customer Types based on schema.sql

export interface Customer {
  id: number;
  store_id: number;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  accepts_marketing: boolean;
  marketing_opt_in_level: string | null;
  state: 'enabled' | 'disabled' | 'invited';
  verified_email: boolean;
  tags: string | null;
  note: string | null;
  tax_exempt: boolean;
  tax_exemptions: any[] | null;
  total_spent: string;
  orders_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string;
  zip: string | null;
  phone: string | null;
  name: string | null;
  province_code: string | null;
  country_code: string;
  country_name: string | null;
  default_address: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerNote {
  id: number;
  customer_id: number;
  store_id: number;
  note: string;
  staff_only: boolean;
  created_at: Date;
}

// Extended types for API responses
export interface CustomerWithDetails extends Omit<Customer, 'total_spent' | 'orders_count'> {
  addresses?: CustomerAddress[];
  notes?: CustomerNote[];
  orders_count?: number;
  total_spent?: string;
}

// API Request/Response types
export interface CreateCustomerRequest {
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  accepts_marketing?: boolean;
  tags?: string[];
  note?: string;
}

export interface UpdateCustomerRequest {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  accepts_marketing?: boolean;
  tags?: string[];
  note?: string;
  state?: Customer['state'];
}

export interface CreateCustomerNoteRequest {
  note: string;
  staff_only?: boolean;
}

export interface AddCustomerTagRequest {
  tag: string;
}

