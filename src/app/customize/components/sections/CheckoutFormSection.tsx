'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { 
  CreditCard, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Home, 
  FileText,
  Plus,
  GripVertical,
  Trash2,
  Truck,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface CheckoutFormSectionProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
}

// תצוגה מקדימה של טופס הצ'ק אאוט בקסטומייזר - תואם לעיצוב הפרונט
export function CheckoutFormSection({ section, onUpdate }: CheckoutFormSectionProps) {
  const settings = section.settings || {};
  const layout = settings.layout || {};
  const button = settings.button || {};
  const fieldsOrder = settings.fields_order || [
    'email',
    'first_name',
    'last_name',
    'phone',
    'city',
    'street',
    'apartment',
    'notes'
  ];
  const customFields = settings.custom_fields || [];

  const fieldLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    email: { label: 'אימייל', icon: <Mail className="w-5 h-5" /> },
    first_name: { label: 'שם פרטי', icon: <User className="w-5 h-5" /> },
    last_name: { label: 'שם משפחה', icon: <User className="w-5 h-5" /> },
    phone: { label: 'טלפון', icon: <Phone className="w-5 h-5" /> },
    city: { label: 'עיר', icon: <MapPin className="w-5 h-5" /> },
    street: { label: 'רחוב ומספר', icon: <Home className="w-5 h-5" /> },
    apartment: { label: 'דירה / קומה', icon: <Home className="w-5 h-5" /> },
    notes: { label: 'הערות להזמנה', icon: <FileText className="w-5 h-5" /> }
  };

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Grid Layout - matches actual checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        
        {/* CheckoutHeader - spans full width */}
        <div 
          className="lg:col-span-3 flex justify-end border-b border-gray-200"
          style={{ backgroundColor: layout.right_column_color || '#ffffff' }}
        >
          <div className="w-full max-w-3xl pl-8 pr-4 py-4 flex items-center">
            <div className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              <ArrowRight className="w-4 h-4" />
              <span>חזרה לחנות</span>
            </div>
          </div>
        </div>
        <div 
          className="lg:col-span-2 border-b border-gray-200 flex justify-start"
          style={{ backgroundColor: layout.left_column_color || '#fafafa' }}
        >
          <div className="w-full max-w-md px-8 py-4 flex items-center justify-end gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs text-gray-500">
              לוגו
            </div>
            <h1 className="text-xl font-bold uppercase">שם החנות</h1>
          </div>
        </div>

        {/* Main Form - Left Side - 60% */}
        <div 
          className="lg:col-span-3 min-h-screen flex justify-end"
          style={{ backgroundColor: layout.right_column_color || '#ffffff' }}
        >
          <div className="w-full max-w-3xl pl-8 pr-4 py-8 space-y-6">
            {/* Page Title */}
            <h1 className="text-2xl font-semibold mb-8">צ'ק אאוט</h1>

            {/* Contact Information */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                פרטי איש קשר
              </h2>
              <div className="space-y-4">
                {/* Email field */}
                <div className="relative group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">אימייל *</label>
                    <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  </div>
                  <input 
                    type="text"
                    disabled
                    placeholder="כתובת האימייל שלך"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                  />
                </div>
                
                {/* Phone field */}
                <div className="relative group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">טלפון *</label>
                    <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  </div>
                  <input 
                    type="text"
                    disabled
                    placeholder="05X-XXXXXXX"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                  />
                </div>

                {/* Name fields - side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">שם פרטי *</label>
                      <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    </div>
                    <input 
                      type="text"
                      disabled
                      placeholder="שם פרטי"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                    />
                  </div>
                  <div className="relative group">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">שם משפחה *</label>
                      <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    </div>
                    <input 
                      type="text"
                      disabled
                      placeholder="שם משפחה"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                שיטת משלוח
              </h2>
              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-5 h-5 border-2 border-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-900">משלוח</span>
                    <span className="text-sm text-gray-500 block">משלוח חינם</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                כתובת משלוח
              </h2>
              <div className="space-y-4">
                {/* City and Street side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">עיר *</label>
                      <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    </div>
                    <input 
                      type="text"
                      disabled
                      placeholder="התחל להקליד עיר..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                    />
                  </div>
                  <div className="relative group">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">רחוב *</label>
                      <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                    </div>
                    <input 
                      type="text"
                      disabled
                      placeholder="בחר עיר תחילה..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields Preview */}
            {customFields.length > 0 && (
              <div className="pb-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  פרטים נוספים
                </h2>
                <div className="space-y-4">
                  {customFields.map((customField: any, index: number) => (
                    <div 
                      key={customField.id || index} 
                      className="relative group border-2 border-dashed border-blue-200 rounded-lg p-3 bg-blue-50/50"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-500" />
                          <label className="text-sm font-medium text-blue-700">
                            {customField.label || 'שדה מותאם'}
                          </label>
                          <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
                            {customField.type === 'text' && 'טקסט'}
                            {customField.type === 'select' && 'בחירה'}
                            {customField.type === 'date' && 'תאריך'}
                            {customField.type === 'textarea' && 'טקסט ארוך'}
                          </span>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input 
                        type="text"
                        disabled
                        placeholder={customField.placeholder || customField.label}
                        className="w-full px-4 py-3 border border-blue-200 rounded-lg bg-white text-gray-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                אמצעי תשלום
              </h2>
              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-5 h-5 border-2 border-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900">כרטיס אשראי</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - Right Side - 40% */}
        <div 
          className="lg:col-span-2 min-h-screen flex justify-start"
          style={{ backgroundColor: layout.left_column_color || '#fafafa' }}
        >
          <div className="w-full max-w-md px-8 py-8">
            <div 
              className="p-6 sticky top-24"
              style={{ backgroundColor: layout.left_column_color || '#fafafa' }}
            >
              <h2 className="text-lg font-semibold mb-6">סיכום הזמנה</h2>
              
              {/* Sample Product */}
              <div className="flex gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">תמונה</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">מוצר לדוגמה</div>
                  <div className="text-sm text-gray-500">מידה: 45</div>
                </div>
                <div className="text-sm font-medium text-gray-900">₪299.90</div>
              </div>

              {/* Coupon Input */}
              <div className="flex gap-2 mb-6">
                <input 
                  type="text"
                  disabled
                  placeholder="קוד קופון או הנחה"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-400 text-sm"
                />
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-500">
                  החל
                </button>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>סכום ביניים</span>
                  <span>₪299.90</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>הנחה 10% על כל המוצרים</span>
                  <span>-₪29.99</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>משלוח</span>
                  <span>חינם</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                  <span>סה"כ</span>
                  <span>₪269.91</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled
                className="w-full mt-6 py-4 text-lg font-semibold transition-colors"
                style={{
                  backgroundColor: button.background_color || '#000000',
                  color: button.text_color || '#ffffff',
                  borderRadius: `${button.border_radius || 8}px`
                }}
              >
                {button.text || 'לתשלום'} ₪269.91
              </button>

              {/* Secure payment */}
              <div className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                <span className="w-3 h-3">🔒</span>
                תשלום מאובטח
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Footer */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-sm text-gray-500">
          <span className="hover:underline cursor-pointer">תקנון</span>
          <span className="text-gray-300">|</span>
          <span className="hover:underline cursor-pointer">מדיניות פרטיות</span>
          <span className="text-gray-300">|</span>
          <span className="hover:underline cursor-pointer">החזרות והחלפות</span>
          <span className="text-gray-300">|</span>
          <span className="hover:underline cursor-pointer">הצהרת נגישות</span>
        </div>
      </div>
    </div>
  );
}
