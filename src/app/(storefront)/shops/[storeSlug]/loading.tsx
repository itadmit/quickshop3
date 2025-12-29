/**
 * Loading State for Store Pages
 * מוצג מיידית כאשר עוברים בין דפים
 */

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header Skeleton */}
      <header className="h-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
      
      {/* Content Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-4/5 animate-pulse" />
        </div>
      </main>
      
      {/* Footer Skeleton */}
      <footer className="h-48 bg-gray-100 animate-pulse" />
    </div>
  );
}

