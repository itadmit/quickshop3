import { ReactNode } from 'react';

/**
 * Layout מיוחד לצ'ק אאוט - ללא ההדר והפוטר הרגילים
 * כדי למנוע הסחות דעת בתהליך הקנייה
 * 
 * Layout זה מבטל את ה-layout של הסטורפרונט ומציג רק את התוכן
 */
export default function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen" dir="rtl">
      {/* בצ'ק אאוט - לא נציג הדר ופוטר, רק את התוכן */}
      {children}
    </div>
  );
}

