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

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const page = await getPage('accessibility', storeId);

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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">מדיניות הנגשה</h1>
      <div className="prose prose-lg max-w-none text-gray-700">
        <p className="mb-4">
          אנו מחויבים להבטיח שהאתר שלנו נגיש ונוח לשימוש עבור כל המשתמשים, כולל אנשים עם מוגבלויות.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">סטנדרטי נגישות</h2>
        <p className="mb-4">
          האתר שלנו נבנה בהתאם לתקן WCAG 2.1 ברמה AA, המהווה את התקן הבינלאומי לנגישות אתרים.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">תכונות נגישות</h2>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>ניווט מקלדת מלא - ניתן לנווט באתר באמצעות מקלדת בלבד</li>
          <li>תמיכה בקוראי מסך - האתר תואם לקוראי מסך נפוצים</li>
          <li>ניגודיות צבעים - שימוש בצבעים עם ניגודיות מספקת לקריאה</li>
          <li>טקסט חלופי - כל התמונות כוללות טקסט חלופי תיאורי</li>
          <li>גודל טקסט - ניתן להגדיל את הטקסט בדפדפן לפי הצורך</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">שיפורים מתמשכים</h2>
        <p className="mb-4">
          אנו ממשיכים לעבוד על שיפור הנגישות של האתר שלנו. אם נתקלתם בבעיה נגישות או יש לכם הצעות לשיפור, נשמח לשמוע מכם.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">יצירת קשר</h2>
        <p className="mb-4">
          אם יש לכם שאלות או הערות לגבי נגישות האתר, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל. נשמח לעזור ולשפר את החוויה שלכם באתר.
        </p>
      </div>
    </div>
  );
}



