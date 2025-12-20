'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Check, 
  X, 
  Zap, 
  Shield, 
  Truck, 
  CreditCard,
  BarChart3,
  Users,
  Gift,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  display_name: string;
  description: string;
  price: number;
  vat_amount: number;
  total_price: number;
  commission_display: string | null;
  features: Record<string, boolean>;
  has_checkout: boolean;
  is_recommended: boolean;
}

const featuresList = {
  lite: [
    { text: 'עיצוב אישי ב-Drag & Drop', included: true },
    { text: 'הצגת מוצרים ללא הגבלה', included: true },
    { text: 'חיבור לדומיין אישי', included: true },
    { text: 'טופס יצירת קשר ללידים', included: true },
    { text: 'מערכת סליקה', included: false },
    { text: 'ניהול משלוחים', included: false },
    { text: 'קופונים ומבצעים', included: false },
    { text: 'מועדון לקוחות', included: false },
  ],
  pro: [
    { text: 'כל מה שב-Lite', included: true, highlight: true },
    { text: 'מערכת סליקה ומשלוחים', included: true },
    { text: 'קופונים, מבצעים והנחות', included: true },
    { text: 'מועדון לקוחות ונקודות', included: true },
    { text: 'אינטגרציה לפייסבוק ו-TikTok', included: true },
    { text: 'Google Analytics מובנה', included: true },
    { text: 'יועץ חכם למוצרים', included: true },
    { text: 'תמיכה מלאה בוואטסאפ', included: true },
  ],
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    fetch('/api/billing/plans')
      .then(res => res.json())
      .then(data => setPlans(data.plans || []))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Quick Shop
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900 transition"
            >
              התחברות
            </Link>
            <Link 
              href="/register" 
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              נסה בחינם
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            תמחור פשוט ושקוף
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            בחרו את המסלול המתאים לעסק שלכם
          </h1>
          <p className="text-xl text-gray-600">
            בלי אותיות קטנות, בלי הפתעות. אפשר לשדרג או לבטל בכל רגע.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Lite Plan */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 relative">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">אתר תדמית / קטלוג</h2>
                <p className="text-gray-600">
                  מתאים לעסקים שרוצים להציג מוצרים ללא רכישה אונליין
                </p>
              </div>

              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">₪299</span>
                </div>
                <p className="text-gray-500 mt-1">לחודש</p>
                <p className="text-sm text-green-600 font-medium mt-2">0% עמלות עסקה</p>
              </div>

              <Link
                href="/register?plan=lite"
                className="block w-full py-4 text-center border-2 border-gray-900 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition mb-8"
              >
                התחילו עם קטלוג
              </Link>

              <ul className="space-y-4">
                {featuresList.lite.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-primary p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  מומלץ
                </span>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">חנות אונליין מלאה</h2>
                <p className="text-gray-600">
                  כל מה שצריך כדי למכור באינטרנט ולצמוח
                </p>
              </div>

              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-primary">₪399</span>
                </div>
                <p className="text-gray-500 mt-1">לחודש</p>
                <p className="text-sm text-orange-600 font-medium mt-2">+ 0.5% עמלת מערכת</p>
              </div>

              <Link
                href="/register?plan=pro"
                className="block w-full py-4 text-center bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition mb-8"
              >
                פתחו חנות מלאה
              </Link>

              <ul className="space-y-4">
                {featuresList.pro.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 ${feature.highlight ? 'text-primary' : 'text-green-500'}`} />
                    <span className={`text-gray-700 ${feature.highlight ? 'font-medium' : ''}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            מה כולל Quick Shop Pro?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CreditCard className="h-8 w-8" />}
              title="סליקת אשראי מובנית"
              description="חיבור לכל ספקי הסליקה המובילים בישראל - פלאכארד, משולם, קארדקום ועוד"
            />
            <FeatureCard
              icon={<Truck className="h-8 w-8" />}
              title="ניהול משלוחים"
              description="חיבור לחברות שליחויות, נקודות איסוף, ומחשבון משלוח אוטומטי"
            />
            <FeatureCard
              icon={<Gift className="h-8 w-8" />}
              title="קופונים ומבצעים"
              description="צרו קופונים, מבצעים אוטומטיים, והנחות לקוחות חוזרים"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="מועדון לקוחות"
              description="תוכנית נאמנות עם נקודות, רמות VIP והטבות מותאמות אישית"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="אנליטיקס מתקדם"
              description="פייסבוק פיקסל, Google Analytics, ודשבורד מכירות מפורט"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="יועץ חכם"
              description="הובילו לקוחות למוצר המושלם עבורם עם שאלון אינטראקטיבי"
            />
          </div>
        </div>
      </section>

      {/* Trial CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            7 ימים בחינם, ללא התחייבות
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            נסו את Quick Shop בחינם למשך שבוע. ללא צורך בכרטיס אשראי.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition"
          >
            התחילו עכשיו בחינם
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2025 Quick Shop. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

