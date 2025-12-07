'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When route changes, complete loading
    setIsNavigating(false);
    setProgress(100);
    
    const timer = setTimeout(() => {
      setProgress(0);
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Simulate progress - fast at start, slow near end
  useEffect(() => {
    if (isNavigating && progress < 90) {
      const increment = progress < 30 ? 20 : progress < 60 ? 10 : 5;
      const delay = progress < 30 ? 100 : progress < 60 ? 300 : 500;
      
      const timer = setTimeout(() => {
        setProgress(prev => Math.min(prev + increment, 90));
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, progress]);

  // Intercept all link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.target && link.href.startsWith(window.location.origin)) {
        setIsNavigating(true);
        setProgress(10);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (progress === 0) return null;

  return (
    <>
      {/* Thin Progress Bar - Like Shopify */}
      <div 
        className="fixed top-0 left-0 z-[9999] h-[3px] bg-emerald-500 transition-all duration-200 ease-out shadow-sm"
        style={{ 
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1 
        }}
      />
    </>
  );
}

