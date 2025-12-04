import Link from "next/link"

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1">
            <h3 className="font-bold text-xl text-gray-900 mb-4">קוויק שופ</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              הפלטפורמה הישראלית לבניית חנויות אונליין. פשוט, חכם, ובעברית.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">מוצר</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-emerald-600 transition-colors">דף הבית</Link></li>
              <li><Link href="/#pricing" className="hover:text-emerald-600 transition-colors">מחירים</Link></li>
              <li><Link href="/quickshop-payments" className="hover:text-emerald-600 transition-colors font-bold text-emerald-600">Quick Shop Payments</Link></li>
              <li><Link href="/#features" className="hover:text-emerald-600 transition-colors">פיצ'רים</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">שותפים</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="/for-marketers" className="hover:text-emerald-600 transition-colors">למשווקים</Link></li>
              <li><Link href="/for-developers" className="hover:text-emerald-600 transition-colors">למפתחים</Link></li>
              <li><Link href="/login" className="hover:text-emerald-600 transition-colors">התחברות שותפים</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">תמיכה</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <a href="mailto:info@quick-shop.co.il" className="hover:text-emerald-600 transition-colors">
                  info@quick-shop.co.il
                </a>
              </li>
              <li>
                <a href="tel:+972552554432" className="hover:text-emerald-600 transition-colors" dir="ltr">
                  +972-55-255-4432
                </a>
              </li>
              <li>וואטסאפ זמין 09:00-18:00</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} קוויק שופ. כל הזכויות שמורות.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-600">פרטיות</Link>
            <Link href="/terms" className="hover:text-gray-600">תנאי שימוש</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}


