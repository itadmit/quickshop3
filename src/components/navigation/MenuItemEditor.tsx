'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { NavigationMenuItem } from '@/types/content';
import { Package, Folder, FileText, ExternalLink, Trash2, GripVertical } from 'lucide-react';

interface MenuItemEditorProps {
  item: NavigationMenuItem;
  onUpdate: (itemId: number, updates: Partial<NavigationMenuItem>) => void;
  onDelete: (itemId: number) => void;
  products: Array<{ id: number; title: string; handle: string }>;
  collections: Array<{ id: number; title: string; handle: string }>;
  pages: Array<{ id: number; title: string; handle: string }>;
  dragHandleProps?: any;
}

export function MenuItemEditor({
  item,
  onUpdate,
  onDelete,
  products,
  collections,
  pages,
  dragHandleProps,
}: MenuItemEditorProps) {
  const [label, setLabel] = useState(item.label || item.title || '');
  const [urlInput, setUrlInput] = useState(item.url || '');
  const labelDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const urlDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLabel(item.label || item.title || '');
    setUrlInput(item.url || '');
  }, [item]);

  // ניקוי הטיימרים בעת unmount
  useEffect(() => {
    return () => {
      if (labelDebounceRef.current) clearTimeout(labelDebounceRef.current);
      if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    };
  }, []);

  // רשימה משולבת של כל המשאבים עם אייקונים
  const allResources = useMemo(() => {
    return [
      ...products.map(p => ({ 
        ...p, 
        type: 'product' as const, 
        displayUrl: `/products/${p.handle}`,
        icon: Package
      })),
      ...collections.map(c => ({ 
        ...c, 
        type: 'collection' as const, 
        displayUrl: `/categories/${c.handle}`,
        icon: Folder
      })),
      ...pages.map(p => ({ 
        ...p, 
        type: 'page' as const, 
        displayUrl: `/${p.handle}`,
        icon: FileText
      })),
    ];
  }, [products, collections, pages]);

  // אפשרויות עבור Autocomplete - מסוננות לפי מה שמקלידים
  const autocompleteOptions = useMemo(() => {
    if (!urlInput || urlInput.startsWith('https://') || urlInput.startsWith('http://')) {
      return [];
    }

    const searchTerm = urlInput.toLowerCase();
    const filtered = allResources.filter(resource => 
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.handle.toLowerCase().includes(searchTerm) ||
      resource.displayUrl.toLowerCase().includes(searchTerm)
    );

    return filtered.slice(0, 20).map(resource => ({
      value: resource.displayUrl,
      label: `${resource.title} (${resource.type === 'product' ? 'מוצר' : resource.type === 'collection' ? 'קטגוריה' : 'עמוד'})`
    }));
  }, [urlInput, allResources]);

  // פונקציה לעדכון עם debounce
  const debouncedUpdate = useCallback((updates: Partial<NavigationMenuItem>) => {
    onUpdate(item.id, updates);
  }, [item.id, onUpdate]);

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    
    // ניקוי הטיימר הקודם
    if (labelDebounceRef.current) {
      clearTimeout(labelDebounceRef.current);
    }
    
    // המתנה של 800ms לפני שליחה לשרת
    labelDebounceRef.current = setTimeout(() => {
      debouncedUpdate({ title: newLabel, label: newLabel });
    }, 800);
  };

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    
    // ניקוי הטיימר הקודם
    if (urlDebounceRef.current) {
      clearTimeout(urlDebounceRef.current);
    }
    
    // המתנה של 800ms לפני שליחה לשרת
    urlDebounceRef.current = setTimeout(() => {
      // אם זה לינק חיצוני (https://), נשמור בלי חיפוש
      if (value.startsWith('https://') || value.startsWith('http://')) {
        debouncedUpdate({ type: 'link', url: value, resource_id: null });
        return;
      }

      // חיפוש במשאבים - אם זה לינק פנימי שמתחיל ב-/
      if (value.startsWith('/')) {
        const foundResource = allResources.find(r => r.displayUrl === value);
        if (foundResource) {
          debouncedUpdate({ 
            type: foundResource.type, 
            url: value, 
            resource_id: foundResource.id 
          });
          return;
        }
      }

      // אחרת זה לינק מותאם אישית פנימי
      debouncedUpdate({ type: 'link', url: value, resource_id: null });
    }, 800);
  };

  // עדכון מיידי כשבוחרים מה-autocomplete
  const handleUrlSelect = (option: { value: string; label: string }) => {
    setUrlInput(option.value);
    
    // ניקוי הטיימר הקודם אם יש
    if (urlDebounceRef.current) {
      clearTimeout(urlDebounceRef.current);
    }
    
    // מציאת המשאב ועדכון מיידי
    const foundResource = allResources.find(r => r.displayUrl === option.value);
    if (foundResource) {
      onUpdate(item.id, { 
        type: foundResource.type, 
        url: option.value, 
        resource_id: foundResource.id 
      });
    } else {
      onUpdate(item.id, { type: 'link', url: option.value, resource_id: null });
    }
  };

  const isExternalLink = urlInput.startsWith('https://') || urlInput.startsWith('http://');

  return (
    <div className="group flex items-center gap-3 py-2.5 px-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
      {/* ידית גרירה */}
      <div 
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* תווית */}
      <div className="flex-shrink-0" style={{ width: '100px' }}>
        <input
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="תווית"
          className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:ring-0 outline-none py-1 transition-colors"
        />
      </div>

      {/* חץ מפריד */}
      <span className="text-gray-300 flex-shrink-0">←</span>

      {/* שדה לינק */}
      <div className="flex-1 min-w-0 relative">
        {isExternalLink && (
          <ExternalLink className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        {isExternalLink ? (
          <input
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="w-full text-sm text-gray-600 bg-gray-50 rounded px-3 py-1.5 border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none pl-8"
            dir="ltr"
          />
        ) : (
          <Autocomplete
            value={urlInput}
            onChange={(value) => handleUrlChange(value)}
            onSelect={handleUrlSelect}
            options={autocompleteOptions}
            placeholder="הקלד קישור או חפש עמוד, קטגוריה או מוצר"
            className="text-sm"
          />
        )}
      </div>

      {/* כפתור מחיקה */}
      <button
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

