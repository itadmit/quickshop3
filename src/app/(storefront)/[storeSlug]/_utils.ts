import { getStoreIdBySlug } from '@/lib/utils/store';

/**
 * Helper function לקבלת storeId מ-storeSlug
 */
export async function getStoreIdFromParams(params: Promise<{ storeSlug: string }>): Promise<number> {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    throw new Error('Store not found');
  }
  
  return storeId;
}

