'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { sectionPropsAreEqual } from '../sectionMemoUtils';

interface SpacerProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

function SpacerComponent({ section, onUpdate, editorDevice }: SpacerProps) {
  const settings = section.settings || {};
  const height = settings.height || '20px';

  return (
    <div className="w-full" style={{ height: height }}>
      {/* Visual indicator in editor */}
      {editorDevice && (
        <div className="h-full w-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
          רווח: {height}
        </div>
      )}
    </div>
  );
}

export const Spacer = React.memo(SpacerComponent, sectionPropsAreEqual);

