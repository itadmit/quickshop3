import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Users, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Server, 
  CreditCard, 
  Truck, 
  Eye, 
  MousePointerClick, 
  Heart, 
  ShoppingCart, 
  ShoppingBag,
  Search, 
  Check,
  X,
  ChevronDown,
  MessageCircle,
  Smartphone,
  Palette,
  LayoutDashboard,
  Package,
  Globe,
  Star,
  PackagePlus,
  Megaphone,
  Boxes,
  LayoutTemplate,
  CalendarClock,
  Banknote,
  ScanFace
} from "lucide-react"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { HeroProductShowcase } from "@/components/landing/HeroProductShowcase"
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "קוויק שופ - לבנות חנות אונליין בקלות | תמיכה מלאה בעברית",
  description: "הפלטפורמה הישראלית המתקדמת לבניית חנות אינטרנטית. ללא צורך במתכנת, תמיכה ישירה בוואטסאפ, ומערכת שמותאמת לקהל הישראלי. נסו בחינם!",
}

export default function HomePage() {
  const features = [
    { 
      icon: Palette, 
      title: "עיצוב בחוויית Drag & Drop", 
      desc: "לא צריך מעצב ולא מתכנת. גוררים אלמנטים, משנים צבעים וטקסטים בקליק.",
      highlight: true
    },
    { 
      icon: Smartphone, 
      title: "Mobile First", 
      desc: "החנות שלכם תראה מדהים בנייד באופן אוטומטי, בלי שום מאמץ נוסף.",
      highlight: true
    },
    { 
      icon: MessageCircle, 
      title: "תמיכה בוואטסאפ", 
      desc: "נתקעתם? אנחנו כאן. מענה אנושי, מהיר ובעברית.",
      highlight: true
    },
    { 
      icon: ShoppingCart, 
      title: "קופה חכמה המרה גבוהה", 
      desc: "תהליך רכישה מהיר שנועד למקסם מכירות ולמנוע נטישת עגלות.",
      highlight: true
    },
    { 
      icon: Zap, 
      title: "מהירות טעינה", 
      desc: "שרתים חזקים ב-AWS שמבטיחים שהאתר שלכם יטוס.",
    },
    { 
      icon: LayoutDashboard, 
      title: "ניהול מלא בעברית", 
      desc: "כל הממשק, הדוחות וההגדרות - הכל בעברית פשוטה וברורה.",
    },
    { 
      icon: Package, 
      title: "ניהול מלאי והזמנות", 
      desc: "שליטה מלאה על המלאי, ווריאציות מוצרים (צבע/מידה) וסטטוס הזמנות.",
    },
    { 
      icon: TrendingUp, 
      title: "כלי שיווק מובנים", 
      desc: "קופונים, מבצעים, ושחזור עגלות נטושות בלחיצת כפתור.",
    },
  ]

  const comparisons = [
    {
      feature: "תמיכה ושירות",
      quickshop: "וואטסאפ אישי בעברית",
      shopify: "מיילים / צ'אט בוט באנגלית",
      description: "זמינות אמיתית כשיש בעיה דחופה"
    },
    {
      feature: "ממשק ניהול",
      quickshop: "עברית מלאה (RTL)",
      shopify: "אנגלית / תרגום חלקי",
      description: "נוחות עבודה יומיומית"
    },
    {
      feature: "חשבוניות ומשלוחים",
      quickshop: "מובנה במערכת",
      shopify: "דורש אפליקציות חיצוניות",
      description: "אינטגרציה מלאה לשוק הישראלי"
    },
    {
      feature: "הקמת החנות",
      quickshop: "גרירה ושחרור (Drag & Drop)",
      shopify: "דורש ידע/תבניות מורכבות",
      description: "פשוט כמו לבנות מצגת"
    },
    {
      feature: "עלויות נסתרות",
      quickshop: "אין. הכל כלול.",
      shopify: "אפליקציות בתשלום נוסף",
      description: "יודעים בדיוק כמה משלמים בסוף חודש"
    },
  ]

  const integrations = [
    {
      name: 'Google Tag Manager',
      icon: (
        <img src="https://leadproinfotech.com/wp-content/uploads/2025/01/google-tag.png" alt="Google Tag Manager" className="w-10 h-10 object-contain" />
      )
    },
    {
      name: 'Google Analytics 4',
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24">
          <path fill="#E37400" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    },
    {
      name: 'TikTok Ads',
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#000000">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      )
    },
    {
      name: 'Facebook Pixel',
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'Make',
      icon: (
        <img src="https://luna1.co/6e65f0.png" alt="Make" className="w-10 h-10 object-contain" />
      )
    },
    {
      name: 'Zapier',
      icon: (
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zapier_logo.svg/2560px-Zapier_logo.svg.png" alt="Zapier" className="w-10 h-10 object-contain" />
      )
    },
    {
      name: 'Apple Pay',
      icon: (
        <img src="https://cdn2.downdetector.com/static/uploads/logo/apple-pay.png" alt="Apple Pay" className="w-10 h-10 object-contain" />
      )
    },
    {
      name: 'Google Pay',
      icon: (
        <img src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/GooglePayLogo.width-500.format-webp.webp" alt="Google Pay" className="w-10 h-10 object-contain" />
      )
    },
    {
      name: 'Bit',
      icon: (
        <img src="https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Bit_logo_2024.svg/1200px-Bit_logo_2024.svg.png" alt="Bit" className="w-10 h-10 object-contain" />
      )
    },
    {
      name: 'WhatsApp',
      icon: (
        <img src="https://logos-world.net/wp-content/uploads/2020/05/WhatsApp-Logo.png" alt="WhatsApp" className="w-10 h-10 object-contain" />
      )
    }
  ]

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right z-10">
              <Badge className="mb-6 bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-1.5 text-sm font-medium rounded-full">
                הפלטפורמה המובילה בישראל 🇮🇱
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight text-gray-900">
                לבנות חנות אונליין
                <span className="text-emerald-500 block mt-2">בלי מתכנת ובלי כאב ראש</span>
              </h1>
              
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                הכל בעברית, הכל פשוט, והכל עובד.
                <br />
                <strong>תמיכה ישירה בוואטסאפ</strong>, ממשק Drag & Drop קליל, וחיבור מושלם לכל מה שהעסק הישראלי צריך.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-emerald-100 border-0">
                    <Rocket className="ml-2 h-5 w-5" />
                    פתחו חנות בחינם
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full px-8 h-14 text-lg font-bold">
                  צפו איך זה עובד
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ללא כרטיס אשראי
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  הקמה תוך דקות
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  שירות אישי
                </div>
              </div>
            </div>

            {/* Hero Visual - iPhone Product Page Simulation */}
            <HeroProductShowcase />
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 font-medium mb-10">עסקים ישראלים שבחרו בקוויק שופ</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
             <img 
               src="https://quickshopil-storage.s3.amazonaws.com/uploads/spasha/6903621c39586.webp" 
               alt="סטודיו פשה" 
               className="h-12 w-auto object-contain hover:scale-110 transition-transform"
             />
             <img 
               src="https://www.teva-call.co.il/wp-content/uploads/2019/08/Argania-logo.png" 
               alt="ארגניה" 
               className="h-12 w-auto object-contain hover:scale-110 transition-transform"
             />
             <img 
               src="https://quickshopil-storage.s3.amazonaws.com/uploads/reefjewelry/67e51d6ff3fc3.webp" 
               alt="ריף תכשיטים" 
               className="h-12 w-auto object-contain hover:scale-110 transition-transform"
             />
             <img 
               src="https://quickshopil-storage.s3.amazonaws.com/uploads/sefer/67c5c3d3d4273.webp" 
               alt="ספר טוב" 
               className="h-14 w-auto object-contain hover:scale-110 transition-transform"
             />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 mb-4">הכל כלול</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">כל הכלים להצלחה במקום אחד</h2>
            <p className="text-xl text-gray-500">
              בנינו מערכת שחושבת על הכל, כדי שאתם תוכלו להתעסק רק בלמכור.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${item.highlight ? 'bg-white border-emerald-100 shadow-lg shadow-emerald-50' : 'bg-white border-gray-100 hover:border-emerald-100'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.highlight ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Comparison Section */}
      <section id="comparison" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">למה כולם עוברים לקוויק שופ?</h2>
            <p className="text-xl text-gray-500">
              כשמשווים ראש בראש מול פלטפורמות בינלאומיות כמו שופיפיי, ההבדל ברור.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="hidden md:grid grid-cols-3 bg-gray-50/50 border-b border-gray-100">
              <div className="p-6 font-semibold text-gray-500">תכונה</div>
              <div className="p-6 text-center font-bold text-emerald-600 bg-emerald-50/30">קוויק שופ (אנחנו)</div>
              <div className="p-6 text-center font-semibold text-gray-500">פלטפורמות אחרות (Shopify/Wix)</div>
            </div>
            
            {comparisons.map((item, i) => (
              <div key={i} className="grid md:grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="p-6 flex flex-col justify-center">
                  <span className="font-bold text-gray-900">{item.feature}</span>
                  <span className="text-sm text-gray-500 mt-1">{item.description}</span>
                </div>
                <div className="p-6 flex items-center justify-center bg-emerald-50/10 font-bold text-emerald-700 text-center">
                   {item.quickshop}
                </div>
                <div className="p-6 flex items-center justify-center text-gray-500 text-center">
                   {item.shopify}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Shop Payments Section - NEW */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 to-slate-900 text-white overflow-hidden relative">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-6 px-4 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm">
                 חדש! סליקה מובנית 💳
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                תשכחו מחברות אשראי.
                <br />
                <span className="text-emerald-400">Quick Shop Payments</span> כאן.
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                אין צורך לעשות סקר שוק בחברות האשראי. קבלו תשלומים בקלות דרכנו, עם חוויית סליקה חלקה שמגדילה המרות ב-15%.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Bit & Apple Pay & Google Pay</div>
                    <div className="text-xs text-gray-400">מופעל אוטומטית לכולם</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Banknote className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">חשבוניות אוטומטיות</div>
                    <div className="text-xs text-gray-400">נשלחות ללקוח מייד עם הרכישה</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                   <div className="bg-purple-500/20 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">הכסף אצלכם מהר</div>
                    <div className="text-xs text-gray-400">זיכוי חודשי כל 2 לחודש בפעימה אחת בלבד!</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/quickshop-payments">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 h-12 rounded-full shadow-lg shadow-emerald-500/20 border-0 w-full sm:w-auto">
                    לפרטים נוספים והרשמה
                    <ArrowLeft className="mr-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-all duration-700">
                 <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="font-bold text-gray-900">סיכום הזמנה</div>
                    <Badge className="bg-green-100 text-green-700 border-0">שולם בהצלחה</Badge>
                 </div>
                 <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                             <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                             <div className="font-bold text-gray-900">Nike Air Max</div>
                             <div className="text-sm text-gray-500">מידה: 42 | צבע: לבן</div>
                          </div>
                       </div>
                       <div className="font-bold text-gray-900">₪450.00</div>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-500">אמצעי תשלום</span>
                          <div className="flex items-center gap-2 font-bold text-gray-900">
                             <img src="https://cdn2.downdetector.com/static/uploads/logo/apple-pay.png" alt="Apple Pay" className="w-8 h-5 object-contain" />
                             Apple Pay
                          </div>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-500">חשבונית מס</span>
                          <span className="text-emerald-600 font-medium cursor-pointer">#INV-2024-001</span>
                       </div>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                       <p className="text-emerald-800 text-sm font-medium">
                          התשלום עבר בהצלחה! החשבונית נשלחה למייל.
                       </p>
                    </div>
                 </div>
              </div>
              
              {/* Floating Badges */}
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl animate-bounce delay-700">
                 <div className="flex items-center gap-2 font-bold text-gray-900">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    סליקה מאובטחת SSL
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 mb-4">אינטגרציות</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">הכל מתחבר Plug & Play</h2>
            <p className="text-xl text-gray-500">
              בלי קוד ובלי הסתבכויות. מחברים את כל הכלים שאתם צריכים בקליק אחד.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {integrations.map((platform, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center mb-4 transition-colors">
                  {platform.icon}
                </div>
                <h3 className="font-bold text-gray-900">{platform.name}</h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  חיבור בקליק
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">שקט נפשי טכנולוגי</h2>
              <p className="text-gray-400 text-lg mb-8">
                אנחנו דואגים לכל הצד הטכני - שרתים, אבטחה, גיבויים ועדכונים. אתם דואגים רק לעסק שלכם.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Server className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">מאוחסן ב-AWS</h3>
                    <p className="text-gray-400 text-sm">התשתית החזקה בעולם שמבטיחה שהחנות תמיד באוויר</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">מחובר לחברות שילוח</h3>
                    <p className="text-gray-400 text-sm">Cargo, HFD, Lionwheel ועוד - הפקת משלוחים אוטומטית</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">סליקה ישראלית</h3>
                    <p className="text-gray-400 text-sm">עובדים עם כל חברות האשראי הישראליות, ביט ו-Apple Pay</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700">
              <h3 className="font-bold text-xl mb-6">תמיכה שאין באף מקום אחר</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <MessageCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                     <div className="font-bold">וואטסאפ ישיר</div>
                     <div className="text-sm text-gray-400">דברו עם בן אדם, לא עם בוט</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <Globe className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <div>
                     <div className="font-bold">מדברים עברית</div>
                     <div className="text-sm text-gray-400">מבינים את השוק הישראלי ואת הצרכים שלכם</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <Users className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <div>
                     <div className="font-bold">קהילה תומכת</div>
                     <div className="text-sm text-gray-400">אלפי בעלי עסקים שכבר הצליחו</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built-in Plugins Section - Moved & Redesigned */}
      <section className="py-24 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 mb-4">חוסכים לכם כסף</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">למה לשלם על אפליקציות?</h2>
            <p className="text-xl text-gray-500">
              בפלטפורמות אחרות כל פיצ'ר עולה כסף. אצלנו הכל מגיע Built-in.
              <br />
              כל הכלים המתקדמים ביותר, מוכנים לשימוש מהרגע הראשון.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* Card 1: Reviews */}
             <div className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 bg-white group">
                <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <Star className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-lg text-gray-900 mb-2">מערכת ביקורות</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">אימות רכישה, תמונות וידאו, שאלות ותשובות (Q&A) וסינון חכם.</p>
                </div>
             </div>

             {/* Card 2: Bundles */}
             <div className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 bg-white group">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <PackagePlus className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-lg text-gray-900 mb-2">Bundles & Upsell</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">הגדלת סל הקנייה עם באנדלים, הצעות בקופה ו-Cross-sell חכם.</p>
                </div>
             </div>

             {/* Card 3: Shop the Look */}
             <div className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 bg-white group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <ScanFace className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-lg text-gray-900 mb-2">Shop the Look</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">תיוג מוצרים על תמונות אווירה לרכישה מהירה של כל הלוק.</p>
                </div>
             </div>

             {/* Card 4: Marketing */}
             <div className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 bg-white group">
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <Megaphone className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-lg text-gray-900 mb-2">שיווק מתקדם</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">עגלות נטושות, קופונים, Gift Cards, ופיקסלים (FB, TikTok, Google).</p>
                </div>
             </div>

              {/* Card 5: Inventory */}
             <div className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 bg-white group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <Boxes className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-lg text-gray-900 mb-2">ניהול מלאי</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">וריאציות, עריכה מהירה, תוספות למוצרים וטבלאות מידות.</p>
                </div>
             </div>

             {/* Card 6: Content */}
             <div className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 bg-white group">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                   <LayoutTemplate className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-lg text-gray-900 mb-2">תוכן ועיצוב</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">בלוג מובנה, עמודים אישיים, תפריטים ועורך עיצוב מתקדם.</p>
                </div>
             </div>
          </div>

          {/* Extra Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: CalendarClock, label: 'שומר שבת אוטומטי' },
              { icon: MessageCircle, label: 'אייקון וואטסאפ צף' },
              { icon: Banknote, label: 'תשלום במזומן לשליח' },
              { icon: BarChart3, label: 'Google Analytics 4' },
            ].map((item, i) => (
               <div key={i} className="flex items-center justify-center gap-2 p-4 rounded-xl border border-gray-50 bg-gray-50/50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors">
                 <item.icon className="w-4 h-4 text-emerald-500" />
                 {item.label}
               </div>
            ))}
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-white text-emerald-600 border-emerald-200 mb-6 shadow-sm">תמחור פשוט ושקוף</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              בחרו את המסלול המתאים לעסק שלכם
            </h2>
            <p className="text-xl text-gray-600">
              בלי אותיות קטנות, בלי הפתעות. אפשר לשדרג או לבטל בכל רגע.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             {/* Catalog Plan */}
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-gray-300 transition-all flex flex-col">
               <div className="mb-6">
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">אתר תדמית / קטלוג</h3>
                 <p className="text-gray-500">מתאים לעסקים שרוצים להציג מוצרים ללא רכישה אונליין</p>
               </div>
               <div className="mb-8">
                 <div className="text-5xl font-bold text-gray-900">₪299</div>
                 <div className="text-gray-500 mt-2">לחודש</div>
                 <div className="text-emerald-600 font-bold text-sm mt-2">0% עמלות עסקה</div>
               </div>
               <Link href="/register?plan=catalog" className="w-full">
                 <Button variant="outline" className="w-full h-12 text-lg font-bold rounded-xl border-2">
                   התחילו עם קטלוג
                 </Button>
               </Link>
               <ul className="mt-8 space-y-4 text-sm text-gray-600 flex-1">
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   עיצוב אישי ב-Drag & Drop
                 </li>
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   הצגת מוצרים ללא הגבלה
                 </li>
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   חיבור לדומיין אישי
                 </li>
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   טופס יצירת קשר ללידים
                 </li>
               </ul>
             </div>

             {/* Full Store Plan */}
             <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 relative overflow-hidden flex flex-col">
               <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">מומלץ</div>
               <div className="mb-6">
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">חנות אונליין מלאה</h3>
                 <p className="text-gray-500">כל מה שצריך כדי למכור באינטרנט ולצמוח</p>
               </div>
               <div className="mb-8">
                 <div className="text-5xl font-bold text-emerald-600">₪399</div>
                 <div className="text-gray-500 mt-2">לחודש</div>
                 <div className="text-gray-400 text-sm mt-2">+ 0.5% עמלת מערכת</div>
               </div>
               <Link href="/register?plan=store" className="w-full">
                 <Button className="w-full h-12 text-lg font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100">
                   פתחו חנות מלאה
                 </Button>
               </Link>
               <ul className="mt-8 space-y-4 text-sm text-gray-600 flex-1">
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   <strong>כל הפיצ'רים כלולים</strong>
                 </li>
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   מערכת סליקה ומשלוחים
                 </li>
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   קופונים, מבצעים ומועדון לקוחות
                 </li>
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   אינטגרציה לפייסבוק, גוגל וטיקטוק
                 </li>
                 <li className="flex items-center gap-3">
                   <Check className="w-5 h-5 text-emerald-500" />
                   תמיכה מלאה בוואטסאפ
                 </li>
               </ul>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">שאלות נפוצות</h2>
          <div className="space-y-4">
            {[
              {
                q: "האם אני צריך מתכנת כדי להקים חנות?",
                a: "ממש לא! המערכת שלנו בנויה בשיטת 'גרירה ושחרור' (Drag & Drop). אתם פשוט גוררים את האלמנטים שאתם רוצים, משנים טקסטים ותמונות, והחנות מוכנה. זה פשוט כמו לערוך מצגת."
              },
              {
                q: "האם באמת יש תמיכה בעברית?",
                a: "כן, וזה אחד היתרונות הגדולים שלנו. אנחנו חברה ישראלית, והתמיכה שלנו היא בעברית מלאה. בנוסף, יש לנו ערוץ תמיכה ישיר בוואטסאפ, כך שתמיד יש עם מי לדבר."
              },
              {
                q: "האם המערכת מתאימה למובייל?",
                a: "בוודאי. כל חנות שנבנית בקוויק שופ מותאמת אוטומטית למובייל (Mobile First). האתר שלכם יראה מדהים בכל מכשיר - אייפון, אנדרואיד, טאבלט ומחשב."
              },
              {
                q: "מה זה חבילת 'אתר קטלוג'?",
                a: "זו חבילה שמתאימה לעסקים שרוצים להציג את המוצרים שלהם באינטרנט בצורה מקצועית, אבל מעדיפים לסגור את העסקה בטלפון או בוואטסאפ ולא דרך סליקה באתר. מעולה ליבואנים, סיטונאים או עסקים בתחום השירותים."
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-2xl p-6 cursor-pointer border border-gray-100 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-bold text-gray-900 list-none">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-gray-600 mt-4 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-gray-900">
            החנות החדשה שלכם מחכה
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            אלפי עסקים ישראלים כבר בחרו בדרך הקלה והמשתלמת. הצטרפו אליהם היום.
          </p>
          <div className="flex justify-center gap-4">
             <Link href="/register">
               <Button variant="outline" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 py-6 h-auto text-xl font-bold shadow-xl shadow-emerald-100 border-0">
                 פתחו חנות בחינם עכשיו
               </Button>
             </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
