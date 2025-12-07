export interface ContactCategory {
  id: number;
  store_id: number;
  type: 'CUSTOMER' | 'CLUB_MEMBER' | 'NEWSLETTER' | 'CONTACT_FORM';
  name: string;
  color: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Contact {
  id: number;
  store_id: number;
  customer_id: number | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[] | null;
  email_marketing_consent: boolean;
  email_marketing_consent_at: Date | null;
  source: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ContactWithDetails extends Contact {
  category_assignments?: Array<{
    id: number;
    category: ContactCategory;
  }>;
  customer?: {
    id: number;
    total_spent: string;
    orders_count: number;
  };
}

export interface CreateContactRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  category_types?: string[];
  email_marketing_consent?: boolean;
  source?: string;
}

export interface UpdateContactRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  category_types?: string[];
  email_marketing_consent?: boolean;
}

