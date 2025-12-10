'use client';

import { useState } from 'react';
import { X, Phone, Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeInfo?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
    hours?: string;
  };
}

export function ContactDialog({ isOpen, onClose, storeInfo }: ContactDialogProps) {
  if (!isOpen) return null;

  const whatsappNumber = storeInfo?.whatsapp?.replace(/[^0-9]/g, '');
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">צור קשר</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* Description */}
          <p className="text-gray-600">
            נשמח לעמוד לשירותכם! ניתן ליצור איתנו קשר בכל אחד מהאמצעים הבאים:
          </p>

          {/* Contact Options */}
          <div className="space-y-4">
            {/* Phone */}
            {storeInfo?.phone && (
              <a
                href={`tel:${storeInfo.phone}`}
                className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">טלפון</h3>
                  <p className="text-gray-600" dir="ltr">{storeInfo.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">לחץ להתקשרות</p>
                </div>
              </a>
            )}

            {/* WhatsApp */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">וואטסאפ</h3>
                  <p className="text-gray-600" dir="ltr">{storeInfo.whatsapp}</p>
                  <p className="text-sm text-gray-500 mt-1">שלח הודעה בוואטסאפ</p>
                </div>
              </a>
            )}

            {/* Email */}
            {storeInfo?.email && (
              <a
                href={`mailto:${storeInfo.email}`}
                className="flex items-start gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">אימייל</h3>
                  <p className="text-gray-600 break-all">{storeInfo.email}</p>
                  <p className="text-sm text-gray-500 mt-1">שלח מייל</p>
                </div>
              </a>
            )}

            {/* Address */}
            {storeInfo?.address && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">כתובת</h3>
                  <p className="text-gray-600">{storeInfo.address}</p>
                </div>
              </div>
            )}

            {/* Hours */}
            {storeInfo?.hours && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">שעות פעילות</h3>
                  <p className="text-gray-600 whitespace-pre-line">{storeInfo.hours}</p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>זמני תגובה:</strong> אנו עונים לכל פניה תוך 24 שעות בימי עסקים.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

