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

export default async function TermsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const page = await getPage('terms', storeId);

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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">תנאי שימוש</h1>
      <div className="prose prose-lg max-w-none text-gray-700">
        <p className="mb-4">
          על ידי שימוש באתר זה, אתה מסכים לתנאי השימוש שלנו. אנא קרא את התנאים בעיון לפני שימוש באתר או ביצוע רכישה.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">שימוש באתר</h2>
        <p className="mb-4">
          אתה מתחייב להשתמש באתר רק למטרות חוקיות ולכבד את כל החוקים והתקנות החלים. אסור להשתמש באתר בדרכים שעלולות לפגוע, להשבית או להפריע לאתר או לשירותים אחרים.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">תנאי רכישה</h2>
        <p className="mb-4">
          כל הרכישות כפופות לתנאי המכירה שלנו. בעת ביצוע הזמנה, אתה מאשר שאתה מעל גיל 18 ויש לך סמכות חוקית לבצע את הרכישה.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">מחירים ותשלום</h2>
        <p className="mb-4">
          כל המחירים באתר מצוינים בשקלים חדשים (ILS) וכוללים מע"מ כנדרש על פי החוק. אנחנו שומרים לעצמנו את הזכות לשנות מחירים בכל עת, אך מחירים שכבר שולמו לא ישתנו.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">קניין רוחני</h2>
        <p className="mb-4">
          כל התוכן באתר, כולל טקסטים, תמונות, לוגו ועיצוב, הוא קניין רוחני שלנו או של בעלי הזכויות. אסור להעתיק, לשכפל או להשתמש בתוכן ללא רשות מפורשת בכתב.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">הגבלת אחריות</h2>
        <p className="mb-4">
          האתר מסופק "כפי שהוא" ללא כל אחריות, מפורשת או משתמעת. אנחנו לא מתחייבים שהאתר יהיה זמין ללא הפרעות או שגיאות.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">שינויים בתנאים</h2>
        <p className="mb-4">
          אנחנו שומרים לעצמנו את הזכות לעדכן את תנאי השימוש בכל עת. שינויים יכנסו לתוקף מייד עם פרסומם באתר. המשך השימוש באתר לאחר שינויים מהווה הסכמה לתנאים החדשים.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">דין שולט</h2>
        <p className="mb-4">
          תנאי השימוש האלה כפופים לחוקי מדינת ישראל. כל סכסוך ייפתר בבתי המשפט המוסמכים בישראל.
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">יצירת קשר</h2>
        <p className="mb-4">
          אם יש לך שאלות לגבי תנאי השימוש, אנא צרו איתנו קשר דרך דף יצירת קשר או במייל.
        </p>
      </div>
    </div>
  );
}

