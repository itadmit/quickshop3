'use client';

import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-t-4 border-x-transparent border-x-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-b-4 border-x-transparent border-x-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-l-4 border-y-transparent border-y-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-r-4 border-y-transparent border-y-4',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div
        className={`absolute z-50 ${positionClasses[position]} pointer-events-none transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
          {content}
          <div
            className={`absolute ${arrowClasses[position]}`}
          />
        </div>
      </div>
    </div>
  );
}

