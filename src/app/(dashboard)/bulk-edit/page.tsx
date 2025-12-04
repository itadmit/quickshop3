'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPencil } from 'react-icons/hi';

export default function BulkEditPage() {
  const [selectedAction, setSelectedAction] = useState<string>('');

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">עריכה קבוצתית</h1>
        <p className="text-gray-500 mt-1">ערוך מספר מוצרים בו-זמנית</p>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">בחר פעולה</h2>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedAction('price')}
              className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${
                selectedAction === 'price'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">עדכון מחירים</div>
              <div className="text-sm text-gray-500 mt-1">עדכן מחירים למוצרים נבחרים</div>
            </button>

            <button
              onClick={() => setSelectedAction('status')}
              className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${
                selectedAction === 'status'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">שינוי סטטוס</div>
              <div className="text-sm text-gray-500 mt-1">שנה סטטוס למוצרים נבחרים</div>
            </button>

            <button
              onClick={() => setSelectedAction('tags')}
              className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${
                selectedAction === 'tags'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">הוספת תגיות</div>
              <div className="text-sm text-gray-500 mt-1">הוסף תגיות למוצרים נבחרים</div>
            </button>

            <button
              onClick={() => setSelectedAction('collections')}
              className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${
                selectedAction === 'collections'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">הוספה לאוספים</div>
              <div className="text-sm text-gray-500 mt-1">הוסף מוצרים לאוספים</div>
            </button>
          </div>

          {selectedAction && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-center">
                בחר מוצרים מדף המוצרים ואז חזור לכאן לביצוע הפעולה
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

