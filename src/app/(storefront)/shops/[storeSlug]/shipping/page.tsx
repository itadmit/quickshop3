import { queryOne } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';
import { notFound } from 'next/navigation';
import { Truck, Package, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

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

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const page = await getPage('shipping', storeId);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">משלוחים והחזרות</h1>
      <p className="text-lg text-gray-600 mb-12">
        כל מה שצריך לדעת על המשלוחים שלנו ומדיניות ההחזרות
      </p>

      {/* Shipping Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">משלוחים</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">משלוח חינם</h3>
              <p className="text-gray-600">לכל הארץ בהזמנות מעל ₪200</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">זמן אספקה</h3>
              <p className="text-gray-600">3-7 ימי עסקים</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">אריזה</h3>
              <p className="text-gray-600">כל המוצרים נארזים בקפידה</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">חברות שילוח</h3>
              <p className="text-gray-600">עם חברות משלוחים מובילות</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">עלויות משלוח</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• הזמנות עד ₪200 - ₪30 דמי משלוח</li>
            <li>• הזמנות מעל ₪200 - משלוח חינם!</li>
            <li>• איסוף עצמי - ללא עלות (לפי תיאום מראש)</li>
          </ul>
        </div>
      </div>

      {/* Returns Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">החזרות והחלפות</h2>
        </div>

        <div className="prose prose-lg max-w-none mb-6">
          <p className="text-gray-700 mb-4">
            אנחנו רוצים שתהיו מרוצים לחלוטין מהרכישה. אם מסיבה כלשהי אתם לא מרוצים, ניתן להחזיר מוצרים בתנאים הבאים:
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">תוך 14 יום</h3>
              <p className="text-gray-700">ניתן להחזיר מוצרים תוך 14 יום מיום קבלת המשלוח</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">מצב המוצר</h3>
              <p className="text-gray-700">המוצר חייב להיות במצב חדש, לא בשימוש ובאריזה המקורית</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">החזר כספי מלא</h3>
              <p className="text-gray-700">נחזיר את מלוא הכסף תוך 7-14 ימי עסקים</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">מוצרים שלא ניתן להחזיר</h3>
              <p className="text-gray-700">מוצרי היגיינה, תכשיטים ומוצרים מותאמים אישית</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">איך מחזירים?</h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span>צרו איתנו קשר בטלפון או במייל</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <span>נשלח אליכם תווית החזרה</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span>ארזו את המוצר והחזירו אותו</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
              <span>נבדוק את המוצר ונחזיר את הכסף</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-2">יש שאלות?</h3>
        <p className="mb-4 text-green-50">אנחנו כאן כדי לעזור! צרו איתנו קשר בכל דרך שנוחה לכם</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="tel:+972525555555" className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors">
            התקשרו אלינו
          </a>
          <a href="https://wa.me/972525555555" className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors">
            שלחו הודעה
          </a>
        </div>
      </div>
    </div>
  );
}
