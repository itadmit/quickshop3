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

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const page = await getPage('privacy', storeId);

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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">מדיניות פרטיות</h1>
      <div className="prose prose-lg max-w-none text-gray-700">
        <p className="mb-4">
          אנו מחויבים להגנה על הפרטיות שלך. מדיניות הפרטיות הזו מסבירה איך אנחנו אוספים, משתמשים ומגנים על המידע האישי שלך בעת השימוש באתר שלנו.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">איזה מידע אנחנו אוספים</h2>
        <p className="mb-4">
          אנחנו אוספים מידע שאתה מספק לנו ישירות בעת הרשמה, רכישה או יצירת קשר. זה כולל שם, כתובת אימייל, כתובת משלוח, פרטי תשלום ומידע אחר שאתה בוחר לשתף.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">איך אנחנו משתמשים במידע</h2>
        <p className="mb-4">
          המידע שאתה מספק לנו משמש למטרות הבאות:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>עיבוד והשלמת הזמנות</li>
          <li>שיפור השירות והחוויה שלך</li>
          <li>שליחת עדכונים על ההזמנות שלך</li>
          <li>תקשורת עם לקוחות</li>
          <li>שיפור האתר והמוצרים שלנו</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">שיתוף מידע</h2>
        <p className="mb-4">
          אנו לא נמכור או נשתף את המידע האישי שלך עם צדדים שלישיים ללא הסכמתך המפורשת, למעט מקרים בהם זה נדרש על פי חוק או לצורך השלמת ההזמנה שלך (כמו שירותי משלוח).
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">אבטחת מידע</h2>
        <p className="mb-4">
          אנחנו משתמשים באמצעי אבטחה מתקדמים כדי להגן על המידע האישי שלך. עם זאת, אין שיטה של העברה באינטרנט או אחסון אלקטרוני שהיא מאה אחוז מאובטחת.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">זכויותיך</h2>
        <p className="mb-4">
          יש לך זכות לגשת למידע האישי שלך, לעדכן אותו או למחוק אותו. אם יש לך שאלות או בקשות לגבי המידע האישי שלך, אנא צרו איתנו קשר.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">שינויים במדיניות</h2>
        <p className="mb-4">
          אנחנו עשויים לעדכן את מדיניות הפרטיות הזו מעת לעת. כל שינוי יפורסם בדף זה עם תאריך העדכון האחרון.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">יצירת קשר</h2>
        <p className="mb-4">
          אם יש לך שאלות לגבי מדיניות הפרטיות הזו, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל.
        </p>
      </div>
    </div>
  );
}

