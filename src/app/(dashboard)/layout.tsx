import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { NavigationProgress } from '@/components/ui/NavigationProgress';
import { PrintStyles } from '@/components/layout/PrintStyles';

// Prevent prerendering to avoid clientReferenceManifest error
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PrintStyles />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <NavigationProgress />
        <Header />
        <Sidebar />
        <main className="md:mr-64 mt-16 flex-1">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

