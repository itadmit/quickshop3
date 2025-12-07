'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useNavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // When route changes, stop loading
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const startNavigation = () => {
    setIsNavigating(true);
  };

  return { isNavigating, startNavigation };
}

