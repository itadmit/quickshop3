'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-gray-200 bg-white mt-auto">
      <div className="md:mr-64 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600" dir="rtl">
          <div className="flex items-center gap-1">
            <span>נבנה עם</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>על ידי</span>
            <span className="font-semibold text-gray-900">
              Quick Shop
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span>© 2026 כל הזכויות שמורות • גרסה 3.0.1</span>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
              תנאי שימוש
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
              מדיניות פרטיות
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              צור קשר
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

