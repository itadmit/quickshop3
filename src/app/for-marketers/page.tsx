import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  CheckCircle, 
  ArrowLeft, 
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
  ChevronDown
} from "lucide-react"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "מסלול Partners | קוויק שופ",
  description: "הפלטפורמה הישראלית המתקדמת לניהול חנות אונליין. 14 אירועי tracking, מערכת משפיעניות מובנית, שיתוף צוות ללא עלות, והתממשקות מושלמת לכל פלטפורמות הפרסום.",
}

export default function ForMarketersPage() {
  const features = [
    { 
      icon: Eye, 
      title: "PageView", 
      desc: "מעקב אחרי כל צפייה בעמוד",
    },
    { 
      icon: Eye, 
      title: "ViewContent", 
      desc: "צפייה במוצר עם variant מלא",
      highlight: true
    },
    { 
      icon: MousePointerClick, 
      title: "SelectVariant", 
      desc: "בחירת variant ספציפי (מידה/צבע)",
      highlight: true
    },
    { 
      icon: Heart, 
      title: "AddToWishlist", 
      desc: "הוספה למועדפים + variant",
      highlight: true
    },
    { 
      icon: Heart, 
      title: "RemoveFromWishlist", 
      desc: "הסרה ממועדפים + variant",
    },
    { 
      icon: ShoppingCart, 
      title: "AddToCart", 
      desc: "הוספה לעגלה + variant מלא",
      highlight: true
    },
    { 
      icon: ShoppingCart, 
      title: "RemoveFromCart", 
      desc: "הסרה מעגלה + variant",
    },
    { 
      icon: ShoppingCart, 
      title: "ViewCart", 
      desc: "צפייה בעגלה מלאה",
    },
    { 
      icon: CreditCard, 
      title: "InitiateCheckout", 
      desc: "תחילת תהליך תשלום",
      highlight: true
    },
    { 
      icon: CreditCard, 
      title: "AddPaymentInfo", 
      desc: "הזנת פרטי תשלום",
    },
    { 
      icon: CheckCircle, 
      title: "Purchase", 
      desc: "רכישה מוצלחת + כל הפריטים",
      highlight: true
    },
    { 
      icon: Users, 
      title: "SignUp", 
      desc: "הרשמת משתמש חדש",
    },
    { 
      icon: Users, 
      title: "Login", 
      desc: "התחברות משתמש",
    },
    { 
      icon: Search, 
      title: "Search", 
      desc: "חיפוש מוצרים + תוצאות",
    },
  ]

  const comparisons = [
    {
      feature: "Variant Info בכל אירוע",
      quickshop: true,
      shopify: "partial",
      description: "מידע מלא על מידה, צבע וכל variant בכל אירוע"
    },
    {
      feature: "AddToWishlist עם Variant",
      quickshop: true,
      shopify: false,
      description: "מעקב מדויק אחרי מה הלקוחות רוצים"
    },
    {
      feature: "RemoveFromWishlist עם Variant",
      quickshop: true,
      shopify: false,
      description: "הבנה מדויקת של התנהגות לקוחות"
    },
    {
      feature: "SelectVariant אירוע נפרד",
      quickshop: true,
      shopify: false,
      description: "מעקב אחרי כל בחירת variant"
    },
    {
      feature: "ViewCart עם Variants מלא",
      quickshop: true,
      shopify: "partial",
      description: "רואים בדיוק מה בעגלה"
    },
    {
      feature: "מניעת כפילויות ב-React",
      quickshop: true,
      shopify: false,
      description: "Tracking נקי ללא רעש"
    },
    {
      feature: "Server-Side Tracking",
      quickshop: true,
      shopify: true,
      description: "Conversion API לכל הפלטפורמות"
    },
    {
      feature: "14 אירועי Tracking",
      quickshop: true,
      shopify: "partial",
      description: "מעקב מלא אחרי כל פעולה"
    },
  ]

  const integrations = [
    {
      name: 'Facebook Pixel',
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
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
      name: 'TikTok Pixel',
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#000000">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      )
    },
    {
      name: 'Instagram Shopping',
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
          <defs>
            <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#833AB4" }} />
              <stop offset="50%" style={{ stopColor: "#E1306C" }} />
              <stop offset="100%" style={{ stopColor: "#FCAF45" }} />
            </linearGradient>
          </defs>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right z-10">
              <Badge className="mb-6 bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-1.5 text-sm font-medium rounded-full">
                למשווקים ומומחי פרסום
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight text-gray-900">
                הפלטפורמה הישראלית
                <span className="text-emerald-500 block mt-2">שמשנה את חוקי המשחק</span>
              </h1>
              
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                <strong>התממשקות מושלמת לפייסבוק, גוגל וטיקטוק</strong> • פלטפורמת איקומרס מתקדמת שבנויה למכירות • 
                <strong> דאטה מדויקת שתשפר את ה-ROAS של הלקוחות שלכם</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-emerald-100 border-0">
                    <Rocket className="ml-2 h-5 w-5" />
                    התחילו להרוויח היום
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full px-8 h-14 text-lg font-bold">
                  צפו בהדגמה
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ללא עלויות
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  עמלות גבוהות
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  תמיכה 24/7
                </div>
              </div>
            </div>

            {/* Hero Visual - Marketer Dashboard */}
            <div className="relative lg:h-[600px] w-full flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                {/* Abstract decorative elements */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100 rounded-full filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-100 rounded-full filter blur-3xl opacity-30 animate-pulse delay-700" />
                
                {/* Ad Manager Card */}
                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs font-mono text-gray-400">Campaign Manager</div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-gray-500 text-sm font-medium">Campaign: Summer Sale 2024</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                          <span className="text-xs text-gray-400">Last 30 Days</span>
                        </div>
                      </div>
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">ROAS</div>
                        <div className="text-3xl font-bold text-gray-900">9.42</div>
                        <div className="flex items-center gap-1 text-emerald-600 text-xs mt-1 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          +24% vs avg
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Purchases</div>
                        <div className="text-3xl font-bold text-gray-900">842</div>
                        <div className="text-xs text-gray-400 mt-1">Cost per purchase: ₪14</div>
                      </div>
                    </div>

                    {/* Detailed Stats Rows */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Facebook Ads</div>
                            <div className="text-xs text-gray-500">Retargeting - Top 1%</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-sm">12.5 ROAS</div>
                          <div className="text-xs text-green-600">Excellent</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">TikTok Ads</div>
                            <div className="text-xs text-gray-500">Broad Audience</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-sm">8.2 ROAS</div>
                          <div className="text-xs text-green-600">Good</div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Bubble */}
                    <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                       <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                         <Zap className="w-4 h-4 text-blue-500" />
                       </div>
                       <div>
                         <div className="text-xs font-bold text-blue-800 mb-1">AI Optimization</div>
                         <p className="text-xs text-blue-700 leading-relaxed">
                           הפיקסל זיהה 45 רכישות נוספות שלא דווחו. השיפור ב-ROAS עודכן אוטומטית.
                         </p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 font-medium mb-10">עסקים מובילים שכבר עובדים עם קוויק שופ</p>
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

      {/* Tracking Section */}
      <section id="tracking" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 mb-4">Tracking מתקדם</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">14 אירועי Tracking מלאים</h2>
            <p className="text-xl text-gray-500">
              מעקב אחרי <strong>כל פעולה אפשרית</strong> עם פרטי Variant מלאים.
              זה מה שהופך קמפיינים טובים למצוינים.
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

          {/* Code Snippet */}
          <div className="mt-16 bg-[#1e1e1e] rounded-3xl p-8 shadow-2xl overflow-hidden relative" dir="ltr">
             <div className="absolute top-0 left-0 w-full h-10 bg-[#2d2d2d] flex items-center px-4 gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500"/>
               <div className="w-3 h-3 rounded-full bg-yellow-500"/>
               <div className="w-3 h-3 rounded-full bg-green-500"/>
             </div>
             <div className="mt-8 font-mono text-sm md:text-base overflow-x-auto text-left">
               <pre className="text-gray-300">
{`{
  "event": `}<span className="text-emerald-400">"AddToCart"</span>{`,
  "content_name": "נעל נייק - 39 / אפור",
  "content_ids": ["variant_cmi5t9jlj001b13an3qzlg25q"],
  "content_type": "product",
  "value": 150,
  "currency": "ILS",
  "variant_id": `}<span className="text-blue-400">"cmi5t9jlj001b13an3qzlg25q"</span>{`,
  "variant_name": "39 / אפור",
  "quantity": 1
}`}
               </pre>
             </div>
             <div className="mt-6 flex items-center gap-2 text-gray-400 text-sm border-t border-gray-800 pt-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                נשלח אוטומטית ל-<span dir="ltr">Facebook, Google, TikTok</span> ו-Instagram
             </div>
          </div>
        </div>
      </section>

      {/* Influencer System Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 mb-6">מערכת משפיעניות מובנית</Badge>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                תנו למשפיעניות שלכם <br/>
                <span className="text-emerald-600">גישה לנתונים בזמן אמת</span>
              </h2>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                במקום לשלוח צילומי מסך ואקסלים בסוף חודש, תנו למשפיעניות שלכם גישה לאזור אישי משלהן.
                שקיפות מלאה = יותר מוטיבציה למכור.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">אזור אישי לכל משפיענית</h3>
                    <p className="text-gray-500 leading-relaxed">
                      כל משפיענית מקבלת שם משתמש וסיסמא לאזור פרטי משלה. היא רואה רק את הנתונים שלה, ללא חשיפה לנתונים הכלליים של החנות.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">מעקב מכירות LIVE</h3>
                    <p className="text-gray-500 leading-relaxed">
                      המשפיענית רואה בדיוק כמה מכירות הגיעו מהקופון שלה ברגע זה, מה המוצרים שהקהל שלה הכי אוהב, וכמה עמלה היא צברה.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <MousePointerClick className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">מחולל לינקים חכם</h3>
                    <p className="text-gray-500 leading-relaxed">
                      יצירת לינקים למעקב עם הקופון מוטמע אוטומטית. כשהלקוח לוחץ על הלינק - הקופון כבר מוזן בקופה. פחות נטישות, יותר המרות.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual representation of the Influencer Dashboard */}
            <div className="order-1 lg:order-2 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-emerald-100 to-pink-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
               
               <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                 {/* Mock Dashboard Header */}
                 <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                       AN
                     </div>
                     <span className="font-bold text-gray-700 text-sm">אנה זק - דשבורד</span>
                   </div>
                   <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">מחובר</Badge>
                 </div>

                 {/* Dashboard Content Mock */}
                 <div className="p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-emerald-50 rounded-2xl">
                       <div className="text-xs text-emerald-600 font-medium mb-1">סך עמלות</div>
                       <div className="text-2xl font-bold text-gray-900">₪4,250</div>
                     </div>
                     <div className="p-4 bg-pink-50 rounded-2xl">
                       <div className="text-xs text-pink-600 font-medium mb-1">הזמנות החודש</div>
                       <div className="text-2xl font-bold text-gray-900">142</div>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <div className="text-sm font-bold text-gray-900">הזמנות אחרונות</div>
                     {[
                       { name: 'נועה ק.', amount: '₪349', time: 'לפני 5 דק׳' },
                       { name: 'דניאל כ.', amount: '₪199', time: 'לפני 12 דק׳' },
                       { name: 'שירה מ.', amount: '₪850', time: 'לפני 28 דק׳' },
                     ].map((order, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                             <ShoppingBag className="w-4 h-4 text-gray-400" />
                           </div>
                           <div>
                             <div className="text-xs font-bold text-gray-900">{order.name}</div>
                             <div className="text-[10px] text-gray-500">קופון: ANNA10</div>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="text-xs font-bold text-gray-900">{order.amount}</div>
                           <div className="text-[10px] text-gray-400">{order.time}</div>
                         </div>
                       </div>
                     ))}
                   </div>

                   <div className="pt-4 border-t border-gray-100">
                     <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-xl shadow-lg">
                       <div className="flex items-center gap-2 text-sm">
                         <CheckCircle className="w-4 h-4 text-green-400" />
                         <span>תשלום הבא: 10/11/2024</span>
                       </div>
                       <span className="font-bold">₪4,250</span>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">בואו נשווה לפלטפורמות אחרות</h2>
            <p className="text-xl text-gray-500">
              המתחרים שלנו (כן כן, אפילו Shopify) - בואו נראה מה ההבדלים
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="hidden md:grid grid-cols-3 bg-gray-50/50 border-b border-gray-100">
              <div className="p-6 font-semibold text-gray-500">תכונה</div>
              <div className="p-6 text-center font-bold text-emerald-600 bg-emerald-50/30">קוויק שופ</div>
              <div className="p-6 text-center font-semibold text-gray-500">אחרים</div>
            </div>
            
            {comparisons.map((item, i) => (
              <div key={i} className="grid md:grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="p-6 flex flex-col justify-center">
                  <span className="font-bold text-gray-900">{item.feature}</span>
                  <span className="text-sm text-gray-500 mt-1">{item.description}</span>
                </div>
                <div className="p-6 flex items-center justify-center bg-emerald-50/10">
                  {item.quickshop && <CheckCircle className="w-8 h-8 text-emerald-500 fill-emerald-50" />}
                </div>
                <div className="p-6 flex items-center justify-center">
                  {item.shopify === true ? (
                    <CheckCircle className="w-8 h-8 text-emerald-500 fill-emerald-50" />
                  ) : item.shopify === 'partial' ? (
                    <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">חלקי</span>
                  ) : (
                    <X className="w-8 h-8 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 mb-4">אינטגרציות</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">התממשקות מושלמת</h2>
            <p className="text-xl text-gray-500">
              Facebook, Google, TikTok - כל הפיקסלים מקבלים את כל הנתונים אוטומטית!
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
                  מחובר אוטומטית
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
              <h2 className="text-3xl font-bold mb-6">תשתית מתקדמת ואינטגרציות מובנות</h2>
              <p className="text-gray-400 text-lg mb-8">
                הכל מחובר ועובד מהרגע הראשון. מאוחסן ב-AWS לאמינות וביצועים ברמה עולמית.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Server className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">מאוחסן ב-AWS</h3>
                    <p className="text-gray-400 text-sm">זמינות 99.9%, גיבויים אוטומטיים ואבטחה ברמה בנקאית</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">חברות משלוחים</h3>
                    <p className="text-gray-400 text-sm">Cargo, Focus, Negev, HFD, Lionwheel ועוד - הכל בפנים</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">סליקה ותשלומים</h3>
                    <p className="text-gray-400 text-sm">PayPlus, CardCom, Bit, PayPal - כל האפשרויות ללקוח</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700">
              <h3 className="font-bold text-xl mb-6">למה זה חשוב למשווק?</h3>
              <div className="space-y-4">
                {[
                  "הלקוח לא מתלונן על משלוחים = אתם יכולים להתמקד בקמפיינים",
                  "הפיקסל יודע מי קנה ובכמה = אופטימיזציה מושלמת",
                  "אתר מהיר = יחס המרה גבוה יותר",
                  "אין התעסקות טכנית = שקט נפשי"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-white text-emerald-600 border-emerald-200 mb-6 shadow-sm">כמה הלקוח משלם?</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            399₪ <span className="text-xl text-gray-500 font-normal">לחודש</span>
            <span className="mx-4 text-gray-300 font-light">+</span>
            0.5% <span className="text-xl text-gray-500 font-normal">עמלה</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            המחיר ללקוחות שלכם: עלות חודשית קבועה ועמלה רק על מכירות בפועל.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-right">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
               <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                 <Users className="w-5 h-5 text-emerald-600" />
               </div>
               <h3 className="font-bold text-gray-900 mb-1">הלקוח + המשווק + הצוות</h3>
               <p className="text-sm text-gray-500">כולם במערכת - בחינם</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
               <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                 <TrendingUp className="w-5 h-5 text-emerald-600" />
               </div>
               <h3 className="font-bold text-gray-900 mb-1">מערכת משפיעניות</h3>
               <p className="text-sm text-gray-500">כלולה במחיר, ללא עלות</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
               <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                 <BarChart3 className="w-5 h-5 text-emerald-600" />
               </div>
               <h3 className="font-bold text-gray-900 mb-1">14 אירועי Tracking</h3>
               <p className="text-sm text-gray-500">ללא תוספת מחיר</p>
             </div>
          </div>

          <div className="mt-12 bg-white rounded-xl p-6 border border-emerald-100 inline-flex items-center gap-3 text-emerald-800 shadow-sm">
            <Zap className="w-5 h-5 text-yellow-500" />
            <strong>טיפ:</strong> תוסיפו את הלקוח כמשתמש - הוא יראה רק מה שצריך, ואתם תוכלו לנהל הכל מרחוק!
          </div>
        </div>
      </section>

      {/* Commissions Section */}
      <section id="commissions" className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-white text-emerald-600 border-emerald-200 mb-4 shadow-sm">מודל התגמול</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">כמה אתם מרוויחים?</h2>
            <p className="text-xl text-gray-500">
              ככל שתביאו יותר לקוחות, כך העמלה שלכם תגדל. 
              <br />
              תגמול על כל לקוח משלם (שהכניס אשראי לאחר תקופת הנסיון).
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier 1 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-200"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">מתחילים</h3>
              <div className="text-sm text-gray-500 mb-6">עד 10 חנויות</div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">₪25</div>
              <div className="text-sm text-gray-400 mb-6">לכל לקוח משלם</div>
              
              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-100">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">גישה למרכז הידע לשותפים</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">ערכת שיווק ומיתוג</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">תמיכה בסיסית במייל</span>
                </li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">מתקדמים</h3>
              <div className="text-sm text-gray-500 mb-6">10+ חנויות</div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">₪45</div>
              <div className="text-sm text-gray-400 mb-6">לכל לקוח משלם</div>

              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-100">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600 font-medium">תמיכה ישירה בוואטסאפ</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">גישה מוקדמת לפיצ'רים</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">וובינרים לשיפור ביצועים</span>
                </li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-300 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden transform md:-translate-y-2 flex flex-col">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">פופולרי</div>
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">מומחים</h3>
              <div className="text-sm text-gray-500 mb-6">30+ חנויות</div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">₪85</div>
              <div className="text-sm text-gray-400 mb-6">לכל לקוח משלם</div>

              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-100">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-800 font-bold">מנהל שותפים אישי</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">לידים חמים מקוויק שופ</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">הופעה כמשווק מורשה באתר</span>
                </li>
              </ul>
            </div>

            {/* Tier 4 */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden text-white flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-white">VIP Partner</h3>
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="text-sm text-gray-400 mb-6">100+ חנויות</div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">₪85</div>
              <div className="text-sm text-gray-400 mb-4">לכל לקוח משלם</div>
              <div className="border-t border-gray-700 pt-4 mt-0 mb-6">
                <div className="text-2xl font-bold text-yellow-400 mb-1">0.1-0.3%</div>
                <div className="text-xs text-gray-400">מהמכירות של כל הלקוחות</div>
              </div>

              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-800">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">ערוץ ישיר לצוות הפיתוח והמנכ״ל</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">פיתוח פיצ׳רים בהתאמה אישית</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">טיסות וכנסים על חשבוננו</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">שאלות נפוצות</h2>
          <div className="space-y-4">
            {[
              {
                q: "למה לבחור בקוויק שופ ולא בפלטפורמות אחרות?",
                a: "קוויק שופ היא פלטפורמה ישראלית עם tracking מתקדם פי 3, מחיר נמוך ב-70%, תמיכה בעברית מלאה, ומערכת משפיעניות מובנית. בנוסף, תוכלו להוסיף אנשי צוות ללא עלות נוספת."
              },
              {
                q: "איך עובדת מערכת המשפיעניות?",
                a: "תוכלו ליצור קופונים ייחודיים למשפיעניות ולשייך להן יוזר במערכת. המשפיענית תקבל דשבורד אישי עם נתונים בזמן אמת - היא תראה רק הזמנות שבוצעו עם הקופון שלה."
              },
              {
                q: "כמה עולה להוסיף אנשי צוות למערכת?",
                a: "שום דבר! תוכלו להוסיף מספר בלתי מוגבל של משתמשים ללא תשלום נוסף. כל משתמש מקבל הרשאות מותאמות אישית לפי תפקידו."
              },
              {
                q: "האם יש מגבלות על מספר לקוחות?",
                a: "אין שום מגבלה! תביאו כמה לקוחות שאתם רוצים, נשמח לקבל את כולם."
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-gray-50 rounded-2xl p-6 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
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
            מוכנים להתחיל להרוויח?
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            הצטרפו לאלפי משווקים שכבר מרוויחים מהמערכת הטובה ביותר בישראל
          </p>
          <div className="flex justify-center gap-4">
             <Link href="/register">
               <Button variant="outline" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 py-6 h-auto text-xl font-bold shadow-xl shadow-emerald-100 border-0">
                 הצטרפו עכשיו בחינם
               </Button>
             </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
