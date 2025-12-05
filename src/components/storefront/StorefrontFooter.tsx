'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';

export function StorefrontFooter() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  const { t, loading: translationsLoading } = useTranslation('storefront');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {translationsLoading ? (
                <TextSkeleton width="w-16" height="h-5" className="bg-gray-700" />
              ) : (
                t('footer.about')
              )}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/shops/${storeSlug}/about`} className="hover:text-white transition-colors">
                  {translationsLoading ? (
                    <TextSkeleton width="w-16" height="h-4" className="bg-gray-700" />
                  ) : (
                    t('footer.about')
                  )}
                </Link>
              </li>
              <li>
                <Link href={`/shops/${storeSlug}/contact`} className="hover:text-white transition-colors">
                  {translationsLoading ? (
                    <TextSkeleton width="w-16" height="h-4" className="bg-gray-700" />
                  ) : (
                    t('footer.contact')
                  )}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">שירות לקוחות</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/shops/${storeSlug}/shipping`} className="hover:text-white transition-colors">
                  משלוחים והחזרות
                </Link>
              </li>
              <li>
                <Link href={`/shops/${storeSlug}/faq`} className="hover:text-white transition-colors">
                  שאלות נפוצות
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">משפטי</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/shops/${storeSlug}/privacy`} className="hover:text-white transition-colors">
                  {translationsLoading ? (
                    <TextSkeleton width="w-20" height="h-4" className="bg-gray-700" />
                  ) : (
                    t('footer.privacy')
                  )}
                </Link>
              </li>
              <li>
                <Link href={`/shops/${storeSlug}/terms`} className="hover:text-white transition-colors">
                  {translationsLoading ? (
                    <TextSkeleton width="w-16" height="h-4" className="bg-gray-700" />
                  ) : (
                    t('footer.terms')
                  )}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {translationsLoading ? (
                <TextSkeleton width="w-24" height="h-5" className="bg-gray-700" />
              ) : (
                t('footer.newsletter')
              )}
            </h3>
            <p className="text-sm mb-4">הירשמו לניוזלטר לקבלת עדכונים וקופונים</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="האימייל שלכם"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                {translationsLoading ? (
                  <TextSkeleton width="w-16" height="h-4" className="bg-green-400" />
                ) : (
                  t('footer.subscribe')
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© {currentYear} כל הזכויות שמורות</p>
        </div>
      </div>
    </footer>
  );
}
