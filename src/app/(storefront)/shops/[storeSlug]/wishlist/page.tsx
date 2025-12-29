import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WishlistPageContent } from '@/components/storefront/WishlistPageContent';

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

  // Get store details
  const storeRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stores/by-slug/${storeSlug}`, {
    cache: 'no-store',
  });

  if (!storeRes.ok) {
    notFound();
  }

  const store = await storeRes.json();

  return <WishlistPageContent storeId={store.id} storeSlug={storeSlug} storeName={store.name} />;
}

