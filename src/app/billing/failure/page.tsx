'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle, Loader2 } from 'lucide-react';

function BillingFailureContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            התשלום נכשל
          </h1>

          {/* Message */}
          <p className="text-xl text-gray-600 mb-2">
            לא הצלחנו לעבד את התשלום
          </p>
          <p className="text-gray-500 mb-8">
            זה יכול לקרות מכמה סיבות. אנא נסה שוב או פנה לתמיכה.
          </p>

          {/* Possible reasons */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-right">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-gray-600" />
              סיבות אפשריות
            </h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• פרטי הכרטיס שגויים</li>
              <li>• אין מספיק מסגרת אשראי</li>
              <li>• הכרטיס נחסם לעסקאות אינטרנט</li>
              <li>• בעיה טכנית זמנית</li>
            </ul>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition w-full justify-center"
            >
              <RefreshCw className="h-5 w-5" />
              נסה שוב
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition w-full justify-center"
            >
              חזור לדשבורד
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>

          {/* Support link */}
          <p className="mt-6 text-gray-500 text-sm">
            עדיין לא מצליח?{' '}
            <a href="mailto:support@quickshop.co.il" className="text-primary hover:underline">
              צור קשר עם התמיכה
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BillingFailureContent />
    </Suspense>
  );
}

