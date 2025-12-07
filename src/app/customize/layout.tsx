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
    <div 
      className="fixed inset-0 bg-gray-50 overflow-hidden" 
      dir="rtl" 
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
    >
      {children}
    </div>
  );
}

