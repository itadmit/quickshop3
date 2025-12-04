import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

// Prevent prerendering to avoid clientReferenceManifest error
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="md:mr-64 mt-16">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

