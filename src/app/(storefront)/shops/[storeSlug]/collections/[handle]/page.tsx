import { notFound, redirect } from 'next/navigation';
import { getStoreIdBySlug } from '@/lib/utils/store';

// ============================================
// Collection Page - Redirect to /categories/[handle]
// For backward compatibility, redirects to the main category route
// ============================================

export const revalidate = 300;

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
}) {
  const { storeSlug, handle } = await params;

  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  // Redirect to /categories/[handle] which is the main route
  redirect(`/shops/${storeSlug}/categories/${handle}`);
}
