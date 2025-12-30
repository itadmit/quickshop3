/**
 * Loading State for Products Listing
 * ✅ רק תוכן - הדר ופוטר כבר ב-SharedStoreLayout!
 */

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Skeleton */}
      <div className="h-10 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
      
      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
