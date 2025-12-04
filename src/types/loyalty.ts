// Loyalty Program Types based on schema.sql

export interface CustomerLoyaltyTier {
  id: number;
  store_id: number;
  name: string;
  tier_level: number;
  min_points: number;
  discount_percentage: string;
  benefits: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerLoyaltyPoints {
  id: number;
  store_id: number;
  customer_id: number;
  total_points: number;
  available_points: number;
  pending_points: number;
  tier_id: number | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface LoyaltyPointTransaction {
  id: number;
  loyalty_points_id: number;
  order_id: number | null;
  points: number;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'manual_adjustment' | 'refunded';
  description: string | null;
  expires_at: Date | null;
  admin_user_id: number | null;
  created_at: Date;
}

export interface LoyaltyProgramRule {
  id: number;
  store_id: number;
  name: string;
  rule_type: 'purchase' | 'signup' | 'review' | 'referral';
  points_amount: number;
  conditions: Record<string, any> | null;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// API Request/Response types
export interface CreateLoyaltyTierRequest {
  name: string;
  tier_level: number;
  min_points: number;
  discount_percentage: string;
  benefits?: Record<string, any>;
}

export interface CreateLoyaltyRuleRequest {
  name: string;
  rule_type: 'purchase' | 'signup' | 'review' | 'referral';
  points_amount: number;
  conditions?: Record<string, any>;
  is_active?: boolean;
  starts_at?: string;
  ends_at?: string;
}

