/**
 * Loading State for Store Home Page
 * ✅ רק תוכן - הדר ופוטר כבר ב-SharedStoreLayout!
 */

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Skeleton */}
      <div className="h-[400px] bg-gray-200 rounded-lg animate-pulse mb-8" />
      
      {/* Featured Products Section Skeleton */}
      <div className="mb-12">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Collections Section Skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
