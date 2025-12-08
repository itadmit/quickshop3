'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

interface FooterProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

export function Footer({ section, onUpdate }: FooterProps) {
  const settings = section.settings || {};

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {settings.columns?.map((column: any, index: number) => (
            <div key={index}>
              <h3 className="text-white font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      className="hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>{settings.copyright || `© ${new Date().getFullYear()} כל הזכויות שמורות`}</p>
          
          {/* Social Links */}
          {settings.social_links && settings.social_links.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              {settings.social_links.map((social: any, index: number) => (
                <a
                  key={index}
                  href={social.url}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.platform === 'facebook' && <FaFacebook className="w-5 h-5" />}
                  {social.platform === 'instagram' && <FaInstagram className="w-5 h-5" />}
                  {social.platform === 'twitter' && <FaTwitter className="w-5 h-5" />}
                  {!['facebook', 'instagram', 'twitter'].includes(social.platform) && '🔗'}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
