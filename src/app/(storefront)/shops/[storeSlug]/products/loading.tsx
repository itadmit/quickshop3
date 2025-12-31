/**
 * Loading State for Products Listing
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
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
      
      {/* Products Grid Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="h-10 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
      
      <footer className="h-48 bg-gray-100 animate-pulse" />
    </div>
  );
}

