'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { SettingGroup } from '../ui/SettingGroup';
import { SettingInput } from '../ui/SettingInput';
import { SettingSelect } from '../ui/SettingSelect';
import { ModernColorPicker } from '../SettingsUI';
import { MediaPicker } from '@/components/MediaPicker';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TypographyPopover } from './TypographyPopover';
import { useDebounce } from '@/hooks/useDebounce';
import { RepeaterItem } from '../ui/RepeaterItem';
import { MediaUploader } from '../ui/MediaUploader';
import { SegmentedControl } from '../ui/SegmentedControl';
import { HiPhotograph, HiVideoCamera, HiTrash, HiRefresh, HiPlus, HiDeviceMobile, HiDesktopComputer, HiMenuAlt4, HiUpload, HiSearch, HiX, HiPencil, HiDocumentText, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useStoreId } from '@/hooks/useStoreId';
import { DeviceType } from '../Header';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SettingsPanelProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  device: DeviceType;
}

interface NavigationMenu {
  id: number;
  name: string;
  items?: Array<{ id: number; label?: string; title?: string; url: string }>;
}

// Component for sortable field items in checkout form settings
function SortableFieldItem({
  id,
  index,
  label,
}: {
  id: string;
  index: number;
  label: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-gray-50 rounded border ${isDragging ? 'border-blue-400 shadow-md' : 'border-gray-200'} cursor-grab active:cursor-grabbing`}
      {...attributes}
      {...listeners}
    >
      <HiMenuAlt4 className="w-4 h-4 text-gray-400" />
      <span className="text-gray-400 text-sm">{index + 1}.</span>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

// Checkout Fields Order Component with drag-and-drop
function CheckoutFieldsOrder({
  getValue,
  handleSettingChange,
}: {
  getValue: (key: string, defaultValue: any) => any;
  handleSettingChange: (key: string, value: any) => void;
}) {
  const fieldLabels: Record<string, string> = {
    email: 'אימייל',
    first_name: 'שם פרטי',
    last_name: 'שם משפחה',
    phone: 'טלפון',
    city: 'עיר',
    street: 'רחוב ומספר',
    apartment: 'דירה / קומה',
    notes: 'הערות להזמנה'
  };

  const fieldsOrder = getValue('fields_order', [
    'email', 'first_name', 'last_name', 'phone', 'city', 'street', 'apartment', 'notes'
  ]) as string[];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = fieldsOrder.indexOf(active.id as string);
      const newIndex = fieldsOrder.indexOf(over.id as string);
      
      const newOrder = arrayMove(fieldsOrder, oldIndex, newIndex);
      handleSettingChange('fields_order', newOrder);
    }
  };

  return (
    <SettingGroup title="סדר שדות">
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          גרור לסידור מחדש. שדות שלא בשימוש יוסתרו.
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fieldsOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fieldsOrder.map((fieldKey: string, index: number) => (
                <SortableFieldItem
                  key={fieldKey}
                  id={fieldKey}
                  index={index}
                  label={fieldLabels[fieldKey] || fieldKey}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </SettingGroup>
  );
}

export function SettingsPanel({ section, onUpdate, device }: SettingsPanelProps) {
  const storeId = useStoreId();
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'auto'>('image'); // 'auto' = זיהוי אוטומטי
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [imageDeviceTarget, setImageDeviceTarget] = useState<'desktop' | 'mobile'>('desktop'); // For desktop/mobile image selection
  const [navigationMenus, setNavigationMenus] = useState<NavigationMenu[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [collections, setCollections] = useState<Array<{ id: number; title: string; handle: string; parent_id?: number | null }>>([]);
  const [typographyAnchor, setTypographyAnchor] = useState<HTMLElement | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSectionType, setSelectedSectionType] = useState<string | null>(null);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState('');
  const debouncedCollectionSearch = useDebounce(collectionSearchTerm, 300);
  const [productCollectionSearchTerm, setProductCollectionSearchTerm] = useState('');
  const debouncedProductCollectionSearch = useDebounce(productCollectionSearchTerm, 300);
  const [products, setProducts] = useState<Array<{ id: number; title: string; handle: string; image?: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const debouncedProductSearch = useDebounce(productSearchTerm, 300);

  // Load navigation menus when header or footer section is selected
  useEffect(() => {
    if ((section.type === 'header' || section.type === 'footer') && storeId) {
      loadNavigationMenus();
    }
  }, [section.type, storeId]);

  // Load collections when featured_collections section is selected
  const prevSearchRef = useRef<string>('');
  const prevSectionTypeRef = useRef<string>('');
  const hasLoadedRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (section.type === 'featured_collections' && storeId) {
      // Load collections when section type changes or search term changes
      const sectionChanged = prevSectionTypeRef.current !== section.type;
      const searchChanged = prevSearchRef.current !== debouncedCollectionSearch;
      
      // Always load on first mount or when section changes
      if (sectionChanged || searchChanged || !hasLoadedRef.current) {
        prevSectionTypeRef.current = section.type;
        prevSearchRef.current = debouncedCollectionSearch;
        hasLoadedRef.current = true;
        loadCollections();
      }
    } else {
      // Reset refs when switching away from featured_collections
      prevSectionTypeRef.current = '';
      prevSearchRef.current = '';
      hasLoadedRef.current = false;
    }
  }, [section.type, storeId, debouncedCollectionSearch]);
  
  // Load collections when featured_products section is selected
  const prevProductSearchRef = useRef<string>('');
  const prevProductSectionTypeRef = useRef<string>('');
  const prevProductSelectionModeRef = useRef<string>('');
  const hasLoadedProductsRef = useRef<boolean>(false);
  const prevProductManualSearchRef = useRef<string>('');
  
  useEffect(() => {
    if (section.type === 'featured_products' && storeId) {
      const productSelectionMode = section.settings?.product_selection_mode || 'all';
      const modeChanged = prevProductSelectionModeRef.current !== productSelectionMode;
      
      // Load collections when collection mode is selected
      if (productSelectionMode === 'collection') {
        const sectionChanged = prevProductSectionTypeRef.current !== section.type;
        const searchChanged = prevProductSearchRef.current !== debouncedProductCollectionSearch;
        
        if (sectionChanged || searchChanged || modeChanged || !hasLoadedProductsRef.current) {
          prevProductSectionTypeRef.current = section.type;
          prevProductSearchRef.current = debouncedProductCollectionSearch;
          prevProductSelectionModeRef.current = productSelectionMode;
          hasLoadedProductsRef.current = true;
          loadCollections();
        }
      }
      
      // Load products when manual mode is selected
      if (productSelectionMode === 'manual') {
        const sectionChanged = prevProductSectionTypeRef.current !== section.type;
        const searchChanged = prevProductManualSearchRef.current !== debouncedProductSearch;
        
        if (sectionChanged || searchChanged || modeChanged || !hasLoadedProductsRef.current) {
          prevProductSectionTypeRef.current = section.type;
          prevProductManualSearchRef.current = debouncedProductSearch;
          prevProductSelectionModeRef.current = productSelectionMode;
          hasLoadedProductsRef.current = true;
          loadProducts();
        }
      }
    } else {
      // Reset refs when switching away from featured_products
      prevProductSectionTypeRef.current = '';
      prevProductSearchRef.current = '';
      prevProductManualSearchRef.current = '';
      prevProductSelectionModeRef.current = '';
      hasLoadedProductsRef.current = false;
    }
  }, [section.type, section.settings?.product_selection_mode, storeId, debouncedProductCollectionSearch, debouncedProductSearch]);

  const loadNavigationMenus = async () => {
    if (loadingMenus) return;
    setLoadingMenus(true);
    try {
      const response = await fetch('/api/navigation');
      if (response.ok) {
        const data = await response.json();
        // API returns { navigation_menus: [...] }
        setNavigationMenus(data.navigation_menus || []);
      }
    } catch (error) {
      console.error('Error loading navigation menus:', error);
    } finally {
      setLoadingMenus(false);
    }
  };

  const loadProducts = async () => {
    if (loadingProducts || !storeId) return;
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.append('storeId', storeId.toString());
      // Don't filter by status in customizer - show all products including drafts
      if (debouncedProductSearch) {
        params.append('search', debouncedProductSearch);
      }
      params.append('limit', '50');
      
      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: 'include', // Important: include cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('[SettingsPanel] Failed to load products:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCollections = async () => {
    if (loadingCollections || !storeId) {
      console.log('[SettingsPanel] Skipping loadCollections:', { loadingCollections, storeId });
      return;
    }
    setLoadingCollections(true);
    try {
      const params = new URLSearchParams();
      if (debouncedCollectionSearch) {
        params.append('search', debouncedCollectionSearch);
      }
      // Add limit to get more collections
      params.append('limit', '100');
      
      console.log('[SettingsPanel] Loading collections with params:', params.toString());
      const response = await fetch(`/api/collections?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const loadedCollections = data.collections || [];
        console.log('[SettingsPanel] Loaded collections:', loadedCollections.length, loadedCollections);
        setCollections(loadedCollections);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[SettingsPanel] Failed to load collections:', response.status, response.statusText, errorData);
        setCollections([]);
      }
    } catch (error) {
      console.error('[SettingsPanel] Error loading collections:', error);
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  // Helper to get value based on device (supports nested keys like "search.enabled")
  const getValue = (key: string, defaultValue: any = '') => {
    const keys = key.split('.');
    
    // If desktop, return direct settings
    if (device === 'desktop') {
      let current: any = section.settings;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return defaultValue;
        }
      }
      return current ?? defaultValue;
    }

    // If mobile/tablet, try to get from responsive settings first
    const responsiveSettings = (section as any).responsive?.[device]?.settings;
    if (responsiveSettings) {
      let current: any = responsiveSettings;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined) {
        return current;
      }
    }

    // Fallback to desktop settings
    let current: any = section.settings;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }
    return current ?? defaultValue;
  };

  // Helper to check if value is overridden in current device
  const isOverridden = (key: string) => {
    if (device === 'desktop') return false;
    const responsiveSettings = (section as any).responsive?.[device]?.settings;
    return responsiveSettings && responsiveSettings[key] !== undefined;
  };

  const handleSettingChange = (key: string, value: any) => {
    // Handle nested keys like "search.enabled"
    const keys = key.split('.');
    
    if (device === 'desktop') {
      // Deep clone to avoid mutation issues
      const newSettings = JSON.parse(JSON.stringify(section.settings || {}));
      let current: any = newSettings;
      
      // Navigate to the nested object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;
      
      onUpdate({
        settings: newSettings
      });
    } else {
      // Update responsive settings - deep clone to avoid mutation issues
      const currentResponsive = JSON.parse(JSON.stringify((section as any).responsive || {}));
      const deviceResponsive = currentResponsive[device] || {};
      const deviceSettings = deviceResponsive.settings || {};
      
      let current: any = deviceSettings;
      
      // Navigate to the nested object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;

      onUpdate({
        responsive: {
          ...currentResponsive,
          [device]: {
            ...deviceResponsive,
            settings: deviceSettings
          }
        }
      } as any);
    }
  };

  const handleStyleChange = (path: string, value: any) => {
      const keys = path.split('.');
      // Deep clone the style object to avoid mutation issues
      const style = JSON.parse(JSON.stringify(section.style || {}));
      let current: any = style;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      // ✅ וידוא שה-style מתעדכן כראוי
      onUpdate({ style });
  };

  const handleMediaSelect = (files: string[]) => {
    if (files.length > 0) {
      if ((window as any).__videoSelect) {
          (window as any).__videoSelect(files[0]);
          (window as any).__videoSelect = null;
      } else if (targetBlockId === 'header-logo') {
          // Update header logo
          handleSettingChange('logo', { 
            ...section.settings?.logo, 
            image_url: files[0] 
          });
          setTargetBlockId(null);
      } else if (targetBlockId && targetBlockId.startsWith('footer-column-')) {
          // Update footer column image
          const columnIndex = parseInt(targetBlockId.replace('footer-column-', ''));
          const columns = getValue('columns', []) || [];
          const updatedColumns = [...columns];
          if (updatedColumns[columnIndex]) {
            updatedColumns[columnIndex] = { ...updatedColumns[columnIndex], image_url: files[0] };
            handleSettingChange('columns', updatedColumns);
          }
          setTargetBlockId(null);
      } else if (targetBlockId) {
          // ✅ Update specific block - support desktop/mobile images and video
          // Deep clone to avoid mutation issues
          const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
          const blockIndex = newBlocks.findIndex((b: any) => b.id === targetBlockId);
          if (blockIndex >= 0) {
              // ✅ For image_with_text, multicolumn, and slideshow, detect file type from extension if accept='all' or 'auto'
              let detectedMediaType = mediaType;
              if ((section.type === 'image_with_text' || section.type === 'multicolumn' || section.type === 'slideshow') && (mediaType === 'image' || mediaType === 'auto')) {
                  // Check if the file is actually a video by extension
                  const isVideoFile = files[0].match(/\.(mp4|webm|ogg|mov|avi)$/i);
                  if (isVideoFile) {
                      detectedMediaType = 'video';
                  } else if (mediaType === 'auto') {
                      detectedMediaType = 'image';
                  }
              }
              
              if (detectedMediaType === 'video' || mediaType === 'video') {
                  // ✅ For video, set video_url (desktop/mobile) and clear image_url
                  const videoKey = imageDeviceTarget === 'mobile' ? 'video_url_mobile' : 'video_url';
                  newBlocks[blockIndex].content = {
                      ...newBlocks[blockIndex].content,
                      [videoKey]: files[0],
                      // Clear opposite media type for the same device
                      ...(imageDeviceTarget === 'mobile' 
                          ? { image_url_mobile: '' } 
                          : { image_url: '' })
                  };
              } else {
                  // ✅ For image, set image_url (desktop/mobile) and clear video_url
                  const imageKey = imageDeviceTarget === 'mobile' ? 'image_url_mobile' : 'image_url';
                  newBlocks[blockIndex].content = {
                      ...newBlocks[blockIndex].content,
                      [imageKey]: files[0],
                      // Clear opposite media type for the same device
                      ...(imageDeviceTarget === 'mobile' 
                          ? { video_url_mobile: '' } 
                          : { video_url: '' })
                  };
              }
              onUpdate({ blocks: newBlocks });
          }
          setTargetBlockId(null);
      } else if (section.type === 'gallery') {
          // ✅ Add images to gallery - use batch function if available, otherwise use single
          if ((window as any).__galleryAddImages) {
              // ✅ Use batch function to add all images at once
              (window as any).__galleryAddImages(files);
              (window as any).__galleryAddImages = null;
              (window as any).__galleryAddImage = null;
          } else if ((window as any).__galleryAddImage) {
              // Fallback to single image function
              files.forEach((file, index) => {
                  // ✅ Add small delay to ensure unique IDs
                  setTimeout(() => {
                      (window as any).__galleryAddImage(file);
                  }, index * 10);
              });
              (window as any).__galleryAddImage = null;
          }
      } else if (section.type === 'slideshow' && (window as any).__slideshowAddImage) {
          // Add slide to slideshow
          files.forEach(file => {
              (window as any).__slideshowAddImage(file);
          });
          (window as any).__slideshowAddImage = null;
      } else if (section.type === 'element_image') {
          // Handle image element - support desktop/mobile
          const imageKey = imageDeviceTarget === 'mobile' ? 'image_url_mobile' : 'image_url';
          handleSettingChange(imageKey, files[0]);
      } else if (section.type === 'element_video') {
          // Handle video element - support desktop/mobile
          const videoKey = imageDeviceTarget === 'mobile' ? 'video_url_mobile' : 'video_url';
          handleSettingChange(videoKey, files[0]);
      } else {
        // Update section background - support desktop/mobile images
        // ✅ עבור hero_banner, זיהוי אוטומטי של תמונה/סרטון לפי סיומת הקובץ
        const isVideoFile = files[0] && /\.(mp4|webm|ogg|mov|avi)$/i.test(files[0]);
        const isImage = mediaType === 'image' || (mediaType === 'auto' && !isVideoFile);
        
        if (isImage) {
            const imageKey = imageDeviceTarget === 'mobile' ? 'background_image_mobile' : 'background_image';
            handleStyleChange(`background.${imageKey}`, files[0]);
            // נקה וידאו רק אם זה לא mobile (כי mobile ו-desktop נפרדים)
            if (imageDeviceTarget === 'mobile') {
                handleStyleChange('background.background_video_mobile', '');
            } else {
                handleStyleChange('background.background_video', '');
            }
        } else {
            const videoKey = imageDeviceTarget === 'mobile' ? 'background_video_mobile' : 'background_video';
            handleStyleChange(`background.${videoKey}`, files[0]);
            // נקה תמונות רק אם זה לא mobile
            if (imageDeviceTarget === 'mobile') {
                handleStyleChange('background.background_image_mobile', '');
            } else {
                handleStyleChange('background.background_image', '');
            }
        }
      }
    }
    setIsMediaPickerOpen(false);
  };

  const handleReset = () => {
    if (confirm('האם אתה בטוח שברצונך לאפס את הגדרות הסקשן?')) {
        onUpdate({
            settings: {},
            style: {}
        });
    }
  };

  const renderInput = (label: string, key: string, placeholder?: string, type: 'text' | 'number' = 'text', description?: string, dir?: 'rtl' | 'ltr') => (
    <div className="relative">
       <SettingInput
          label={label}
          value={getValue(key)}
          onChange={(e) => handleSettingChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          dir={dir}
          description={description}
        />
        {isOverridden(key) && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full" title="מוגדר ספציפית למכשיר זה" />
        )}
    </div>
  );

  const renderColorPicker = (label: string, key: string) => (
    <div className="relative">
       <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
       <ModernColorPicker
          value={getValue(key) || '#000000'}
          onChange={(value) => handleSettingChange(key, value)}
        />
        {isOverridden(key) && (
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full" title="מוגדר ספציפית למכשיר זה" />
        )}
    </div>
  );

  const renderSelect = (label: string, key: string, options: { label: string; value: any }[], defaultValue: any = undefined) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOption = options.find(opt => String(opt.value) === e.target.value);
      const value = selectedOption ? selectedOption.value : e.target.value;
      handleSettingChange(key, value);
    };
    
    const currentValue = getValue(key, defaultValue);
    // Handle boolean values correctly - if currentValue is undefined/null, use defaultValue
    let displayValue: string;
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      displayValue = String(currentValue);
    } else if (defaultValue !== undefined && defaultValue !== null) {
      displayValue = String(defaultValue);
    } else {
      // If no value and no default, try to find a default from options (usually the first one)
      displayValue = String(options[0]?.value ?? '');
    }
    
    return (
      <div className="relative">
         <SettingSelect
            label={label}
            value={displayValue}
            onChange={handleChange}
            options={options}
          />
          {isOverridden(key) && (
             <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full" title="מוגדר ספציפית למכשיר זה" />
           )}
       </div>
     );
   };


  const renderSettingsForType = () => {
    switch (section.type) {
      case 'header':
        return (
          <div className="space-y-1">
            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('סגנון פריסה', 'layout_style', [
                  { label: 'לוגו בימין - תפריט במרכז - אייקונים משמאל', value: 'logo_right_menu_center' },
                  { label: 'תפריט בימין - לוגו במרכז - אייקונים משמאל', value: 'menu_right_logo_center' },
                  { label: 'לוגו בשמאל - תפריט במרכז - אייקונים בימין', value: 'logo_left_menu_center' },
                  { label: 'לוגו במרכז - תפריט מתחת', value: 'logo_center_menu_below' },
                ])}
                {renderSelect('הצג חיפוש', 'search.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {getValue('search.enabled', true) !== false && renderInput('טקסט חיפוש (Placeholder)', 'search.placeholder', 'חפש מוצרים...')}
                {renderSelect('הצג עגלה', 'cart.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {renderSelect('הצג בחירת שפה ומטבע', 'currency_selector.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], false)}
                {renderSelect('הצג חשבון משתמש', 'user_account.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {renderSelect('הצג רשימת משאלות', 'wishlist.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="לוגו">
              <div className="space-y-4">
                {/* Logo Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">תמונת לוגו</label>
                  {getValue('logo.image_url') ? (
                    <div className="relative group">
                      <img 
                        src={getValue('logo.image_url')} 
                        alt="לוגו" 
                        className="w-full h-20 object-contain bg-gray-100 rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setMediaType('image');
                            setTargetBlockId('header-logo');
                            setIsMediaPickerOpen(true);
                          }}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                          title="החלף תמונה"
                        >
                          <HiRefresh className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSettingChange('logo', { ...section.settings?.logo, image_url: null })}
                          className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50"
                          title="הסר תמונה"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setMediaType('image');
                        setTargetBlockId('header-logo');
                        setIsMediaPickerOpen(true);
                      }}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all flex flex-col items-center gap-2"
                    >
                      <HiPhotograph className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">העלה לוגו</span>
                    </button>
                  )}
                </div>

                {renderInput('טקסט לוגו (אם אין תמונה)', 'logo.text', 'שם החנות')}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">גובה לוגו - דסקטופ</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.height_desktop', '40'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          height_desktop: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={20}
                        max={120}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">גובה לוגו - מובייל</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.height_mobile', '32'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          height_mobile: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={16}
                        max={80}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">מרווח לוגו - דסקטופ</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.padding_desktop', '0'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          padding_desktop: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={0}
                        max={40}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">מרווח לוגו - מובייל</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={parseInt(getValue('logo.padding_mobile', '0'))}
                        onChange={(e) => handleSettingChange('logo', { 
                          ...section.settings?.logo, 
                          padding_mobile: `${e.target.value}px` 
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        min={0}
                        max={40}
                      />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                  </div>
                </div>
              </div>
            </SettingGroup>

            <SettingGroup title="תפריט ניווט">
              <div className="space-y-4">
                {/* Desktop Menu Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תפריט למחשב</label>
                  <select
                    value={getValue('navigation.menu_desktop', '') || ''}
                    onChange={(e) => {
                      const menuId = e.target.value ? parseInt(e.target.value) : null;
                      const selectedMenu = navigationMenus.find(m => m.id === menuId);
                      handleSettingChange('navigation', {
                        ...section.settings?.navigation,
                        menu_desktop: menuId,
                        menu_items: selectedMenu?.items?.map(item => ({
                          label: item.title || item.label || '',
                          url: item.url || ''
                        })) || section.settings?.navigation?.menu_items || []
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">-- בחר תפריט --</option>
                    {loadingMenus ? (
                      <option value="" disabled>טוען תפריטים...</option>
                    ) : (
                      navigationMenus.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Mobile Menu Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תפריט למובייל</label>
                  <select
                    value={getValue('navigation.menu_mobile', '') || ''}
                    onChange={(e) => {
                      const menuId = e.target.value ? parseInt(e.target.value) : null;
                      const selectedMenu = navigationMenus.find(m => m.id === menuId);
                      handleSettingChange('navigation', {
                        ...section.settings?.navigation,
                        menu_mobile: menuId,
                        menu_items_mobile: selectedMenu?.items?.map(item => ({
                          label: item.title || item.label || '',
                          url: item.url || ''
                        })) || section.settings?.navigation?.menu_items_mobile || []
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">-- בחר תפריט (אופציונלי - אם לא נבחר, ישתמש בתפריט למחשב) --</option>
                    {loadingMenus ? (
                      <option value="" disabled>טוען תפריטים...</option>
                    ) : (
                      navigationMenus.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {renderSelect('גודל פונט תפריט', 'navigation.font_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'רגיל', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
                {renderSelect('משקל פונט', 'navigation.font_weight', [
                  { label: 'רגיל', value: 'normal' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'מודגש', value: 'bold' },
                ])}
                {renderInput('מרווח בין פריטים', 'navigation.gap', '24', 'number')}
              </div>
            </SettingGroup>

            <SettingGroup title="הדר דביק (Sticky)">
              <div className="space-y-4">
                {renderSelect('הדר דביק', 'sticky.enabled', [
                  { label: 'כן - נשאר למעלה בגלילה', value: true },
                  { label: 'לא - נגלל עם העמוד', value: false },
                ])}
                {getValue('sticky.enabled', true) && renderSelect('אפקט בגלילה', 'sticky.shrink', [
                  { label: 'ללא', value: 'none' },
                  { label: 'הקטנה', value: 'shrink' },
                  { label: 'צל', value: 'shadow' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'hero_banner':
        // Mobile Preview Component - מודרני וקומפקטי
        const MobilePreview = ({ 
          children, 
          onDelete, 
          onClick 
        }: { 
          children: React.ReactNode; 
          onDelete?: () => void;
          onClick?: () => void;
        }) => (
          <div 
            className="relative group border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all bg-white"
            style={{ height: '120px', maxWidth: '90px', margin: '0 auto' }}
            onClick={onClick}
          >
            {children || (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <HiPhotograph className="w-6 h-6" />
                <span className="text-xs text-center px-2">לחץ לעלות מדיה</span>
              </div>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                title="הסר"
              >
                <HiTrash className="w-3 h-3" />
              </button>
            )}
          </div>
        );

        // Desktop Preview Component - מודרני וקומפקטי
        const DesktopPreview = ({ 
          children, 
          onDelete,
          onClick 
        }: { 
          children: React.ReactNode; 
          onDelete?: () => void;
          onClick?: () => void;
        }) => (
          <div 
            className="relative group border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all bg-white"
            style={{ height: '120px' }}
            onClick={onClick}
          >
            {children || (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <HiPhotograph className="w-8 h-8" />
                <span className="text-sm text-center px-2">לחץ לעלות מדיה</span>
              </div>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                title="הסר"
              >
                <HiTrash className="w-3 h-3" />
              </button>
            )}
          </div>
        );

        return (
          <div className="space-y-1">
            {/* Mobile + Tablet Section */}
            <SettingGroup title={<span className="flex items-center gap-2"><HiDeviceMobile className="w-4 h-4" /> מובייל + טאבלט</span>}>
                <div className="space-y-3">
                    {/* Preview Mobile Image */}
                    {section.style?.background?.background_image_mobile ? (
                        <MobilePreview 
                            onDelete={() => {
                                handleStyleChange('background.background_image_mobile', '');
                                handleStyleChange('background.background_video_mobile', '');
                            }}
                            onClick={() => {
                                setMediaType('image');
                                setImageDeviceTarget('mobile');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                            }}
                        >
                            <img 
                                src={section.style.background.background_image_mobile} 
                                alt="Mobile Background" 
                                className="w-full h-full object-cover"
                            />
                        </MobilePreview>
                    ) : section.style?.background?.background_video_mobile ? (
                        <MobilePreview 
                            onDelete={() => {
                                handleStyleChange('background.background_image_mobile', '');
                                handleStyleChange('background.background_video_mobile', '');
                            }}
                            onClick={() => {
                                setMediaType('video');
                                setImageDeviceTarget('mobile');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                            }}
                        >
                            <video 
                                src={section.style.background.background_video_mobile} 
                                className="w-full h-full object-cover"
                                autoPlay muted loop
                            />
                        </MobilePreview>
                    ) : (
                        <MobilePreview
                            onClick={() => {
                                setMediaType('auto');
                                setImageDeviceTarget('mobile');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                            }}
                        />
                    )}

                    {/* כפתור העלאה */}
                    <button
                        onClick={() => {
                            setMediaType('auto');
                            setImageDeviceTarget('mobile');
                            setTargetBlockId(null);
                            setIsMediaPickerOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all text-sm font-medium"
                    >
                        <HiUpload className="w-4 h-4" />
                        <span>העלה מדיה</span>
                    </button>
                </div>
            </SettingGroup>

            {/* Desktop Section */}
            <SettingGroup title={<span className="flex items-center gap-2"><HiDesktopComputer className="w-4 h-4" /> מחשב</span>}>
                <div className="space-y-3">
                    {/* Preview Desktop Image */}
                    {section.style?.background?.background_image ? (
                        <DesktopPreview 
                            onDelete={() => {
                                handleStyleChange('background.background_image', '');
                                handleStyleChange('background.background_video', '');
                            }}
                            onClick={() => {
                                setMediaType('image');
                                setImageDeviceTarget('desktop');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                            }}
                        >
                            <img 
                                src={section.style.background.background_image} 
                                alt="Desktop Background" 
                                className="w-full h-full object-cover"
                            />
                        </DesktopPreview>
                    ) : section.style?.background?.background_video ? (
                        <DesktopPreview 
                            onDelete={() => {
                                handleStyleChange('background.background_image', '');
                                handleStyleChange('background.background_video', '');
                            }}
                            onClick={() => {
                                setMediaType('video');
                                setImageDeviceTarget('desktop');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                            }}
                        >
                            <video 
                                src={section.style.background.background_video} 
                                className="w-full h-full object-cover"
                                autoPlay muted loop
                            />
                        </DesktopPreview>
                    ) : (
                        <DesktopPreview
                            onClick={() => {
                                setMediaType('auto');
                                setImageDeviceTarget('desktop');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                            }}
                        />
                    )}

                    {/* כפתור העלאה */}
                    <button
                        onClick={() => {
                            setMediaType('auto');
                            setImageDeviceTarget('desktop');
                            setTargetBlockId(null);
                            setIsMediaPickerOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all text-sm font-medium"
                    >
                        <HiUpload className="w-4 h-4" />
                        <span>העלה מדיה</span>
                    </button>

                    {/* Image Settings */}
                    {section.style?.background?.background_image && (
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                            <SettingSelect
                                label="גודל תמונה"
                                value={section.style?.background?.background_size || 'cover'}
                                onChange={(e) => handleStyleChange('background.background_size', e.target.value)}
                                options={[
                                    { label: 'כיסוי (Cover)', value: 'cover' },
                                    { label: 'הכל (Contain)', value: 'contain' },
                                    { label: 'אוטומטי', value: 'auto' },
                                    { label: 'מתיחה (100%)', value: '100% 100%' },
                                ]}
                            />
                            <SettingSelect
                                label="מיקום תמונה"
                                value={section.style?.background?.background_position || 'center'}
                                onChange={(e) => handleStyleChange('background.background_position', e.target.value)}
                                options={[
                                    { label: 'מרכז', value: 'center' },
                                    { label: 'למעלה', value: 'top' },
                                    { label: 'למטה', value: 'bottom' },
                                    { label: 'שמאל', value: 'left' },
                                    { label: 'ימין', value: 'right' },
                                ]}
                            />
                        </div>
                    )}

                    {/* Video Settings */}
                    {section.style?.background?.background_video && (
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                            <SettingSelect
                                label="התאמת גודל"
                                value={section.style?.background?.video_object_fit || 'cover'}
                                onChange={(e) => handleStyleChange('background.video_object_fit', e.target.value)}
                                options={[
                                    { label: 'כיסוי (Cover)', value: 'cover' },
                                    { label: 'הכל (Contain)', value: 'contain' },
                                    { label: 'מילוי (Fill)', value: 'fill' },
                                ]}
                            />
                        </div>
                    )}
                </div>
            </SettingGroup>

            <SettingGroup title="תוכן">
              <div className="space-y-4">
                {renderInput('כותרת ראשית', 'heading', 'הכנס כותרת...')}
                {renderInput('תת כותרת', 'subheading', 'הכנס תת כותרת...')}
              </div>
            </SettingGroup>
            
            <SettingGroup title="גדלי פונט">
              <div className="space-y-4">
                {renderSelect('גודל כותרת ראשית', 'heading_font_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'גדול מאוד', value: 'xlarge' },
                ])}
                {renderSelect('גודל תת כותרת', 'subheading_font_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'גדול מאוד', value: 'xlarge' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="כפתור">
              <div className="space-y-4">
                {renderInput('טקסט כפתור', 'button_text', 'קנה עכשיו')}
                {renderInput('קישור', 'button_url', '/categories/all', 'text', undefined, 'ltr')}
              </div>
            </SettingGroup>

            <SettingGroup title="פריסה">
               <div className="space-y-4">
                {renderSelect('גובה הסקשן', 'height', [
                    { label: 'קטן (40vh)', value: 'small' },
                    { label: 'בינוני (60vh)', value: 'medium' },
                    { label: 'גדול (80vh)', value: 'large' },
                    { label: 'מסך מלא (100vh)', value: 'full_screen' },
                ])}
                {renderSelect('מיקום תוכן אנכי', 'content_position_vertical', [
                    { label: 'למעלה', value: 'top' },
                    { label: 'מרכז', value: 'center' },
                    { label: 'למטה', value: 'bottom' },
                ])}
                {renderSelect('מיקום תוכן אופקי', 'content_position_horizontal', [
                    { label: 'ימין', value: 'right' },
                    { label: 'מרכז', value: 'center' },
                    { label: 'שמאל', value: 'left' },
                ])}
                {renderSelect('יישור טקסט', 'text_align', [
                    { label: 'ימין', value: 'right' },
                    { label: 'מרכז', value: 'center' },
                    { label: 'שמאל', value: 'left' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'featured_products':
        const productSelectionMode = getValue('product_selection_mode', 'all') as 'all' | 'collection' | 'manual';
        const productSelectedCollectionIds = getValue('selected_collection_ids', []) as number[];
        const productSelectedProductIds = getValue('selected_product_ids', []) as number[];
        
        const toggleProductCollection = (collectionId: number) => {
          const currentIds = productSelectedCollectionIds || [];
          const newIds = currentIds.includes(collectionId)
            ? currentIds.filter(id => id !== collectionId)
            : [...currentIds, collectionId];
          handleSettingChange('selected_collection_ids', newIds);
        };
        
        const toggleProduct = (productId: number) => {
          const currentIds = productSelectedProductIds || [];
          const newIds = currentIds.includes(productId)
            ? currentIds.filter(id => id !== productId)
            : [...currentIds, productId];
          handleSettingChange('selected_product_ids', newIds);
        };
        
        return (
          <div className="space-y-1">
            <SettingGroup title="מקור מוצרים">
              <div className="space-y-4">
                {renderSelect('מקור מוצרים', 'product_selection_mode', [
                  { label: 'כל המוצרים', value: 'all' },
                  { label: 'קטגוריה', value: 'collection' },
                  { label: 'בחירה ידנית', value: 'manual' },
                ])}
                
                {productSelectionMode === 'all' && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    כל המוצרים יוצגו בסקשיין.
                  </p>
                )}
                
                {productSelectionMode === 'collection' && (
                  <>
                    <div className="relative">
                      <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="חיפוש קטגוריות..."
                        value={productCollectionSearchTerm}
                        onChange={(e) => setProductCollectionSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    
                    {productSelectedCollectionIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {collections
                          .filter(c => productSelectedCollectionIds.includes(c.id))
                          .map(collection => (
                            <span
                              key={collection.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {collection.title}
                              <button
                                type="button"
                                onClick={() => toggleProductCollection(collection.id)}
                                className="hover:text-blue-900"
                              >
                                <HiX className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                    
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                      {loadingCollections ? (
                        <div className="text-center py-4 text-gray-500">טוען קטגוריות...</div>
                      ) : collections.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">לא נמצאו קטגוריות</div>
                      ) : (
                        collections
                          .filter(c => 
                            c.title.toLowerCase().includes(debouncedProductCollectionSearch.toLowerCase())
                          )
                          .map(collection => (
                            <div
                              key={collection.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                productSelectedCollectionIds.includes(collection.id) ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                            >
                              <div
                                className="flex-shrink-0"
                                onClick={(e) => {
                                  // Don't toggle if clicking on checkbox (it handles its own click)
                                  if ((e.target as HTMLElement).closest('label, input[type="checkbox"]')) {
                                    return;
                                  }
                                  e.stopPropagation();
                                  toggleProductCollection(collection.id);
                                }}
                              >
                                <Checkbox
                                  checked={productSelectedCollectionIds.includes(collection.id)}
                                  onCheckedChange={(checked) => {
                                    toggleProductCollection(collection.id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <span 
                                className="text-sm text-gray-700 cursor-pointer flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProductCollection(collection.id);
                                }}
                              >
                                {collection.title}
                              </span>
                            </div>
                          ))
                      )}
                      {collections.filter(c => 
                        c.title.toLowerCase().includes(debouncedProductCollectionSearch.toLowerCase())
                      ).length === 0 && !loadingCollections && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          לא נמצאו קטגוריות
                        </p>
                      )}
                    </div>
                  </>
                )}
                
                {productSelectionMode === 'manual' && (
                  <>
                    <div className="relative">
                      <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="חיפוש מוצרים..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    
                    {productSelectedProductIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {products
                          .filter(p => productSelectedProductIds.includes(p.id))
                          .map(product => (
                            <span
                              key={product.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                            >
                              {product.title}
                              <button
                                type="button"
                                onClick={() => toggleProduct(product.id)}
                                className="hover:text-green-900"
                              >
                                <HiX className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                    
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                      {loadingProducts ? (
                        <div className="text-center py-4 text-gray-500">טוען מוצרים...</div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">לא נמצאו מוצרים</div>
                      ) : (
                        products
                          .filter(p => 
                            !debouncedProductSearch || 
                            p.title.toLowerCase().includes(debouncedProductSearch.toLowerCase())
                          )
                          .map(product => (
                            <div
                              key={product.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                productSelectedProductIds.includes(product.id) ? 'bg-green-50 border border-green-200' : ''
                              }`}
                              onClick={(e) => {
                                // Don't toggle if clicking on checkbox (it handles its own click)
                                if ((e.target as HTMLElement).closest('label, input[type="checkbox"]')) {
                                  return;
                                }
                                toggleProduct(product.id);
                              }}
                            >
                              <Checkbox
                                checked={productSelectedProductIds.includes(product.id)}
                                onCheckedChange={() => toggleProduct(product.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {product.image && (
                                <img src={product.image} alt={product.title} className="w-10 h-10 object-cover rounded" />
                              )}
                              <span className="text-sm text-gray-700 cursor-pointer flex-1">{product.title}</span>
                            </div>
                          ))
                      )}
                      {products.filter(p => 
                        !debouncedProductSearch || 
                        p.title.toLowerCase().includes(debouncedProductSearch.toLowerCase())
                      ).length === 0 && !loadingProducts && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          לא נמצאו מוצרים
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </SettingGroup>
            <SettingGroup title="כללי">
                <div className="space-y-4">
                  {renderInput('כותרת הסקשן', 'title', 'מוצרים מומלצים')}
                  {renderSelect('יישור כותרת', 'title_align', [
                      { label: 'ימין', value: 'right' },
                      { label: 'מרכז', value: 'center' },
                      { label: 'שמאל', value: 'left' },
                  ])}
                </div>
            </SettingGroup>
            <SettingGroup title="פריסה">
                <div className="space-y-4">
                  {renderSelect('מספר מוצרים בשורה (דסקטופ)', 'items_per_row', [
                      { label: '2 מוצרים', value: 2 },
                      { label: '3 מוצרים', value: 3 },
                      { label: '4 מוצרים', value: 4 },
                      { label: '5 מוצרים', value: 5 },
                  ])}
                  {renderSelect('מספר מוצרים בשורה (מובייל)', 'items_per_row_mobile', [
                      { label: '1 מוצר', value: 1 },
                      { label: '2 מוצרים', value: 2 },
                  ])}
                  {renderSelect('כמה מוצרים להציג (דסקטופ)', 'products_count', [
                      { label: '4 מוצרים', value: 4 },
                      { label: '6 מוצרים', value: 6 },
                      { label: '8 מוצרים', value: 8 },
                      { label: '10 מוצרים', value: 10 },
                      { label: '12 מוצרים', value: 12 },
                  ])}
                  {renderSelect('כמה מוצרים להציג (מובייל)', 'products_count_mobile', [
                      { label: '2 מוצרים', value: 2 },
                      { label: '4 מוצרים', value: 4 },
                      { label: '6 מוצרים', value: 6 },
                  ])}
                   {renderSelect('סוג תצוגה', 'display_type', [
                      { label: 'רשת (Grid)', value: 'grid' },
                      { label: 'קרוסלה (Carousel)', value: 'carousel' },
                   ])}
                </div>
            </SettingGroup>
             <SettingGroup title="כרטיס מוצר">
                <div className="space-y-4">
                   {renderSelect('הצג דירוג', 'show_rating', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                   {renderSelect('הצג מחיר', 'show_price', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                   {renderSelect('הצג תגיות', 'show_badges', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    {renderSelect('יישור תוכן מוצר', 'content_align', [
                      { label: 'ימין', value: 'right' },
                      { label: 'מרכז', value: 'center' },
                      { label: 'שמאל', value: 'left' },
                    ])}
                </div>
             </SettingGroup>
             <SettingGroup title="גדלי פונט">
                <div className="space-y-4">
                   {renderSelect('גודל כותרת סקשן', 'title_font_size', [
                      { label: 'קטן', value: 'small' },
                      { label: 'בינוני', value: 'medium' },
                      { label: 'גדול', value: 'large' },
                      { label: 'גדול מאוד', value: 'xlarge' },
                    ])}
                   {renderSelect('גודל כותרת מוצר', 'product_title_font_size', [
                      { label: 'קטן', value: 'small' },
                      { label: 'בינוני', value: 'medium' },
                      { label: 'גדול', value: 'large' },
                      { label: 'גדול מאוד', value: 'xlarge' },
                    ])}
                   {renderSelect('גודל מחיר', 'price_font_size', [
                      { label: 'קטן', value: 'small' },
                      { label: 'בינוני', value: 'medium' },
                      { label: 'גדול', value: 'large' },
                      { label: 'גדול מאוד', value: 'xlarge' },
                    ])}
                </div>
             </SettingGroup>
             <SettingGroup title="עיצוב כרטיס מוצר">
                <div className="space-y-4">
                   {renderInput('עובי מסגרת (px, 0 להסרה)', 'card_border_width', '1', 'number')}
                   {renderInput('צבע מסגרת', 'card_border_color', '#e5e7eb', 'text', undefined, 'ltr')}
                   {renderInput('עיגול פינות (px)', 'card_border_radius', '8', 'number')}
                </div>
             </SettingGroup>
             <SettingGroup title="קישור 'ראה עוד'">
                <div className="space-y-4">
                   {renderSelect('הצג קישור', 'show_view_all', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                   {renderInput('טקסט הקישור', 'view_all_text', 'לכל המוצרים')}
                   {renderInput('כתובת הקישור', 'view_all_url', '/categories/all')}
                </div>
             </SettingGroup>
          </div>
        );

      case 'featured_collections':
        const selectedCollectionIds = getValue('selected_collection_ids', []) as number[];
        const collectionSelectionMode = getValue('collection_selection_mode', 'all') as 'all' | 'manual';
        
        const toggleCollection = (collectionId: number) => {
          const currentIds = selectedCollectionIds || [];
          const newIds = currentIds.includes(collectionId)
            ? currentIds.filter(id => id !== collectionId)
            : [...currentIds, collectionId];
          handleSettingChange('selected_collection_ids', newIds);
        };
        
        return (
            <div className="space-y-1">
                <SettingGroup title="בחירת קטגוריות">
                    <div className="space-y-4">
                        {renderSelect('איזה קטגוריות להציג', 'collection_selection_mode', [
                            { label: 'הצג את כולן', value: 'all' },
                            { label: 'בחר ידנית', value: 'manual' },
                        ])}
                        
                        {collectionSelectionMode === 'all' && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                כל הקטגוריות יוצגו בסקשיין לפי הסדר שלהן במערכת.
                            </p>
                        )}
                        
                        {collectionSelectionMode === 'manual' && (
                            <>
                                <div className="relative">
                                    <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="חיפוש קטגוריות..."
                                        value={collectionSearchTerm}
                                        onChange={(e) => setCollectionSearchTerm(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                
                                {selectedCollectionIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {collections
                                            .filter(c => selectedCollectionIds.includes(c.id))
                                            .map(collection => {
                                                const isSubcategory = collection.parent_id !== null && collection.parent_id !== undefined;
                                                const parentCategory = collections.find(c => c.id === collection.parent_id);
                                                return (
                                                    <span
                                                        key={collection.id}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                                                            isSubcategory 
                                                                ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                        title={isSubcategory ? `תת-קטגוריה של: ${parentCategory?.title || 'לא ידוע'}` : 'קטגוריה ראשית'}
                                                    >
                                                        {collection.title}
                                                        {isSubcategory && (
                                                            <span className="text-xs opacity-75">(תת)</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCollection(collection.id)}
                                                            className="hover:opacity-70"
                                                        >
                                                            <HiX className="w-4 h-4" />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                    </div>
                                )}
                                
                                <div className="max-h-60 overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-3">
                                    {loadingCollections ? (
                                        <div className="text-center py-4 text-gray-500">טוען קטגוריות...</div>
                                    ) : collections.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">לא נמצאו קטגוריות</div>
                                    ) : (() => {
                                        // הפרדה בין קטגוריות ראשיות לתת-קטגוריות
                                        const mainCategories = collections.filter(c => !c.parent_id || c.parent_id === null);
                                        const subCategories = collections.filter(c => c.parent_id !== null && c.parent_id !== undefined);
                                        
                                        return (
                                            <>
                                                {/* קטגוריות ראשיות */}
                                                {mainCategories.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                                                            קטגוריות ראשיות
                                                        </div>
                                                        {mainCategories
                                                            .filter(c => 
                                                                !debouncedCollectionSearch || 
                                                                c.title.toLowerCase().includes(debouncedCollectionSearch.toLowerCase())
                                                            )
                                                            .map(collection => (
                                                                <div
                                                                    key={collection.id}
                                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                                    onClick={() => toggleCollection(collection.id)}
                                                                >
                                                                    <Checkbox
                                                                        checked={selectedCollectionIds.includes(collection.id)}
                                                                        onCheckedChange={() => toggleCollection(collection.id)}
                                                                    />
                                                                    <Label className="cursor-pointer flex-1">{collection.title}</Label>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                                
                                                {/* תת-קטגוריות */}
                                                {subCategories.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs font-semibold text-orange-700 mb-2 pb-1 border-b border-orange-200">
                                                            תת-קטגוריות (לא מומלץ לבחירה)
                                                        </div>
                                                        {subCategories
                                                            .filter(c => 
                                                                !debouncedCollectionSearch || 
                                                                c.title.toLowerCase().includes(debouncedCollectionSearch.toLowerCase())
                                                            )
                                                            .map(collection => {
                                                                const parentCategory = collections.find(c => c.id === collection.parent_id);
                                                                return (
                                                                    <div
                                                                        key={collection.id}
                                                                        className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded cursor-pointer border border-orange-100"
                                                                        onClick={() => toggleCollection(collection.id)}
                                                                        title={`תת-קטגוריה של: ${parentCategory?.title || 'לא ידוע'}`}
                                                                    >
                                                                        <Checkbox
                                                                            checked={selectedCollectionIds.includes(collection.id)}
                                                                            onCheckedChange={() => toggleCollection(collection.id)}
                                                                        />
                                                                        <Label className="cursor-pointer flex-1 text-sm">
                                                                            <span className="text-orange-600">{collection.title}</span>
                                                                            {parentCategory && (
                                                                        <span className="text-xs text-gray-500 mr-2">← {parentCategory.title}</span>
                                                                            )}
                                                                        </Label>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                                
                                                {/* הודעה אם אין תוצאות בחיפוש */}
                                                {debouncedCollectionSearch && 
                                                 mainCategories.filter(c => c.title.toLowerCase().includes(debouncedCollectionSearch.toLowerCase())).length === 0 &&
                                                 subCategories.filter(c => c.title.toLowerCase().includes(debouncedCollectionSearch.toLowerCase())).length === 0 && (
                                                    <div className="text-center py-4 text-gray-500">לא נמצאו קטגוריות התואמות לחיפוש</div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                
                                {/* אזהרה אם נבחרו תת-קטגוריות */}
                                {selectedCollectionIds.some(id => {
                                    const collection = collections.find(c => c.id === id);
                                    return collection && collection.parent_id !== null && collection.parent_id !== undefined;
                                }) && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                                        <strong>שימו לב:</strong> נבחרו תת-קטגוריות. תת-קטגוריות לא יוצגו בדף - רק קטגוריות ראשיות מוצגות.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת הסקשן', 'title', 'קטגוריות פופולריות')}
                        {renderSelect('יישור כותרת', 'title_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>
                <SettingGroup title="גדלי פונט">
                    <div className="space-y-4">
                        {renderSelect('גודל כותרת סקשן', 'title_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                        {renderSelect('גודל כותרת קטגוריה', 'collection_title_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                    </div>
                </SettingGroup>
                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('סוג תצוגה', 'display_type', [
                            { label: 'רשת (Grid)', value: 'grid' },
                            { label: 'סליידר נגלל', value: 'slider' },
                        ])}
                        {getValue('display_type') !== 'slider' && (
                          <>
                            {renderSelect('מספר קטגוריות בשורה (דסקטופ)', 'items_per_row', [
                              { label: '2 קטגוריות', value: 2 },
                              { label: '3 קטגוריות', value: 3 },
                              { label: '4 קטגוריות', value: 4 },
                              { label: '5 קטגוריות', value: 5 },
                              { label: '6 קטגוריות', value: 6 },
                            ])}
                            {renderSelect('מספר קטגוריות בשורה (מובייל)', 'items_per_row_mobile', [
                              { label: '1 קטגוריה', value: 1 },
                              { label: '2 קטגוריות', value: 2 },
                            ])}
                          </>
                        )}
                        {getValue('display_type') === 'slider' && renderSelect('פריטים נראים (מחשב)', 'slider_items_desktop', [
                            { label: '2.5 פריטים', value: 2.5 },
                            { label: '3.5 פריטים', value: 3.5 },
                            { label: '4.5 פריטים', value: 4.5 },
                            { label: '5.5 פריטים', value: 5.5 },
                        ])}
                        {getValue('display_type') === 'slider' && renderSelect('פריטים נראים (מובייל)', 'slider_items_mobile', [
                            { label: '1.2 פריטים', value: 1.2 },
                            { label: '1.5 פריטים', value: 1.5 },
                            { label: '2.2 פריטים', value: 2.2 },
                        ])}
                        {getValue('display_type') === 'slider' && (
                          <>
                            {renderSelect('הצג חיצים', 'show_arrows', [
                              { label: 'כן', value: true },
                              { label: 'לא', value: false },
                            ])}
                            {renderSelect('הצג נקודות', 'show_dots', [
                              { label: 'כן', value: true },
                              { label: 'לא', value: false },
                            ])}
                          </>
                        )}
                        {renderSelect('יישור תוכן קטגוריה', 'content_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                        {renderSelect('הצג מספר מוצרים', 'show_products_count', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ], true)}
                    </div>
                </SettingGroup>
                <SettingGroup title="קישור 'ראה עוד'">
                    <div className="space-y-4">
                       {renderSelect('הצג קישור', 'show_view_all', [
                          { label: 'כן', value: true },
                          { label: 'לא', value: false },
                        ])}
                       {renderInput('טקסט הקישור', 'view_all_text', 'לכל הקטגוריות')}
                       {renderInput('כתובת הקישור', 'view_all_url', '/collections')}
                    </div>
                </SettingGroup>
            </div>
        );

      case 'image_with_text':
        // Find blocks
        const imageBlock = section.blocks?.find(b => b.type === 'image');
        const textBlock = section.blocks?.find(b => b.type === 'text');

        const updateBlockContent = (blockType: string, contentKey: string, value: any) => {
             // Deep clone to avoid mutation issues
             const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
             const blockIndex = newBlocks.findIndex((b: any) => b.type === blockType);
             
             if (blockIndex >= 0) {
                 newBlocks[blockIndex].content = {
                     ...newBlocks[blockIndex].content,
                     [contentKey]: value
                 };
                 onUpdate({ blocks: newBlocks });
             }
        };
        
        const updateBlockStyle = (blockType: string, styleKey: string, value: any) => {
             // Deep clone to avoid mutation issues
             const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
             const blockIndex = newBlocks.findIndex((b: any) => b.type === blockType);
             
             if (blockIndex >= 0) {
                 newBlocks[blockIndex].style = {
                     ...newBlocks[blockIndex].style,
                     [styleKey]: value
                 };
                 onUpdate({ blocks: newBlocks });
             }
        };

        // Check if media is video
        const isVideo = imageBlock?.content?.video_url || 
                       (imageBlock?.content?.image_url && imageBlock.content.image_url.match(/\.(mp4|webm|ogg|mov|avi)$/i));
        const mediaUrl = imageBlock?.content?.video_url || imageBlock?.content?.image_url;

        return (
            <div className="space-y-1">
                <SettingGroup title="מדיה">
                    <div className="space-y-4">
                        {/* Media Type Selector */}
                        <SettingSelect
                            label="סוג מדיה"
                            value={isVideo ? 'video' : 'image'}
                            onChange={(e) => {
                                const newType = e.target.value;
                                if (newType === 'video') {
                                    // Switch to video - clear image_url, keep video_url if exists
                                    updateBlockContent('image', 'image_url', '');
                                } else {
                                    // Switch to image - clear video_url, keep image_url if exists
                                    updateBlockContent('image', 'video_url', '');
                                }
                            }}
                            options={[
                                { label: 'תמונה', value: 'image' },
                                { label: 'וידאו', value: 'video' },
                            ]}
                        />

                        {/* Media Preview */}
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                            {mediaUrl ? (
                                isVideo ? (
                                    <video 
                                        src={mediaUrl} 
                                        className="w-full h-full object-cover"
                                        controls={imageBlock?.content?.video_controls !== false}
                                        autoPlay={imageBlock?.content?.video_autoplay !== false}
                                        muted={imageBlock?.content?.video_muted !== false}
                                        loop={imageBlock?.content?.video_loop === true}
                                        playsInline={imageBlock?.content?.video_playsinline !== false}
                                    />
                                ) : (
                                    <img 
                                        src={mediaUrl} 
                                        alt="Selected" 
                                        className="w-full h-full object-cover"
                                    />
                                )
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-gray-400">
                                    {isVideo ? (
                                        <HiVideoCamera className="w-8 h-8" />
                                    ) : (
                                        <HiPhotograph className="w-8 h-8" />
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setMediaType(isVideo ? 'video' : 'image');
                                    setTargetBlockId(imageBlock?.id || null);
                                    setIsMediaPickerOpen(true);
                                }}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                            >
                                {mediaUrl ? (isVideo ? 'החלף וידאו' : 'החלף תמונה') : (isVideo ? 'בחר וידאו' : 'בחר תמונה')}
                            </button>
                        </div>
                        
                        {/* File size warning for video */}
                        {isVideo && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                גודל מקסימלי: 20 מגה
                            </div>
                        )}

                        {mediaUrl && (
                             <button
                                onClick={() => {
                                    if (isVideo) {
                                        updateBlockContent('image', 'video_url', '');
                                    } else {
                                        updateBlockContent('image', 'image_url', '');
                                    }
                                }}
                                className="text-red-500 text-sm hover:underline"
                            >
                                הסר {isVideo ? 'וידאו' : 'תמונה'}
                            </button>
                        )}

                        {/* Media Height Settings */}
                        {mediaUrl && (
                            <div className="space-y-3 pt-3 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-700">גובה מדיה</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={imageBlock?.content?.media_height?.replace(/[^0-9.]/g, '') || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const unit = imageBlock?.content?.media_height_unit || 'px';
                                            updateBlockContent('image', 'media_height', value ? `${value}${unit}` : '');
                                        }}
                                        placeholder="400"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    />
                                    <select
                                        value={imageBlock?.content?.media_height_unit || 'px'}
                                        onChange={(e) => {
                                            const unit = e.target.value;
                                            const value = imageBlock?.content?.media_height?.replace(/[^0-9.]/g, '') || '';
                                            updateBlockContent('image', 'media_height_unit', unit);
                                            if (value) {
                                                updateBlockContent('image', 'media_height', `${value}${unit}`);
                                            }
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    >
                                        <option value="px">px</option>
                                        <option value="vh">vh</option>
                                        <option value="%">%</option>
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500">השאר ריק לאוטומטי (יחס 4:3)</p>
                            </div>
                        )}
                    </div>
                </SettingGroup>

                {/* Video Settings */}
                {isVideo && mediaUrl && (
                    <SettingGroup title="הגדרות וידאו">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">אוטופליי</label>
                                <input
                                    type="checkbox"
                                    checked={imageBlock?.content?.video_autoplay !== false}
                                    onChange={(e) => updateBlockContent('image', 'video_autoplay', e.target.checked)}
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">השתק</label>
                                <input
                                    type="checkbox"
                                    checked={imageBlock?.content?.video_muted !== false}
                                    onChange={(e) => updateBlockContent('image', 'video_muted', e.target.checked)}
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">לולאה</label>
                                <input
                                    type="checkbox"
                                    checked={imageBlock?.content?.video_loop === true}
                                    onChange={(e) => updateBlockContent('image', 'video_loop', e.target.checked)}
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">בקרות (נגן)</label>
                                <input
                                    type="checkbox"
                                    checked={imageBlock?.content?.video_controls !== false}
                                    onChange={(e) => updateBlockContent('image', 'video_controls', e.target.checked)}
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">נגן אוטומטי במובייל</label>
                                <input
                                    type="checkbox"
                                    checked={imageBlock?.content?.video_playsinline !== false}
                                    onChange={(e) => updateBlockContent('image', 'video_playsinline', e.target.checked)}
                                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                            </div>
                        </div>
                    </SettingGroup>
                )}

                <SettingGroup title="תוכן טקסט">
                    <div className="space-y-4">
                        <SettingInput
                            label="כותרת"
                            value={textBlock?.content?.heading || ''}
                            onChange={(e) => updateBlockContent('text', 'heading', e.target.value)}
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">תוכן</label>
                            <textarea
                                className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md text-sm"
                                value={textBlock?.content?.text || ''}
                                onChange={(e) => updateBlockContent('text', 'text', e.target.value)}
                            />
                        </div>
                         <SettingSelect
                            label="יישור טקסט"
                            value={textBlock?.style?.text_align || 'right'}
                            onChange={(e) => updateBlockStyle('text', 'text_align', e.target.value)}
                            options={[
                                { label: 'ימין', value: 'right' },
                                { label: 'מרכז', value: 'center' },
                                { label: 'שמאל', value: 'left' },
                            ]}
                        />
                    </div>
                </SettingGroup>

                <SettingGroup title="כפתור">
                    <div className="space-y-4">
                        <SettingInput
                            label="טקסט כפתור"
                            value={textBlock?.content?.button_text || ''}
                            onChange={(e) => updateBlockContent('text', 'button_text', e.target.value)}
                        />
                        <SettingInput
                            label="קישור"
                            value={textBlock?.content?.button_url || ''}
                            onChange={(e) => updateBlockContent('text', 'button_url', e.target.value)}
                            dir="ltr"
                        />
                    </div>
                </SettingGroup>

                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('גובה הסקשן', 'height', [
                            { label: 'אוטומטי', value: 'auto' },
                            { label: 'מסך מלא', value: 'full_screen' },
                        ])}
                        {renderSelect('מיקום מדיה', 'layout', [
                            { label: 'מדיה מימין', value: 'image_right' },
                            { label: 'מדיה משמאל', value: 'image_left' },
                        ])}
                         {renderSelect('רוחב מדיה', 'image_width', [
                            { label: 'קטן (30%)', value: 'small' },
                            { label: 'בינוני (50%)', value: 'medium' },
                            { label: 'גדול (70%)', value: 'large' },
                        ])}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="גדלי פונט">
                    <div className="space-y-4">
                        {renderSelect('גודל כותרת', 'heading_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                        {renderSelect('גודל טקסט', 'text_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
        );
      
      case 'rich_text':
          const richTextBlocks = section.blocks?.filter(b => b.type === 'text') || [];
          const mainTextBlock = richTextBlocks[0] || null;
          
          const updateRichTextBlock = (blockId: string, updates: any) => {
              const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
              const blockIndex = newBlocks.findIndex((b: any) => b.id === blockId);
              if (blockIndex >= 0) {
                  newBlocks[blockIndex].content = { ...newBlocks[blockIndex].content, ...updates };
                  onUpdate({ blocks: newBlocks });
              }
          };
          
          const addRichTextBlock = () => {
              const newBlock = {
                  id: `rt-${Date.now()}`,
                  type: 'text' as const,
                  content: {
                      heading: '',
                      text: ''
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeRichTextBlock = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter((b: any) => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };
          
          return (
            <div className="space-y-1">
                <SettingGroup title="תוכן" defaultOpen={true}>
                    <div className="space-y-4">
                        {richTextBlocks.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-sm text-gray-500 mb-3">אין בלוקי טקסט</p>
                                <button
                                    onClick={addRichTextBlock}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                                >
                                    הוסף בלוק טקסט
                                </button>
                            </div>
                        ) : (
                            richTextBlocks.map((block, index) => (
                                <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">בלוק טקסט {index + 1}</span>
                                        {richTextBlocks.length > 1 && (
                                            <button
                                                onClick={() => removeRichTextBlock(block.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                title="מחק בלוק"
                                            >
                                                <HiTrash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Heading */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <label className="block text-xs font-medium text-gray-600 flex-1">כותרת (אופציונלי)</label>
                                            <button 
                                                onClick={(e) => {
                                                    setTypographyAnchor(e.currentTarget);
                                                    setSelectedBlockId(block.id);
                                                    setSelectedSectionType('rich_text');
                                                }}
                                                className={`p-1 rounded transition-colors ${selectedBlockId === block.id && typographyAnchor ? 'text-gray-800 bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                                                title="ערוך טיפוגרפיה"
                                            >
                                                <span className="text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={block.content?.heading || ''}
                                            onChange={(e) => updateRichTextBlock(block.id, { heading: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                            placeholder="כותרת..."
                                        />
                                    </div>
                                    
                                    {/* Rich Text Editor */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">תוכן</label>
                                        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                                            <RichTextEditor
                                                value={block.content?.text || ''}
                                                onChange={(html) => updateRichTextBlock(block.id, { text: html })}
                                                placeholder="הזן טקסט עשיר כאן... ניתן להוסיף קישורים, רשימות, עיצוב וכו'"
                                                className="min-h-[200px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        
                        {richTextBlocks.length > 0 && (
                            <button
                                onClick={addRichTextBlock}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2 text-sm"
                            >
                                <HiPlus className="w-4 h-4" />
                                הוסף בלוק טקסט נוסף
                            </button>
                        )}
                    </div>
                </SettingGroup>
                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('יישור תוכן', 'content_align', [
                             { label: 'ימין', value: 'right' },
                             { label: 'מרכז', value: 'center' },
                             { label: 'שמאל', value: 'left' },
                        ])}
                        {renderSelect('רוחב תוכן', 'content_width', [
                             { label: 'צר', value: 'narrow' },
                             { label: 'רגיל', value: 'regular' },
                             { label: 'רחב', value: 'wide' },
                        ])}
                    </div>
                </SettingGroup>
                <SettingGroup title="גדלי פונט">
                    <div className="space-y-4">
                        {renderSelect('גודל כותרת', 'heading_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                        {renderSelect('גודל טקסט', 'text_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'newsletter':
          return (
            <div className="space-y-1">
                 <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderSelect('גובה הסקשן', 'height', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                        ])}
                        {renderSelect('רוחב תוכן', 'content_width', [
                             { label: 'צר', value: 'narrow' },
                             { label: 'רגיל', value: 'regular' },
                        ])}
                        {renderInput('הודעת הצלחה', 'success_message', 'תודה שנרשמת!')}
                    </div>
                </SettingGroup>

                <SettingGroup title="אישורים והסכמות">
                    <div className="space-y-4">
                        {renderSelect('הצג אישור מדיניות פרטיות', 'show_privacy_consent', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                        {getValue('show_privacy_consent') !== false && renderInput('טקסט מדיניות פרטיות', 'privacy_text', 'אני מאשר/ת את מדיניות הפרטיות')}
                        {getValue('show_privacy_consent') !== false && renderInput('קישור למדיניות', 'privacy_url', '/privacy-policy', 'text', undefined, 'ltr')}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'gallery':
          const galleryImageBlocks = section.blocks?.filter(b => b.type === 'image') || [];
          
          // ✅ פונקציה להוספת מספר תמונות בבת אחת (יותר יעיל)
          const addGalleryImages = (imageUrls: string[]) => {
              if (!imageUrls || imageUrls.length === 0) return;
              
              const timestamp = Date.now();
              const newBlocks = imageUrls.map((imageUrl, index) => ({
                  id: `gallery-image-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'image' as const,
                  content: {
                      image_url: imageUrl,
                      alt_text: ''
                  },
                  style: {},
                  settings: {}
              }));
              
              // ✅ הוסף את כל ה-blocks בבת אחת
              onUpdate({
                  blocks: [...(section.blocks || []), ...newBlocks]
              });
          };
          
          // ✅ פונקציה להוספת תמונה אחת (למקרה של fallback)
          const addGalleryImage = (imageUrl: string) => {
              addGalleryImages([imageUrl]);
          };
          
          const removeGalleryImage = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };
          
          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת הסקשן', 'title', 'גלריה')}
                        {renderSelect('יישור כותרת', 'title_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="תמונות">
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                setMediaType('image');
                                setTargetBlockId(null);
                                setIsMediaPickerOpen(true);
                                // ✅ Store callbacks to add images (both single and multiple)
                                (window as any).__galleryAddImage = addGalleryImage;
                                (window as any).__galleryAddImages = addGalleryImages;
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-sm font-medium"
                        >
                            <HiPhotograph className="w-5 h-5" />
                            הוסף תמונות
                        </button>
                        
                        {galleryImageBlocks.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {galleryImageBlocks.map((block) => (
                                    <div key={block.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                        {block.content?.image_url ? (
                                            <img src={block.content.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <HiPhotograph className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeGalleryImage(block.id)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <HiTrash className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('מספר עמודות', 'items_per_row', [
                            { label: '2 עמודות', value: 2 },
                            { label: '3 עמודות', value: 3 },
                            { label: '4 עמודות', value: 4 },
                            { label: '5 עמודות', value: 5 },
                            { label: '6 עמודות', value: 6 },
                        ])}
                        {renderSelect('סוג תצוגה', 'display_type', [
                            { label: 'רשת (Grid)', value: 'grid' },
                            { label: 'קרוסלה (Carousel)', value: 'carousel' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'slideshow':
          const slides = section.blocks?.filter(b => b.type === 'image') || [];
          
          // Add a new slide with optional image
          const addSlide = (imageUrl?: string) => {
              const newBlock = {
                  id: `slide-${Date.now()}`,
                  type: 'image' as const,
                  content: {
                      image_url: imageUrl || '',
                      heading: 'כותרת חדשה',
                      subheading: 'תת כותרת',
                      button_text: 'כפתור',
                      button_url: '#'
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeSlide = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };

          const updateSlide = (blockId: string, updates: any) => {
             // Deep clone to avoid mutation issues
             const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
             const index = newBlocks.findIndex((b: any) => b.id === blockId);
             if (index >= 0) {
                 newBlocks[index].content = { ...newBlocks[index].content, ...updates };
                 onUpdate({ blocks: newBlocks });
             }
          };

          // ✅ Open media picker for specific slide image/video
          const openSlideMediaPicker = (slideId: string, device: 'desktop' | 'mobile', mediaType: 'image' | 'video' | 'auto' = 'auto') => {
              setMediaType(mediaType);
              setTargetBlockId(slideId);
              setImageDeviceTarget(device);
              setIsMediaPickerOpen(true);
          };

          return (
            <div className="space-y-1">
                <SettingGroup title="הגדרות מצגת">
                    <div className="space-y-4">
                        {renderSelect('גובה', 'height', [
                            { label: 'קטן (40vh)', value: 'small' },
                            { label: 'בינוני (60vh)', value: 'medium' },
                            { label: 'גדול (80vh)', value: 'large' },
                            { label: 'מסך מלא (100vh)', value: 'full' },
                        ])}
                        {renderSelect('ניגון אוטומטי', 'autoplay', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                        {getValue('autoplay') && renderInput('מהירות (שניות)', 'autoplay_speed', '5', 'number')}
                    </div>
                </SettingGroup>

                <SettingGroup title="הגדרות מדיה (תמונה/וידאו)">
                    <div className="space-y-4">
                        {renderSelect('גודל מדיה', 'image_fit', [
                            { label: 'כיסוי (Cover)', value: 'cover' },
                            { label: 'הכל (Contain)', value: 'contain' },
                            { label: 'מילוי (Fill)', value: 'fill' },
                        ])}
                        {renderSelect('מיקום מדיה', 'image_position', [
                            { label: 'מרכז', value: 'center' },
                            { label: 'למעלה', value: 'top' },
                            { label: 'למטה', value: 'bottom' },
                            { label: 'שמאל', value: 'left' },
                            { label: 'ימין', value: 'right' },
                            { label: 'למעלה שמאל', value: 'top left' },
                            { label: 'למעלה ימין', value: 'top right' },
                            { label: 'למטה שמאל', value: 'bottom left' },
                            { label: 'למטה ימין', value: 'bottom right' },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="מיקום תוכן">
                    <div className="space-y-4">
                        {renderSelect('מיקום אנכי', 'content_position_vertical', [
                            { label: 'למעלה', value: 'top' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'למטה', value: 'bottom' },
                        ])}
                        {renderSelect('מיקום אופקי', 'content_position_horizontal', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                        {renderSelect('יישור טקסט', 'text_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="שקופיות">
                    <div className="space-y-4">
                        <button
                            onClick={() => addSlide()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-sm font-medium"
                        >
                            <HiPlus className="w-5 h-5" />
                            הוסף שקופית
                        </button>

                        <div className="space-y-3">
                            {slides.map((slide, index) => (
                                <div key={slide.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-medium text-sm">שקופית {index + 1}</div>
                                        <button onClick={() => removeSlide(slide.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <HiTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    {/* ✅ Mobile + Desktop Media (Image/Video) */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {/* Mobile */}
                                        <div className="space-y-2">
                                            <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                <HiDeviceMobile className="w-3 h-3" /> מובייל
                                            </div>
                                            {slide.content?.video_url_mobile ? (
                                                <div className="relative group border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '120px' }}>
                                                    <video src={slide.content.video_url_mobile} className="w-full h-full object-cover" muted loop playsInline />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <HiVideoCamera className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="absolute top-1 left-1 flex gap-1">
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'mobile', 'video')}
                                                            className="p-1 bg-blue-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה וידאו"
                                                        >
                                                            <HiVideoCamera className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'mobile', 'image')}
                                                            className="p-1 bg-green-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה לתמונה"
                                                        >
                                                            <HiPhotograph className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : slide.content?.image_url_mobile ? (
                                                <div className="relative group border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '120px' }}>
                                                    <img src={slide.content.image_url_mobile} className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 left-1 flex gap-1">
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'mobile', 'image')}
                                                            className="p-1 bg-green-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה תמונה"
                                                        >
                                                            <HiPhotograph className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'mobile', 'video')}
                                                            className="p-1 bg-blue-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה לווידאו"
                                                        >
                                                            <HiVideoCamera className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openSlideMediaPicker(slide.id, 'mobile', 'image')}
                                                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-1"
                                                        style={{ height: '120px' }}
                                                    >
                                                        <HiPhotograph className="w-6 h-6 text-gray-400" />
                                                        <span className="text-[10px] text-gray-400">תמונה</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openSlideMediaPicker(slide.id, 'mobile', 'video')}
                                                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-1"
                                                        style={{ height: '120px' }}
                                                    >
                                                        <HiVideoCamera className="w-6 h-6 text-gray-400" />
                                                        <span className="text-[10px] text-gray-400">וידאו</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop */}
                                        <div className="space-y-2">
                                            <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                <HiDesktopComputer className="w-3 h-3" /> מחשב
                                            </div>
                                            {slide.content?.video_url ? (
                                                <div className="relative group border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '120px' }}>
                                                    <video src={slide.content.video_url} className="w-full h-full object-cover" muted loop playsInline />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <HiVideoCamera className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="absolute top-1 left-1 flex gap-1">
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'desktop', 'video')}
                                                            className="p-1 bg-blue-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה וידאו"
                                                        >
                                                            <HiVideoCamera className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'desktop', 'image')}
                                                            className="p-1 bg-green-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה לתמונה"
                                                        >
                                                            <HiPhotograph className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : slide.content?.image_url ? (
                                                <div className="relative group border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '120px' }}>
                                                    <img src={slide.content.image_url} className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 left-1 flex gap-1">
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'desktop', 'image')}
                                                            className="p-1 bg-green-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה תמונה"
                                                        >
                                                            <HiPhotograph className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => openSlideMediaPicker(slide.id, 'desktop', 'video')}
                                                            className="p-1 bg-blue-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="שנה לווידאו"
                                                        >
                                                            <HiVideoCamera className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openSlideMediaPicker(slide.id, 'desktop', 'image')}
                                                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-1"
                                                        style={{ height: '120px' }}
                                                    >
                                                        <HiPhotograph className="w-6 h-6 text-gray-400" />
                                                        <span className="text-[10px] text-gray-400">תמונה</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openSlideMediaPicker(slide.id, 'desktop', 'video')}
                                                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-1"
                                                        style={{ height: '120px' }}
                                                    >
                                                        <HiVideoCamera className="w-6 h-6 text-gray-400" />
                                                        <span className="text-[10px] text-gray-400">וידאו</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                className="flex-1 text-xs p-2 border rounded" 
                                                placeholder="כותרת"
                                                value={slide.content?.heading || ''}
                                                onChange={(e) => updateSlide(slide.id, { heading: e.target.value })}
                                            />
                                            <button 
                                                onClick={(e) => {
                                                    setTypographyAnchor(e.currentTarget);
                                                    setSelectedBlockId(slide.id);
                                                    setSelectedSectionType('slideshow');
                                                }}
                                                className={`p-1 rounded transition-colors ${selectedBlockId === slide.id && typographyAnchor ? 'text-gray-800 bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                                                title="ערוך טיפוגרפיה"
                                            >
                                                <span className="text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
                                            </button>
                                        </div>
                                        <input 
                                            className="w-full text-xs p-2 border rounded" 
                                            placeholder="תת כותרת"
                                            value={slide.content?.subheading || ''}
                                            onChange={(e) => updateSlide(slide.id, { subheading: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="טקסט כפתור"
                                                value={slide.content?.button_text || ''}
                                                onChange={(e) => updateSlide(slide.id, { button_text: e.target.value })}
                                            />
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="לינק"
                                                value={slide.content?.button_url || ''}
                                                onChange={(e) => updateSlide(slide.id, { button_url: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SettingGroup>
                
                <SettingGroup title="גדלי פונט">
                    <div className="space-y-4">
                        {renderSelect('גודל כותרת שקופית', 'slide_heading_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                        {renderSelect('גודל תת כותרת שקופית', 'slide_subheading_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'testimonials':
          const testimonials = section.blocks?.filter(b => b.type === 'text') || [];
          
          const addTestimonial = () => {
              const newBlock = {
                  id: `testim-${Date.now()}`,
                  type: 'text' as const,
                  content: {
                      text: 'המלצה חדשה...',
                      heading: 'שם לקוח',
                      subheading: 'לקוח מאומת'
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeTestimonial = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };

          const updateTestimonial = (blockId: string, updates: any) => {
             // Deep clone to avoid mutation issues
             const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
             const index = newBlocks.findIndex((b: any) => b.id === blockId);
             if (index >= 0) {
                 newBlocks[index].content = { ...newBlocks[index].content, ...updates };
                 onUpdate({ blocks: newBlocks });
             }
          };

          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'לקוחות מספרים')}
                        {renderInput('תת כותרת', 'subtitle', 'מה חושבים עלינו')}
                        {renderSelect('מספר עמודות', 'columns', [
                            { label: '2', value: 2 },
                            { label: '3', value: 3 },
                            { label: '4', value: 4 },
                        ])}
                        {renderSelect('יישור טקסט', 'text_align', [
                            { label: 'ימין', value: 'right' },
                            { label: 'מרכז', value: 'center' },
                            { label: 'שמאל', value: 'left' },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="המלצות">
                    <div className="space-y-4">
                        <button
                            onClick={addTestimonial}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-sm font-medium"
                        >
                            <HiPlus className="w-5 h-5" />
                            הוסף המלצה
                        </button>

                        <div className="space-y-3">
                            {testimonials.map((item, index) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex-1 font-medium text-sm">המלצה {index + 1}</div>
                                        <button onClick={() => removeTestimonial(item.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <HiTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <textarea 
                                            className="w-full text-xs p-2 border rounded resize-none" 
                                            placeholder="תוכן ההמלצה"
                                            rows={2}
                                            value={item.content?.text || ''}
                                            onChange={(e) => updateTestimonial(item.id, { text: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="שם לקוח"
                                                value={item.content?.heading || ''}
                                                onChange={(e) => updateTestimonial(item.id, { heading: e.target.value })}
                                            />
                                            <input 
                                                className="w-1/2 text-xs p-2 border rounded" 
                                                placeholder="תיאור (לקוח מאומת)"
                                                value={item.content?.subheading || ''}
                                                onChange={(e) => updateTestimonial(item.id, { subheading: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SettingGroup>
            </div>
          );

      case 'faq':
          const faqItems = section.blocks?.filter(b => b.type === 'text') || [];
          
          const addFaq = () => {
              const newBlock = {
                  id: `faq-${Date.now()}`,
                  type: 'text' as const,
                  content: {
                      heading: 'שאלה חדשה?',
                      text: 'תשובה...'
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeFaq = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };

          const updateFaq = (blockId: string, updates: any) => {
             // Deep clone to avoid mutation issues
             const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
             const index = newBlocks.findIndex((b: any) => b.id === blockId);
             if (index >= 0) {
                 newBlocks[index].content = { ...newBlocks[index].content, ...updates };
                 onUpdate({ blocks: newBlocks });
             }
          };

          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'שאלות ותשובות')}
                        {renderInput('תת כותרת', 'subtitle', 'כל המידע שחשוב לדעת')}
                        {renderSelect('רוחב', 'width', [
                            { label: 'רגיל', value: 'regular' },
                            { label: 'צר', value: 'narrow' },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="שאלות">
                    <div className="space-y-4">
                        <button
                            onClick={addFaq}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-sm font-medium"
                        >
                            <HiPlus className="w-5 h-5" />
                            הוסף שאלה
                        </button>

                        <div className="space-y-3">
                            {faqItems.map((item, index) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex-1 font-medium text-sm">שאלה {index + 1}</div>
                                        <button onClick={() => removeFaq(item.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <HiTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <input 
                                            className="w-full text-xs p-2 border rounded" 
                                            placeholder="השאלה"
                                            value={item.content?.heading || ''}
                                            onChange={(e) => updateFaq(item.id, { heading: e.target.value })}
                                        />
                                        <textarea 
                                            className="w-full text-xs p-2 border rounded resize-none" 
                                            placeholder="התשובה"
                                            rows={2}
                                            value={item.content?.text || ''}
                                            onChange={(e) => updateFaq(item.id, { text: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SettingGroup>
                
                <SettingGroup title="גדלי פונט">
                    <div className="space-y-4">
                        {renderSelect('גודל כותרת', 'title_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                        {renderSelect('גודל תת כותרת', 'subtitle_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                        {renderSelect('גודל שאלה', 'question_font_size', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                            { label: 'גדול מאוד', value: 'xlarge' },
                        ])}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'video':
          return (
            <div className="space-y-1">
                <SettingGroup title="תוכן">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'כותרת הוידאו')}
                        {renderInput('תיאור', 'description', 'תיאור קצר מתחת לוידאו')}
                    </div>
                </SettingGroup>
                
                <SettingGroup title="קובץ וידאו">
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                            {section.settings?.video_url ? (
                                <div className="space-y-2">
                                    <video src={section.settings.video_url} className="w-full rounded h-32 object-cover bg-black" />
                                    <div className="flex gap-2 justify-center">
                                        <button 
                                            onClick={() => {
                                                setMediaType('video');
                                                setTargetBlockId('video-main'); // Custom ID logic
                                                // Handle video update manually
                                                handleSettingChange('video_url', '');
                                            }}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            הסר וידאו
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setMediaType('video');
                                        setTargetBlockId(null);
                                        setIsMediaPickerOpen(true);
                                        // Update handleMediaSelect to check for video section
                                        (window as any).__videoSelect = (url: string) => handleSettingChange('video_url', url);
                                    }}
                                    className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700"
                                >
                                    <HiVideoCamera className="w-8 h-8" />
                                    <span className="text-sm">בחר וידאו</span>
                                </button>
                            )}
                        </div>
                        {renderInput('תמונת כיסוי (URL)', 'cover_image', 'https://...', 'text', 'אופציונלי', 'ltr')}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'contact_form':
          return (
            <div className="space-y-1">
                <SettingGroup title="כללי">
                    <div className="space-y-4">
                        {renderInput('כותרת', 'title', 'צור קשר')}
                        {renderInput('תת כותרת', 'subtitle', 'נשמח לשמוע מכם')}
                        {renderInput('טקסט כפתור שליחה', 'submit_text', 'שלח הודעה')}
                        {renderInput('הודעת הצלחה', 'success_message', 'ההודעה נשלחה בהצלחה!')}
                    </div>
                </SettingGroup>

                <SettingGroup title="שדות הטופס">
                    <div className="space-y-4">
                        {renderSelect('הצג שדה אימייל', 'show_email', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                        {renderSelect('הצג שדה טלפון', 'show_phone', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                        {renderSelect('הצג שדה נושא', 'show_subject', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="אישורים והסכמות">
                    <div className="space-y-4">
                        {renderSelect('הצג אישור מדיניות פרטיות', 'show_privacy_consent', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                        {getValue('show_privacy_consent') !== false && renderInput('טקסט מדיניות פרטיות', 'privacy_text', 'אני מאשר/ת את מדיניות הפרטיות')}
                        {getValue('show_privacy_consent') !== false && renderInput('קישור למדיניות', 'privacy_url', '/privacy-policy', 'text', undefined, 'ltr')}
                        
                        {renderSelect('הצג אישור קבלת דיוור', 'show_marketing_consent', [
                            { label: 'כן', value: true },
                            { label: 'לא', value: false },
                        ])}
                        {getValue('show_marketing_consent') === true && renderInput('טקסט אישור דיוור', 'marketing_text', 'אני מאשר/ת לקבל עדכונים ומבצעים במייל')}
                    </div>
                </SettingGroup>
            </div>
          );

      case 'logo_list':
          const logoBlocks = section.blocks?.filter(b => b.type === 'image') || [];
          
          const addLogo = (imageUrl?: string) => {
              const newBlock = {
                  id: `logo-${Date.now()}`,
                  type: 'image' as const,
                  content: {
                      image_url: imageUrl || '',
                      title: '',
                      description: '',
                      link_url: ''
                  },
                  style: {},
                  settings: {}
              };
              onUpdate({
                  blocks: [...(section.blocks || []), newBlock]
              });
          };
          
          const removeLogo = (blockId: string) => {
              const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
              onUpdate({ blocks: newBlocks });
          };

          const updateLogo = (blockId: string, updates: any) => {
             // Deep clone to avoid mutation issues
             const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
             const index = newBlocks.findIndex((b: any) => b.id === blockId);
             if (index >= 0) {
                 newBlocks[index].content = { ...newBlocks[index].content, ...updates };
                 onUpdate({ blocks: newBlocks });
             }
          };

          const openLogoImagePicker = (logoId: string) => {
              setMediaType('image');
              setTargetBlockId(logoId);
              setImageDeviceTarget('desktop');
              setIsMediaPickerOpen(true);
          };

          return (
            <div className="space-y-1">
                <SettingGroup title="כותרות">
                    <div className="space-y-4">
                        {renderInput('כותרת ראשית', 'heading', 'המותגים שלנו')}
                        {renderInput('תת כותרת', 'subheading', 'אנחנו עובדים עם המותגים המובילים בעולם')}
                    </div>
                </SettingGroup>

                <SettingGroup title="פריסה">
                    <div className="space-y-4">
                        {renderSelect('סוג תצוגה', 'display_type', [
                            { label: 'רשת (Grid)', value: 'grid' },
                            { label: 'סליידר נגלל', value: 'slider' },
                        ])}
                        {renderSelect('רוחב סקשן', 'section_width', [
                            { label: 'קונטיינר (מרכז)', value: 'container' },
                            { label: 'רוחב מלא', value: 'full' },
                        ])}
                        {getValue('display_type') !== 'slider' && renderSelect('לוגואים בשורה (מחשב)', 'items_per_row_desktop', [
                            { label: '1', value: 1 },
                            { label: '2', value: 2 },
                            { label: '3', value: 3 },
                            { label: '4', value: 4 },
                            { label: '5', value: 5 },
                            { label: '6', value: 6 },
                            { label: '7', value: 7 },
                            { label: '8', value: 8 },
                            { label: '9', value: 9 },
                            { label: '10', value: 10 },
                            { label: '11', value: 11 },
                            { label: '12', value: 12 },
                        ])}
                        {renderSelect('לוגואים בשורה (מובייל)', 'items_per_row_mobile', [
                            { label: '1', value: 1 },
                            { label: '2', value: 2 },
                            { label: '3', value: 3 },
                            { label: '4', value: 4 },
                        ])}
                        {renderInput('גובה לוגו (px)', 'logo_height', '80', 'number')}
                        {renderInput('רוחב לוגו (px, השאר אוטו)', 'logo_width', '', 'number', 'השאר ריק לאוטומטי')}
                        {renderSelect('ריווח בין לוגואים', 'logo_gap', [
                            { label: 'קטן', value: 'small' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'גדול', value: 'large' },
                        ])}
                        {renderSelect('אפקט גווני אפור', 'grayscale_enabled', [
                            { label: 'מופעל (צבע בהובר)', value: true },
                            { label: 'כבוי', value: false },
                        ])}
                    </div>
                </SettingGroup>

                <SettingGroup title="כפתור פעולה">
                    <div className="space-y-4">
                        {renderInput('טקסט כפתור', 'button_text', '')}
                        {renderInput('קישור כפתור', 'button_url', '#', 'text', undefined, 'ltr')}
                    </div>
                </SettingGroup>

                <SettingGroup title="לוגואים">
                    <div className="space-y-4">
                        <button
                            onClick={() => addLogo()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-sm font-medium"
                        >
                            <HiPlus className="w-5 h-5" />
                            הוסף לוגו
                        </button>

                        <div className="space-y-3">
                            {logoBlocks.map((logo, index) => (
                                <div key={logo.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-medium text-sm">לוגו {index + 1}</div>
                                        <button onClick={() => removeLogo(logo.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <HiTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    {/* Logo Image */}
                                    <div className="mb-3">
                                        {logo.content?.image_url ? (
                                            <div className="relative group border-2 border-gray-300 rounded-lg overflow-hidden bg-white p-4" style={{ height: '100px' }}>
                                                <img src={logo.content.image_url} className="w-full h-full object-contain" />
                                                <button
                                                    onClick={() => openLogoImagePicker(logo.id)}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <HiRefresh className="w-5 h-5 text-white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => openLogoImagePicker(logo.id)}
                                                className="w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all flex items-center justify-center"
                                                style={{ height: '100px' }}
                                            >
                                                <HiPhotograph className="w-8 h-8 text-gray-400" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                className="flex-1 text-xs p-2 border rounded" 
                                                placeholder="כותרת (אופציונלי)"
                                                value={logo.content?.title || ''}
                                                onChange={(e) => updateLogo(logo.id, { title: e.target.value })}
                                            />
                                            <button 
                                                onClick={(e) => {
                                                    setTypographyAnchor(e.currentTarget);
                                                    setSelectedBlockId(logo.id);
                                                    setSelectedSectionType('logo_list');
                                                }}
                                                className={`p-1 rounded transition-colors ${selectedBlockId === logo.id && typographyAnchor ? 'text-gray-800 bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                                                title="ערוך טיפוגרפיה"
                                            >
                                                <span className="text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
                                            </button>
                                        </div>
                                        <textarea 
                                            className="w-full text-xs p-2 border rounded" 
                                            placeholder="תוכן (אופציונלי)"
                                            rows={2}
                                            value={logo.content?.description || ''}
                                            onChange={(e) => updateLogo(logo.id, { description: e.target.value })}
                                        />
                                        <input 
                                            className="w-full text-xs p-2 border rounded" 
                                            placeholder="קישור (אופציונלי)"
                                            dir="ltr"
                                            value={logo.content?.link_url || ''}
                                            onChange={(e) => updateLogo(logo.id, { link_url: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SettingGroup>
            </div>
          );

      case 'footer':
        const columnsCount = getValue('columns_count', 4);
        const columns = getValue('columns', []) || [];
        
        // Ensure columns array matches columns_count
        const ensureColumns = () => {
          const currentColumns = [...columns];
          while (currentColumns.length < columnsCount) {
            currentColumns.push({ 
              type: 'menu', 
              title: '', 
              menu_id: null, 
              text: '', 
              image_url: '',
              newsletter_title: '',
              newsletter_content: '',
              newsletter_button_bg: '#000000',
              newsletter_button_text: '#FFFFFF'
            });
          }
          while (currentColumns.length > columnsCount) {
            currentColumns.pop();
          }
          return currentColumns;
        };

        const updateColumn = (index: number, updates: any) => {
          const updatedColumns = ensureColumns();
          updatedColumns[index] = { ...updatedColumns[index], ...updates };
          handleSettingChange('columns', updatedColumns);
        };

        const addColumn = () => {
          const updatedColumns = ensureColumns();
          updatedColumns.push({ type: 'menu', title: '', menu_id: null, text: '', image_url: '' });
          handleSettingChange('columns', updatedColumns);
          handleSettingChange('columns_count', updatedColumns.length);
        };

        return (
          <div className="space-y-1">
            <SettingGroup title="עמודות">
              <div className="space-y-4">
                {renderSelect('מספר עמודות', 'columns_count', [
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                  { label: '3', value: 3 },
                  { label: '4', value: 4 },
                ])}
              </div>
            </SettingGroup>

            {Array.from({ length: columnsCount }).map((_, index) => {
              const currentColumns = ensureColumns();
              const column = currentColumns[index] || { type: 'menu', title: '', menu_id: null, text: '', image_url: '' };
              const columnType = column.type || 'menu';
              
              return (
                <SettingGroup key={index} title={`עמודה ${index + 1}`}>
                  <div className="space-y-4">
                    {renderInput(`כותרת עמודה ${index + 1}`, `columns.${index}.title`, '', 'text', 'אופציונלי')}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">סוג תוכן</label>
                      <select
                        value={columnType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const resetData: any = { type: newType };
                          if (newType !== 'menu') resetData.menu_id = null;
                          if (newType !== 'text') resetData.text = '';
                          if (newType !== 'image') resetData.image_url = '';
                          if (newType !== 'newsletter') {
                            resetData.newsletter_title = '';
                            resetData.newsletter_content = '';
                            resetData.newsletter_button_bg = '#000000';
                            resetData.newsletter_button_text = '#FFFFFF';
                          }
                          updateColumn(index, resetData);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="menu">תפריט</option>
                        <option value="text">טקסט</option>
                        <option value="image">תמונה</option>
                        <option value="newsletter">ניוזלטר</option>
                      </select>
                    </div>

                    {columnType === 'newsletter' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">כותרת</label>
                          <input
                            type="text"
                            value={column.newsletter_title || ''}
                            onChange={(e) => {
                              const currentColumn = ensureColumns()[index] || {};
                              updateColumn(index, { ...currentColumn, newsletter_title: e.target.value });
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            placeholder="כותרת הניוזלטר"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">תוכן</label>
                          <textarea
                            value={column.newsletter_content || ''}
                            onChange={(e) => {
                              const currentColumn = ensureColumns()[index] || {};
                              updateColumn(index, { ...currentColumn, newsletter_content: e.target.value });
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]"
                            placeholder="תוכן הניוזלטר"
                          />
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">צבע רקע כפתור</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={column.newsletter_button_bg || '#000000'}
                                onChange={(e) => {
                                  const currentColumn = ensureColumns()[index] || {};
                                  updateColumn(index, { ...currentColumn, newsletter_button_bg: e.target.value });
                                }}
                                className="w-12 h-10 border border-gray-200 rounded cursor-pointer flex-shrink-0"
                              />
                              <input
                                type="text"
                                value={column.newsletter_button_bg || '#000000'}
                                onChange={(e) => {
                                  const currentColumn = ensureColumns()[index] || {};
                                  updateColumn(index, { ...currentColumn, newsletter_button_bg: e.target.value });
                                }}
                                className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                placeholder="#000000"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">צבע טקסט כפתור</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={column.newsletter_button_text || '#FFFFFF'}
                                onChange={(e) => {
                                  const currentColumn = ensureColumns()[index] || {};
                                  updateColumn(index, { ...currentColumn, newsletter_button_text: e.target.value });
                                }}
                                className="w-12 h-10 border border-gray-200 rounded cursor-pointer flex-shrink-0"
                              />
                              <input
                                type="text"
                                value={column.newsletter_button_text || '#FFFFFF'}
                                onChange={(e) => {
                                  const currentColumn = ensureColumns()[index] || {};
                                  updateColumn(index, { ...currentColumn, newsletter_button_text: e.target.value });
                                }}
                                className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                placeholder="#FFFFFF"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {columnType === 'menu' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">בחר תפריט</label>
                        <select
                          value={column.menu_id ? String(column.menu_id) : ''}
                          onChange={(e) => {
                            const menuId = e.target.value ? parseInt(e.target.value) : null;
                            const currentColumn = ensureColumns()[index] || { type: 'menu', title: '', menu_id: null, text: '', image_url: '' };
                            updateColumn(index, { ...currentColumn, menu_id: menuId });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="">-- בחר תפריט --</option>
                          {loadingMenus ? (
                            <option value="" disabled>טוען תפריטים...</option>
                          ) : (
                            navigationMenus.map((menu) => (
                              <option key={menu.id} value={menu.id}>
                                {menu.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}

                    {columnType === 'text' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">הכנס טקסט</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <RichTextEditor
                            value={column.text || ''}
                            onChange={(html) => {
                              const currentColumn = ensureColumns()[index] || {};
                              updateColumn(index, { ...currentColumn, text: html });
                            }}
                            placeholder="הכנס את הטקסט כאן... ניתן להוסיף קישורים, שורות וכו'"
                            className="min-h-[150px]"
                          />
                        </div>
                      </div>
                    )}

                    {columnType === 'image' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">בחר תמונה</label>
                        {column.image_url ? (
                          <div className="relative group">
                            <img 
                              src={column.image_url} 
                              alt="תמונה" 
                              className="w-full h-32 object-cover bg-gray-100 rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setMediaType('image');
                                  setTargetBlockId(`footer-column-${index}`);
                                  setIsMediaPickerOpen(true);
                                }}
                                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                                title="החלף תמונה"
                              >
                                <HiRefresh className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateColumn(index, { image_url: '' })}
                                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                                title="מחק תמונה"
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setMediaType('image');
                              setTargetBlockId(`footer-column-${index}`);
                              setIsMediaPickerOpen(true);
                            }}
                            className="w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-all flex items-center justify-center py-8"
                          >
                            <HiPhotograph className="w-8 h-8 text-gray-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </SettingGroup>
              );
            })}

            <SettingGroup title="רשתות חברתיות">
              <div className="space-y-4">
                {renderSelect('הצג רשתות חברתיות', 'social_links.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], true)}
                
                {getValue('social_links.enabled', true) !== false && (
                  <div className="space-y-3 pt-2">
                    {[
                      { key: 'facebook', label: 'פייסבוק' },
                      { key: 'instagram', label: 'אינסטגרם' },
                      { key: 'tiktok', label: 'טיקטוק' },
                      { key: 'whatsapp', label: 'וואטסאפ' },
                      { key: 'snapchat', label: 'סנאפצ\'אט' },
                      { key: 'pinterest', label: 'פינטרסט' },
                      { key: 'youtube', label: 'יוטיוב' },
                    ].map((social) => {
                      const socialLinks = getValue('social_links.links', []) || [];
                      const socialLink = socialLinks.find((s: any) => s.platform === social.key) || { platform: social.key, url: '' };
                      const linkIndex = socialLinks.findIndex((s: any) => s.platform === social.key);
                      
                      return (
                        <div key={social.key}>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {social.label}
                            </label>
                            <input
                              type="text"
                              value={socialLink.url || ''}
                              onChange={(e) => {
                                const updatedLinks = [...socialLinks];
                                if (linkIndex >= 0) {
                                  updatedLinks[linkIndex] = { ...updatedLinks[linkIndex], url: e.target.value };
                                } else {
                                  updatedLinks.push({ platform: social.key, url: e.target.value });
                                }
                                handleSettingChange('social_links', {
                                  ...section.settings?.social_links,
                                  enabled: getValue('social_links.enabled', true),
                                  links: updatedLinks
                                });
                              }}
                              placeholder={`קישור ל-${social.label}`}
                              dir="ltr"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="בורר שפות ומטבע">
              <div className="space-y-4">
                {renderSelect('הצג בחירת שפה ומטבע', 'currency_selector.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="כללי">
              <div className="space-y-4">
                {renderInput('זכויות יוצרים', 'copyright', `מופעל על ידי Quick Shop - פלטפורמה להקמת חנויות וירטואליות © ${new Date().getFullYear()}`)}
              </div>
            </SettingGroup>
          </div>
        );

      // ========== Product Page Sections ==========
      case 'product_gallery':
        return (
          <div className="space-y-1">
            <SettingGroup title="פריסת גלריה">
              <div className="space-y-4">
                {renderSelect('סגנון גלריה', 'gallery_layout', [
                  { label: 'תמונה גדולה עם תמונות ממוזערות', value: 'thumbnails' },
                  { label: 'גלריה רשת', value: 'grid' },
                  { label: 'קרוסלה', value: 'carousel' },
                  { label: 'סליידר עמודה אחת', value: 'single' },
                  { label: 'שתי עמודות', value: 'two_columns' },
                ])}
                
                {getValue('gallery_layout', 'thumbnails') === 'thumbnails' && (
                  <>
                    {renderSelect('מיקום תמונות ממוזערות', 'thumbnail_position', [
                      { label: 'מתחת לתמונה', value: 'bottom' },
                      { label: 'בצד שמאל', value: 'left' },
                      { label: 'בצד ימין', value: 'right' },
                    ])}
                    
                    {renderSelect('גודל תמונות ממוזערות', 'thumbnail_size', [
                      { label: 'קטן (60px)', value: 'small' },
                      { label: 'בינוני (80px)', value: 'medium' },
                      { label: 'גדול (100px)', value: 'large' },
                    ])}
                  </>
                )}
                
                {getValue('gallery_layout', 'thumbnails') === 'grid' && (
                  renderSelect('עמודות ברשת', 'grid_columns', [
                    { label: '2 עמודות', value: 2 },
                    { label: '3 עמודות', value: 3 },
                    { label: '4 עמודות', value: 4 },
                  ])
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="התנהגות">
              <div className="space-y-4">
                {renderSelect('הפעל זום בעכבר', 'enable_zoom', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('פתח בלייטבוקס בלחיצה', 'enable_lightbox', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הפעל וידאו', 'enable_video', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('enable_video', true) !== false && (
                  renderSelect('הפעל וידאו אוטומטית', 'video_autoplay', [
                    { label: 'כן', value: true },
                    { label: 'לא', value: false },
                  ])
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="תמונות">
              <div className="space-y-4">
                {renderSelect('יחס גובה-רוחב', 'image_ratio', [
                  { label: 'מותאם לתמונה', value: 'adapt' },
                  { label: 'ריבוע (1:1)', value: 'square' },
                  { label: 'לרוחב (4:3)', value: 'landscape' },
                  { label: 'לאורך (3:4)', value: 'portrait' },
                  { label: 'סטורי (9:16)', value: 'story' },
                  { label: 'רחב (16:9)', value: 'wide' },
                  { label: 'גבוה (2:3)', value: 'tall' },
                  { label: 'אולטרה רחב (21:9)', value: 'ultra_wide' },
                  { label: 'אנכי (9:16)', value: 'vertical' },
                  { label: 'אופקי (16:10)', value: 'horizontal' },
                ])}
                
                {renderSelect('התאמת תמונה', 'image_fit', [
                  { label: 'כיסוי (Cover)', value: 'cover' },
                  { label: 'התאמה (Contain)', value: 'contain' },
                ])}
                
                {renderSelect('רדיוס פינות', 'border_radius', [
                  { label: 'ללא', value: '0' },
                  { label: 'קטן', value: '4px' },
                  { label: 'בינוני', value: '8px' },
                  { label: 'גדול', value: '16px' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="מובייל">
              <div className="space-y-4">
                {renderSelect('סגנון גלריה במובייל', 'mobile_layout', [
                  { label: 'כמו דסקטופ', value: 'same' },
                  { label: 'סליידר', value: 'carousel' },
                  { label: 'ערימה אנכית', value: 'stack' },
                ])}
                
                {renderSelect('הצג אינדיקטורים', 'show_dots', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_name':
        return (
          <div className="space-y-1">
            <SettingGroup title="כותרת">
              <div className="space-y-4">
                {renderSelect('גודל כותרת', 'title_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'גדול מאוד', value: 'xlarge' },
                ])}
                
                {renderSelect('משקל פונט', 'font_weight', [
                  { label: 'רגיל', value: 'normal' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'מודגש', value: 'bold' },
                ])}
                
                {renderColorPicker('צבע כותרת', 'title_color')}
              </div>
            </SettingGroup>

            <SettingGroup title="מידע נוסף">
              <div className="space-y-4">
                {renderSelect('הצג יצרן/מותג', 'show_vendor', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג מק"ט (SKU)', 'show_sku', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג דירוג', 'show_rating', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_rating', false) && (
                  renderSelect('סגנון דירוג', 'rating_style', [
                    { label: 'כוכבים', value: 'stars' },
                    { label: 'מספר', value: 'number' },
                    { label: 'כוכבים + מספר', value: 'both' },
                  ])
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="תגיות">
              <div className="space-y-4">
                {renderSelect('הצג תגית "חדש"', 'show_new_badge', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_new_badge', false) && (
                  renderInput('ימים להצגת תגית "חדש"', 'new_badge_days', '30', 'number')
                )}
                
                {renderSelect('הצג תגית "נמכר היטב"', 'show_bestseller_badge', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_price':
        return (
          <div className="space-y-1">
            <SettingGroup title="תצוגת מחיר">
              <div className="space-y-4">
                {renderSelect('גודל מחיר', 'price_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'גדול מאוד', value: 'xlarge' },
                ])}
                
                {renderColorPicker('צבע מחיר', 'price_color')}
                
                {renderSelect('משקל פונט', 'font_weight', [
                  { label: 'רגיל', value: 'normal' },
                  { label: 'מודגש', value: 'bold' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="מחיר השוואה (מבצע)">
              <div className="space-y-4">
                {renderSelect('הצג מחיר לפני הנחה', 'show_compare_price', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_compare_price', true) !== false && (
                  <>
                    {renderColorPicker('צבע מחיר לפני הנחה', 'compare_price_color')}
                    
                    {renderSelect('קו חוצה על מחיר ישן', 'strikethrough', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="תגית הנחה">
              <div className="space-y-4">
                {renderSelect('הצג תגית הנחה', 'show_discount_badge', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_discount_badge', true) !== false && (
                  <>
                    {renderSelect('סגנון תגית', 'badge_style', [
                      { label: 'אחוז הנחה (-20%)', value: 'percentage' },
                      { label: 'חסכון בש"ח (חסוך ₪50)', value: 'amount' },
                      { label: 'טקסט "מבצע!"', value: 'text' },
                    ])}
                    
                    {renderColorPicker('צבע רקע תגית', 'badge_bg_color')}
                    {renderColorPicker('צבע טקסט תגית', 'badge_text_color')}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="מעמ ומשלוח">
              <div className="space-y-4">
                {renderSelect('הצג הודעת מעמ', 'show_tax_info', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג הודעת משלוח', 'show_shipping_info', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_shipping_info', false) && (
                  renderInput('טקסט משלוח', 'shipping_text', 'משלוח חינם מעל ₪200')
                )}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_variations':
      case 'product_variants':
        return (
          <div className="space-y-1">
            <SettingGroup title="סגנון תצוגה">
              <div className="space-y-4">
                {renderSelect('סגנון בחירת וריאציות', 'variant_style', [
                  { label: 'כפתורים', value: 'buttons' },
                  { label: 'רשימה נפתחת', value: 'dropdown' },
                  { label: 'רדיו (עיגולים)', value: 'radio' },
                ])}
                
                {renderSelect('גודל כפתורים', 'button_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
                
                {renderSelect('צורת כפתורים', 'button_shape', [
                  { label: 'מלבני', value: 'square' },
                  { label: 'מעוגל', value: 'rounded' },
                  { label: 'עגול (לצבעים)', value: 'circle' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תצוגת צבעים">
              <div className="space-y-4">
                {renderSelect('הצג צבעים כסווטצ\'ים', 'show_color_swatches', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_color_swatches', true) !== false && (
                  <>
                    {renderSelect('גודל סווטצ\'ים', 'swatch_size', [
                      { label: 'קטן (24px)', value: 'small' },
                      { label: 'בינוני (32px)', value: 'medium' },
                      { label: 'גדול (40px)', value: 'large' },
                    ])}
                    
                    {renderSelect('הצג שם צבע בריחוף', 'show_color_name', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="מלאי">
              <div className="space-y-4">
                {renderSelect('הצג סטטוס מלאי', 'show_stock_status', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_stock_status', false) && (
                  <>
                    {renderSelect('הצג כמות במלאי', 'show_stock_count', [
                      { label: 'תמיד', value: 'always' },
                      { label: 'כשנמוך', value: 'low' },
                      { label: 'לעולם לא', value: 'never' },
                    ])}
                    
                    {renderInput('סף מלאי נמוך', 'low_stock_threshold', '5', 'number')}
                  </>
                )}
                
                {renderSelect('השבת וריאציות שאזלו', 'disable_unavailable', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הסתר וריאציות שאזלו', 'hide_unavailable', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תמונות">
              <div className="space-y-4">
                {renderSelect('החלף תמונה בבחירת וריאציה', 'change_image_on_select', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_add_to_cart':
        return (
          <div className="space-y-1">
            <SettingGroup title="כפתור הוסף לסל">
              <div className="space-y-4">
                {renderInput('טקסט כפתור', 'button_text', 'הוסף לסל')}
                
                {renderSelect('סגנון כפתור', 'button_style', [
                  { label: 'מלא (Solid)', value: 'solid' },
                  { label: 'מסגרת (Outline)', value: 'outline' },
                ])}
                
                {renderColorPicker('צבע רקע כפתור', 'button_bg_color')}
                {renderColorPicker('צבע טקסט כפתור', 'button_text_color')}
                
                {renderSelect('רדיוס פינות', 'button_radius', [
                  { label: 'ללא', value: '0' },
                  { label: 'קטן', value: '4px' },
                  { label: 'בינוני', value: '8px' },
                  { label: 'מעוגל', value: '9999px' },
                ])}
                
                {renderSelect('רוחב כפתור', 'button_width', [
                  { label: 'רוחב מלא', value: 'full' },
                  { label: 'אוטומטי', value: 'auto' },
                ])}
                
                {renderSelect('הצג אייקון עגלה', 'show_cart_icon', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="בורר כמות">
              <div className="space-y-4">
                {renderSelect('הצג בורר כמות', 'show_quantity_selector', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_quantity_selector', true) !== false && (
                  <>
                    {renderSelect('סגנון בורר כמות', 'quantity_style', [
                      { label: 'כפתורי +/-', value: 'buttons' },
                      { label: 'שדה מספר', value: 'input' },
                      { label: 'רשימה נפתחת', value: 'dropdown' },
                    ])}
                    
                    {renderInput('כמות מקסימלית', 'max_quantity', '10', 'number')}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="כפתור קנה עכשיו">
              <div className="space-y-4">
                {renderSelect('הצג כפתור "קנה עכשיו"', 'show_buy_now', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_buy_now', true) !== false && (
                  <>
                    {renderInput('טקסט כפתור', 'buy_now_text', 'קנה עכשיו')}
                    {renderColorPicker('צבע רקע', 'buy_now_bg_color')}
                    {renderColorPicker('צבע טקסט', 'buy_now_text_color')}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="פעולות נוספות">
              <div className="space-y-4">
                {renderSelect('הצג כפתור "הוסף למועדפים"', 'show_wishlist', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג כפתור "השווה"', 'show_compare', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג כפתור שיתוף', 'show_share', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="התראות">
              <div className="space-y-4">
                {renderSelect('הצג הודעה לאחר הוספה', 'show_add_notification', [
                  { label: 'פופאפ', value: 'popup' },
                  { label: 'הודעה בעמוד', value: 'inline' },
                  { label: 'ללא', value: 'none' },
                ])}
                
                {renderSelect('הפעל "הודע כשיחזור למלאי"', 'enable_back_in_stock', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_description':
        return (
          <div className="space-y-1">
            <SettingGroup title="תצוגה">
              <div className="space-y-4">
                {renderSelect('סגנון תצוגה', 'display_style', [
                  { label: 'פתוח', value: 'open' },
                  { label: 'אקורדיון (מתקפל)', value: 'accordion' },
                  { label: 'טאבים', value: 'tabs' },
                ])}
                
                {renderInput('כותרת', 'title', 'תיאור המוצר')}
                
                {renderSelect('גודל כותרת', 'title_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תוכן">
              <div className="space-y-4">
                {renderSelect('הצג קרא עוד', 'show_read_more', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_read_more', false) && (
                  renderInput('מספר תווים לתצוגה', 'truncate_length', '300', 'number')
                )}
                
                {renderSelect('גודל פונט', 'font_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
                
                {renderColorPicker('צבע טקסט', 'text_color')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_custom_fields':
        return (
          <div className="space-y-1">
            <SettingGroup title="תצוגה">
              <div className="space-y-4">
                {renderSelect('סגנון תצוגה', 'display_style', [
                  { label: 'טבלה', value: 'table' },
                  { label: 'רשימה', value: 'list' },
                  { label: 'רשת', value: 'grid' },
                  { label: 'אקורדיון', value: 'accordion' },
                ])}
                
                {renderInput('כותרת', 'title', 'מפרט טכני')}
                
                {renderSelect('הצג כותרת', 'show_title', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {getValue('display_style', 'table') === 'table' && (
                  <>
                    {renderSelect('רקע שורות לסירוגין', 'striped_rows', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    
                    {renderSelect('קווי מפריד', 'show_borders', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                  </>
                )}
                
                {getValue('display_style', 'table') === 'grid' && (
                  renderSelect('עמודות', 'grid_columns', [
                    { label: '2 עמודות', value: 2 },
                    { label: '3 עמודות', value: 3 },
                    { label: '4 עמודות', value: 4 },
                  ])
                )}
                
                {renderColorPicker('צבע שם שדה', 'label_color')}
                {renderColorPicker('צבע ערך שדה', 'value_color')}
              </div>
            </SettingGroup>

            <SettingGroup title="אייקונים">
              <div className="space-y-4">
                {renderSelect('הצג אייקונים', 'show_icons', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_reviews':
        return (
          <div className="space-y-1">
            <SettingGroup title="כללי">
              <div className="space-y-4">
                {renderInput('כותרת', 'title', 'ביקורות לקוחות')}
                
                {renderSelect('הצג סיכום דירוגים', 'show_rating_summary', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_rating_summary', true) !== false && (
                  <>
                    {renderSelect('סגנון סיכום', 'summary_style', [
                      { label: 'מלא עם גרף', value: 'full' },
                      { label: 'קומפקטי', value: 'compact' },
                    ])}
                    
                    {renderSelect('הצג חלוקת כוכבים', 'show_rating_breakdown', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="רשימת ביקורות">
              <div className="space-y-4">
                {renderInput('ביקורות לעמוד', 'reviews_per_page', '5', 'number')}
                
                {renderSelect('מיון ברירת מחדל', 'default_sort', [
                  { label: 'חדשות ביותר', value: 'newest' },
                  { label: 'דירוג גבוה', value: 'highest' },
                  { label: 'דירוג נמוך', value: 'lowest' },
                  { label: 'מועילות', value: 'helpful' },
                ])}
                
                {renderSelect('אפשר סינון', 'enable_filter', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג תמונות מביקורות', 'show_review_images', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="כתיבת ביקורת">
              <div className="space-y-4">
                {renderSelect('אפשר כתיבת ביקורת', 'allow_reviews', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('allow_reviews', true) !== false && (
                  <>
                    {renderSelect('דרוש אימות רכישה', 'require_purchase', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    
                    {renderSelect('אפשר העלאת תמונות', 'allow_images', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderColorPicker('צבע כוכבים', 'star_color')}
                {renderColorPicker('צבע כוכבים ריקים', 'empty_star_color')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'related_products':
        return (
          <div className="space-y-1">
            <SettingGroup title="כללי">
              <div className="space-y-4">
                {renderInput('כותרת', 'title', 'מוצרים קשורים')}
                
                {renderSelect('גודל כותרת', 'title_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
                
                {renderSelect('יישור כותרת', 'title_alignment', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="מוצרים">
              <div className="space-y-4">
                {renderInput('מספר מוצרים (דסקטופ)', 'products_count', '4', 'number')}
                
                {renderSelect('כמה מוצרים להציג (מובייל)', 'products_count_mobile', [
                  { label: '2 מוצרים', value: 2 },
                  { label: '4 מוצרים', value: 4 },
                  { label: '6 מוצרים', value: 6 },
                  { label: '8 מוצרים', value: 8 },
                ])}
                
                {renderSelect('מוצרים בשורה (דסקטופ)', 'columns_desktop', [
                  { label: '2', value: 2 },
                  { label: '3', value: 3 },
                  { label: '4', value: 4 },
                  { label: '5', value: 5 },
                  { label: '6', value: 6 },
                ])}
                
                {renderSelect('מוצרים בשורה (מובייל)', 'columns_mobile', [
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                ])}
                
                {renderSelect('מקור מוצרים', 'source', [
                  { label: 'אוטומטי (קטגוריה)', value: 'auto' },
                  { label: 'בחירה ידנית', value: 'manual' },
                  { label: 'נרכשו יחד', value: 'bought_together' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תצוגת כרטיס מוצר">
              <div className="space-y-4">
                {renderSelect('יחס תמונה', 'image_ratio', [
                  { label: 'ריבוע (1:1)', value: 'square' },
                  { label: 'פורטרט (3:4)', value: 'portrait' },
                  { label: 'לנדסקייפ (4:3)', value: 'landscape' },
                  { label: 'סטורי (9:16)', value: 'story' },
                  { label: 'רחב (16:9)', value: 'wide' },
                  { label: 'גבוה (2:3)', value: 'tall' },
                  { label: 'אולטרה רחב (21:9)', value: 'ultra_wide' },
                  { label: 'אנכי (9:16)', value: 'vertical' },
                  { label: 'אופקי (16:10)', value: 'horizontal' },
                  { label: 'מקורי', value: 'original' },
                ])}
                
                {renderSelect('הצג מחיר', 'show_price', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג דירוג', 'show_rating', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג כפתור הוספה מהירה', 'show_quick_add', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג תגיות מבצע', 'show_badges', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderInput('עיגול פינות (px)', 'card_border_radius', '0', 'number')}
              </div>
            </SettingGroup>

            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('סגנון תצוגה', 'layout_style', [
                  { label: 'רשת', value: 'grid' },
                  { label: 'סליידר', value: 'carousel' },
                ])}
                
                {getValue('layout_style', 'grid') === 'carousel' && (
                  <>
                    {renderSelect('הצג חיצים', 'show_arrows', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    
                    {renderSelect('הצג נקודות', 'show_dots', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    
                    {renderSelect('גלילה אוטומטית', 'autoplay', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                  </>
                )}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_recently_viewed':
      case 'recently_viewed':
        return (
          <div className="space-y-1">
            <SettingGroup title="כללי">
              <div className="space-y-4">
                {renderInput('כותרת', 'title', 'נצפו לאחרונה')}
                
                {renderSelect('גודל כותרת', 'title_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="מוצרים">
              <div className="space-y-4">
                {renderInput('מספר מוצרים להצגה', 'products_count', '4', 'number')}
                
                {renderSelect('מוצרים בשורה (דסקטופ)', 'columns_desktop', [
                  { label: '2', value: 2 },
                  { label: '3', value: 3 },
                  { label: '4', value: 4 },
                  { label: '5', value: 5 },
                  { label: '6', value: 6 },
                ])}
                
                {renderSelect('מוצרים בשורה (מובייל)', 'columns_mobile', [
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                ])}
                
                {renderSelect('הסתר מוצר נוכחי', 'hide_current', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תצוגת כרטיס מוצר">
              <div className="space-y-4">
                {renderSelect('יחס תמונה', 'image_ratio', [
                  { label: 'ריבוע (1:1)', value: 'square' },
                  { label: 'פורטרט (3:4)', value: 'portrait' },
                  { label: 'לנדסקייפ (4:3)', value: 'landscape' },
                  { label: 'סטורי (9:16)', value: 'story' },
                  { label: 'רחב (16:9)', value: 'wide' },
                  { label: 'גבוה (2:3)', value: 'tall' },
                  { label: 'אולטרה רחב (21:9)', value: 'ultra_wide' },
                  { label: 'אנכי (9:16)', value: 'vertical' },
                  { label: 'אופקי (16:10)', value: 'horizontal' },
                  { label: 'מקורי', value: 'original' },
                ])}
                
                {renderSelect('הצג מחיר', 'show_price', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג כפתור הוספה מהירה', 'show_quick_add', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('סגנון תצוגה', 'layout_style', [
                  { label: 'רשת', value: 'grid' },
                  { label: 'סליידר', value: 'carousel' },
                ])}
                
                {getValue('layout_style', 'grid') === 'carousel' && (
                  <>
                    {renderSelect('הצג חיצים', 'show_arrows', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    
                    {renderSelect('הצג נקודות', 'show_dots', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                  </>
                )}
              </div>
            </SettingGroup>
          </div>
        );

      // ========== Collection Page Sections ==========
      case 'collection_header':
        return (
          <div className="space-y-1">
            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('סגנון תצוגה', 'layout', [
                  { label: 'באנר גדול', value: 'banner' },
                  { label: 'פשוט', value: 'simple' },
                  { label: 'Hero', value: 'hero' },
                ])}
                
                {getValue('layout', 'banner') !== 'simple' && (
                  <>
                    {renderSelect('גובה באנר', 'banner_height', [
                      { label: 'קטן', value: 'small' },
                      { label: 'בינוני', value: 'medium' },
                      { label: 'גדול', value: 'large' },
                      { label: 'מלא', value: 'full' },
                    ])}
                  </>
                )}
                
                {renderSelect('יישור תוכן', 'text_align', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
                
                {renderSelect('מיקום תוכן אנכי', 'content_position', [
                  { label: 'למעלה', value: 'top' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'למטה', value: 'bottom' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תצוגה">
              <div className="space-y-4">
                {renderSelect('הצג תמונת קטגוריה', 'show_image', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג תיאור', 'show_description', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג מספר מוצרים', 'show_product_count', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="טיפוגרפיה">
              <div className="space-y-4">
                {renderSelect('גודל כותרת', 'title_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'ענק', value: 'xl' },
                ])}
                
                {renderColorPicker('צבע כותרת', 'title_color')}
                {renderColorPicker('צבע תיאור', 'description_color')}
              </div>
            </SettingGroup>

            <SettingGroup title="רקע">
              <div className="space-y-4">
                {renderColorPicker('צבע שכבת-על', 'overlay_color')}
                
                {renderSelect('שקיפות שכבת-על', 'overlay_opacity', [
                  { label: '0%', value: '0' },
                  { label: '20%', value: '0.2' },
                  { label: '40%', value: '0.4' },
                  { label: '60%', value: '0.6' },
                  { label: '80%', value: '0.8' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'collection_description':
        return (
          <div className="space-y-1">
            <SettingGroup title="תצוגה">
              <div className="space-y-4">
                {renderSelect('הצג תיאור מלא', 'show_full', [
                  { label: 'כן', value: true },
                  { label: 'לא - קטע מקוצר', value: false },
                ])}
                
                {getValue('show_full', false) === false && (
                  <>
                    {renderInput('מספר תווים מקסימלי', 'max_characters', '200', 'number')}
                    {renderInput('טקסט "קרא עוד"', 'read_more_text', 'קרא עוד')}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="טיפוגרפיה">
              <div className="space-y-4">
                {renderSelect('גודל טקסט', 'text_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
                
                {renderSelect('יישור טקסט', 'text_align', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
                
                {renderColorPicker('צבע טקסט', 'text_color')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'collection_filters':
        return (
          <div className="space-y-1">
            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('סגנון תצוגה', 'layout', [
                  { label: 'סרגל צד', value: 'sidebar' },
                  { label: 'אופקי', value: 'horizontal' },
                  { label: 'נפתח (Drawer)', value: 'drawer' },
                ])}
                
                {getValue('layout', 'sidebar') === 'sidebar' && (
                  <>
                    {renderSelect('מיקום סרגל צד', 'sidebar_position', [
                      { label: 'ימין', value: 'right' },
                      { label: 'שמאל', value: 'left' },
                    ])}
                  </>
                )}
                
                {renderSelect('מכווץ במובייל', 'collapsed_on_mobile', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="סוגי מסננים">
              <div className="space-y-4">
                {renderSelect('סינון לפי מחיר', 'show_price_filter', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('סינון לפי זמינות', 'show_availability_filter', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('סינון לפי מותג/יצרן', 'show_vendor_filter', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('סינון לפי סוג מוצר', 'show_type_filter', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('סינון לפי צבע', 'show_color_filter', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('סינון לפי מידה', 'show_size_filter', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="מיון">
              <div className="space-y-4">
                {renderSelect('הצג אפשרויות מיון', 'show_sort', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {getValue('show_sort', true) && (
                  <>
                    {renderSelect('מיון ברירת מחדל', 'default_sort', [
                      { label: 'חדש ביותר', value: 'newest' },
                      { label: 'ישן ביותר', value: 'oldest' },
                      { label: 'מחיר: נמוך לגבוה', value: 'price_asc' },
                      { label: 'מחיר: גבוה לנמוך', value: 'price_desc' },
                      { label: 'שם: א-ת', value: 'name_asc' },
                      { label: 'שם: ת-א', value: 'name_desc' },
                      { label: 'פופולריות', value: 'popularity' },
                    ])}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderColorPicker('צבע רקע מסננים', 'filter_bg_color')}
                {renderColorPicker('צבע טקסט', 'filter_text_color')}
                {renderColorPicker('צבע מסנן פעיל', 'active_filter_color')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'collection_products':
        return (
          <div className="space-y-1">
            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('מוצרים בשורה (דסקטופ)', 'products_per_row', [
                  { label: '2', value: 2 },
                  { label: '3', value: 3 },
                  { label: '4', value: 4 },
                  { label: '5', value: 5 },
                  { label: '6', value: 6 },
                ])}
                
                {renderSelect('מוצרים בשורה (טאבלט)', 'products_per_row_tablet', [
                  { label: '2', value: 2 },
                  { label: '3', value: 3 },
                  { label: '4', value: 4 },
                ])}
                
                {renderSelect('מוצרים בשורה (מובייל)', 'products_per_row_mobile', [
                  { label: '1', value: 1 },
                  { label: '2', value: 2 },
                ])}
                
                {renderInput('מוצרים בעמוד', 'products_per_page', '12', 'number')}
                
                {renderSelect('רווח בין מוצרים', 'gap', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תצוגת כרטיס מוצר">
              <div className="space-y-4">
                {renderSelect('סגנון כרטיס', 'card_style', [
                  { label: 'ברירת מחדל', value: 'default' },
                  { label: 'מינימליסטי', value: 'minimal' },
                  { label: 'מפורט', value: 'detailed' },
                ])}
                
                {renderSelect('הצג צל', 'show_shadow', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג מסגרת', 'show_border', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('יחס תמונה', 'image_ratio', [
                  { label: 'ריבוע (1:1)', value: 'square' },
                  { label: 'פורטרט (3:4)', value: 'portrait' },
                  { label: 'לנדסקייפ (4:3)', value: 'landscape' },
                  { label: 'מקורי', value: 'original' },
                  { label: 'סטורי (9:16)', value: 'story' },
                  { label: 'רחב (16:9)', value: 'wide' },
                  { label: 'גבוה (2:3)', value: 'tall' },
                  { label: 'אולטרה רחב (21:9)', value: 'ultra_wide' },
                  { label: 'אנכי (9:16)', value: 'vertical' },
                  { label: 'אופקי (16:10)', value: 'horizontal' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="מידע מוצר">
              <div className="space-y-4">
                {renderSelect('הצג מחיר', 'show_price', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג מחיר השוואה', 'show_compare_price', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג יצרן/מותג', 'show_vendor', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג דירוג', 'show_rating', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג תגיות', 'show_badges', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג צבעים זמינים', 'show_color_swatches', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="פעולות">
              <div className="space-y-4">
                {renderSelect('הצג צפייה מהירה', 'show_quick_view', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג הוספה לסל', 'show_add_to_cart', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                
                {renderSelect('הצג רשימת משאלות', 'show_wishlist', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="הודעות">
              <div className="space-y-4">
                {renderInput('טקסט "אין מוצרים"', 'empty_text', 'לא נמצאו מוצרים בקטגוריה זו')}
                {renderInput('טקסט "אזל מהמלאי"', 'sold_out_text', 'אזל מהמלאי')}
                {renderInput('טקסט "מבצע"', 'sale_badge_text', 'מבצע')}
                {renderInput('טקסט "חדש"', 'new_badge_text', 'חדש')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'collection_pagination':
        return (
          <div className="space-y-1">
            <SettingGroup title="סגנון">
              <div className="space-y-4">
                {renderSelect('סוג עימוד', 'style', [
                  { label: 'מספרי עמודים', value: 'numbers' },
                  { label: 'כפתור "טען עוד"', value: 'load_more' },
                  { label: 'גלילה אינסופית', value: 'infinite' },
                ])}
                
                {getValue('style', 'numbers') === 'load_more' && (
                  <>
                    {renderInput('טקסט כפתור', 'load_more_text', 'טען עוד מוצרים')}
                  </>
                )}
                
                {getValue('style', 'numbers') === 'numbers' && (
                  <>
                    {renderSelect('הצג מספרי עמודים', 'show_page_numbers', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    
                    {renderSelect('הצג כפתורי הבא/קודם', 'show_prev_next', [
                      { label: 'כן', value: true },
                      { label: 'לא', value: false },
                    ])}
                    
                    {renderInput('טקסט "הבא"', 'next_text', 'הבא')}
                    {renderInput('טקסט "קודם"', 'prev_text', 'הקודם')}
                  </>
                )}
              </div>
            </SettingGroup>

            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderSelect('יישור', 'alignment', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
                
                {renderColorPicker('צבע רקע כפתור', 'button_bg_color')}
                {renderColorPicker('צבע טקסט כפתור', 'button_text_color')}
                {renderColorPicker('צבע כפתור פעיל', 'active_button_color')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'product_breadcrumbs':
        return (
          <div className="space-y-1">
            <SettingGroup title="תצוגה">
              <div className="space-y-4">
                {renderSelect('הצג בית', 'show_home', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {renderSelect('הצג אייקון בית', 'home_icon', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {renderSelect('הצג קטגוריה', 'show_category', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderSelect('מפריד', 'separator', [
                  { label: 'חץ (שברון)', value: 'chevron' },
                  { label: 'קו נטוי', value: 'slash' },
                  { label: 'חץ', value: 'arrow' },
                ])}
                {renderSelect('גודל טקסט', 'text_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                ])}
                {renderSelect('יישור', 'alignment', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
                {renderColorPicker('צבע קישורים', 'link_color')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'announcement_bar':
        return (
          <div className="space-y-1">
            <SettingGroup title="תוכן">
              <div className="space-y-4">
                {renderInput('טקסט ההודעה', 'text', 'משלוח חינם בקנייה מעל 299₪')}
                {renderInput('טקסט קישור', 'link_text', '')}
                {renderInput('כתובת קישור', 'link_url', '/categories/all')}
              </div>
            </SettingGroup>
            
            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">צבע רקע</label>
                  <ModernColorPicker 
                    value={section.style?.background?.background_color || '#000000'}
                    onChange={(color) => handleStyleChange('background.background_color', color)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">צבע טקסט</label>
                  <ModernColorPicker 
                    value={section.style?.typography?.color || '#FFFFFF'}
                    onChange={(color) => handleStyleChange('typography.color', color)}
                  />
                </div>
                {renderSelect('יישור טקסט', 'text_align', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
                {renderSelect('גובה', 'height', [
                  { label: 'קטן', value: 'small' },
                  { label: 'רגיל', value: 'auto' },
                  { label: 'גדול', value: 'large' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="אפשרויות נוספות">
              <div className="space-y-4">
                {renderSelect('הצג כפתור סגירה', 'show_dismiss', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {renderSelect('טקסט גולל', 'scrolling_text', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ])}
                {getValue('scrolling_text') && renderSelect('מהירות גלילה', 'scroll_speed', [
                  { label: 'איטי', value: 'slow' },
                  { label: 'רגיל', value: 'normal' },
                  { label: 'מהיר', value: 'fast' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'collage':
        const collageBlocks = section.blocks?.filter(b => b.type === 'image') || [];
        
        const addCollageImage = () => {
          const newBlock = {
            id: `collage-img-${Date.now()}`,
            type: 'image' as const,
            content: {
              image_url: '',
              title: '',
              link_url: ''
            },
            style: {},
            settings: {}
          };
          onUpdate({
            blocks: [...(section.blocks || []), newBlock]
          });
        };
        
        const removeCollageImage = (blockId: string) => {
          const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
          onUpdate({ blocks: newBlocks });
        };

        const updateCollageImage = (blockId: string, updates: any) => {
          // Deep clone to avoid mutation issues
          const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
          const index = newBlocks.findIndex((b: any) => b.id === blockId);
          if (index >= 0) {
            newBlocks[index].content = { ...newBlocks[index].content, ...updates };
            onUpdate({ blocks: newBlocks });
          }
        };

        const openCollageImagePicker = (imageId: string) => {
          setMediaType('image');
          setTargetBlockId(imageId);
          setImageDeviceTarget('desktop');
          setIsMediaPickerOpen(true);
        };

        return (
          <div className="space-y-1">
            <SettingGroup title="כותרת">
              <div className="space-y-4">
                {renderInput('כותרת', 'title', 'הקולקציה החדשה')}
                {renderSelect('יישור כותרת', 'title_align', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title={`תמונות (${collageBlocks.length})`} defaultOpen={true}>
              <div className="space-y-3">
                {collageBlocks.map((block, index) => (
                  <div key={block.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">תמונה {index + 1}</span>
                      <button
                        onClick={() => removeCollageImage(block.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="מחק תמונה"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Image */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">תמונה</label>
                      <div className="flex gap-2">
                        {block.content?.image_url ? (
                          <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100">
                            <img 
                              src={block.content.image_url} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => updateCollageImage(block.id, { image_url: '' })}
                              className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-bl"
                            >
                              <HiTrash className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openCollageImagePicker(block.id)}
                            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500"
                          >
                            <HiPhotograph className="w-8 h-8" />
                          </button>
                        )}
                        {block.content?.image_url && (
                          <button
                            onClick={() => openCollageImagePicker(block.id)}
                            className="text-xs text-blue-600 hover:underline self-center"
                          >
                            החלף
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Link */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">קישור (אופציונלי)</label>
                      <input
                        type="text"
                        value={block.content?.link_url || ''}
                        onChange={(e) => updateCollageImage(block.id, { link_url: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="/categories/new"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addCollageImage}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2 text-sm"
                >
                  <HiPlus className="w-4 h-4" />
                  הוסף תמונה
                </button>
              </div>
            </SettingGroup>

            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('סוג פריסה', 'layout', [
                  { label: 'תמונה גדולה מימין', value: 'left-large' },
                  { label: 'תמונה גדולה משמאל', value: 'right-large' },
                  { label: 'רשת שווה', value: 'equal' },
                ])}
                {renderSelect('מרווח בין תמונות', 'gap', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {/* ✅ שינוי ל-number input עם טיפול אוטומטי ב-px */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    עיגול פינות
                  </label>
                  <input
                    type="number"
                    value={parseInt(getValue('image_border_radius', '8px').replace('px', '')) || 8}
                    onChange={(e) => {
                      const numValue = parseInt(e.target.value) || 0;
                      handleSettingChange('image_border_radius', numValue > 0 ? `${numValue}px` : '0px');
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="8"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">px נוסף אוטומטית</p>
                </div>
              </div>
            </SettingGroup>
          </div>
        );

      case 'multicolumn':
        const mcColumnBlocks = section.blocks?.filter(b => b.type === 'text' || b.type === 'image') || [];
        
        const addMcColumn = () => {
          const newBlock = {
            id: `col-${Date.now()}`,
            type: 'text' as const,
            content: {
              image_url: '',
              heading: 'כותרת עמודה',
              text: 'הוסף תיאור קצר כאן',
              button_text: '',
              button_url: ''
            },
            style: {},
            settings: {}
          };
          onUpdate({
            blocks: [...(section.blocks || []), newBlock]
          });
          setExpandedBlockId(newBlock.id);
        };
        
        const removeMcColumn = (blockId: string) => {
          const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
          onUpdate({ blocks: newBlocks });
          if (expandedBlockId === blockId) setExpandedBlockId(null);
        };

        const updateMcColumn = (blockId: string, updates: any) => {
          // Deep clone to avoid mutation issues
          const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
          const index = newBlocks.findIndex((b: any) => b.id === blockId);
          if (index >= 0) {
            newBlocks[index].content = { ...newBlocks[index].content, ...updates };
            onUpdate({ blocks: newBlocks });
          }
        };

        const openMcColumnImagePicker = (columnId: string) => {
          setMediaType('auto');
          setTargetBlockId(columnId);
          setImageDeviceTarget('desktop');
          setIsMediaPickerOpen(true);
        };
        
        const openMcColumnVideoPicker = (columnId: string) => {
          setMediaType('video');
          setTargetBlockId(columnId);
          setImageDeviceTarget('desktop');
          setIsMediaPickerOpen(true);
        };

        return (
          <div className="space-y-6">
            <SettingGroup title="תוכן וכותרת">
              <div className="space-y-4">
                {renderInput('כותרת ראשית', 'title', 'למשל: השירותים שלנו')}
                <div className="grid grid-cols-2 gap-4">
                   {renderSelect('יישור', 'title_align', [
                     { label: 'ימין', value: 'right' },
                     { label: 'מרכז', value: 'center' },
                     { label: 'שמאל', value: 'left' },
                   ])}
                   {renderSelect('גודל', 'title_font_size', [
                     { label: 'קטן', value: 'small' },
                     { label: 'בינוני', value: 'medium' },
                     { label: 'גדול', value: 'large' },
                     { label: 'ענק', value: 'xlarge' },
                   ])}
                </div>
              </div>
            </SettingGroup>

            <SettingGroup title={`עמודות (${mcColumnBlocks.length})`} defaultOpen={true}>
              <div className="space-y-3">
                {mcColumnBlocks.map((block, index) => {
                   const isOpen = expandedBlockId === block.id;
                   const isVideoMode = !!block.content?.video_url;

                   return (
                     <div 
                        key={block.id} 
                        className={`border rounded-lg transition-all duration-200 overflow-hidden ${
                          isOpen 
                            ? 'border-gray-900 ring-1 ring-gray-900/5 bg-white shadow-sm' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                     >
                        {/* Header */}
                        <div 
                          className={`flex items-center justify-between p-3 cursor-pointer select-none transition-colors ${isOpen ? 'bg-gray-50 border-b border-gray-100' : 'hover:bg-gray-50'}`}
                          onClick={() => setExpandedBlockId(isOpen ? null : block.id)}
                        >
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className="text-gray-400 cursor-grab active:cursor-grabbing p-1 hover:text-gray-600 rounded">
                                <HiMenuAlt4 className="w-4 h-4" />
                              </div>
                              {/* Thumbnail Preview */}
                              <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                 {block.content?.image_url ? (
                                   <img src={block.content.image_url} className="w-full h-full object-cover" alt="" />
                                 ) : block.content?.video_url ? (
                                   <HiVideoCamera className="w-4 h-4 text-gray-500" />
                                 ) : (
                                   <span className="text-xs font-bold text-gray-400">{index + 1}</span>
                                 )}
                              </div>
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {block.content?.heading || `עמודה ${index + 1}`}
                              </span>
                           </div>
                           <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); removeMcColumn(block.id); }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="מחק עמודה"
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                              <div className={`p-1.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                <HiChevronDown className="w-4 h-4" />
                              </div>
                           </div>
                        </div>

                        {/* Content */}
                        {isOpen && (
                          <div className="p-4 space-y-5">
                             
                             {/* Media Type Selector (Segmented Control) */}
                             <div>
                               <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">מדיה</label>
                               <div className="bg-gray-100 p-1 rounded-lg flex">
                                 <button
                                   onClick={() => {
                                      if (isVideoMode) updateMcColumn(block.id, { video_url: '', image_url: '' });
                                      openMcColumnImagePicker(block.id);
                                   }}
                                   className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                     !isVideoMode 
                                       ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                       : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                   }`}
                                 >
                                   <HiPhotograph className="w-4 h-4" />
                                   תמונה
                                 </button>
                                 <button
                                   onClick={() => {
                                      if (!isVideoMode) updateMcColumn(block.id, { image_url: '', video_url: '' });
                                      openMcColumnVideoPicker(block.id);
                                   }}
                                   className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                     isVideoMode 
                                       ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                       : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                   }`}
                                 >
                                   <HiVideoCamera className="w-4 h-4" />
                                   וידאו
                                 </button>
                               </div>
                             </div>

                             {/* Media Preview & Actions */}
                             <div className="bg-gray-50 rounded-lg border border-gray-200/60 p-3">
                                {(block.content?.image_url || block.content?.video_url) ? (
                                   <div className="relative aspect-video rounded-md overflow-hidden bg-white border border-gray-200 shadow-sm group">
                                      {isVideoMode ? (
                                         <video src={block.content.video_url} className="w-full h-full object-cover" muted playsInline />
                                      ) : (
                                         <img src={block.content.image_url} className="w-full h-full object-cover" alt="" />
                                      )}
                                      
                                      {/* Overlay Actions */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                         <button
                                            onClick={() => isVideoMode ? openMcColumnVideoPicker(block.id) : openMcColumnImagePicker(block.id)}
                                            className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 text-xs font-medium rounded shadow-sm backdrop-blur-sm transition-colors"
                                         >
                                            החלף
                                         </button>
                                         <button
                                            onClick={() => updateMcColumn(block.id, isVideoMode ? { video_url: '' } : { image_url: '' })}
                                            className="p-1.5 bg-white/90 hover:bg-red-50 hover:text-red-600 text-gray-900 rounded shadow-sm backdrop-blur-sm transition-colors"
                                         >
                                            <HiTrash className="w-4 h-4" />
                                         </button>
                                      </div>
                                   </div>
                                ) : (
                                   <div 
                                     onClick={() => isVideoMode ? openMcColumnVideoPicker(block.id) : openMcColumnImagePicker(block.id)}
                                     className="aspect-video border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-white cursor-pointer transition-all bg-white/50"
                                   >
                                      {isVideoMode ? <HiVideoCamera className="w-8 h-8 mb-2 opacity-50" /> : <HiPhotograph className="w-8 h-8 mb-2 opacity-50" />}
                                      <span className="text-xs font-medium">לחץ להוספת {isVideoMode ? 'וידאו' : 'תמונה'}</span>
                                   </div>
                                )}
                             </div>

                             {/* Text Fields */}
                             <div className="space-y-4">
                                <div>
                                   <div className="flex items-center justify-between mb-1.5">
                                      <label className="text-xs font-medium text-gray-700">כותרת העמודה</label>
                                      <button 
                                        onClick={(e) => {
                                          setTypographyAnchor(e.currentTarget);
                                          setSelectedBlockId(block.id);
                                          setSelectedSectionType('multicolumn');
                                        }}
                                        className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50 group/type"
                                        title="ערוך טיפוגרפיה"
                                      >
                                        <span className="font-serif italic font-bold group-hover/type:scale-110 transition-transform">Aa</span>
                                        <span>עיצוב</span>
                                      </button>
                                   </div>
                                   <input
                                     type="text"
                                     value={block.content?.heading || ''}
                                     onChange={(e) => updateMcColumn(block.id, { heading: e.target.value })}
                                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white hover:border-gray-300"
                                     placeholder="הזן כותרת..."
                                   />
                                </div>

                                <div>
                                   <label className="block text-xs font-medium text-gray-700 mb-1.5">תיאור העמודה</label>
                                   <textarea
                                     value={block.content?.text || ''}
                                     onChange={(e) => updateMcColumn(block.id, { text: e.target.value })}
                                     rows={3}
                                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white hover:border-gray-300 resize-none"
                                     placeholder="הזן תיאור..."
                                   />
                                </div>
                             </div>

                             {/* Button Fields */}
                             <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                                <div>
                                   <label className="block text-xs font-medium text-gray-700 mb-1.5">טקסט כפתור</label>
                                   <input
                                     type="text"
                                     value={block.content?.button_text || ''}
                                     onChange={(e) => updateMcColumn(block.id, { button_text: e.target.value })}
                                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white hover:border-gray-300"
                                     placeholder="למשל: קרא עוד"
                                   />
                                </div>
                                <div>
                                   <label className="block text-xs font-medium text-gray-700 mb-1.5">קישור</label>
                                   <input
                                     type="text"
                                     value={block.content?.button_url || ''}
                                     onChange={(e) => updateMcColumn(block.id, { button_url: e.target.value })}
                                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white hover:border-gray-300"
                                     placeholder="/page"
                                     dir="ltr"
                                   />
                                </div>
                             </div>
                          </div>
                        )}
                     </div>
                   );
                })}

                <button
                  onClick={addMcColumn}
                  className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium transition-all"
                >
                  <HiPlus className="w-4 h-4" />
                  הוסף עמודה חדשה
                </button>
              </div>
            </SettingGroup>

            <SettingGroup title="פריסה ועיצוב">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {renderSelect('עמודות (דסקטופ)', 'columns_desktop', [
                      { label: '2', value: 2 },
                      { label: '3', value: 3 },
                      { label: '4', value: 4 },
                      { label: '5', value: 5 },
                      { label: '6', value: 6 },
                    ])}
                    {renderSelect('עמודות (מובייל)', 'columns_mobile', [
                      { label: '1', value: 1 },
                      { label: '2', value: 2 },
                    ])}
                </div>
                
                <div className="border-t border-gray-100 my-2 pt-2"></div>
                
                {renderSelect('יישור תוכן', 'text_align', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
                {renderSelect('מרווח בין עמודות', 'column_gap', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
              </div>
            </SettingGroup>

            <SettingGroup title="תמונות ומדיה">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {renderSelect('יחס גובה-רוחב', 'image_ratio', [
                      { label: 'ריבוע (1:1)', value: 'square' },
                      { label: 'דיוקן (3:4)', value: 'portrait' },
                      { label: 'נוף (4:3)', value: 'landscape' },
                      { label: 'עיגול', value: 'circle' },
                      { label: 'סטורי (9:16)', value: 'story' },
                      { label: 'רחב (16:9)', value: 'wide' },
                      { label: 'גבוה (2:3)', value: 'tall' },
                      { label: 'אולטרה רחב (21:9)', value: 'ultra_wide' },
                      { label: 'אנכי (9:16)', value: 'vertical' },
                      { label: 'אופקי (16:10)', value: 'horizontal' },
                    ])}
                    {/* ✅ שינוי ל-number input עם טיפול אוטומטי ב-px */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        עיגול פינות
                      </label>
                      <input
                        type="number"
                        value={parseInt(getValue('image_border_radius', '8px').replace('px', '')) || 8}
                        onChange={(e) => {
                          const numValue = parseInt(e.target.value) || 0;
                          handleSettingChange('image_border_radius', numValue > 0 ? `${numValue}px` : '0px');
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/5"
                        placeholder="8"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">px נוסף אוטומטית</p>
                    </div>
                </div>
                {renderSelect('מסגרת תמונה', 'image_border', [
                  { label: 'ללא', value: false },
                  { label: 'עם מסגרת', value: true },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'custom_html':
        return (
          <div className="space-y-1">
            <SettingGroup title="קוד HTML">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קוד HTML
                  </label>
                  <textarea
                    value={getValue('html_content', '')}
                    onChange={(e) => handleSettingChange('html_content', e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="<div>הזן כאן את קוד ה-HTML שלך...</div>"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ קוד לא בטוח עלול לגרום לבעיות באתר. ודא שהקוד תקין.
                  </p>
                </div>
              </div>
            </SettingGroup>

            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('רוחב תוכן', 'container_width', [
                  { label: 'צר', value: 'narrow' },
                  { label: 'רגיל', value: 'container' },
                  { label: 'מלא', value: 'full' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      // ========== Checkout Page Settings ==========
      case 'checkout_form':
        return (
          <div className="space-y-1">
            <SettingGroup title="עיצוב כללי">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">צבע עמודה ימנית (טופס)</label>
                  <ModernColorPicker
                    value={getValue('layout.right_column_color', '#ffffff')}
                    onChange={(color) => handleSettingChange('layout.right_column_color', color)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">צבע עמודה שמאלית (סיכום)</label>
                  <ModernColorPicker
                    value={getValue('layout.left_column_color', '#fafafa')}
                    onChange={(color) => handleSettingChange('layout.left_column_color', color)}
                  />
                </div>
              </div>
            </SettingGroup>
            
            <SettingGroup title="כפתור תשלום">
              <div className="space-y-4">
                {renderInput('טקסט הכפתור', 'button.text', 'לתשלום')}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">צבע רקע</label>
                  <ModernColorPicker
                    value={getValue('button.background_color', '#000000')}
                    onChange={(color) => handleSettingChange('button.background_color', color)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">צבע טקסט</label>
                  <ModernColorPicker
                    value={getValue('button.text_color', '#ffffff')}
                    onChange={(color) => handleSettingChange('button.text_color', color)}
                  />
                </div>
                {renderInput('עיגול פינות (px)', 'button.border_radius', '8', 'number')}
              </div>
            </SettingGroup>

            <CheckoutFieldsOrder 
              getValue={getValue}
              handleSettingChange={handleSettingChange}
            />

            <SettingGroup title="שדות מותאמים אישית">
              <div className="space-y-4">
                <p className="text-xs text-gray-500 mb-4">
                  הוסף שדות נוספים שיופיעו בטופס ויישמרו עם ההזמנה.
                </p>
                {(() => {
                  const customFields = getValue('custom_fields', []) as any[];
                  return (
                    <>
                      {customFields.map((field: any, index: number) => (
                        <div key={field.id || index} className="p-3 border border-blue-200 rounded-lg bg-blue-50/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-700">שדה {index + 1}</span>
                            <button
                              onClick={() => {
                                const newFields = customFields.filter((_, i) => i !== index);
                                handleSettingChange('custom_fields', newFields);
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={field.label || ''}
                            onChange={(e) => {
                              const newFields = [...customFields];
                              newFields[index] = { ...field, label: e.target.value };
                              handleSettingChange('custom_fields', newFields);
                            }}
                            placeholder="שם השדה"
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                          />
                          <select
                            value={field.type || 'text'}
                            onChange={(e) => {
                              const newFields = [...customFields];
                              newFields[index] = { ...field, type: e.target.value };
                              handleSettingChange('custom_fields', newFields);
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                          >
                            <option value="text">טקסט</option>
                            <option value="textarea">טקסט ארוך</option>
                            <option value="date">תאריך</option>
                            <option value="select">בחירה מרשימה</option>
                          </select>
                          {field.type === 'select' && (
                            <input
                              type="text"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[index] = { 
                                  ...field, 
                                  options: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) 
                                };
                                handleSettingChange('custom_fields', newFields);
                              }}
                              placeholder="אפשרויות (מופרדות בפסיק)"
                              className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) => {
                                const newFields = [...customFields];
                                newFields[index] = { ...field, required: e.target.checked };
                                handleSettingChange('custom_fields', newFields);
                              }}
                              className="rounded border-gray-300"
                            />
                            <label className="text-sm text-gray-600">שדה חובה</label>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newField = {
                            id: `custom_${Date.now()}`,
                            label: '',
                            type: 'text',
                            required: false,
                            placeholder: ''
                          };
                          handleSettingChange('custom_fields', [...customFields, newField]);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                      >
                        <HiPlus className="w-4 h-4" />
                        הוסף שדה מותאם
                      </button>
                    </>
                  );
                })()}
              </div>
            </SettingGroup>

            <SettingGroup title="הגדרות נוספות">
              <div className="space-y-4">
                {renderSelect('הצג הערות להזמנה', 'show_order_notes', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], true)}
                {renderSelect('הצג אפשרויות משלוח', 'show_shipping_options', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], true)}
                {renderSelect('הצג אמצעי תשלום', 'show_payment_methods', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], true)}
              </div>
            </SettingGroup>

            <SettingGroup title="הסכמה לתקנון">
              <div className="space-y-4">
                {renderSelect('הצג צ\'קבוקס הסכמה לתקנון', 'terms_checkbox.enabled', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], false)}
                {getValue('terms_checkbox.enabled', false) && (
                  <>
                    {renderInput('טקסט לפני הלינק', 'terms_checkbox.text_before', 'קראתי ואני מסכים/ה ל')}
                    {renderInput('טקסט הלינק', 'terms_checkbox.link_text', 'תקנון האתר')}
                    {renderInput('עמוד התקנון (handle)', 'terms_checkbox.terms_page', 'terms', 'text', 'ברירת מחדל: terms')}
                    {renderSelect('פתיחה ב', 'terms_checkbox.open_in', [
                      { label: 'מודל (חלונית)', value: 'modal' },
                      { label: 'עמוד חדש', value: 'new_tab' },
                    ], 'modal')}
                  </>
                )}
              </div>
            </SettingGroup>
          </div>
        );

      // ========== Elements (יחידים) - Repeaters ==========
      case 'element_heading':
        const headingBlocks = section.blocks?.filter(b => b.type === 'heading') || [];
        
        const addHeading = () => {
          const newBlock = {
            id: `heading-${Date.now()}`,
            type: 'heading' as const,
            content: {
              heading: 'כותרת חדשה',
              heading_tag: 'h2',
              text_align: 'right'
            },
            style: {},
            settings: {}
          };
          onUpdate({
            blocks: [...(section.blocks || []), newBlock]
          });
        };
        
        const removeHeading = (blockId: string) => {
          const newBlocks = (section.blocks || []).filter(b => b.id !== blockId);
          onUpdate({ blocks: newBlocks });
        };

        const updateHeading = (blockId: string, updates: any) => {
          const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
          const index = newBlocks.findIndex((b: any) => b.id === blockId);
          if (index >= 0) {
            newBlocks[index].content = { ...newBlocks[index].content, ...updates };
            onUpdate({ blocks: newBlocks });
          }
        };

        const updateHeadingBlockStyle = (blockId: string, styleUpdates: any) => {
          const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
          const index = newBlocks.findIndex((b: any) => b.id === blockId);
          if (index >= 0) {
            if (!newBlocks[index].style) newBlocks[index].style = {};
            newBlocks[index].style = {
              ...newBlocks[index].style,
              ...styleUpdates
            };
            onUpdate({ blocks: newBlocks });
          }
        };

        const openTypographyPopover = (event: React.MouseEvent<HTMLElement>, blockId: string) => {
          setTypographyAnchor(event.currentTarget);
          setSelectedBlockId(blockId);
          setSelectedSectionType('element_heading');
        };

        const getBlockTypography = (blockId: string) => {
          const block = section.blocks?.find(b => b.id === blockId);
          return block?.style?.typography || {};
        };

        return (
          <div className="space-y-1">
            <SettingGroup title="כותרות">
              <div className="space-y-4">
                <button
                  onClick={addHeading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  <HiPlus className="w-5 h-5" />
                  הוסף כותרת
                </button>

                <div className="space-y-3">
                  {headingBlocks.map((block, index) => (
                    <div key={block.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-sm">כותרת {index + 1}</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => openTypographyPopover(e, block.id)} 
                            className={`p-1 rounded transition-colors ${selectedBlockId === block.id && typographyAnchor ? 'text-gray-800 bg-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="ערוך טיפוגרפיה"
                          >
                            <span className="text-sm font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Aa</span>
                          </button>
                          <button onClick={() => removeHeading(block.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <input 
                          className="w-full text-sm p-2 border rounded" 
                          placeholder="כותרת"
                          value={block.content?.heading || ''}
                          onChange={(e) => updateHeading(block.id, { heading: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            className="text-xs p-2 border rounded"
                            value={block.content?.heading_tag || 'h2'}
                            onChange={(e) => updateHeading(block.id, { heading_tag: e.target.value })}
                          >
                            <option value="h1">H1 (למטרות SEO)</option>
                            <option value="h2">H2</option>
                            <option value="h3">H3</option>
                            <option value="h4">H4</option>
                            <option value="h5">H5</option>
                            <option value="h6">H6</option>
                          </select>
                          <select 
                            className="text-xs p-2 border rounded"
                            value={block.content?.text_align || 'right'}
                            onChange={(e) => updateHeading(block.id, { text_align: e.target.value })}
                          >
                            <option value="right">ימין</option>
                            <option value="center">מרכז</option>
                            <option value="left">שמאל</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SettingGroup>
          </div>
        );

      case 'element_content':
        return (
          <div className="space-y-1">
            <SettingGroup title="תוכן">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תוכן</label>
                  <RichTextEditor
                    value={getValue('content', '')}
                    onChange={(html) => handleSettingChange('content', html)}
                    placeholder="הזן תוכן..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            </SettingGroup>
            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderSelect('גודל טקסט', 'text_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'גדול מאוד', value: 'xlarge' },
                ])}
                {renderSelect('יישור', 'text_align', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'element_button':
        return (
          <div className="space-y-1">
            <SettingGroup title="תוכן">
              <div className="space-y-4">
                {renderInput('טקסט כפתור', 'button_text', 'כפתור')}
                {renderInput('קישור', 'button_url', '#', 'text', undefined, 'ltr')}
              </div>
            </SettingGroup>
            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderSelect('גודל כפתור', 'button_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                ])}
                {renderSelect('סגנון כפתור', 'button_style_type', [
                  { label: 'מלא', value: 'solid' },
                  { label: 'מסגרת', value: 'outline' },
                  { label: 'קישור', value: 'link' },
                ])}
                {renderSelect('יישור', 'text_align', [
                  { label: 'ימין', value: 'right' },
                  { label: 'מרכז', value: 'center' },
                  { label: 'שמאל', value: 'left' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'element_image':
        return (
          <div className="space-y-1">
            <SettingGroup title="תמונה">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תמונה למחשב</label>
                    {getValue('image_url') ? (
                      <div className="relative group">
                        <img 
                          src={getValue('image_url')} 
                          alt="תמונה" 
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setMediaType('image');
                            setTargetBlockId(null);
                            setImageDeviceTarget('desktop');
                            setIsMediaPickerOpen(true);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white"
                        >
                          <HiPhotograph className="w-6 h-6 mr-2" />
                          החלף תמונה
                        </button>
                        <button
                          onClick={() => handleSettingChange('image_url', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setMediaType('image');
                          setTargetBlockId(null);
                          setImageDeviceTarget('desktop');
                          setIsMediaPickerOpen(true);
                        }}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <HiPhotograph className="w-8 h-8 mb-2" />
                        <span>הוסף תמונה למחשב</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">תמונה למובייל (אופציונלי)</label>
                    {getValue('image_url_mobile') ? (
                      <div className="relative group">
                        <img 
                          src={getValue('image_url_mobile')} 
                          alt="תמונה מובייל" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setMediaType('image');
                            setTargetBlockId(null);
                            setImageDeviceTarget('mobile');
                            setIsMediaPickerOpen(true);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white"
                        >
                          <HiPhotograph className="w-6 h-6 mr-2" />
                          החלף תמונה
                        </button>
                        <button
                          onClick={() => handleSettingChange('image_url_mobile', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setMediaType('image');
                          setTargetBlockId(null);
                          setImageDeviceTarget('mobile');
                          setIsMediaPickerOpen(true);
                        }}
                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <HiDeviceMobile className="w-6 h-6 mb-1" />
                        <span className="text-xs">הוסף תמונה למובייל</span>
                      </button>
                    )}
                  </div>
                </div>
                {renderInput('טקסט חלופי (Alt)', 'alt_text', '')}
              </div>
            </SettingGroup>
            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('רוחב תמונה', 'image_width', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'מלא', value: 'full' },
                ])}
                {renderSelect('יחס גובה-רוחב', 'image_ratio', [
                  { label: 'מותאם', value: 'adapt' },
                  { label: 'ריבוע', value: 'square' },
                  { label: 'פורטרט', value: 'portrait' },
                  { label: 'לנדסקפ', value: 'landscape' },
                ])}
                {renderSelect('התאמת תמונה', 'image_fit', [
                  { label: 'כיסוי (Cover)', value: 'cover' },
                  { label: 'הכל (Contain)', value: 'contain' },
                  { label: 'מילוי (Fill)', value: 'fill' },
                ])}
                {renderSelect('מיקום תמונה', 'image_position', [
                  { label: 'מרכז', value: 'center' },
                  { label: 'למעלה', value: 'top' },
                  { label: 'למטה', value: 'bottom' },
                  { label: 'שמאל', value: 'left' },
                  { label: 'ימין', value: 'right' },
                ])}
              </div>
            </SettingGroup>
            <SettingGroup title="קישור">
              <div className="space-y-4">
                {renderInput('קישור (אופציונלי)', 'link_url', '', 'text', undefined, 'ltr')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'element_video':
        return (
          <div className="space-y-1">
            <SettingGroup title="וידאו">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">וידאו למחשב</label>
                    {getValue('video_url') ? (
                      <div className="relative group">
                        <video 
                          src={getValue('video_url')} 
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          controls
                        />
                        <button
                          onClick={() => {
                            setMediaType('video');
                            setTargetBlockId(null);
                            setImageDeviceTarget('desktop');
                            setIsMediaPickerOpen(true);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white"
                        >
                          <HiVideoCamera className="w-6 h-6 mr-2" />
                          החלף וידאו
                        </button>
                        <button
                          onClick={() => handleSettingChange('video_url', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setMediaType('video');
                          setTargetBlockId(null);
                          setImageDeviceTarget('desktop');
                          setIsMediaPickerOpen(true);
                        }}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <HiVideoCamera className="w-8 h-8 mb-2" />
                        <span>הוסף וידאו למחשב</span>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">וידאו למובייל (אופציונלי)</label>
                    {getValue('video_url_mobile') ? (
                      <div className="relative group">
                        <video 
                          src={getValue('video_url_mobile')} 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          controls
                        />
                        <button
                          onClick={() => {
                            setMediaType('video');
                            setTargetBlockId(null);
                            setImageDeviceTarget('mobile');
                            setIsMediaPickerOpen(true);
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white"
                        >
                          <HiVideoCamera className="w-6 h-6 mr-2" />
                          החלף וידאו
                        </button>
                        <button
                          onClick={() => handleSettingChange('video_url_mobile', '')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setMediaType('video');
                          setTargetBlockId(null);
                          setImageDeviceTarget('mobile');
                          setIsMediaPickerOpen(true);
                        }}
                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <HiDeviceMobile className="w-6 h-6 mb-1" />
                        <span className="text-xs">הוסף וידאו למובייל</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SettingGroup>
            <SettingGroup title="הגדרות נגן">
              <div className="space-y-4">
                {renderSelect('הצג בקרות', 'controls', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], true)}
                {renderSelect('הפעלה אוטומטית', 'autoplay', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], false)}
                {renderSelect('השתק', 'muted', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], false)}
                {renderSelect('לולאה', 'loop', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], false)}
                {renderSelect('נגן אוטומטי במובייל', 'plays_inline', [
                  { label: 'כן', value: true },
                  { label: 'לא', value: false },
                ], false)}
              </div>
            </SettingGroup>
            <SettingGroup title="פריסה">
              <div className="space-y-4">
                {renderSelect('התאמת וידאו', 'video_fit', [
                  { label: 'כיסוי (Cover)', value: 'cover' },
                  { label: 'הכל (Contain)', value: 'contain' },
                  { label: 'מילוי (Fill)', value: 'fill' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      case 'element_divider':
        return (
          <div className="space-y-1">
            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderSelect('סגנון', 'divider_style', [
                  { label: 'רציף', value: 'solid' },
                  { label: 'מקווקו', value: 'dashed' },
                  { label: 'מנוקד', value: 'dotted' },
                  { label: 'כפול', value: 'double' },
                ])}
                {renderSelect('רוחב', 'divider_width', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'מלא', value: 'full' },
                ])}
                {renderInput('עובי (px)', 'divider_thickness', '1', 'number')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'element_spacer':
        return (
          <div className="space-y-1">
            <SettingGroup title="גובה">
              <div className="space-y-4">
                {renderInput('גובה (px)', 'height', '20', 'text', 'לדוגמה: 20px, 50px, 100px', 'ltr')}
              </div>
            </SettingGroup>
          </div>
        );

      case 'element_marquee':
        return (
          <div className="space-y-1">
            <SettingGroup title="תוכן">
              <div className="space-y-4">
                {renderInput('טקסט', 'text', 'טקסט נע')}
              </div>
            </SettingGroup>
            <SettingGroup title="אנימציה">
              <div className="space-y-4">
                {renderSelect('כיוון', 'direction', [
                  { label: 'ימין', value: 'right' },
                  { label: 'שמאל', value: 'left' },
                ])}
                {renderSelect('מהירות', 'speed', [
                  { label: 'איטי', value: 'slow' },
                  { label: 'רגיל', value: 'normal' },
                  { label: 'מהיר', value: 'fast' },
                ])}
              </div>
            </SettingGroup>
            <SettingGroup title="עיצוב">
              <div className="space-y-4">
                {renderSelect('גודל טקסט', 'text_size', [
                  { label: 'קטן', value: 'small' },
                  { label: 'בינוני', value: 'medium' },
                  { label: 'גדול', value: 'large' },
                  { label: 'גדול מאוד', value: 'xlarge' },
                ])}
              </div>
            </SettingGroup>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-gray-500">
            <p>אין הגדרות זמינות לסוג סקשן זה</p>
          </div>
        );
    }
  };

  return (
    <div className="pb-8">
      {renderSettingsForType()}

      {/* Advanced Settings */}
      <SettingGroup title="מתקדם" defaultOpen={false}>
         <div className="space-y-4">
            {renderInput('מזהה סקשן (ID)', 'custom_id', 'my-section', 'text', 'משמש לקישורים פנימיים ו-CSS', 'ltr')}
            {renderInput('מחלקת CSS (Class)', 'custom_css_class', 'my-custom-class', 'text', undefined, 'ltr')}
         </div>
      </SettingGroup>
      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={handleMediaSelect}
        shopId={storeId ? String(storeId) : undefined}
        title={
          mediaType === 'auto' ? 'בחר מדיה' :
          mediaType === 'image' ? (section.type === 'gallery' ? 'בחר תמונות' : 'בחר תמונה') :
          'בחר וידאו'
        }
        multiple={section.type === 'gallery'}
        accept={
          section.type === 'slideshow' || section.type === 'image_with_text' || section.type === 'hero_banner' || section.type === 'multicolumn' || section.type === 'element_image' || section.type === 'element_video' 
            ? 'all' // ✅ Allow both image and video for slideshow and other sections
            : mediaType === 'auto' 
            ? 'all' 
            : mediaType
        }
        accept={section.type === 'image_with_text' || section.type === 'hero_banner' || section.type === 'multicolumn' || section.type === 'element_image' || section.type === 'element_video' ? 'all' : mediaType === 'auto' ? 'all' : mediaType}
      />

      {/* Typography Popover for blocks - works for all repeater sections */}
      {selectedBlockId && typographyAnchor && (() => {
        const updateBlockStyle = (blockId: string, styleUpdates: any) => {
          const newBlocks = JSON.parse(JSON.stringify(section.blocks || []));
          const index = newBlocks.findIndex((b: any) => b.id === blockId);
          if (index >= 0) {
            if (!newBlocks[index].style) newBlocks[index].style = {};
            newBlocks[index].style = {
              ...newBlocks[index].style,
              ...styleUpdates
            };
            onUpdate({ blocks: newBlocks });
          }
        };

        const getBlockTypography = () => {
          const block = section.blocks?.find(b => b.id === selectedBlockId);
          return block?.style?.typography || {};
        };

        return (
          <TypographyPopover
            open={Boolean(typographyAnchor)}
            anchorEl={typographyAnchor}
            onClose={() => {
              setTypographyAnchor(null);
              setSelectedBlockId(null);
              setSelectedSectionType(null);
            }}
            typography={getBlockTypography()}
            onUpdate={(typography) => {
              updateBlockStyle(selectedBlockId, { typography });
            }}
          />
        );
      })()}
    </div>
  );
}
