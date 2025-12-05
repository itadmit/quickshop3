import { queryOne } from '@/lib/db';
import { notFound } from 'next/navigation';

async function getPage(handle: string, storeId: number) {
  const page = await queryOne<{
    id: number;
    title: string;
    handle: string;
    body_html: string | null;
    published_at: Date | null;
  }>(
    'SELECT id, title, handle, body_html, published_at FROM pages WHERE store_id = $1 AND handle = $2',
    [storeId, handle]
  );

  if (!page || !page.published_at) {
    return null;
  }

  return page;
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

