import { queryOne } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';
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

  return page;
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const page = await getPage('faq', storeId);

  // If page exists in database, show it
  if (page && page.published_at) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
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

  // Default content if page doesn't exist
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">שאלות נפוצות</h1>
      <div className="prose prose-lg max-w-none text-gray-700">
        <h2 className="text-2xl font-semibold mb-4">איך אני מזמין מוצר?</h2>
        <p className="mb-6">
          פשוט בחר את המוצר הרצוי, הוסף אותו לעגלה והמשך לתשלום.
        </p>
        <h2 className="text-2xl font-semibold mb-4">מה זמן המשלוח?</h2>
        <p className="mb-6">
          זמן המשלוח הוא בדרך כלל 2-5 ימי עסקים, תלוי במיקום.
        </p>
        <h2 className="text-2xl font-semibold mb-4">איך אני יכול להחזיר מוצר?</h2>
        <p className="mb-6">
          תוכל להחזיר מוצר תוך 14 ימים מהרכישה. אנא צור איתנו קשר להחזרה.
        </p>
      </div>
    </div>
  );
}

