'use client';

import React from 'react';
import Link from 'next/link';
import { HiCode, HiPencil, HiExternalLink, HiCheck, HiDotsVertical } from 'react-icons/hi';

// Theme data - in future this could come from API
const currentTheme = {
  id: 'new-york',
  name: 'New York',
  version: '1.0.0',
  author: 'QuickShop',
  isActive: true,
  previewImage: '/images/library/New_york_desktop_image.jpg',
  lastUpdated: new Date().toLocaleDateString('he-IL'),
};

export default function ThemesPage() {
  return (
    <div className="p-6 space-y-8" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">עיצוב ותבניות</h1>
          <p className="text-gray-500 mt-1">התאם אישית את העיצוב והמראה של החנות שלך</p>
        </div>
      </div>

      {/* Current Theme Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">התבנית הנוכחית</h2>
                <p className="text-sm text-gray-500">התבנית הפעילה בחנות שלך</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                <HiCheck className="w-4 h-4" />
                פעיל
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Theme Preview - Browser Mockup */}
            <div className="flex-1 max-w-2xl">
              <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                {/* Browser Chrome */}
                <div className="bg-gray-200 px-4 py-3 flex items-center gap-3 border-b border-gray-300">
                  {/* Traffic Lights */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  {/* URL Bar */}
                  <div className="flex-1 bg-white rounded-md px-4 py-1.5 text-sm text-gray-500 font-mono text-center">
                    mystore.quickshop.co.il
                  </div>
                  {/* Empty space for balance */}
                  <div className="w-16"></div>
                </div>
                
                {/* Preview Image */}
                <div className="relative aspect-[16/10] bg-gray-300">
                  {currentTheme.previewImage ? (
                    <img 
                      src={currentTheme.previewImage} 
                      alt={currentTheme.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>תצוגה מקדימה</span>
                    </div>
                  )}
                  
                  {/* Overlay gradient for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Theme name overlay */}
                  <div className="absolute bottom-4 right-4 left-4">
                    <h3 className="text-2xl font-bold text-white">{currentTheme.name}</h3>
                    <p className="text-white/80 text-sm">גרסה {currentTheme.version}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Info & Actions */}
            <div className="lg:w-80 flex flex-col gap-6">
              {/* Theme Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">שם התבנית</label>
                  <p className="text-lg font-semibold text-gray-900">{currentTheme.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">יוצר</label>
                  <p className="text-gray-900">{currentTheme.author}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">גרסה</label>
                  <p className="text-gray-900">{currentTheme.version}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">עדכון אחרון</label>
                  <p className="text-gray-900">{currentTheme.lastUpdated}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {/* Primary: Customize Button */}
                <Link
                  href="/customize"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                >
                  <HiPencil className="w-5 h-5" />
                  התאמה אישית
                </Link>

                {/* Secondary: Edit Code Button */}
                <Link
                  href="/themes/code"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  <HiCode className="w-5 h-5" />
                  עריכת קוד
                </Link>

                {/* View Store */}
                <a
                  href="/shops/my-store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  <HiExternalLink className="w-5 h-5" />
                  צפייה בחנות
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Library Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">ספריית תבניות</h2>
          <p className="text-sm text-gray-500 mt-1">תבניות נוספות יהיו זמינות בקרוב</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Current Theme (Active) */}
            <div className="relative group rounded-xl border-2 border-emerald-500 overflow-hidden bg-white shadow-sm">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {currentTheme.previewImage ? (
                  <img 
                    src={currentTheme.previewImage} 
                    alt={currentTheme.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                    <span>תצוגה מקדימה</span>
                  </div>
                )}
                {/* Active Badge */}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full shadow-sm">
                    <HiCheck className="w-3.5 h-3.5" />
                    פעיל
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{currentTheme.name}</h3>
                <p className="text-sm text-gray-500">מאת {currentTheme.author}</p>
              </div>
            </div>

            {/* Coming Soon Placeholders */}
            {['Tokyo', 'Paris', 'London'].map((name) => (
              <div key={name} className="relative group rounded-xl border border-gray-200 overflow-hidden bg-white opacity-60">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-400">{name[0]}</span>
                    </div>
                    <span className="text-sm text-gray-400">בקרוב</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-400">{name}</h3>
                  <p className="text-sm text-gray-400">בקרוב...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 טיפים מהירים</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>השתמש ב<strong>התאמה אישית</strong> כדי לשנות צבעים, פונטים ופריסה בקלות</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span><strong>עריכת קוד</strong> מאפשרת שליטה מלאה על CSS וקוד מותאם אישית</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>כל השינויים נשמרים אוטומטית וניתן לבטל אותם בכל עת</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

