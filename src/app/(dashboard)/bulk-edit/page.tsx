'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { CategoryTreeSelector } from '@/components/products/CategoryTreeSelector';
import {
  HiSave,
  HiViewGrid,
  HiCube,
  HiSearch,
  HiDuplicate,
  HiEye,
  HiEyeOff,
  HiRefresh,
  HiExclamationCircle,
} from 'react-icons/hi';

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  comparePrice: number | null;
  cost: number | null;
  inventoryQty: number;
  weight: number | null;
  image?: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  status: 'draft' | 'active' | 'archived';
  price: number;
  comparePrice: number | null;
  cost: number | null;
  inventoryQty: number;
  availability: string;
  vendor: string | null;
  category: string | null;
  categories: Array<{ categoryId: string; category: { id: string; name: string } }>;
  images?: string[] | null;
  variants: ProductVariant[];
}

interface BulkEditRow {
  id: string;
  type: 'product' | 'variant';
  productId: string;
  variantId?: string;
  name: string;
  sku: string | null;
  price: number | null;
  comparePrice: number | null;
  cost: number | null;
  inventoryQty: number;
  onHandQty: number;
  vendor: string | null;
  category: string | null;
  categoryId: string | null;
  isHidden: boolean;
  isVariant: boolean;
  image?: string | null;
  images?: string[];
  originalData: any;
  // שדות נוספים לניהול תצוגה
  hasMultipleVariants?: boolean; // האם למוצר יש מספר וריאציות
  isSingleVariantProduct?: boolean; // האם זה מוצר עם וריאציה אחת (מוצג כשורה אחת)
  variantFieldsReadOnly?: boolean; // האם שדות הווריאציה (מחיר/מלאי) הם read-only
  originalVariantTitle?: string; // שם הווריאציה המקורי מה-DB
  productName?: string; // שם המוצר (לוריאציות)
}

type ColumnKey =
  | 'product-id'
  | 'product-title'
  | 'product-category'
  | 'vendor'
  | 'base-price'
  | 'compare-price'
  | 'cost'
  | 'on-hand-quantity'
  | 'sku';

interface Column {
  key: ColumnKey;
  label: string;
  editable: boolean;
  type: 'text' | 'number' | 'select' | 'status';
}

const AVAILABLE_COLUMNS: Column[] = [
  { key: 'product-id', label: 'ID מוצר', editable: false, type: 'text' },
  { key: 'product-title', label: 'שם מוצר', editable: true, type: 'text' },
  { key: 'product-category', label: 'קטגוריה', editable: true, type: 'select' },
  { key: 'vendor', label: 'ספק', editable: true, type: 'text' },
  { key: 'base-price', label: 'מחיר בסיס', editable: true, type: 'number' },
  { key: 'compare-price', label: 'מחיר לפני הנחה', editable: true, type: 'number' },
  { key: 'cost', label: 'עלות', editable: true, type: 'number' },
  { key: 'on-hand-quantity', label: 'כמות במלאי', editable: true, type: 'number' },
  { key: 'sku', label: 'מקט', editable: true, type: 'text' },
];

