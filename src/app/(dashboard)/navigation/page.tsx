'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPlus, HiPencil, HiTrash, HiMenu } from 'react-icons/hi';
import { NavigationMenu } from '@/types/content';

export default function NavigationPage() {
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/navigation');
      if (!response.ok) throw new Error('Failed to load navigation menus');
      const data = await response.json();
      setMenus(data.navigation_menus || []);
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">תפריטי ניווט</h1>
        <Button className="flex items-center gap-2">
          הוסף תפריט
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : menus.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiMenu className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין תפריטי ניווט</p>
            <Button className="flex items-center gap-2">
              הוסף תפריט ראשון
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <Card key={menu.id}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      מיקום: {menu.position || 'לא מוגדר'} • Handle: {menu.handle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <HiPencil className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <HiTrash className="w-4 h-4 ml-1" />
                      מחק
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

