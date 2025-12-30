'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

interface TextSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

/**
 * TextSkeleton - סקלטון לטקסטים
 * משמש להצגת סקלטון במקום מפתחות תרגום בזמן טעינה
 * ✅ משתמש ב-span במקום div כדי למנוע שגיאת hydration כשיש בתוך <p>
 */
export function TextSkeleton({ 
  width = 'w-24', 
  height = 'h-4',
  className = '' 
}: TextSkeletonProps) {
  return (
    <span
      className={`inline-block animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
    />
  );
}