export default function BulkEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useOptimisticToast();
  const [rows, setRows] = useState<BulkEditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>([
    'product-id',
    'product-title',
    'sku',
    'base-price',
    'on-hand-quantity',
    'product-category',
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Array<{ id: number; title: string }>>([]);
  const cellRefs = useRef<Map<string, HTMLInputElement | HTMLButtonElement>>(new Map());

  // קבלת מוצרים נבחרים מ-query params או טעינת כל המוצרים
  const productIdsString = useMemo(() => {
    return searchParams.get('ids') || '';
  }, [searchParams]);

  const productIds = useMemo(() => {
    if (!productIdsString) return null;
    return productIdsString.split(',').filter(Boolean);
  }, [productIdsString]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [productIdsString]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/collections?limit=1000', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '1000',
        ...(productIds && productIds.length > 0 && { ids: productIds.join(',') }),
      });

      const response = await fetch(`/api/products/bulk-edit?${params.toString()}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const products: Product[] = data.products || [];

        // המרת מוצרים לשורות עם וריאציות
        const newRows: BulkEditRow[] = [];
        products.forEach((product: any) => {
          const productImage = product.images && product.images.length > 0 ? product.images[0] : null;
          const variants = product.variants || [];
          
          // לפי האפיון: כל מוצר חייב לפחות variant אחד
          // מוצר רגיל = variant אחד (בדרך כלל "Default Title")
          // מוצר עם variants = יותר מ-variant אחד או יש options
          const hasOptions = (product.options?.length || 0) > 0;
          const hasMultipleVariants = variants.length > 1;
          const isSingleVariantProduct = !hasOptions && !hasMultipleVariants;
          
          if (isSingleVariantProduct) {
            // מוצר פשוט - variant אחד בלבד (לפי האפיון תמיד יש לפחות אחד)
            const singleVariant = variants[0] || null;
            const variantPrice = singleVariant?.price ?? product.price;
            const variantComparePrice = singleVariant?.comparePrice ?? variantPrice;
            const variantInventory = singleVariant?.inventoryQty ?? product.inventoryQty ?? 0;
            
            newRows.push({
              id: product.id,
              type: 'product',
              productId: product.id,
              variantId: singleVariant?.id, // שמירת ID הווריאציה לעדכון
              name: product.name,
              sku: singleVariant?.sku || product.sku,
              price: variantPrice,
              comparePrice: variantComparePrice,
              cost: singleVariant?.cost ?? product.cost,
              inventoryQty: variantInventory,
              onHandQty: variantInventory,
              vendor: product.vendor,
              category: product.category,
              categoryId: product.categories?.[0]?.categoryId || null,
              isHidden: product.status === 'draft' || product.status === 'archived',
              isVariant: false,
              image: productImage,
              images: product.images || undefined,
              originalData: {
                ...product,
                variant: singleVariant, // שמירת הווריאציה לעדכון
              },
              hasMultipleVariants: false,
              isSingleVariantProduct: true,
              variantFieldsReadOnly: false, // ניתן לערוך
            });
          } else {
            // מוצר עם מספר וריאציות - שורה למוצר + שורות לווריאציות
            // חישוב סכום המלאי מכל הווריאציות
            const totalInventory = variants.reduce((sum: number, v: any) => sum + (v.inventoryQty || 0), 0);
            // מחיר מינימלי מהווריאציות
            const minPrice = Math.min(...variants.map((v: any) => v.price || 0));
            
            // שורת המוצר - read-only לשדות מחיר/מלאי
            newRows.push({
              id: product.id,
              type: 'product',
              productId: product.id,
              name: product.name,
              sku: product.sku,
              price: minPrice,
              comparePrice: product.comparePrice,
              cost: product.cost,
              inventoryQty: totalInventory, // סכום המלאי מכל הווריאציות
              onHandQty: totalInventory,
              vendor: product.vendor,
              category: product.category,
              categoryId: product.categories?.[0]?.categoryId || null,
              isHidden: product.status === 'draft' || product.status === 'archived',
              isVariant: false,
              image: productImage,
              images: product.images || undefined,
              originalData: product,
              hasMultipleVariants: true,
              isSingleVariantProduct: false,
              variantFieldsReadOnly: true, // לא ניתן לערוך מחיר/מלאי בשורת המוצר
            });
            
            // שורות הווריאציות
            variants.forEach((variant: any) => {
              const variantImage = variant.image || productImage;
              const variantPrice = variant.price ?? product.price;
              const variantComparePrice = variant.comparePrice ?? variantPrice;
              const originalVariantTitle = variant.name;
              
              // יצירת שם תצוגה לווריאציה
              let variantDisplayName = variant.name;
              if (variant.name === 'Default Title') {
                variantDisplayName = product.name;
              } else if (variant.name !== product.name) {
                variantDisplayName = variant.name; // רק שם הווריאציה, לא שם המוצר
              } else {
                variantDisplayName = product.name;
              }
              
              newRows.push({
                id: `${product.id}-${variant.id}`,
                type: 'variant',
                productId: product.id,
                variantId: variant.id,
                name: variantDisplayName,
                originalVariantTitle: originalVariantTitle,
                productName: product.name,
                sku: variant.sku,
                price: variantPrice,
                comparePrice: variantComparePrice,
                cost: variant.cost ?? product.cost,
                inventoryQty: variant.inventoryQty,
                onHandQty: variant.inventoryQty,
                vendor: product.vendor,
                category: product.category,
                categoryId: product.categories?.[0]?.categoryId || null,
                isHidden: product.status === 'draft' || product.status === 'archived',
                isVariant: true,
                image: variantImage,
                images: product.images || undefined,
                originalData: {
                  ...variant,
                  title: originalVariantTitle,
                  name: originalVariantTitle,
                },
                hasMultipleVariants: true,
                variantFieldsReadOnly: false,
              });
            });
          }
        });

        setRows(newRows);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        toast({
          title: 'שגיאה',
          description: errorData.error || 'לא הצלחנו לטעון את המוצרים',
          variant: 'destructive',
        });
        setRows([]);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בטעינת המוצרים',
        variant: 'destructive',
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // פונקציה להעתקת ערך לכולם
  const copyToAll = (columnKey: ColumnKey) => {
    if (selectedRows.size === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות שורה אחת',
        variant: 'destructive',
      });
      return;
    }

    const firstSelectedRow = rows.find((row) => selectedRows.has(row.id));
    if (!firstSelectedRow) return;

    let valueToCopy: any = null;
    switch (columnKey) {
      case 'product-category':
        valueToCopy = firstSelectedRow.category;
        break;
      case 'vendor':
        valueToCopy = firstSelectedRow.vendor;
        break;
      case 'base-price':
        valueToCopy = firstSelectedRow.price;
        break;
      case 'compare-price':
        valueToCopy = firstSelectedRow.comparePrice;
        break;
      case 'cost':
        valueToCopy = firstSelectedRow.cost;
        break;
      case 'on-hand-quantity':
        valueToCopy = firstSelectedRow.onHandQty;
        break;
      case 'sku':
        valueToCopy = firstSelectedRow.sku;
        break;
    }

    if (valueToCopy !== null) {
      setRows((prevRows) =>
        prevRows.map((row) => {
          if (selectedRows.has(row.id)) {
            const updated = { ...row };
            switch (columnKey) {
              case 'product-category':
                updated.category = valueToCopy;
                updated.categoryId = firstSelectedRow.categoryId;
                break;
              case 'vendor':
                updated.vendor = valueToCopy;
                break;
              case 'base-price':
                updated.price = valueToCopy;
                break;
              case 'compare-price':
                updated.comparePrice = valueToCopy;
                break;
              case 'cost':
                updated.cost = valueToCopy;
                break;
              case 'on-hand-quantity':
                updated.onHandQty = valueToCopy;
                updated.inventoryQty = valueToCopy;
                break;
              case 'sku':
                updated.sku = valueToCopy;
                break;
            }
            return updated;
          }
          return row;
        })
      );
      setHasUnsavedChanges(true);
      toast({
        title: 'הצלחה',
        description: 'הערך הועתק לכל השורות הנבחרות',
      });
    }
  };

  // סינון וחיפוש
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // סינון לפי חיפוש
    if (searchQuery) {
      filtered = filtered.filter(
        (row) =>
          row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.productId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // סינון לפי סטטוס פעיל/לא פעיל
    if (filterStatus === 'active') {
      filtered = filtered.filter((row) => !row.isHidden);
    } else if (filterStatus === 'hidden') {
      filtered = filtered.filter((row) => row.isHidden);
    }

    return filtered;
  }, [rows, searchQuery, filterStatus]);

  // פונקציה להחלפת סטטוס פעיל/לא פעיל
  const toggleVisibility = (rowId: string) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          return { ...row, isHidden: !row.isHidden };
        }
        return row;
      })
    );
    setHasUnsavedChanges(true);
  };

  // פונקציה להחלפת סטטוס פעיל/לא פעיל לכולם
  const toggleVisibilityForAll = (isHidden: boolean) => {
    if (selectedRows.size === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לפחות שורה אחת',
        variant: 'destructive',
      });
      return;
    }

    setRows((prevRows) =>
      prevRows.map((row) => {
        if (selectedRows.has(row.id)) {
          return { ...row, isHidden };
        }
        return row;
      })
    );
    setHasUnsavedChanges(true);
    toast({
      title: 'הצלחה',
      description: `כל השורות הנבחרות ${isHidden ? 'הוסתרו' : 'הופעלו'}`,
    });
  };

  const updateRow = (rowId: string, columnKey: ColumnKey, value: any) => {
    setRows((prevRows) => {
      const newRows = prevRows.map((row: any) => {
        if (row.id === rowId) {
          const updated = { ...row };

          switch (columnKey) {
            case 'product-id':
              // לא ניתן לערוך ID
              break;
            case 'product-title':
              updated.name = value;
              break;
            case 'product-category':
              updated.category = value;
              break;
            case 'vendor':
              updated.vendor = value;
              break;
            case 'base-price':
              const newPrice = value !== '' ? parseFloat(value) || null : null;
              updated.price = newPrice;
              break;
            case 'compare-price':
              const newComparePrice = value !== '' ? parseFloat(value) || null : null;
              updated.comparePrice = newComparePrice;
              break;
            case 'cost':
              updated.cost = value !== '' ? parseFloat(value) || null : null;
              break;
            case 'on-hand-quantity':
              const newInventoryQty = parseInt(value) || 0;
              updated.onHandQty = newInventoryQty;
              updated.inventoryQty = newInventoryQty;
              break;
            case 'sku':
              updated.sku = value;
              break;
          }

          return updated;
        }
        return row;
      });

      // עדכון סיכום המלאי בשורת המוצר אם זו וריאציה
      const updatedWithTotals = newRows.map((row: any) => {
        if (row.type === 'product' && row.hasMultipleVariants) {
          // חישוב מחדש של סיכום המלאי מכל הווריאציות
          const variantsOfProduct = newRows.filter(
            (r: any) => r.type === 'variant' && r.productId === row.productId
          );
          const totalInventory = variantsOfProduct.reduce(
            (sum: number, v: any) => sum + (v.inventoryQty || 0),
            0
          );
          return {
            ...row,
            inventoryQty: totalInventory,
            onHandQty: totalInventory,
          };
        }
        return row;
      });

      setHasUnsavedChanges(true);
      return updatedWithTotals;
    });
  };

  // פונקציה לוולידציה ב-onBlur
  const validateComparePrice = (rowId: string) => {
    setRows((prevRows) => {
      return prevRows.map((row: any) => {
        if (row.id === rowId) {
          // וולידציה: המחיר לפני הנחה חייב להיות גדול מהמחיר הבסיסי
          if (row.price !== null && row.comparePrice !== null && row.comparePrice <= row.price) {
            // אם המחיר לפני הנחה קטן או שווה למחיר, נעדכן אותו למחיר + 1%
            return {
              ...row,
              comparePrice: row.price * 1.01,
            };
          }
        }
        return row;
      });
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // וולידציה לפני שמירה - תיקון אוטומטי של מחירים לפני הנחה
      const validatedRows = rows.map((row: any) => {
        if (row.price !== null && row.comparePrice !== null && row.comparePrice <= row.price) {
          return {
            ...row,
            comparePrice: row.price * 1.01,
          };
        }
        return row;
      });

      // עדכון ה-state עם הערכים המתוקנים
      setRows(validatedRows);

      // איסוף כל השינויים (אחרי התיקון)
      const updates: any[] = [];

      validatedRows.forEach((row: any) => {
        const changes: any = {};
        const original = row.originalData;

        if (row.type === 'product') {
          // עדכון מוצר
          if (row.name !== original.name) changes.name = row.name;
          if (row.sku !== original.sku) changes.sku = row.sku;
          
          // בדיקה אם זה מוצר עם וריאציה אחת (מוצג כשורה אחת)
          if (row.isSingleVariantProduct) {
            // מוצר עם וריאציה אחת - עדכון ישיר של הווריאציה
            const originalVariant = original.variant;
            const originalPrice = parseFloat(originalVariant?.price || original.price || '0');
            const rowPrice = row.price !== null && row.price !== undefined ? parseFloat(row.price.toString()) : 0;
            const hasPriceChange = Math.abs(rowPrice - originalPrice) > 0.01;
            
            const originalInventoryQty = parseInt(originalVariant?.inventoryQty?.toString() || original.inventoryQty?.toString() || '0');
            const rowInventoryQty = parseInt(row.inventoryQty?.toString() || '0');
            const hasInventoryChange = rowInventoryQty !== originalInventoryQty;
            
            if (hasPriceChange || hasInventoryChange) {
              const variantChanges: any = {};
              if (hasPriceChange) variantChanges.price = rowPrice;
              if (hasInventoryChange) variantChanges.inventoryQty = rowInventoryQty;
              
              if (row.variantId) {
                // יש וריאציה - עדכון שלה
                updates.push({
                  type: 'variant',
                  productId: row.productId,
                  variantId: row.variantId,
                  changes: variantChanges,
                });
              } else {
                // אין וריאציה - ה-API יצור אחת
                if (hasPriceChange) changes.price = rowPrice;
                if (hasInventoryChange) changes.inventoryQty = rowInventoryQty;
              }
            }
          } else if (!row.variantFieldsReadOnly) {
            // מוצר עם מספר וריאציות - אם השדות לא read-only
            // (בדרך כלל השדות כן read-only עבור מוצרים עם מספר וריאציות)
            const originalPrice = parseFloat(original.price || '0');
            const rowPrice = row.price !== null && row.price !== undefined ? parseFloat(row.price.toString()) : 0;
            const hasPriceChange = Math.abs(rowPrice - originalPrice) > 0.01;
            
            const originalInventoryQty = parseInt(original.inventoryQty?.toString() || '0');
            const rowInventoryQty = parseInt(row.inventoryQty?.toString() || '0');
            const hasInventoryChange = rowInventoryQty !== originalInventoryQty;
            
            if (hasPriceChange || hasInventoryChange) {
              // נחפש את הווריאציה הראשונה של המוצר הזה
              const firstVariant = validatedRows.find((r: any) => 
                r.type === 'variant' && r.productId === row.productId
              );
              
              if (firstVariant) {
                const variantChanges: any = {};
                if (hasPriceChange) variantChanges.price = rowPrice;
                if (hasInventoryChange) variantChanges.inventoryQty = rowInventoryQty;
                
                updates.push({
                  type: 'variant',
                  productId: row.productId,
                  variantId: firstVariant.variantId,
                  changes: variantChanges,
                });
              } else {
                // אין וריאציות - נוסיף לעדכון המוצר
                if (hasPriceChange) changes.price = rowPrice;
                if (hasInventoryChange) changes.inventoryQty = rowInventoryQty;
              }
            }
          }
          // אם variantFieldsReadOnly === true, לא נשלח שינויי מחיר/מלאי מהשורה הזו
          
          if (row.isHidden !== (original.status === 'draft' || original.status === 'archived'))
            changes.isHidden = row.isHidden;

          // עדכון קטגוריה - השוואה לפי ID הקטגוריה
          const originalCategoryId = original.categories?.[0]?.categoryId || null;
          if (row.categoryId !== originalCategoryId) {
            changes.categories = row.categoryId ? [row.categoryId] : [];
          }

          // עדכון ספק
          if (row.vendor !== original.vendor) changes.vendor = row.vendor;

          if (Object.keys(changes).length > 0) {
            updates.push({
              type: 'product',
              id: row.productId,
              productId: row.productId,
              changes,
            });
          }
        } else if (row.type === 'variant') {
          // עדכון וריאציה
          const originalVariantTitle = row.originalVariantTitle || original.title || original.name || 'Default Title';
          const productName = row.productName || '';
          
          // חילוץ השם החדש מהווריאציה מהשם המפורמט
          let newVariantTitle = row.name;
          if (row.name.includes(' - ')) {
            // אם השם מכיל " - ", נחלץ את החלק אחרי " - "
            newVariantTitle = row.name.split(' - ')[1];
          } else if (row.name === productName && originalVariantTitle === 'Default Title') {
            // אם השם הוא שם המוצר והמקורי היה Default Title, זה לא שינוי אמיתי
            newVariantTitle = originalVariantTitle;
          } else if (row.name === productName) {
            // אם השם הוא שם המוצר בלבד, זה אומר שהמשתמש לא שינה את השם מהווריאציה
            // נשאיר את השם המקורי
            newVariantTitle = originalVariantTitle;
          }
          
          // השוואה פשוטה - אם השם החדש שונה מהמקורי, נשלח את השינוי
          if (newVariantTitle !== originalVariantTitle) {
            changes.name = newVariantTitle;
          }
          if (row.sku !== original.sku) {
            changes.sku = row.sku;
          }
          
          // השוואה נכונה של מחירים (מספרים)
          const originalPrice = parseFloat(original.price || '0');
          const rowPrice = row.price !== null && row.price !== undefined ? parseFloat(row.price.toString()) : 0;
          if (Math.abs(rowPrice - originalPrice) > 0.01) {
            changes.price = rowPrice;
          }

          const originalComparePrice = original.comparePrice ? parseFloat(original.comparePrice.toString()) : null;
          const rowComparePrice = row.comparePrice !== null && row.comparePrice !== undefined ? parseFloat(row.comparePrice.toString()) : null;
          if ((originalComparePrice === null || originalComparePrice === undefined) !== (rowComparePrice === null || rowComparePrice === undefined)) {
            changes.comparePrice = rowComparePrice;
          } else if (originalComparePrice !== null && rowComparePrice !== null && Math.abs(rowComparePrice - originalComparePrice) > 0.01) {
            changes.comparePrice = rowComparePrice;
          }

          // השוואה נכונה של מלאי
          const originalInventoryQty = parseInt(original.inventoryQty?.toString() || '0');
          const rowInventoryQty = parseInt(row.inventoryQty?.toString() || '0');
          if (rowInventoryQty !== originalInventoryQty) {
            changes.inventoryQty = rowInventoryQty;
          }

          if (Object.keys(changes).length > 0) {
            updates.push({
              type: 'variant',
              productId: row.productId,
              variantId: row.variantId,
              changes,
            });
          }
        }
      });

      if (updates.length === 0) {
        toast({
          title: 'אין שינויים',
          description: 'לא בוצעו שינויים לשמירה',
        });
        setSaving(false);
        return;
      }

      const response = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: `עודכנו ${updates.length} פריטים בהצלחה`,
        });
        setHasUnsavedChanges(false);
        // רענון הנתונים
        fetchProducts();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בשמירת השינויים',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error saving bulk edits:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת השינויים',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, columnKey: ColumnKey) => {
    const currentIndex = rows.findIndex((r) => r.id === rowId);
    const columnIndex = visibleColumns.indexOf(columnKey);

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextColumnIndex = e.key === 'ArrowRight' ? columnIndex + 1 : columnIndex - 1;

      if (nextColumnIndex >= 0 && nextColumnIndex < visibleColumns.length) {
        const nextColumn = visibleColumns[nextColumnIndex];
        const cellKey = `${rowId}-${nextColumn}`;
        const cell = cellRefs.current.get(cellKey);
        if (cell && 'focus' in cell) {
          cell.focus();
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextRowIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

      if (nextRowIndex >= 0 && nextRowIndex < rows.length) {
        const nextRow = rows[nextRowIndex];
        const cellKey = `${nextRow.id}-${columnKey}`;
        const cell = cellRefs.current.get(cellKey);
        if (cell && 'focus' in cell) {
          cell.focus();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // מעבר לשורה הבאה באותה עמודה
      if (currentIndex < rows.length - 1) {
        const nextRow = rows[currentIndex + 1];
        const cellKey = `${nextRow.id}-${columnKey}`;
        const cell = cellRefs.current.get(cellKey);
        if (cell && 'focus' in cell) {
          cell.focus();
        }
      }
    }
  };

  const renderCell = (row: BulkEditRow, column: Column, rowIndex?: number) => {
    const cellKey = `${row.id}-${column.key}`;
    let value: any = '';

    switch (column.key) {
      case 'product-id':
        // הצגת מספר סידורי במקום ID טכני
        let displayNumber = 1;
        if (rowIndex !== undefined) {
          if (row.isVariant) {
            const parentProductIndex = filteredRows.findIndex(
              (r) => r.productId === row.productId && !r.isVariant
            );
            if (parentProductIndex !== -1) {
              const uniqueProductsBefore = new Set(
                filteredRows
                  .slice(0, parentProductIndex)
                  .filter((r) => !r.isVariant)
                  .map((r) => r.productId)
              );
              displayNumber = uniqueProductsBefore.size + 1;
            }
          } else {
            const uniqueProductsBefore = new Set(
              filteredRows
                .slice(0, rowIndex)
                .filter((r) => !r.isVariant)
                .map((r) => r.productId)
            );
            displayNumber = uniqueProductsBefore.size + 1;
          }
        } else {
          const allProductRows = rows.filter((r) => !r.isVariant);
          const productIndex = allProductRows.findIndex((r) => r.productId === row.productId);
          displayNumber = productIndex !== -1 ? productIndex + 1 : 1;
        }
        return (
          <div className="text-sm text-gray-600 font-semibold">#{displayNumber}</div>
        );
      case 'product-title':
        // עבור שם מוצר, נציג תמונה + שם
        // שם הווריאציה לא ניתן לעריכה, רק שם המוצר
        const isNameEditable = !row.isVariant; // רק מוצרים ניתנים לעריכה, לא וריאציות
        return (
          <div className="flex items-center gap-3 w-full">
            {/* אינדנטציה לווריאציות */}
            {row.isVariant && (
              <div className="w-4 border-r-2 border-b-2 border-gray-300 h-6 mr-2 flex-shrink-0" />
            )}
            {row.image ? (
              <img
                src={row.image}
                alt={row.name}
                className="w-10 h-10 rounded-md object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                <HiCube className="w-5 h-5 text-gray-400" />
              </div>
            )}
            {isNameEditable ? (
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateRow(row.id, column.key, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, row.id, column.key)}
                className="h-9 flex-1 border border-gray-200 rounded-md bg-white px-3 py-2 text-sm hover:border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                ref={(el) => {
                  if (el) cellRefs.current.set(cellKey, el);
                }}
              />
            ) : (
              <div className="h-9 flex-1 border border-gray-100 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {row.name}
              </div>
            )}
          </div>
        );
      case 'product-category':
        value = row.category || '';
        break;
      case 'vendor':
        value = row.vendor || '';
        break;
      case 'base-price':
        value = row.price ?? '';
        break;
      case 'compare-price':
        value = row.comparePrice ?? '';
        break;
      case 'cost':
        value = row.cost ?? '';
        break;
      case 'on-hand-quantity':
        value = row.onHandQty;
        break;
      case 'sku':
        value = row.sku || '';
        break;
    }

    if (column.key === 'product-category') {
      // שימוש בקומפוננטה החדשה עם עץ היררכי
      const selectedCategoryIds = row.categoryId ? [parseInt(row.categoryId.toString())] : [];
      
      return (
        <CategoryTreeSelector
          selectedCategoryIds={selectedCategoryIds}
          onSelectionChange={(ids) => {
            if (ids.length === 0) {
              updateRow(row.id, column.key, '');
              setRows((prevRows) =>
                prevRows.map((r) => (r.id === row.id ? { ...r, categoryId: null, category: '' } : r))
              );
            } else {
              // נשתמש בקטגוריה הראשונה שנבחרה
              const selectedCategoryId = ids[0];
              setRows((prevRows) =>
                prevRows.map((r) =>
                  r.id === row.id
                    ? { ...r, categoryId: selectedCategoryId.toString() }
                    : r
                )
              );
            }
            setHasUnsavedChanges(true);
          }}
          onCategoryNameChange={(categoryId, categoryName) => {
            updateRow(row.id, column.key, categoryName);
            setRows((prevRows) =>
              prevRows.map((r) =>
                r.id === row.id
                  ? { ...r, category: categoryName }
                  : r
              )
            );
          }}
          compact={true}
        />
      );
    }

    // בדיקת וולידציה למחיר לפני הנחה
    const isComparePriceInvalid =
      column.key === 'compare-price' &&
      row.price !== null &&
      row.comparePrice !== null &&
      row.comparePrice <= row.price;

    // הוספת onBlur לוולידציה למחיר לפני הנחה ולמחיר הבסיסי
    const handleBlur = () => {
      if (column.key === 'compare-price' || column.key === 'base-price') {
        validateComparePrice(row.id);
      }
    };

    // בדיקה אם השדה צריך להיות read-only
    // שדות מחיר/מלאי/עלות במוצר עם מספר וריאציות הם read-only (רק סיכום)
    const isVariantField = ['base-price', 'compare-price', 'cost', 'on-hand-quantity'].includes(column.key);
    const isReadOnly = row.variantFieldsReadOnly && isVariantField;

    if (isReadOnly) {
      // תצוגת read-only לשדות מחיר/מלאי בשורת מוצר עם וריאציות
      const displayValue = column.key === 'on-hand-quantity' 
        ? `${value} (סה"כ)` 
        : column.key === 'base-price' 
          ? `החל מ-${value}` 
          : value;
      
      return (
        <div className="h-9 w-full border border-gray-100 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500 flex items-center">
          {displayValue}
        </div>
      );
    }

    return (
      <input
        type={column.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => updateRow(row.id, column.key, e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, row.id, column.key)}
        className={`h-9 w-full border rounded-md bg-white px-3 py-2 text-sm transition-colors focus:outline-none ${
          isComparePriceInvalid
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-gray-200 hover:border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500'
        }`}
        ref={(el) => {
          if (el) cellRefs.current.set(cellKey, el);
        }}
      />
    );
  };

  const visibleColumnsData = AVAILABLE_COLUMNS.filter((col: any) => visibleColumns.includes(col.key));

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6" dir="rtl">
      {/* Mobile Warning */}
      <div className="md:hidden bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <HiExclamationCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-amber-800 mb-1">תכונה זו מיועדת למסך גדול</p>
          <p className="text-amber-700">
            לחוויית עריכה מיטבית, מומלץ להשתמש בעריכה קבוצתית ממחשב או טאבלט.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
      <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">עריכה קבוצתית</h1>
            <p className="text-sm text-gray-500">
              עריכת {filteredRows.length} {filteredRows.length === 1 ? 'מוצר' : 'מוצרים'}
              {filteredRows.length !== rows.length && ` מתוך ${rows.length}`}
            </p>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="warning" className="font-medium px-3 py-1">
              שינויים שלא נשמרו
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu
            trigger={
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <HiViewGrid className="w-4 h-4 ml-2" />
                עמודות
              </Button>
            }
            items={AVAILABLE_COLUMNS.map((column: any) => ({
              label: column.label,
              showCheckbox: true,
              checked: visibleColumns.includes(column.key),
              onClick: () => {
                if (visibleColumns.includes(column.key)) {
                  setVisibleColumns(visibleColumns.filter((key: any) => key !== column.key));
                } else {
                  setVisibleColumns([...visibleColumns, column.key]);
                }
              },
            }))}
            align="end"
            closeOnSelect={false}
          />
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6"
          >
            {saving ? (
              <>
                <HiRefresh className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <HiSave className="w-4 h-4 ml-2" />
                שמור שינויים
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Card>
          <div className="p-6">
            <div className="text-center py-12">
              <HiRefresh className="w-8 h-8 mx-auto animate-spin text-gray-400" />
              <p className="text-gray-600 mt-4">טוען מוצרים...</p>
            </div>
          </div>
        </Card>
      ) : rows.length === 0 ? (
      <Card>
        <div className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">לא נמצאו מוצרים לעריכה</p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* סינון וחיפוש */}
          <Card>
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="חיפוש לפי שם, מקט או ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                    size="sm"
                  >
                    הכל
                  </Button>
                  <Button
                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('active')}
                    size="sm"
                  >
                    <HiEye className="w-4 h-4 ml-2" />
                    פעיל
                  </Button>
                  <Button
                    variant={filterStatus === 'hidden' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('hidden')}
                    size="sm"
                  >
                    <HiEyeOff className="w-4 h-4 ml-2" />
                    מוסתר
                  </Button>
                </div>
                {selectedRows.size > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleVisibilityForAll(false)}>
                      <HiEye className="w-4 h-4 ml-2" />
                      הפעל נבחרים
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleVisibilityForAll(true)}>
                      <HiEyeOff className="w-4 h-4 ml-2" />
                      הסתר נבחרים
                    </Button>
                  </div>
                )}
          </div>
            </div>
          </Card>

          {/* כפתורי העתק לכולם */}
          {selectedRows.size > 0 && (
            <Card>
              <div className="p-4 md:p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 self-center">העתק לכולם:</span>
                  {visibleColumnsData
                    .filter(
                      (col) => col.editable && col.key !== 'product-id' && col.key !== 'product-title'
                    )
                    .map((column: any) => (
                      <Button
                        key={column.key}
                        variant="outline"
                        size="sm"
                        onClick={() => copyToAll(column.key)}
                      >
                        <HiDuplicate className="w-3 h-3 ml-1" />
                        {column.label}
                      </Button>
                    ))}
                </div>
              </div>
            </Card>
          )}

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider w-12 sticky right-0 bg-gradient-to-r from-gray-50 to-gray-100/50 z-10">
                      <Checkbox
                        checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRows(new Set(filteredRows.map((r: any) => r.id)));
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-l border-gray-200/50">
                      פעיל/מוסתר
                    </th>
                    {visibleColumnsData.map((column: any) => (
                      <th
                        key={column.key}
                        className="text-right px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-l border-gray-200/50 first:border-l-0"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`
                        transition-all duration-150
                        ${selectedRows.has(row.id) ? 'bg-blue-50/50 border-r-2 border-blue-400' : 'hover:bg-gray-50/50'}
                        ${row.isVariant ? 'bg-gray-50/30' : 'bg-white'}
                        ${index % 2 === 0 && !row.isVariant ? 'bg-white' : ''}
                      `}
                    >
                      <td className="px-6 py-3 sticky right-0 bg-inherit z-10 border-l border-gray-200/30">
                        <Checkbox
                          checked={selectedRows.has(row.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedRows);
                            if (checked) {
                              newSelected.add(row.id);
                            } else {
                              newSelected.delete(row.id);
                            }
                            setSelectedRows(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-6 py-3 border-l border-gray-200/30">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVisibility(row.id)}
                          className="h-8 w-8 p-0"
                        >
                          {row.isHidden ? (
                            <HiEyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <HiEye className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </td>
                      {visibleColumnsData.map((column: any) => (
                        <td
                          key={column.key}
                          className={`
                            px-6 py-3 border-l border-gray-200/30 first:border-l-0
                            ${row.isVariant ? 'pr-12' : ''}
                            group
                          `}
                        >
                          <div className="flex items-center min-h-[32px]">
                            {column.key === 'product-title' && row.isVariant ? (
                              <div className="flex items-center gap-3 w-full">
                                <span className="text-gray-300 text-lg font-light flex-shrink-0">┘</span>
                                {renderCell(row, column, index)}
                              </div>
                            ) : (
                              renderCell(row, column, index)
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Floating Save Button */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out">
          <div className="bg-white rounded-lg shadow-2xl p-2 border border-gray-200">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-base font-semibold"
            >
              {saving ? (
                <>
                  <HiRefresh className="w-5 h-5 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <HiSave className="w-5 h-5 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
