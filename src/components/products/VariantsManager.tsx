'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { HiPlus, HiTrash, HiX, HiPhotograph, HiUpload } from 'react-icons/hi';
import { ProductOption, ProductOptionValue, ProductVariant } from '@/types/product';
import { MediaPicker } from '@/components/MediaPicker';
import { getVariantDisplayName } from '@/lib/utils/variant-display';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSwappingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VariantsManagerProps {
  options: ProductOption[];
  variants: ProductVariant[];
  onOptionsChange: (options: ProductOption[]) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  productId: number;
  defaultVariantId?: string | null;
  onDefaultVariantChange?: (variantId: string | null) => void;
  shopId?: string;
  hasVariants?: boolean;
  onHasVariantsChange?: (hasVariants: boolean) => void;
}

// Popular colors mapping (Hebrew)
const popularColors: Record<string, string> = {
  'שחור': '#000000',
  'לבן': '#FFFFFF',
  'אדום': '#FF0000',
  'כחול': '#0000FF',
  'ירוק': '#00FF00',
  'צהוב': '#FFFF00',
  'כתום': '#FFA500',
  'סגול': '#800080',
  'ורוד': '#FFC0CB',
  'חום': '#8B4513',
  'אפור': '#808080',
  'זהב': '#FFD700',
  'כסף': '#C0C0C0',
  'תכלת': '#00FFFF',
  'ורד': '#FF69B4',
  'שמנת': '#FFFDD0',
  'בז\'': '#F5F5DC',
  'חאקי': '#F0E68C',
  'טורקיז': '#40E0D0',
  'אפרסק': '#FFDAB9',
};

// Detect color from name - moved outside component
const detectColorFromName = (name: string): string | null => {
  const lowerName = name.toLowerCase().trim();
  const colorKey = Object.keys(popularColors).find(key => 
    key.toLowerCase() === lowerName
  );
  return colorKey ? popularColors[colorKey] : null;
};

// Props interfaces for sortable components
interface SortableOptionItemProps {
  option: ProductOption;
  optionIndex: number;
  sensors: ReturnType<typeof useSensors>;
  onUpdate: (index: number, updates: Partial<ProductOption>) => void;
  onDelete: (index: number) => void;
  onAddValue: (optionIndex: number, value: string, metadata?: { color?: string }) => void;
  onDeleteValue: (optionIndex: number, valueIndex: number) => void;
  onValuesDragEnd: (optionIndex: number) => (event: DragEndEvent) => void;
}

