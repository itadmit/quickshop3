import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'קסטומייזר - עיצוב החנות',
  description: 'כלי עיצוב ויזואלי לחנות המקוונת',
};

export default function CustomizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
