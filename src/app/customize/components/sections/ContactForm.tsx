'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface ContactFormProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function ContactForm({ section, onUpdate }: ContactFormProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  const textColor = style.typography?.color;
  const buttonBg = style.button?.background_color || '#111827';
  const buttonText = style.button?.text_color || '#FFFFFF';

  return (
    <div className="py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
            {settings.title || 'צור קשר'}
          </h2>
          <p className="text-lg opacity-80" style={{ color: textColor }}>
            {settings.subtitle || 'השאירו פרטים ונחזור אליכם בהקדם'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: textColor }}>שם מלא</label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="ישראל ישראלי"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: textColor }}>אימייל</label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                placeholder="example@email.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1" style={{ color: textColor }}>נושא</label>
            <input
              type="text"
              id="subject"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              placeholder="בנושא מה הפנייה?"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1" style={{ color: textColor }}>הודעה</label>
            <textarea
              id="message"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none bg-white"
              placeholder="כתוב כאן את הודעתך..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-gray-200"
            style={{ backgroundColor: buttonBg, color: buttonText }}
          >
            {settings.submit_text || 'שלח הודעה'}
          </button>
        </form>
      </div>
    </div>
  );
}
