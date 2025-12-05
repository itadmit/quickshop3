import { ReactNode } from 'react';

export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Layout זה משמש רק כ-wrapper - ההדר והפוטר מופיעים ב-StoreSlugLayout
  return <>{children}</>;
}

