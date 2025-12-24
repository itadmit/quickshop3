import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import type { Metadata } from 'next'
import { 
  Rocket, 
  CheckCircle, 
  ArrowLeft, 
  Code, 
  Terminal, 
  Layout, 
  Zap, 
  Server, 
  Database, 
  Puzzle, 
  Globe, 
  Braces,
  GitBranch,
  Box,
  Layers, 
  Check,
  X,
  ChevronDown,
  Cpu,
  Workflow
} from "lucide-react"

export const metadata: Metadata = {
  title: "מסלול Partners למפתחים | קוויק שופ",
  description: "הפלטפורמה הישראלית הגמישה ביותר למפתחים ובוני אתרים. שליטה מלאה בקוד, קומפוננטות React, API מתקדם ומודל רווח משתלם.",
}

export default function ForDevelopersPage() {
  const features = [
    { 
      icon: Code, 
      title: "Full Code Access", 
      desc: "גישה מלאה ל-HTML/CSS ולוגיקה. אין אזורים סגורים.",
      highlight: true
    },
    { 
      icon: Layout, 
      title: "React Components", 
      desc: "בניית תבניות באמצעות קומפוננטות React מודרניות.",
      highlight: true
    },
    { 
      icon: Zap, 
      title: "Edge Caching", 
      desc: "ביצועים מעולים עם תשתית CDN גלובלית.",
      highlight: true
    },
    { 
      icon: Terminal, 
      title: "Developer API", 
      desc: "API מלא לניהול מוצרים, הזמנות ולקוחות.",
      highlight: true
    },
    { 
      icon: Database, 
      title: "Custom Fields", 
      desc: "הוספת שדות מידע מותאמים לכל ישות במערכת.",
    },
    { 
      icon: Braces, 
      title: "Headless Ready", 
      desc: "אפשרות להשתמש בקוויק שופ רק כ-Backend.",
      highlight: true
    },
    { 
      icon: Workflow, 
      title: "Webhooks", 
      desc: "עדכונים בזמן אמת למערכות חיצוניות על כל פעולה.",
    },
    { 
      icon: Puzzle, 
      title: "Plugin System", 
      desc: "פיתוח תוספים ושימוש חוזר בפרויקטים שונים.",
    },
    { 
      icon: GitBranch, 
      title: "Version Control", 
      desc: "ניהול גרסאות קוד מסודר (בקרוב).",
      highlight: true
    },
    { 
      icon: Box, 
      title: "Custom Blocks", 
      desc: "יצירת בלוקים לשימוש עורך התוכן.",
    },
    { 
      icon: CheckCircle, 
      title: "TypeScript", 
      desc: "תמיכה מלאה ב-TypeScript לטייפ-סייפטי.",
      highlight: true
    },
    { 
      icon: Server, 
      title: "No DevOps", 
      desc: "אנחנו דואגים לשרתים, אתם דואגים לקוד.",
    },
    { 
      icon: Layers, 
      title: "Design System", 
      desc: "שימוש ב-Tailwind CSS ובספריות UI מוכנות.",
    },
    { 
      icon: Globe, 
      title: "SEO Optimized", 
      desc: "שליטה מלאה ב-Meta Tags ו-Structured Data.",
    },
  ]

  const comparisons = [
    {
      feature: "טכנולוגיית Frontend",
      quickshop: "React & Next.js",
      shopify: "Liquid (Old)",
      description: "פיתוח מודרני מבוסס קומפוננטות vs שפת טמפלייטים מיושנת"
    },
    {
      feature: "ביצועים (Lighthouse)",
      quickshop: "95-100",
      shopify: "50-70",
      description: "טעינה מיידית ללא עומס של אפליקציות כבדות"
    },
    {
      feature: "גישה ל-Database",
      quickshop: "Direct via API",
      shopify: "Restricted",
      description: "גמישות מלאה בשליפת נתונים מורכבים"
    },
    {
      feature: "Custom Checkout",
      quickshop: true,
      shopify: "Plus Only",
      description: "התאמה מלאה של עמוד התשלום לצרכי הלקוח"
    },
    {
      feature: "ניהול שדות מותאמים",
      quickshop: "Built-in",
      shopify: "Requires App",
      description: "שדות מיוחדים למוצרים ולקוחות ללא תוספים חיצוניים"
    },
    {
      feature: "תמיכה בעברית (RTL)",
      quickshop: "Native",
      shopify: "Partial",
      description: "תמיכה מובנית מימין לשמאל ללא האקים של CSS"
    },
    {
      feature: "עמלות פיתוח",
      quickshop: "0%",
      shopify: "0%",
      description: "אנחנו לא לוקחים עמלה על העבודה שלכם מול הלקוח"
    },
    {
      feature: "סביבת פיתוח מקומית",
      quickshop: true,
      shopify: "CLI Tool",
      description: "פיתוח נוח על המחשב שלכם לפני העלאה"
    },
  ]

  const integrations = [
    {
      name: 'REST API',
      icon: (
        <Terminal className="w-10 h-10 text-gray-700" />
      )
    },
    {
      name: 'Webhooks',
      icon: (
        <Workflow className="w-10 h-10 text-pink-600" />
      )
    },
    {
      name: 'Zapier / Make',
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#FF4F00">
          <path d="M3.12 6.88L7.47 16.8h4.42L7.53 6.88H3.12zm5.84 0L4.61 16.8h4.41l4.35-9.92H8.96zm8.83-3.96L13.44 12.8h4.42l4.35-9.88h-4.42z" />
        </svg>
      )
    },
    {
      name: 'Custom JS',
      icon: (
        <Code className="w-10 h-10 text-yellow-500" />
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
                למפתחים ובוני אתרים
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight text-gray-900">
                הכוח לבנות בדיוק
                <span className="text-emerald-500 block mt-2">את מה שהלקוח דמיין</span>
              </h1>
              
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                <strong>חופש מלא בקוד (Custom Code)</strong> • ביצועי על עם Next.js • 
                <strong> API גמיש שמאפשר אינטגרציה לכל מערכת</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-emerald-100 border-0">
                    <Terminal className="ml-2 h-5 w-5" />
                    התחילו לבנות בחינם
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-full px-8 h-14 text-lg font-bold">
                  דוקומנטציה
                  <Code className="mr-2 h-5 w-5" />
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ללא התעסקות בשרתים
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  קוד נקי ומודרני
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  תגמול שותפים
                </div>
              </div>
            </div>

            {/* Hero Visual - Developer IDE */}
            <div className="relative lg:h-[600px] w-full flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                {/* Abstract decorative elements */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-100 rounded-full filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-100 rounded-full filter blur-3xl opacity-30 animate-pulse delay-700" />
                
                {/* Code Editor Card */}
                <div className="relative bg-[#1e1e1e] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden font-mono text-left" dir="ltr">
                  {/* Header */}
                  <div className="bg-[#252526] border-b border-[#333] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <Layout className="w-3 h-3" />
                      ProductPage.tsx
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-1 text-sm md:text-base">
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">1</span>
                        <span className="text-pink-400">import</span>
                        <span className="text-white ml-2">{`{ Product }`}</span>
                        <span className="text-pink-400 ml-2">from</span>
                        <span className="text-green-400 ml-2">'@quickshop/ui'</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">2</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">3</span>
                        <span className="text-blue-400">export default</span>
                        <span className="text-blue-400 ml-2">function</span>
                        <span className="text-yellow-300 ml-2">ProductPage</span>
                        <span className="text-white">() {`{`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">4</span>
                        <span className="text-pink-400 ml-4">const</span>
                        <span className="text-white ml-2">product</span>
                        <span className="text-white ml-2">=</span>
                        <span className="text-blue-400 ml-2">useProduct</span>
                        <span className="text-white">()</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">5</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">6</span>
                        <span className="text-pink-400 ml-4">return</span>
                        <span className="text-white ml-2">(</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">7</span>
                        <span className="text-gray-400 ml-8">{`<div className="grid gap-8">`}</span>
                      </div>
                      <div className="flex bg-[#2d2d2d] -mx-6 px-6 border-l-2 border-emerald-500">
                        <span className="text-gray-500 w-8 select-none">8</span>
                        <span className="text-gray-400 ml-10">{`<Product.Gallery images={product.images} />`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">9</span>
                        <span className="text-gray-400 ml-10">{`<Product.Info>`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">10</span>
                        <span className="text-gray-400 ml-12">{`<Product.Title className="text-3xl" />`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">11</span>
                        <span className="text-gray-400 ml-12">{`<Product.Price className="text-xl" />`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">12</span>
                        <span className="text-gray-400 ml-12">{`<Product.AddToCart />`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">13</span>
                        <span className="text-gray-400 ml-10">{`</Product.Info>`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">14</span>
                        <span className="text-gray-400 ml-8">{`</div>`}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">15</span>
                        <span className="text-white ml-4">)</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-8 select-none">16</span>
                        <span className="text-white">{'}'}</span>
                      </div>
                    </div>

                    {/* Compile Status */}
                    <div className="mt-6 bg-[#252526] p-3 rounded-lg border border-[#333] flex items-center justify-between">
                       <div className="flex items-center gap-2 text-xs text-gray-400">
                         <Terminal className="w-3 h-3" />
                         <span>Terminal</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs text-green-400">
                         <CheckCircle className="w-3 h-3" />
                         Compiled successfully in 145ms
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
          <p className="text-center text-gray-500 font-medium mb-10">סוכנויות דיגיטל מובילות שבונות על קוויק שופ</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder Logos for Dev Agencies */}
             <div className="text-xl font-bold text-gray-400 flex items-center gap-2">
               <Cpu className="w-6 h-6" />
               <span>DevTeam</span>
             </div>
             <div className="text-xl font-bold text-gray-400 flex items-center gap-2">
               <Layers className="w-6 h-6" />
               <span>PixelPerfect</span>
             </div>
             <div className="text-xl font-bold text-gray-400 flex items-center gap-2">
               <Globe className="w-6 h-6" />
               <span>WebMasters</span>
             </div>
             <div className="text-xl font-bold text-gray-400 flex items-center gap-2">
               <Zap className="w-6 h-6" />
               <span>SpeedLabs</span>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 mb-4">Developer Experience</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">ארגז הכלים האולטימטיבי</h2>
            <p className="text-xl text-gray-500">
              בנינו את המערכת שתמיד חלמנו עליה כמפתחים.
              גמישה, מהירה, וכתובה בטכנולוגיות הכי עדכניות.
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

          {/* API Code Snippet */}
          <div className="mt-16 bg-[#0f172a] rounded-3xl p-8 shadow-2xl overflow-hidden relative" dir="ltr">
             <div className="absolute top-0 left-0 w-full h-10 bg-[#1e293b] flex items-center justify-between px-4">
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500"/>
                 <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                 <div className="w-3 h-3 rounded-full bg-green-500"/>
               </div>
               <span className="text-xs text-gray-400">api/create-order.ts</span>
             </div>
             <div className="mt-8 font-mono text-sm md:text-base text-left">
               <div className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                 <div>
                   <span className="text-purple-400">const</span> response <span className="text-purple-400">=</span> <span className="text-purple-400">await</span> fetch(<span className="text-green-400">'https://api.quickshop.co.il/v1/orders'</span>, {'{'}
                 </div>
                 <div className="pl-4">
                   method: <span className="text-green-400">'POST'</span>,
                 </div>
                 <div className="pl-4">
                   headers: {'{'}
                 </div>
                 <div className="pl-8">
                   <span className="text-green-400">'Authorization'</span>: <span className="text-yellow-300">`Bearer {'${'}process.env.API_KEY{'}'}`</span>,
                 </div>
                 <div className="pl-8">
                   <span className="text-green-400">'Content-Type'</span>: <span className="text-green-400">'application/json'</span>
                 </div>
                 <div className="pl-4">
                   {'}'},
                 </div>
                 <div className="pl-4">
                   body: JSON.stringify({'{'}
                 </div>
                 <div className="pl-8">
                   store_id: <span className="text-green-400">'store_123'</span>,
                 </div>
                 <div className="pl-8">
                   items: [
                 </div>
                 <div className="pl-12">
                   {'{'} id: <span className="text-green-400">'prod_88'</span>, variant: <span className="text-green-400">'v_01'</span>, qty: <span className="text-orange-400">2</span> {'}'}
                 </div>
                 <div className="pl-8">
                   ],
                 </div>
                 <div className="pl-8">
                   customer: {'{'}
                 </div>
                 <div className="pl-12">
                   email: <span className="text-green-400">'client@example.com'</span>,
                 </div>
                 <div className="pl-12">
                   shipping: {'{'} city: <span className="text-green-400">'Tel Aviv'</span>, street: <span className="text-green-400">'Rothschild'</span> {'}'}
                 </div>
                 <div className="pl-8">
                   {'}'}
                 </div>
                 <div className="pl-4">
                   {'}'})
                 </div>
                 <div>
                   {'}'});
                 </div>
               </div>
             </div>
             <div className="mt-6 flex items-center gap-2 text-gray-400 text-sm border-t border-gray-800 pt-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                REST API מלא עם תיעוד Swagger/OpenAPI
             </div>
          </div>
        </div>
      </section>

      {/* Customization Section */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 mb-6">גמישות אינסופית</Badge>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                תבנו פיצ'רים מורכבים <br/>
                <span className="text-emerald-600">בלי להסתבך עם "עקיפות"</span>
              </h2>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                נמאס לכם להילחם בפלטפורמה? בקוויק שופ יש לכם שליטה מלאה. 
                תבנו מחשבוני מחיר מורכבים, תהליכי רכישה מותאמים אישית, או כל דבר שהלקוח מבקש.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Braces className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Custom Fields & Data</h3>
                    <p className="text-gray-500 leading-relaxed">
                      הוסיפו שדות מידע לכל ישות במערכת. צריכים לשמור "תאריך יום הולדת" ללקוח או "חומר גלם" למוצר? קלי קלות.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Layout className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Layout Engine</h3>
                    <p className="text-gray-500 leading-relaxed">
                      שליטה מלאה ב-Grid ובמבנה העמוד. לא עוד תבניות קשיחות שאי אפשר להזיז בהן פיקסל.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Workflow className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">אוטומציות ו-Webhooks</h3>
                    <p className="text-gray-500 leading-relaxed">
                      חברו את החנות לכל מערכת חיצונית (CRM, ERP, Mailing) באמצעות Webhooks חכמים שמופעלים בכל אירוע.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual representation of Blocks/Components */}
            <div className="order-1 lg:order-2 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-purple-100 to-blue-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
               
               <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-8">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                     <Layout className="w-5 h-5 mr-2" />
                     Header Component
                   </div>
                   <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
                     <div className="text-emerald-700 font-bold text-sm">Custom Banner</div>
                     <div className="text-emerald-500 text-xs mt-1">React Code</div>
                   </div>
                   <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                     <div className="text-blue-700 font-bold text-sm">Product Grid</div>
                     <div className="text-blue-500 text-xs mt-1">Dynamic Data</div>
                   </div>
                   <div className="col-span-2 bg-gray-800 text-white rounded-xl p-4 font-mono text-xs">
                     <div className="text-gray-400">// Custom logic injection</div>
                     <div>if (user.isVIP) {'{'}</div>
                     <div className="ml-4">applyDiscount(0.2);</div>
                     <div>{'}'}</div>
                   </div>
                   <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                     <Layout className="w-5 h-5 mr-2" />
                     Footer Component
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
            <h2 className="text-4xl font-bold mb-6 text-gray-900">למה מפתחים עוברים אלינו?</h2>
            <p className="text-xl text-gray-500">
              ההבדל בין "לתחזק חנות" לבין "לפתח חוויית משתמש".
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="hidden md:grid grid-cols-3 bg-gray-50/50 border-b border-gray-100">
              <div className="p-6 font-semibold text-gray-500">תכונה</div>
              <div className="p-6 text-center font-bold text-emerald-600 bg-emerald-50/30">קוויק שופ</div>
              <div className="p-6 text-center font-semibold text-gray-500">פלטפורמות אחרות</div>
            </div>
            
            {comparisons.map((item, i) => (
              <div key={i} className="grid md:grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="p-6 flex flex-col justify-center">
                  <span className="font-bold text-gray-900">{item.feature}</span>
                  <span className="text-sm text-gray-500 mt-1">{item.description}</span>
                </div>
                <div className="p-6 flex items-center justify-center bg-emerald-50/10 flex-col">
                  <span className="font-bold text-gray-900">{item.quickshop === true ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : item.quickshop}</span>
                </div>
                <div className="p-6 flex items-center justify-center flex-col">
                   <span className="font-medium text-gray-500">{typeof item.shopify === 'boolean' && item.shopify ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : item.shopify}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="api" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 mb-4">API & Integrations</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">התממשקות לכל דבר</h2>
            <p className="text-xl text-gray-500">
              אל תגבילו את עצמכם. חברו את החנות לכל מערכת בעולם.
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
                  Documentation Available
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
              <h2 className="text-3xl font-bold mb-6">תשתית ענן מנוהלת</h2>
              <p className="text-gray-400 text-lg mb-8">
                תשכחו מניהול שרתים, גיבויים, SSL או עדכוני אבטחה. אנחנו מטפלים בהכל בסטנדרט הגבוה ביותר.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Server className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Serverless Architecture</h3>
                    <p className="text-gray-400 text-sm">סקיילינג אוטומטי בזמן עומס, אפס נפילות.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Global CDN</h3>
                    <p className="text-gray-400 text-sm">תוכן מוגש מהשרת הקרוב ביותר לגולש לביצועים מקסימליים.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Code className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Automatic CI/CD</h3>
                    <p className="text-gray-400 text-sm">כל שינוי קוד נבדק ועולה לאוויר בצורה חלקה.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700">
              <h3 className="font-bold text-xl mb-6">שקט נפשי למפתח</h3>
              <div className="space-y-4">
                {[
                  "אין צורך לתחזק Plugin-ים של WordPress",
                  "אין חשש מפריצות אבטחה לשרת",
                  "גיבויים אוטומטיים לכל הנתונים",
                  "ניטור שגיאות בזמן אמת"
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

      {/* Pricing Section (Same model as Marketers) */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-white text-emerald-600 border-emerald-200 mb-6 shadow-sm">כמה הלקוח משלם?</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            399₪ <span className="text-xl text-gray-500 font-normal">לחודש</span>
            <span className="mx-4 text-gray-300 font-light">+</span>
            0.5% <span className="text-xl text-gray-500 font-normal">עמלה</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            המודל שלנו שקוף והוגן. מחיר קבוע ותחרותי ללקוח, ואתם מתמקדים בלבנות מוצר מדהים.
          </p>
          
          <div className="mt-12 bg-white rounded-xl p-6 border border-emerald-100 inline-flex items-center gap-3 text-emerald-800 shadow-sm">
            <Zap className="w-5 h-5 text-yellow-500" />
            <strong>טיפ למפתחים:</strong> אתם יכולים לגבות מהלקוח ריטיינר חודשי על שירות ותחזוקה בנוסף לעלויות שלנו!
          </div>
        </div>
      </section>

      {/* Commissions Section (Same model) */}
      <section id="commissions" className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-white text-emerald-600 border-emerald-200 mb-4 shadow-sm">מודל השותפים</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">בנו נכס מניב</h2>
            <p className="text-xl text-gray-500">
              כבוני אתרים, אתם לא רק מקבלים תשלום חד פעמי על הקמה.
              <br />
              עם קוויק שופ אתם בונים הכנסה פסיבית חודשית שגדלה עם כמות הלקוחות שלכם.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier 1 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-200"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Freelancer</h3>
              <div className="text-sm text-gray-500 mb-6">עד 10 חנויות</div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">₪25</div>
              <div className="text-sm text-gray-400 mb-6">לכל לקוח משלם / חודש</div>
              
              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-100">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">גישה לתיעוד API מלא</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">חנות Sandbox לפיתוח</span>
                </li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Studio</h3>
              <div className="text-sm text-gray-500 mb-6">10+ חנויות</div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">₪45</div>
              <div className="text-sm text-gray-400 mb-6">לכל לקוח משלם / חודש</div>

              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-100">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600 font-medium">תמיכה טכנית מועדפת</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">הופעה ב-Marketplace המפתחים</span>
                </li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-300 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden transform md:-translate-y-2 flex flex-col">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">פופולרי</div>
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Agency</h3>
              <div className="text-sm text-gray-500 mb-6">30+ חנויות</div>
              <div className="text-4xl font-bold text-emerald-600 mb-2">₪85</div>
              <div className="text-sm text-gray-400 mb-6">לכל לקוח משלם / חודש</div>

              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-100">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-800 font-bold">ערוץ Slack עם ה-CTO</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-gray-600">הפניית לקוחות אנטרפרייז</span>
                </li>
              </ul>
            </div>

            {/* Tier 4 */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden text-white flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-white">Enterprise Partner</h3>
                <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="text-sm text-gray-400 mb-6">100+ חנויות</div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">₪85</div>
              <div className="text-sm text-gray-400 mb-4">לכל לקוח משלם</div>
              <div className="border-t border-gray-700 pt-4 mt-0 mb-6">
                <div className="text-2xl font-bold text-yellow-400 mb-1">Revenue Share</div>
                <div className="text-xs text-gray-400">אחוזים מהמחזור (Custom Deal)</div>
              </div>

              <ul className="mt-auto space-y-3 text-sm pt-6 border-t border-gray-800">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">השפעה על ה-Roadmap</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">Whitelabel מלא</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">שאלות של מפתחים</h2>
          <div className="space-y-4">
            {[
              {
                q: "האם אני יכול לכתוב קוד צד שרת (Backend)?",
                a: "קוויק שופ בנויה כ-Headless commerce. אתם מקבלים שליטה מלאה על ה-Frontend (Next.js), ויכולים להשתמש ב-API שלנו מכל שרת Backend חיצוני או דרך Serverless Functions."
              },
              {
                q: "האם יש תמיכה בסביבת Staging?",
                a: "כן! כל חנות יכולה להיות משוכפלת לסביבת Staging בלחיצת כפתור, כך שתוכלו לבדוק שינויים לפני שאתם מעלים אותם לפרודקשן."
              },
              {
                q: "איך עובד ה-Deploy?",
                a: "אנחנו מחוברים ל-Github. כל Push ל-Branch הראשי מפעיל תהליך Build ו-Deploy אוטומטי (CI/CD) לתשתית ה-Edge שלנו."
              },
              {
                q: "האם אפשר לייצא את הדאטה?",
                a: "בוודאי. הדאטה הוא של הלקוח. יש API מלא לייצוא מוצרים, הזמנות ולקוחות בפורמט JSON או CSV."
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
            קוד זה החיים? בואו לבנות איתנו
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            הצטרפו לקהילת המפתחים של קוויק שופ ותיהנו מחוויית פיתוח מתקדמת, תמיכה טכנית אמיתית ומודל רווח הוגן.
          </p>
          <div className="flex justify-center gap-4">
             <Link href="/register">
               <Button variant="outline" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 py-6 h-auto text-xl font-bold shadow-xl shadow-emerald-100 border-0">
                 פתחו חשבון מפתח (Sandbox)
               </Button>
             </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
