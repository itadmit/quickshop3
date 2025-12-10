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

export default async function AboutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const page = await getPage('about', storeId);

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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">אודותינו</h1>
      <div className="prose prose-lg max-w-none text-gray-700">
        <p className="text-lg mb-4">
          ברוכים הבאים לחנות שלנו! אנחנו מתמחים במתן שירות איכותי ומוצרים מעולים.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">הסיפור שלנו</h2>
        <p className="mb-4">
          החנות שלנו נוסדה מתוך אמונה עמוקה באיכות, שירות לקוחות מעולה וחווית קנייה יוצאת דופן. אנחנו מתמחים במציאת המוצרים הטובים ביותר עבור הלקוחות שלנו ומתחייבים לספק חוויה מעולה משלב הגלישה ועד לקבלת המוצר.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">המשימה שלנו</h2>
        <p className="mb-4">
          המשימה שלנו היא לספק לכם את החוויה הטובה ביותר בקנייה אונליין. אנחנו מאמינים שכל לקוח ראוי לשירות אישי, מוצרים איכותיים ומחירים הוגנים.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">הערכים שלנו</h2>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>איכות - אנחנו בוחרים בקפידה כל מוצר שאנחנו מציעים</li>
          <li>שירות לקוחות - הלקוח תמיד במרכז</li>
          <li>שקיפות - אנחנו גלויים ומדויקים בכל מה שאנחנו עושים</li>
          <li>אמינות - אפשר לסמוך עלינו בכל שלב</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">צרו קשר</h2>
        <p className="mb-4">
          נשמח לשמוע מכם! אם יש לכם שאלות, הערות או הצעות, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל. הצוות שלנו זמין לעזור לכם בכל עת.
        </p>
      </div>
    </div>
  );
}

