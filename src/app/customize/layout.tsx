/**
 * Customizer Layout - Full Screen Layout
 * ללא Header/Sidebar של הדשבורד
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function CustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden" dir="rtl" style={{ zIndex: 9999 }}>
      {children}
    </div>
  );
}

