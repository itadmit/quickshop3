'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface RichTextProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function RichText({ section, onUpdate }: RichTextProps) {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">טקסט עשיר</h2>
          <p className="text-gray-600 mb-6">
            כאן ניתן להוסיף טקסט עשיר עם עיצוב, קישורים, רשימות וכו'.
          </p>
        </div>
      </div>
    </div>
  );
}
