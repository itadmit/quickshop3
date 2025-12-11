import { queryOne, query } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ChoicesOfPageClient } from './ChoicesOfPageClient';

async function getPage(handle: string, storeId: number) {
  const page = await queryOne<{
    id: number;
    title: string;
    handle: string;
    body_html: string | null;
    template: 'STANDARD' | 'CHOICES_OF';
    display_type: 'GRID' | 'LIST' | null;
    selected_products: number[] | null;
    coupon_code: string | null;
    published_at: Date | null;
  }>(
    `SELECT id, title, handle, body_html, template, display_type, selected_products, coupon_code, published_at 
     FROM pages 
     WHERE store_id = $1 AND handle = $2 AND is_published = true`,
    [storeId, handle]
  );

  if (!page) {
    return null;
  }

  // If CHOICES_OF template, load products
  let products = null;
  if (page.template === 'CHOICES_OF' && page.selected_products && page.selected_products.length > 0) {
    products = await query<any>(
      `SELECT id, title as name, handle as slug, 
              (SELECT MIN(CAST(price AS DECIMAL)) FROM product_variants WHERE product_id = products.id) as price,
              (SELECT MIN(CAST(compare_price AS DECIMAL)) FROM product_variants WHERE product_id = products.id) as compare_price,
              images, description, inventory_qty, availability
       FROM products 
       WHERE store_id = $1 AND id = ANY($2::int[]) AND status = 'PUBLISHED' AND is_hidden = false`,
      [storeId, page.selected_products]
    );
    
    // Sort products according to selected_products order
    if (products && products.length > 0) {
      const productMap = new Map(products.map((p: any) => [p.id, p]));
      products = page.selected_products
        .map((id) => productMap.get(id))
        .filter((p) => p !== undefined);
    }
  }

  return { ...page, products };
}

export default async function PagePage({
  params,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
}) {
  const { storeSlug, handle } = await params;
  const { getStoreIdBySlug } = await import('@/lib/utils/store');
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    return <div>חנות לא נמצאה</div>;
  }

  const page = await getPage(handle, storeId);

  if (!page) {
    notFound();
  }

  // If CHOICES_OF template, use special component
  if (page.template === 'CHOICES_OF') {
    return (
      <ChoicesOfPageClient
        page={page}
        products={page.products || []}
        storeSlug={storeSlug}
      />
    );
  }

  // Standard template
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
      {page.body_html && (
        <div
          className="prose prose-lg max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: page.body_html }}
        />
      )}
    </div>
  );
}

