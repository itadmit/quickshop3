import { queryOne } from '@/lib/db';

export interface PremiumClubTier {
  slug: string;
  name: string;
  color: string;
  priority: number;
  minSpent?: number | null;
  minOrders?: number | null;
  discount?: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
  } | null;
  benefits: {
    freeShipping?: boolean;
    earlyAccess?: boolean;
    exclusiveProducts?: boolean;
    birthdayGift?: boolean;
    pointsMultiplier?: number | null;
  };
}

export interface PremiumClubConfig {
  enabled: boolean;
  tiers: PremiumClubTier[];
  benefits: {
    freeShippingThreshold?: number | null;
    birthdayDiscount?: {
      enabled: boolean;
      value: number;
      type: 'PERCENTAGE' | 'FIXED';
    } | null;
    earlyAccessToSales?: boolean;
    exclusiveProductsAccess?: boolean;
    vipSupport?: boolean;
    monthlyGift?: boolean;
  };
  notifications: {
    tierUpgradeEmail: boolean;
    tierUpgradeSMS: boolean;
  };
}

/**
 * Get premium club configuration for a store
 */
export async function getPremiumClubConfig(storeId: number): Promise<PremiumClubConfig | null> {
  try {
    const config = await queryOne<{
      enabled: boolean;
      config: any;
    }>(
      `SELECT enabled, config
       FROM premium_club_config
       WHERE store_id = $1`,
      [storeId]
    );

    if (!config || !config.enabled) {
      return null;
    }

    return config.config as PremiumClubConfig;
  } catch (error) {
    console.error('Error fetching premium club config:', error);
    return null;
  }
}

/**
 * Calculate premium club discount for a customer
 */
export async function calculatePremiumClubDiscount(
  storeId: number,
  customerTier: string | null,
  basePrice: number
): Promise<number> {
  if (!customerTier) {
    return 0;
  }

  try {
    const config = await getPremiumClubConfig(storeId);
    if (!config || !config.tiers || config.tiers.length === 0) {
      return 0;
    }

    const tier = config.tiers.find((t) => t.slug === customerTier);
    if (!tier || !tier.discount) {
      return 0;
    }

    if (tier.discount.type === 'PERCENTAGE') {
      return (basePrice * tier.discount.value) / 100;
    } else {
      return tier.discount.value;
    }
  } catch (error) {
    console.error('Error calculating premium club discount:', error);
    return 0;
  }
}

/**
 * Calculate customer tier based on total spent and order count
 */
export function calculateCustomerTier(
  totalSpent: number,
  orderCount: number,
  tiers: PremiumClubTier[]
): string | null {
  if (!tiers || tiers.length === 0) {
    return null;
  }

  // Sort by priority (lower priority = higher tier)
  const sortedTiers = [...tiers].sort((a, b) => a.priority - b.priority);

  let bestTier: PremiumClubTier | null = null;

  for (const tier of sortedTiers) {
    const meetsSpentRequirement = tier.minSpent != null ? totalSpent >= tier.minSpent : true;
    const meetsOrderRequirement = tier.minOrders != null ? orderCount >= tier.minOrders : true;

    if (meetsSpentRequirement && meetsOrderRequirement) {
      if (tier.minSpent == null && tier.minOrders == null) {
        if (!bestTier) bestTier = tier;
      } else {
        bestTier = tier;
      }
    }
  }

  return bestTier?.slug || null;
}

/**
 * Check if customer has free shipping benefit
 */
export async function hasFreeShippingBenefit(
  storeId: number,
  customerTier: string | null
): Promise<boolean> {
  if (!customerTier) {
    return false;
  }

  try {
    const config = await getPremiumClubConfig(storeId);
    if (!config) {
      return false;
    }

    const tier = config.tiers.find((t) => t.slug === customerTier);
    return tier?.benefits?.freeShipping || false;
  } catch (error) {
    console.error('Error checking free shipping benefit:', error);
    return false;
  }
}

/**
 * Check if customer has early access to sales
 */
export async function hasEarlyAccessToSales(
  storeId: number,
  customerTier: string | null
): Promise<boolean> {
  if (!customerTier) {
    return false;
  }

  try {
    const config = await getPremiumClubConfig(storeId);
    if (!config || !config.benefits?.earlyAccessToSales) {
      return false;
    }

    const tier = config.tiers.find((t) => t.slug === customerTier);
    return tier?.benefits?.earlyAccess || false;
  } catch (error) {
    console.error('Error checking early access to sales:', error);
    return false;
  }
}

