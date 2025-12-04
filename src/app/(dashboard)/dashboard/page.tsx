// Server component - prevents clientReferenceManifest error in Vercel
// This is a known issue with Next.js 15.5.7 and route groups with client components
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function DashboardPage() {
  return <DashboardContent />;
}

