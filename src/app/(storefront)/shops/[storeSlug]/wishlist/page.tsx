import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WishlistPageContent } from '@/components/storefront/WishlistPageContent';
import { query } from '@/lib/db';

interface WishlistPageProps {
  params: Promise<{
    storeSlug: string;
  }>;
}

export async function generateMetadata({ params }: WishlistPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { storeSlug } = resolvedParams;

  return {
    title: `רשימת משאלות - ${storeSlug}`,
    description: 'המוצרים שאהבת ושמרת לרשימת המשאלות שלך',
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const resolvedParams = await params;
  const { storeSlug } = resolvedParams;

  if (!storeSlug) {
    notFound();
  }

  // Get store details directly from DB
  try {
    const stores = await query(
      'SELECT id, name FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (!stores || stores.length === 0) {
      notFound();
    }

    const store = stores[0];

    return <WishlistPageContent storeId={store.id} storeSlug={storeSlug} storeName={store.name} />;
  } catch (error) {
    console.error('Error loading store:', error);
    notFound();
  }
}

