import { queryOne } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';
import { notFound } from 'next/navigation';
import { ContactForm } from '@/components/storefront/ContactForm';
import { getTranslation } from '@/lib/i18n/translations';

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

export default async function ContactPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  // Get store locale
  const store = await queryOne<{ locale: string }>(
    'SELECT locale FROM stores WHERE id = $1',
    [storeId]
  );
  const locale = store?.locale || 'he-IL';

  // Helper function for translations
  const t = async (key: string) => {
    return await getTranslation(key, {
      storeId,
      locale,
      namespace: 'storefront',
    });
  };

  const page = await getPage('contact', storeId);

  // If page exists in database, show it with contact form
  if (page && page.published_at) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
        {page.body_html && (
          <div
            className="prose prose-lg max-w-none text-gray-700 mb-8"
            dangerouslySetInnerHTML={{ __html: page.body_html }}
          />
        )}
        <ContactForm storeId={storeId} storeSlug={storeSlug} />
      </div>
    );
  }

  // Default content if page doesn't exist
  const contactTitle = await t('contact.title');
  const contactSubtitle = await t('contact.subtitle');
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{contactTitle || 'צור קשר'}</h1>
      <div className="prose prose-lg max-w-none text-gray-700 mb-8">
        <p className="text-lg mb-4">
          {contactSubtitle || 'אנחנו כאן כדי לעזור לך! אם יש לך שאלות או בקשות, אנא צור איתנו קשר.'}
        </p>
        <p className="mb-4">
          נשמח לשמוע ממך ולעזור בכל מה שצריך.
        </p>
      </div>
      <ContactForm storeId={storeId} storeSlug={storeSlug} />
    </div>
  );
}
