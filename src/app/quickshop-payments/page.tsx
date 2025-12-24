'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { 
  HiCreditCard, 
  HiShieldCheck, 
  HiLightningBolt, 
  HiTrendingUp, 
  HiRefresh, 
  HiGlobe, 
  HiCheckCircle,
  HiArrowLeft
} from 'react-icons/hi';

function LaunchPriceBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (contentRef.current) {
        const width = contentRef.current.scrollWidth / 2;
        setContentWidth(width);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const bannerItems = [
    { en: "LAUNCH PRICE", he: "מחירי השקה בלעדיים - לזמן מוגבל בלבד" },
    { en: "LIMITED TIME OFFER", he: "הזדמנות חד פעמית - רק עכשיו" },
    { en: "EXCLUSIVE LAUNCH PRICES", he: "מחירי השקה בלעדיים - לזמן מוגבל בלבד" },
    { en: "GRAND OPENING", he: "הזדמנות חד פעמית - רק עכשיו" },
  ];

  const renderBannerItem = (item: typeof bannerItems[0], key: string) => (
    <div key={key} className="flex items-center gap-8 flex-shrink-0">
      <span className="text-yellow-400 font-black text-2xl md:text-3xl tracking-wider">
        {item.en}
      </span>
      <span className="text-white text-lg md:text-xl font-bold">
        {item.he}
      </span>
      <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
    </div>
  );

  const scrollSpeed = 0.2;
  const baseOffset = scrollPosition * scrollSpeed;
  const loopedOffset = contentWidth > 0 ? baseOffset % contentWidth : baseOffset;

  return (
    <section 
      ref={bannerRef}
      className="relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black py-4 border-y-2 border-yellow-500"
    >
      <div className="relative flex">
        <div 
          ref={contentRef}
          className="flex items-center gap-8 whitespace-nowrap"
          style={{
            transform: `translateX(${-loopedOffset}px)`,
            willChange: 'transform'
          }}
        >
          {bannerItems.map((item, i) => renderBannerItem(item, `copy1-${i}`))}
          {bannerItems.map((item, i) => renderBannerItem(item, `copy1-dup-${i}`))}
          {bannerItems.map((item, i) => renderBannerItem(item, `copy1-dup2-${i}`))}
          {bannerItems.map((item, i) => renderBannerItem(item, `copy1-dup3-${i}`))}
          {bannerItems.map((item, i) => renderBannerItem(item, `copy2-${i}`))}
          {bannerItems.map((item, i) => renderBannerItem(item, `copy2-dup-${i}`))}
          {bannerItems.map((item, i) => renderBannerItem(item, `copy2-dup2-${i}`))}
          {bannerItems.map((item, i) => renderBannerItem(item, `copy2-dup3-${i}`))}
        </div>
      </div>
    </section>
  );
}

