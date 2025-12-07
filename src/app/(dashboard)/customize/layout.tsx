/**
 * Customizer Layout - Full Screen Layout
 * ללא Header/Sidebar של הדשבורד
 */

export default function CustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden" dir="rtl">
      {children}
    </div>
  );
}

