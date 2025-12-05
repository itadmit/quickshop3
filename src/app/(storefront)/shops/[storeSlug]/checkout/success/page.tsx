'use client';

import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { HiCheckCircle } from 'react-icons/hi';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const orderId = searchParams.get('orderId');
  const storeSlug = params.storeSlug as string;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <HiCheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">ההזמנה בוצעה בהצלחה!</h1>
        <p className="text-gray-600 mb-2">
          תודה על הקנייה שלך. ההזמנה שלך התקבלה ואנו מעבדים אותה.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-8">
            מספר הזמנה: {orderId}
          </p>
        )}

        <div className="space-y-4">
          <p className="text-gray-700">
            נשלח אליך אימייל אישור עם פרטי ההזמנה.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/shops/${storeSlug}/products`}
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              המשך לקניות
            </Link>
            <Link
              href={`/shops/${storeSlug}`}
              className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