export default function QuickShopPaymentsPage() {
  const [revenue, setRevenue] = useState([15000]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: ''
  });

  const calculateFees = (monthlyRevenue: number) => {
    const tier1 = monthlyRevenue * 0.034;
    const tier2 = 99;
    const tier3 = monthlyRevenue * 0.010;
    const savingVsTier1 = tier1 - tier3;
    return { tier1, tier2, tier3, savingVsTier1 };
  };

  const fees = calculateFees(revenue[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('הפרטים נשלחו בהצלחה!');
      setFormData({ name: '', email: '', phone: '', website: '' });
    } catch (error) {
      alert('אירעה שגיאה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex flex-col overflow-visible">
              <h1 className="text-2xl font-logo text-gray-900 whitespace-nowrap overflow-visible" style={{ lineHeight: '1.5' }}>
                Quick Shop
              </h1>
              <p className="text-xs text-green-600 font-bold tracking-wider whitespace-nowrap">PAYMENTS</p>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#benefits" className="text-gray-600 hover:text-green-600 font-medium transition-colors">יתרונות</a>
              <a href="#pricing" className="text-gray-600 hover:text-green-600 font-medium transition-colors">מסלולים</a>
              <a href="#calculator" className="text-gray-600 hover:text-green-600 font-medium transition-colors">מחשבון חיסכון</a>
            </nav>

            <div className="flex items-center gap-4">
              <Button 
                onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-green-900 hover:bg-green-800 text-white rounded-full px-6 font-bold shadow-lg transition-all border-0"
              >
                הצטרפות להמתנה
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right z-10">
              <div className="mb-6 inline-flex items-center rounded-full border border-green-200 bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800">
                בקרוב ב-Quick Shop
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-gray-900">
                תשכחו מחברות אשראי.
                <span className="text-green-600 block mt-2">Quick Shop Payments כאן.</span>
              </h1>
              
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                אין צורך לעשות סקר שוק בחברות האשראי. קבלו תשלומים בקלות דרכנו, עם חוויית סליקה חלקה שמגדילה המרות ב-15%.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-green-200 flex items-center gap-2"
                >
                  אני רוצה להצטרף ראשון
                  <HiArrowLeft className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <HiShieldCheck className="h-5 w-5 text-green-500" />
                  PCI DSS Level 1
                </div>
                <div className="flex items-center gap-2">
                  <HiCreditCard className="h-5 w-5 text-green-500" />
                  כל סוגי הכרטיסים
                </div>
                <div className="flex items-center gap-2">
                  <HiGlobe className="h-5 w-5 text-green-500" />
                  Bit, Apple Pay & Google Pay
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative lg:h-[600px] w-full flex items-center justify-center">
               <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-100 rounded-full filter blur-3xl opacity-40 animate-pulse" />
               <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-200 rounded-full filter blur-3xl opacity-40 animate-pulse delay-700" />
               
               <Card className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-md w-full transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                 <div className="flex items-center justify-between mb-8">
                   <div className="text-gray-900 font-bold text-xl">תשלום מאובטח</div>
                   <div className="flex gap-2">
                     <div className="h-8 w-12 bg-white rounded border border-gray-100 flex items-center justify-center p-1">
                        <span className="text-xs font-bold">VISA</span>
                     </div>
                     <div className="h-8 px-3 bg-white rounded border border-gray-100 flex items-center justify-center">
                        <span className="text-xs font-bold">Mastercard</span>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4 mb-8">
                   <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
                     <div className="bg-white p-2 rounded-lg shadow-sm">
                        <HiLightningBolt className="w-6 h-6 text-green-600" />
                     </div>
                     <div>
                       <div className="font-bold text-gray-900">Bit</div>
                       <div className="text-xs text-green-600">תשלום מהיר</div>
                     </div>
                     <div className="mr-auto">
                       <HiCheckCircle className="w-5 h-5 text-green-500" />
                     </div>
                   </div>
                   
                   <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
                     <div className="bg-white p-2 rounded-lg shadow-sm">
                        <HiGlobe className="w-6 h-6 text-green-600" />
                     </div>
                     <div>
                       <div className="font-bold text-gray-900">Apple Pay</div>
                       <div className="text-xs text-green-600">מופעל אוטומטית</div>
                     </div>
                     <div className="mr-auto">
                       <HiCheckCircle className="w-5 h-5 text-green-500" />
                     </div>
                   </div>
                   
                   <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
                     <div className="bg-white p-2 rounded-lg shadow-sm">
                        <HiGlobe className="w-6 h-6 text-green-600" />
                     </div>
                     <div>
                       <div className="font-bold text-gray-900">Google Pay</div>
                       <div className="text-xs text-green-600">מופעל אוטומטית</div>
                     </div>
                     <div className="mr-auto">
                       <HiCheckCircle className="w-5 h-5 text-green-500" />
                     </div>
                   </div>
                 </div>

                 <div className="bg-green-600 rounded-xl p-4 text-white text-center font-bold shadow-lg shadow-green-200">
                    שילם ₪249.00 בהצלחה
                 </div>
               </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">למה כולם עוברים ל-Quick Shop Payments?</h2>
            <p className="text-lg text-gray-500">
              הפסקנו את הטרטור מול חברות האשראי. הכל במקום אחד, פשוט וקל.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             <Card className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-100 hover:shadow-lg transition-all">
               <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                 <HiTrendingUp className="w-8 h-8 text-green-600" />
               </div>
               <h3 className="text-xl font-bold mb-3 text-gray-900">אחוזי המרה גבוהים יותר</h3>
               <p className="text-gray-500 leading-relaxed">
                 הלקוח נשאר באתר שלכם ולא מועבר לדף חיצוני. חוויית תשלום חלקה שמגדילה מכירות ב-15% בממוצע.
               </p>
             </Card>

             <Card className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-100 hover:shadow-lg transition-all">
               <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                 <HiRefresh className="w-8 h-8 text-green-600" />
               </div>
               <h3 className="text-xl font-bold mb-3 text-gray-900">החזרים כספיים בקליק</h3>
               <p className="text-gray-500 leading-relaxed">
                 צריכים לזכות לקוח? עושים את זה ישירות מתוך ההזמנה בקוויק שופ. לא צריך להיכנס למערכת נפרדת ולחפש עסקאות.
               </p>
             </Card>

             <Card className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-100 hover:shadow-lg transition-all">
               <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                 <HiCreditCard className="w-8 h-8 text-green-600" />
               </div>
               <h3 className="text-xl font-bold mb-3 text-gray-900">דוחות וניהול במקום אחד</h3>
               <p className="text-gray-500 leading-relaxed">
                 כל המידע הפיננסי שלכם מסונכרן אוטומטית עם ההזמנות. בלי אקסלים ובלי התאמות בסוף החודש.
               </p>
             </Card>
          </div>
        </div>
      </section>

      {/* Launch Price Banner */}
      <LaunchPriceBanner />

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#0B1120] text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
           <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[100px]" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="mb-6 inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
              המסלולים שלנו
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              שקיפות מלאה. <span className="text-green-400">בלי הפתעות.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              בחרו את המסלול שמתאים לגודל העסק שלכם.
              <br/>
              העמלות מחליפות את חברת האשראי והמסוף.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {/* Tier 1 */}
            <Card className="bg-slate-800/20 backdrop-blur-md border border-slate-700/30 rounded-3xl p-8 flex flex-col hover:bg-slate-800/30 transition-all duration-300 group">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">לא סלקת לא שילמת</h3>
                <p className="text-slate-400 text-sm">ללא התחייבות חודשית</p>
              </div>
              
              <div className="mb-8 pb-8 border-b border-slate-700/50">
                <div className="flex items-baseline mb-3">
                  <span className="text-5xl font-bold text-white tracking-tight">₪0</span>
                  <span className="text-slate-400 mr-2 font-medium">/ חודש + מע״מ</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-slate-700/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600/20">
                   <span className="text-white font-bold">₪299</span>
                   <span className="text-slate-400 text-sm">דמי הקמה חד פעמיים + מע״מ</span>
                </div>
              </div>
              
              <div className="mb-8 bg-slate-900/30 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/30 text-center">
                <span className="block text-xs text-slate-400 mb-1 uppercase tracking-wider font-medium">עמלת סליקה</span>
                <span className="text-3xl font-bold text-white">3.4% <span className="text-sm">+ מע״מ</span></span>
              </div>
              
              <ul className="space-y-4 text-sm text-slate-300 flex-grow">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  לא סלקת - לא שילמת
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  הקמה מיידית 24-48 שעות !
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  סליקת כל כרטיסי האשראי
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  תשלום ב-Bit, Apple Pay, Google Pay
                </li>
              </ul>
              
              <Button 
                onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-12 font-medium transition-all"
              >
                בחר מסלול זה
              </Button>
            </Card>

            {/* Tier 2 */}
            <Card className="bg-slate-800/20 backdrop-blur-md border border-slate-700/30 rounded-3xl p-8 flex flex-col hover:bg-slate-800/30 transition-all duration-300 group">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">רק סליקה</h3>
                <p className="text-slate-400 text-sm">ללקוחות עם מסוף קיים</p>
              </div>
              
              <div className="mb-8 pb-8 border-b border-slate-700/50">
                <div className="flex items-baseline mb-3">
                  <span className="text-5xl font-bold text-white tracking-tight">₪129</span>
                  <span className="text-slate-400 mr-2 font-medium">/ חודש + מע״מ</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-slate-700/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-600/20">
                   <span className="text-white font-bold">₪249</span>
                   <span className="text-slate-400 text-sm">דמי הקמה חד פעמיים + מע״מ</span>
                </div>
              </div>
              
              <div className="mb-8 bg-slate-900/30 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/30 text-center">
                <span className="block text-xs text-slate-400 mb-1 uppercase tracking-wider font-medium">עמלת סליקה</span>
                <span className="text-xl font-bold text-white">לפי המסוף שלך</span>
              </div>
              
              <ul className="space-y-4 text-sm text-slate-300 flex-grow">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  חיבור למסוף קיים
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  סליקת כל כרטיסי האשראי
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  תשלום ב-Bit, Apple Pay, Google Pay
                </li>
              </ul>

              <Button 
                onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-12 font-medium transition-all"
              >
                בחר מסלול זה
              </Button>
            </Card>

            {/* Tier 3 - PRO */}
            <Card className="bg-slate-800/30 backdrop-blur-md border border-green-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-6 shadow-2xl shadow-green-500/10 z-10">
              <div className="absolute top-4 left-4">
                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <HiLightningBolt className="w-3 h-3" /> מומלץ
                </span>
              </div>
              
              <div className="mb-6 pt-2">
                <h3 className="text-2xl font-bold text-white mb-2">הכל כלול PRO</h3>
                <p className="text-green-200/80 text-sm">הפתרון המלא לעסקים</p>
              </div>
              
              <div className="mb-8 pb-8 border-b border-slate-700/30">
                <div className="flex items-baseline mb-3">
                   <span className="text-5xl font-bold text-white tracking-tight">₪59</span>
                   <span className="text-slate-400 mr-2 font-medium text-lg">/ חודש + מע״מ</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 mb-3">
                   <span className="text-green-300 font-bold">₪199</span>
                   <span className="text-green-200/60 text-sm">דמי הקמה חד פעמיים + מע״מ</span>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 text-center">
                  <p className="text-yellow-300 text-xs font-bold leading-tight">
                    ⚡ מחיר השקה בלעדי ל-50 הנרשמים הראשונים
                  </p>
                  <p className="text-yellow-200/80 text-[10px] mt-1">
                    הזדמנות חד פעמית - המחיר יעלה בקרוב
                  </p>
                </div>
              </div>
              
              <div className="mb-8 bg-gradient-to-b from-green-900/30 to-green-950/30 backdrop-blur-sm p-6 rounded-2xl border border-green-500/30 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                <span className="block text-xs text-green-200/80 mb-1 uppercase tracking-wider font-bold relative z-10">עמלת סליקה בלבד</span>
                <span className="text-4xl font-bold text-white relative z-10">1.0% <span className="text-sm">+ מע״מ</span></span>
                <span className="block text-xs text-green-200/50 mt-2 relative z-10">הכי משתלם בישראל</span>
              </div>
              
              <ul className="space-y-4 text-sm text-slate-200 flex-grow">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-slate-900" />
                  </div>
                  <span className="font-medium">הקמת מסוף חדש</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-slate-900" />
                  </div>
                  <span className="font-medium">סליקת כל כרטיסי האשראי</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-slate-900" />
                  </div>
                  תשלום ב-Bit, Apple Pay, Google Pay
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <HiCheckCircle className="w-4 h-4 text-slate-900" />
                  </div>
                  <span className="font-medium">הקמה מיידית 24-48 שעות !</span>
                </li>
              </ul>

              <Button 
                onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full mt-4 bg-green-500 hover:bg-green-400 text-white rounded-xl h-14 font-bold text-lg shadow-lg shadow-green-500/25 transition-all"
              >
                אני רוצה את המסלול הזה
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">כמה תחסכו עם מסלול PRO?</h2>
                <p className="text-gray-500">גררו את הסליידר כדי לראות את העלות החודשית לפי מחזור המכירות שלכם</p>
              </div>

              <div className="mb-12">
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-gray-700">מחזור חודשי:</span>
                  <span className="font-bold text-2xl text-green-600">₪{revenue[0].toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={revenue[0]}
                  onChange={(e) => setRevenue([parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2" dir="ltr">
                  <span>₪0</span>
                  <span>₪50,000</span>
                  <span>₪100,000+</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">לא סלקת לא שילמת (3.4%)</div>
                  <div className="text-2xl font-bold text-gray-900">₪{Math.round(fees.tier1).toLocaleString()}</div>
                </Card>
                <Card className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">רק סליקה (₪99/חודש)</div>
                  <div className="text-2xl font-bold text-gray-900">₪{Math.round(fees.tier2).toLocaleString()}</div>
                </Card>
                <Card className="bg-green-50 p-6 rounded-2xl text-center border border-green-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl">הכל כלול</div>
                  <div className="text-sm text-green-800 font-bold mb-2">הכל כלול (1% בלבד)</div>
                  <div className="text-3xl font-bold text-green-600">₪{Math.round(fees.tier3).toLocaleString()}</div>
                </Card>
              </div>

              <div className="mt-8 bg-gray-900 text-white p-6 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HiCreditCard className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="font-bold text-lg">החיסכון השנתי שלך במסלול הכל כלול:</div>
                    <div className="text-xs text-gray-400">לעומת מסלול לא סלקת לא שילמת</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-yellow-400">
                  ₪{Math.round(fees.savingVsTier1 * 12).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">הצטרפו לרשימת ההמתנה</h2>
            <p className="text-gray-500">
              אנחנו פותחים את השירות בהדרגה. הירשמו עכשיו כדי לקבל עדיפות ולהיות הראשונים שמתחילים לסלוק.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא *</Label>
                <Input 
                  id="name" 
                  required 
                  className="h-12 bg-gray-50"
                  placeholder="ישראל ישראלי"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון *</Label>
                <Input 
                  id="phone" 
                  required 
                  className="h-12 bg-gray-50"
                  placeholder="050-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">אימייל *</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                className="h-12 bg-gray-50"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">כתובת החנות (אופציונלי)</Label>
              <Input 
                id="website" 
                className="h-12 bg-gray-50"
                placeholder="https://myshop.co.il"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100"
            >
              {isLoading ? 'שולח...' : 'שריון מקום ברשימת ההמתנה'}
            </Button>

            <p className="text-xs text-center text-gray-400 mt-4">
              * בלחיצה על הכפתור אני מאשר קבלת עדכונים על השקת השירות.
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Quick Shop Payments. כל הזכויות שמורות.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/" className="hover:text-green-600">חזרה לאתר הראשי</Link>
            <Link href="/terms" className="hover:text-green-600">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-green-600">פרטיות</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

