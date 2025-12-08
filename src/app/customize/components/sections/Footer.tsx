'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';

interface FooterProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Footer({ section, onUpdate }: FooterProps) {
  const settings = section.settings || {};

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {settings.columns?.map((column: any, index: number) => (
            <div key={index}>
              <h3 className="font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex items-center justify-between">
          <p className="text-gray-400">
            {settings.copyright || '© 2024 כל הזכויות שמורות'}
          </p>

          {/* Social Links */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {settings.social_links?.map((social: any, index: number) => (
              <a
                key={index}
                href={social.url}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {social.platform === 'facebook' ? '📘' :
                 social.platform === 'instagram' ? '📷' :
                 social.platform === 'twitter' ? '🐦' : '🔗'}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