// Sortable Option Item Component - defined outside VariantsManager
function SortableOptionItem({ 
  option, 
  optionIndex,
  sensors,
  onUpdate,
  onDelete,
  onAddValue,
  onDeleteValue,
  onValuesDragEnd,
}: SortableOptionItemProps) {
  // Local state בתוך הקומפוננטה - לא תלוי ב-state של הקומפוננטה הראשית
  const [localName, setLocalName] = useState(option.name);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNameBlur = () => {
    if (localName !== option.name) {
      onUpdate(optionIndex, { name: localName });
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <Input
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="שם אפשרות (לדוגמה: צבע)"
          className="flex-1"
        />
        <Select
          value={option.type || 'button'}
          onValueChange={(value) => onUpdate(optionIndex, { type: value as 'button' | 'color' | 'pattern' | 'image' })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="בחר סוג">
              {option.type === 'button' && 'כפתור'}
              {option.type === 'color' && 'צבע'}
              {option.type === 'pattern' && 'דוגמה'}
              {option.type === 'image' && 'תמונה'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="button">כפתור</SelectItem>
            <SelectItem value="color">צבע</SelectItem>
            <SelectItem value="pattern">דוגמה</SelectItem>
            <SelectItem value="image">תמונה</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(optionIndex)}
        >
          <HiTrash className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">ערכים</label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onValuesDragEnd(optionIndex)}
        >
          <SortableContext
            items={option.values?.map(v => v.id) || []}
            strategy={rectSwappingStrategy}
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {option.values?.map((value, valueIndex) => (
                <SortableValueItem
                  key={value.id}
                  value={value}
                  option={option}
                  onDelete={() => onDeleteValue(optionIndex, valueIndex)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Input for adding values */}
        {option.type === 'button' && (
          <div className="flex gap-2">
            <Input
              placeholder="הוסף ערך"
              className="w-40"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    onAddValue(optionIndex, value);
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                const value = input.value.trim();
                if (value) {
                  onAddValue(optionIndex, value);
                  input.value = "";
                }
              }}
            >
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {option.type === 'color' && (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                id={`color-${option.id}`}
                className="w-12 h-10 rounded border cursor-pointer"
                defaultValue="#000000"
              />
              <Input
                placeholder="שם צבע (לדוגמה: שחור, לבן, אדום)"
                className="flex-1"
                id={`color-label-${option.id}`}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  if (value) {
                    const detectedColor = detectColorFromName(value);
                    if (detectedColor) {
                      const colorInput = document.getElementById(`color-${option.id}`) as HTMLInputElement;
                      if (colorInput) colorInput.value = detectedColor;
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const colorInput = document.getElementById(`color-${option.id}`) as HTMLInputElement;
                    const value = input.value.trim();
                    const detectedColor = detectColorFromName(value);
                    const color = detectedColor || colorInput?.value || "#000000";
                    
                    if (value) {
                      onAddValue(optionIndex, value, { color });
                      input.value = "";
                      if (colorInput) colorInput.value = "#000000";
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const input = document.getElementById(`color-label-${option.id}`) as HTMLInputElement;
                  const colorInput = document.getElementById(`color-${option.id}`) as HTMLInputElement;
                  const value = input.value.trim();
                  const detectedColor = detectColorFromName(value);
                  const color = detectedColor || colorInput?.value || "#000000";
                  
                  if (value) {
                    onAddValue(optionIndex, value, { color });
                    input.value = "";
                    if (colorInput) colorInput.value = "#000000";
                  }
                }}
              >
                <HiPlus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              💡 כתוב שם צבע בעברית וקוד הצבע יזוהה אוטומטית (20 צבעים פופולריים)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable Value Item Component - defined outside VariantsManager
function SortableValueItem({ 
  value, 
  option, 
  onDelete 
}: { 
  value: ProductOptionValue; 
  option: ProductOption; 
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border bg-gray-100"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      {option.type === 'color' && value.metadata?.color && (
        <div
          className="w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: value.metadata.color }}
        />
      )}
      <span>{value.value}</span>
      <button
        onClick={onDelete}
        className="text-gray-500 hover:text-gray-700"
      >
        <HiX className="w-4 h-4" />
      </button>
    </div>
  );
}

export function VariantsManager({
  options,
  variants,
  onOptionsChange,
  onVariantsChange,
  productId,
  defaultVariantId,
  onDefaultVariantChange,
  shopId,
  hasVariants: hasVariantsProp,
  onHasVariantsChange,
}: VariantsManagerProps) {
  const [localHasVariants, setLocalHasVariants] = useState(options.length > 0 || variants.length > 1);
  const hasVariants = hasVariantsProp !== undefined ? hasVariantsProp : localHasVariants;
  
  const [enableValueGalleries, setEnableValueGalleries] = useState(false);
  const [selectedOptionForGallery, setSelectedOptionForGallery] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState<Record<string, boolean>>({});

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // דורש תזוזה קטנה כדי להתחיל גרירה – מאפשר הקלדה חופשית בשדות
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for options
  const handleOptionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((opt) => opt.id === Number(active.id));
      const newIndex = options.findIndex((opt) => opt.id === Number(over.id));
      
      const newOptions = arrayMove(options, oldIndex, newIndex);
      onOptionsChange(newOptions);
    }
  };

  // Handle drag end for option values
  const handleValuesDragEnd = (optionIndex: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const option = options[optionIndex];
      if (!option.values) return;
      
      const oldIndex = option.values.findIndex((val) => val.id === Number(active.id));
      const newIndex = option.values.findIndex((val) => val.id === Number(over.id));
      
      const newOptions = [...options];
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        values: arrayMove(option.values, oldIndex, newIndex),
      };
      onOptionsChange(newOptions);
      generateVariants(newOptions);
    }
  };

  // Generate all possible variant combinations from options
  const generateVariants = (opts: ProductOption[]) => {
    if (
      opts.length === 0 ||
      opts.some((o) => !o.name?.trim() || !o.values || o.values.length === 0)
    ) {
      onVariantsChange([]);
      return;
    }

    const combinations: Record<string, string>[][] = [[]];
    
    opts.forEach(option => {
      const newCombinations: Record<string, string>[][] = [];
      combinations.forEach(combination => {
        option.values?.forEach(value => {
          const displayValue = value.value || String(value);
          newCombinations.push([
            ...combination,
            { [option.name]: displayValue }
          ]);
        });
      });
      combinations.length = 0;
      combinations.push(...newCombinations);
    });

    const newVariants = combinations.map((combination, index) => {
      const optionValues: Record<string, string> = {};
      combination.forEach(opt => {
        Object.assign(optionValues, opt);
      });
      
      const title = Object.values(optionValues).join(" / ");
      
      // מחפש variant קיים לפי title, אבל מתעלם מ-"Default Title"
      const existing = variants.find(v => 
        v.title === title && v.title !== 'Default Title'
      );

      return existing || {
        id: Date.now() + index,
        product_id: productId,
        title,
        price: variants.find(v => v.title !== 'Default Title')?.price || variants[0]?.price || '0.00',
        compare_at_price: variants.find(v => v.title !== 'Default Title')?.compare_at_price || null,
        sku: null,
        barcode: null,
        position: index + 1,
        inventory_quantity: 0,
        inventory_policy: 'deny',
        inventory_management: null,
        weight: null,
        weight_unit: 'kg',
        requires_shipping: true,
        taxable: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
    });
    // הסרה של כפילויות לפי כותרת
    const uniqueByTitle = new Map<string, ProductVariant>();
    newVariants.forEach((variant) => {
      if (variant.title) {
        uniqueByTitle.set(variant.title, variant);
      }
    });

    // הסרת variants עם "Default Title" כאשר יש options
    const finalVariants = Array.from(uniqueByTitle.values()).filter(
      v => v.title !== 'Default Title'
    );

    onVariantsChange(finalVariants);
  };

  const addOption = () => {
    const newOption: ProductOption = {
      id: Date.now(),
      product_id: productId,
      name: '',
      position: options.length + 1,
      type: 'button',
      created_at: new Date(),
      values: [],
    };
    onOptionsChange([...options, newOption]);
  };

  const updateOption = (index: number, updates: Partial<ProductOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onOptionsChange(newOptions);
    if (updates.values !== undefined) {
      generateVariants(newOptions);
    }
  };

  const deleteOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    onOptionsChange(updated);
    generateVariants(updated);
  };

  const addOptionValue = (optionIndex: number, value: string, metadata?: { color?: string; image?: string; pattern?: string; backgroundSize?: string; backgroundPosition?: string }) => {
    if (!value.trim()) return;

    const newOptions = [...options];
    const option = newOptions[optionIndex];
    
    const valueExists = option.values?.some((v: ProductOptionValue) => v.value === value.trim());
    
    if (valueExists) return;

    const newValue: ProductOptionValue = {
      id: Date.now(),
      option_id: option.id,
      value: value.trim(),
      position: (option.values?.length || 0) + 1,
      metadata: metadata || {},
    };

    if (!option.values) {
      option.values = [];
    }
    option.values.push(newValue);
    onOptionsChange(newOptions);
    generateVariants(newOptions);
  };

  // -------- עריכה גורפת של וריאציות --------
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState<string>('');
  const [bulkInventory, setBulkInventory] = useState<string>('');

  const applyBulkToVariants = () => {
    if (variants.length === 0) return;

    const updated = variants.map((v) => ({
      ...v,
      price: bulkPrice !== '' ? bulkPrice : v.price,
      compare_at_price: bulkCompareAtPrice !== '' ? bulkCompareAtPrice : v.compare_at_price,
      inventory_quantity:
        bulkInventory !== '' ? parseInt(bulkInventory) || 0 : v.inventory_quantity,
    }));

    onVariantsChange(updated);
  };

  const updateOptionValueMetadata = (optionIndex: number, valueIndex: number, metadata: { images?: string[] }) => {
    const newOptions = [...options];
    if (newOptions[optionIndex].values) {
      newOptions[optionIndex].values![valueIndex] = {
        ...newOptions[optionIndex].values![valueIndex],
        metadata: {
          ...newOptions[optionIndex].values![valueIndex].metadata,
          ...metadata,
        },
      };
      onOptionsChange(newOptions);
    }
  };

  const deleteOptionValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    if (newOptions[optionIndex].values) {
      newOptions[optionIndex].values = newOptions[optionIndex].values!.filter(
        (_, i) => i !== valueIndex
      );
    }
    onOptionsChange(newOptions);
    generateVariants(newOptions);
  };

  const handleEnabledChange = (checked: boolean) => {
    if (onHasVariantsChange) {
      onHasVariantsChange(checked);
    } else {
      setLocalHasVariants(checked);
    }
    
    if (!checked) {
      onOptionsChange([]);
      onVariantsChange([]);
    } else if (options.length === 0) {
      addOption();
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">וריאציות ואפשרויות</h2>
        </div>

        <div className="space-y-4">
          {/* Enable variants checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => handleEnabledChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              למוצר זה יש אפשרויות, כמו גודל או צבע
            </span>
          </label>

          {hasVariants && (
            <>
              {/* Options Management with Drag & Drop */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">אפשרויות</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addOption}
                  >
                    <HiPlus className="w-4 h-4 ml-2" />
                    הוסף אפשרות
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleOptionsDragEnd}
                >
                  <SortableContext
                    items={options.map(opt => opt.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {options.map((option, optionIndex) => (
                      <SortableOptionItem
                        key={option.id}
                        option={option}
                        optionIndex={optionIndex}
                        sensors={sensors}
                        onUpdate={updateOption}
                        onDelete={deleteOption}
                        onAddValue={addOptionValue}
                        onDeleteValue={deleteOptionValue}
                        onValuesDragEnd={handleValuesDragEnd}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Option Value Galleries */}
              {hasVariants && options.length > 0 && (
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">גלריות לערכי אפשרויות</h3>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={enableValueGalleries}
                        onCheckedChange={(checked) => setEnableValueGalleries(checked === true)}
                      />
                      <Label className="text-sm cursor-pointer mb-0">
                        הפעל גלריות
                      </Label>
                    </div>
                  </div>

                  {enableValueGalleries && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">בחר אפשרות לגלריה</Label>
                        <Select
                          value={selectedOptionForGallery || ""}
                          onValueChange={setSelectedOptionForGallery}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="בחר אפשרות" />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((opt) => (
                              <SelectItem key={opt.id} value={String(opt.id)}>
                                {opt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-600 mt-2">
                          לכל ערך באפשרות הנבחרת תהיה גלריית תמונות נפרדת
                        </p>
                      </div>

                      {selectedOptionForGallery && (() => {
                        const selectedOption = options.find(opt => String(opt.id) === selectedOptionForGallery);
                        if (!selectedOption) return null;

                        return (
                          <div className="space-y-3">
                            {selectedOption.values?.map((value, valueIndex) => {
                              const valueKey = `${selectedOption.id}-${valueIndex}`;
                              const displayValue = value.value;
                              const valueImages = value.metadata?.images 
                                ? (Array.isArray(value.metadata.images) ? value.metadata.images : [value.metadata.images])
                                : [];

                              const handleImagesUpdate = (newImages: string[]) => {
                                const optionIndex = options.findIndex(opt => opt.id === selectedOption.id);
                                updateOptionValueMetadata(optionIndex, valueIndex, { images: newImages });
                              };

                              return (
                                <Card key={valueKey} className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium">{displayValue} ({valueImages.length} תמונות)</h4>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        const key = `gallery-${valueKey}`;
                                        setMediaPickerOpen(prev => ({ ...prev, [key]: true }));
                                      }}
                                    >
                                      <HiPhotograph className="w-4 h-4 ml-2" />
                                      בחר קבצים
                                    </Button>
                                  </div>

                                  {valueImages.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2">
                                      {valueImages.map((img: string, idx: number) => (
                                        <div key={idx} className="relative aspect-square rounded border overflow-hidden">
                                          <img src={img} alt={`${displayValue} ${idx + 1}`} className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newImages = valueImages.filter((_: string, i: number) => i !== idx);
                                              handleImagesUpdate(newImages);
                                            }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                          >
                                            <HiX className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                      <HiPhotograph className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500">אין תמונות</p>
                                    </div>
                                  )}

                                  {shopId && (
                                    <MediaPicker
                                      open={mediaPickerOpen?.[`gallery-${valueKey}`] || false}
                                      onOpenChange={(open) => {
                                        setMediaPickerOpen(prev => ({ ...prev, [`gallery-${valueKey}`]: open }));
                                      }}
                                      onSelect={(files) => {
                                        const newFiles = files.filter(file => !valueImages.includes(file));
                                        if (newFiles.length > 0) {
                                          handleImagesUpdate([...valueImages, ...newFiles]);
                                        }
                                        setMediaPickerOpen(prev => ({ ...prev, [`gallery-${valueKey}`]: false }));
                                      }}
                                      selectedFiles={valueImages}
                                      shopId={shopId}
                                      entityType="product-option-value"
                                      entityId={valueKey}
                                      multiple={true}
                                      title={`בחר תמונות ל-${displayValue}`}
                                    />
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Variants Table */}
              {(() => {
                // הצג טבלה רק אם יש options עם ערכים
                const hasOptionsWithValues = options.some(opt => opt.values && opt.values.length > 0);
                // סנן variants - רק כאלה שאינם "Default Title"
                const displayVariants = variants.filter(v => v.title !== 'Default Title');
                
                return hasOptionsWithValues && displayVariants.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">
                        וריאציות ({displayVariants.length})
                      </h3>
                    </div>

                    {/* עריכה גורפת לכל הוריאציות */}
                    <Card className="border border-dashed border-gray-300">
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-gray-800">החלה על כל הווריאציות</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="מחיר"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="מחיר לפני הנחה"
                            value={bulkCompareAtPrice}
                            onChange={(e) => setBulkCompareAtPrice(e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="מלאי"
                            value={bulkInventory}
                            onChange={(e) => setBulkInventory(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" variant="secondary" size="sm" onClick={applyBulkToVariants}>
                            החל על כל הווריאציות
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-center p-2 text-sm font-medium">ברירת מחדל</th>
                            <th className="text-right p-2 text-sm font-medium">שם</th>
                            <th className="text-right p-2 text-sm font-medium">מחיר</th>
                            <th className="text-right p-2 text-sm font-medium">מחיר לפני הנחה</th>
                            <th className="text-right p-2 text-sm font-medium">מקט</th>
                            <th className="text-right p-2 text-sm font-medium">מלאי</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayVariants.map((variant, variantIndex) => {
                            // מצא את האינדקס המקורי ב-variants
                            const originalIndex = variants.findIndex(v => v.id === variant.id);
                            return (
                          <tr key={variant.id} className="border-t">
                            <td className="p-2 text-center">
                              <Checkbox
                                checked={defaultVariantId === String(variant.id)}
                                onCheckedChange={(checked) => {
                                  if (onDefaultVariantChange) {
                                    onDefaultVariantChange(checked ? String(variant.id) : null);
                                  }
                                }}
                                title="סמן כווריאנט ברירת מחדל"
                              />
                            </td>
                            <td className="p-2">
                              <div className="font-medium text-sm">
                                {getVariantDisplayName(
                                  variant.title,
                                  variant.option1,
                                  variant.option2,
                                  variant.option3
                                ) || variant.title || 'וריאציה'}
                              </div>
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.price || ''}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[originalIndex] = { ...updated[originalIndex], price: e.target.value };
                                  onVariantsChange(updated);
                                }}
                                placeholder="0.00"
                                className="w-full"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.compare_at_price || ''}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[originalIndex] = { ...updated[originalIndex], compare_at_price: e.target.value };
                                  onVariantsChange(updated);
                                }}
                                placeholder="0.00"
                                className="w-full"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={variant.sku || ''}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[originalIndex] = { ...updated[originalIndex], sku: e.target.value };
                                  onVariantsChange(updated);
                                }}
                                placeholder="מקט"
                                className="w-full"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={variant.inventory_quantity || 0}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[originalIndex] = { ...updated[originalIndex], inventory_quantity: parseInt(e.target.value) || 0 };
                                  onVariantsChange(updated);
                                }}
                                placeholder="0"
                                className="w-full"
                              />
                            </td>
                          </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {displayVariants.map((variant) => {
                        // מצא את האינדקס המקורי ב-variants
                        const originalIndex = variants.findIndex(v => v.id === variant.id);
                        return (
                          <Card key={variant.id} className="border-2">
                            <div className="p-4 space-y-3">
                              <div className="flex items-center justify-between border-b pb-3">
                                <div className="font-semibold text-sm">
                                  {getVariantDisplayName(
                                    variant.title,
                                    variant.option1,
                                    variant.option2,
                                    variant.option3
                                  ) || variant.title || 'וריאציה'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-gray-600 mb-0">ברירת מחדל</Label>
                                  <Checkbox
                                    checked={defaultVariantId === String(variant.id)}
                                    onCheckedChange={(checked) => {
                                      if (onDefaultVariantChange) {
                                        onDefaultVariantChange(checked ? String(variant.id) : null);
                                      }
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-gray-600 mb-0">מחיר (₪)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={variant.price || ''}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[originalIndex] = { ...updated[originalIndex], price: e.target.value };
                                      onVariantsChange(updated);
                                    }}
                                    placeholder="0.00"
                                    className="h-9"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-gray-600 mb-0">לפני הנחה (₪)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={variant.compare_at_price || ''}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[originalIndex] = { ...updated[originalIndex], compare_at_price: e.target.value };
                                      onVariantsChange(updated);
                                    }}
                                    placeholder="0.00"
                                    className="h-9"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-gray-600 mb-0">מלאי</Label>
                                  <Input
                                    type="number"
                                    value={variant.inventory_quantity || 0}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[originalIndex] = { ...updated[originalIndex], inventory_quantity: parseInt(e.target.value) || 0 };
                                      onVariantsChange(updated);
                                    }}
                                    placeholder="0"
                                    className="h-9"
                                  />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                  <Label className="text-xs text-gray-600 mb-0">מקט</Label>
                                  <Input
                                    value={variant.sku || ''}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[originalIndex] = { ...updated[originalIndex], sku: e.target.value };
                                      onVariantsChange(updated);
                                    }}
                                    placeholder="מק״ט"
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
