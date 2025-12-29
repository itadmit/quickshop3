/**
 * Loading State for Product Page
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
      
      {/* Product Content Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Product Info */}
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-12 flex-1 bg-gray-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="h-48 bg-gray-100 animate-pulse" />
    </div>
  );
}

