'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

  const planName = plan === 'pro' ? 'Quick Shop Pro' : 'Quick Shop Lite';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ברוכים הבאים! 🎉
          </h1>

          {/* Message */}
          <p className="text-xl text-gray-600 mb-2">
            התשלום עבר בהצלחה
          </p>
          <p className="text-gray-500 mb-8">
            המנוי שלך ל-<span className="font-semibold text-primary">{planName}</span> פעיל
          </p>

          {/* What's next */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-right">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              מה עכשיו?
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ הגדר את המוצרים שלך</li>
              <li>✓ עצב את החנות בקסטומייזר</li>
              {plan === 'pro' && (
                <>
                  <li>✓ חבר ספק סליקה</li>
                  <li>✓ הגדר אפשרויות משלוח</li>
                </>
              )}
              <li>✓ פרסם את החנות ותתחיל למכור!</li>
            </ul>
          </div>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition w-full justify-center"
          >
            עבור לדשבורד
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* Support link */}
          <p className="mt-6 text-gray-500 text-sm">
            יש לך שאלות?{' '}
            <a href="mailto:support@quickshop.co.il" className="text-primary hover:underline">
              צור קשר עם התמיכה
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}

