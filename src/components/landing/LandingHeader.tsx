import Link from "next/link"
import { Button } from "@/components/ui/Button"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex flex-col overflow-visible">
            <h1 className="text-2xl font-pacifico text-gray-900 whitespace-nowrap overflow-visible" style={{ letterSpacing: '2px', lineHeight: '1.5' }}>
              Quick Shop
            </h1>
            <p className="text-xs text-gray-500 whitespace-nowrap">מערכת ניהול חנויות אונליין</p>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">פיצ'רים</Link>
            <Link href="/#comparison" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">למה אנחנו?</Link>
            <Link href="/#pricing" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">מחירים</Link>
            <Link href="/for-marketers" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">למשווקים</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium hidden sm:block">
              התחברות
            </Link>
            <Link href="/register">
              <Button variant="outline" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 font-bold shadow-lg shadow-emerald-100 transition-all hover:shadow-emerald-200 border-0">
                נסו בחינם
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}



