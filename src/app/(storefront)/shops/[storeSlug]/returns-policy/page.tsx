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

export default async function ReturnsPolicyPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const page = await getPage('returns-policy', storeId);

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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">מדיניות החזרות</h1>
      <div className="prose prose-lg max-w-none text-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">זמן החזרה</h2>
        <p className="mb-4">
          ניתן להחזיר מוצרים תוך 14 ימים ממועד הרכישה, בתנאי שהמוצר לא נפתח, לא שימש ולא נפגע.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">תנאי החזרה</h2>
        <p className="mb-4">
          המוצר חייב להיות במצב המקורי שלו, עם כל התוויות והאריזות המקוריות. מוצרים מותאמים אישית או מוצרים שעברו שימוש לא ניתן להחזיר.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">תהליך החזרה</h2>
        <p className="mb-4">
          כדי להתחיל תהליך החזרה, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל. נספק לכם הוראות משלוח מפורטות.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">החזר כספי</h2>
        <p className="mb-4">
          לאחר שנקבל את המוצר ונבדוק אותו, נעבד את ההחזר הכספי תוך 5-7 ימי עסקים. ההחזר יועבר לאותו אמצעי תשלום שבו בוצעה הרכישה המקורית.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">עלויות משלוח</h2>
        <p className="mb-4">
          עלויות המשלוח להחזרה הן באחריות הלקוח, אלא אם המוצר פגום או נשלח בטעות. במקרים אלה, אנו נכסה את עלויות המשלוח.
        </p>
      </div>
    </div>
  );
}

