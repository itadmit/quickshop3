/**
 * Loading State for Product Page
 * ✅ רק תוכן - הדר ופוטר כבר ב-SharedStoreLayout!
 */

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Product Info Skeleton */}
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
    </div>
  );
}
