'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiPlus, HiPencil, HiTrash, HiMenu, HiDuplicate } from 'react-icons/hi';
import { NavigationMenu } from '@/types/content';

export default function NavigationPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: '',
    handle: '',
    duplicate_from: null as number | null,
  });

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

  const handleCreateMenu = async () => {
    if (!newMenu.name.trim()) {
      alert('נא להזין שם תפריט');
      return;
    }

    try {
      setCreating(true);
      
      // יצירת handle אוטומטית מהשם
      // אם השם בעברית, נשתמש ב-timestamp + מזהה אקראי
      let handle = newMenu.name.toLowerCase()
        .replace(/\s+/g, '-')           // רווחים ל-מקפים
        .replace(/[^a-z0-9\-]/g, '')    // הסרת תווים לא חוקיים
        .replace(/-+/g, '-')            // מקפים כפולים למקף בודד
        .replace(/^-+|-+$/g, '');       // הסרת מקפים מההתחלה והסוף
      
      // אם ה-handle ריק (כי השם היה בעברית), נשתמש בשם תקין
      if (!handle || handle.length < 2) {
        handle = `menu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      
      // אם משכפלים תפריט, נצטרך ליצור את הפריטים אחרי יצירת התפריט
      const response = await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newMenu.name, 
          handle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create menu');
      }

      const createdMenu = await response.json();
      
      // אם משכפלים תפריט, נשכפל את הפריטים
      if (newMenu.duplicate_from) {
        await duplicateMenuItems(newMenu.duplicate_from, createdMenu.navigation_menu.id);
      }

      setShowCreateModal(false);
      setNewMenu({
        name: '',
        handle: '',
        duplicate_from: null,
      });
      await loadMenus();
    } catch (error: any) {
      alert(`שגיאה ביצירת תפריט: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const duplicateMenuItems = async (sourceMenuId: number, targetMenuId: number) => {
    try {
      const sourceResponse = await fetch(`/api/navigation/${sourceMenuId}`);
      if (!sourceResponse.ok) return;
      
      const sourceData = await sourceResponse.json();
      const sourceItems = sourceData.navigation_menu.items || [];
      
      for (const item of sourceItems) {
        await fetch(`/api/navigation/${targetMenuId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            url: item.url,
            type: item.type || 'link',
            position: item.position,
          }),
        });
      }
    } catch (error) {
      console.error('Error duplicating menu items:', error);
    }
  };

  const handleEditMenu = (menuId: number) => {
    router.push(`/navigation/${menuId}`);
  };

  const handleDeleteMenu = async (menuId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את התפריט?')) {
      return;
    }

    try {
      setDeleting(menuId);
      const response = await fetch(`/api/navigation/${menuId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete menu');
      }

      await loadMenus();
    } catch (error: any) {
      alert(`שגיאה במחיקת תפריט: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">תפריטי ניווט</h1>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          הוסף תפריט
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Modal ליצירת תפריט */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">צור תפריט חדש</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם התפריט
                </label>
                <Input
                  value={newMenu.name}
                  onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                  placeholder="למשל: תפריט תחתון"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שכפל מתפריט קיים (אופציונלי)
                </label>
                <select
                  value={newMenu.duplicate_from || ''}
                  onChange={(e) => setNewMenu({ ...newMenu, duplicate_from: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- בחר תפריט לשכפול --</option>
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewMenu({
                      name: '',
                      handle: '',
                      duplicate_from: null,
                    });
                  }}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleCreateMenu}
                  disabled={creating || !newMenu.name.trim()}
                >
                  {creating ? 'יוצר...' : 'צור תפריט'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

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
            <Button 
              onClick={handleCreateMenu}
              disabled={creating}
              className="flex items-center gap-2 mx-auto"
            >
              {creating ? 'יוצר...' : 'הוסף תפריט ראשון'}
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
                      {menu.items && menu.items.length > 0 && (
                        <span>{menu.items.length} פריטים</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditMenu(menu.id)}
                    >
                      <HiPencil className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteMenu(menu.id)}
                      disabled={deleting === menu.id}
                    >
                      <HiTrash className="w-4 h-4 ml-1" />
                      {deleting === menu.id ? 'מוחק...' : 'מחק'}
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

