'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { HiAdjustments, HiPlus, HiX, HiTrash, HiExternalLink } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { useRouter } from 'next/navigation';

interface MetaField {
  id?: number;
  namespace: string;
  key: string;
  value: string;
  value_type: string;
}

interface MetaFieldDefinition {
  id: number;
  namespace: string;
  key: string;
  label: string;
  description: string | null;
  value_type: string;
  required: boolean;
  scope: string;
  category_ids: number[];
  show_in_storefront: boolean;
}

interface MetaFieldsCardProps {
  productId?: number;
  shopId: number;
  categoryIds?: number[];
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

export function MetaFieldsCard({
  productId,
  shopId,
  categoryIds = [],
  values = {},
  onChange,
}: MetaFieldsCardProps) {
  const { toast } = useOptimisticToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [definitions, setDefinitions] = useState<MetaFieldDefinition[]>([]);
  const [metaFields, setMetaFields] = useState<MetaField[]>([]);
  const [availableDefinitions, setAvailableDefinitions] = useState<MetaFieldDefinition[]>([]);

  useEffect(() => {
    loadDefinitions();
    if (productId) {
      loadMetaFields();
    }
  }, [productId, categoryIds]);

  // Filter definitions based on scope and categories
  useEffect(() => {
    if (definitions.length === 0) {
      setAvailableDefinitions([]);
      return;
    }

    const available = definitions.filter((def) => {
      if (def.scope === 'GLOBAL') {
        return true;
      }
      if (def.scope === 'CATEGORY' && categoryIds.length > 0) {
        return def.category_ids.some((catId) => categoryIds.includes(catId));
      }
      return false;
    });

    setAvailableDefinitions(available);

    // Initialize meta fields from definitions
    const initialFields: MetaField[] = available.map((def) => {
      const fullKey = `${def.namespace}.${def.key}`;
      const existingValue = metaFields.find(
        (f) => f.namespace === def.namespace && f.key === def.key
      );
      return {
        namespace: def.namespace,
        key: def.key,
        value: existingValue?.value || values[fullKey] || '',
        value_type: def.value_type,
      };
    });

    // Add any existing meta fields that aren't in definitions
    metaFields.forEach((field) => {
      const exists = initialFields.some(
        (f) => f.namespace === field.namespace && f.key === field.key
      );
      if (!exists) {
        initialFields.push(field);
      }
    });

    setMetaFields(initialFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitions, categoryIds]);

  const loadDefinitions = async () => {
    try {
      const response = await fetch('/api/meta-field-definitions', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDefinitions(data || []);
      }
    } catch (error) {
      console.error('Error loading meta field definitions:', error);
    }
  };

  const loadMetaFields = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}/meta-fields`);
      if (response.ok) {
        const data = await response.json();
        setMetaFields(data.meta_fields || []);
        
        // Update parent with values
        if (onChange) {
          const valuesMap: Record<string, any> = {};
          data.meta_fields.forEach((field: MetaField) => {
            const fullKey = `${field.namespace}.${field.key}`;
            valuesMap[fullKey] = field.value;
          });
          onChange(valuesMap);
        }
      }
    } catch (error) {
      console.error('Error loading meta fields:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteField = async (namespace: string, key: string) => {
    if (!productId) {
      // Remove from local state
      setMetaFields(metaFields.filter(f => !(f.namespace === namespace && f.key === key)));
      if (onChange) {
        const fullKey = `${namespace}.${key}`;
        const newValues = { ...values };
        delete newValues[fullKey];
        onChange(newValues);
      }
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/products/${productId}/meta-fields?namespace=${encodeURIComponent(namespace)}&key=${encodeURIComponent(key)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setMetaFields(metaFields.filter(f => !(f.namespace === namespace && f.key === key)));
        
        if (onChange) {
          const fullKey = `${namespace}.${key}`;
          const newValues = { ...values };
          delete newValues[fullKey];
          onChange(newValues);
        }

        toast({
          title: 'הצלחה',
          description: 'השדה נמחק בהצלחה',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה במחיקת השדה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting meta field:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת השדה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (namespace: string, key: string, value: string) => {
    if (!productId) {
      // Update local state
      const updated = metaFields.map(f =>
        f.namespace === namespace && f.key === key ? { ...f, value } : f
      );
      setMetaFields(updated);
      if (onChange) {
        const fullKey = `${namespace}.${key}`;
        onChange({ ...values, [fullKey]: value });
      }
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/meta-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace, key, value }),
      });

      if (response.ok) {
        const data = await response.json();
        setMetaFields(metaFields.map(f =>
          f.namespace === namespace && f.key === key ? data.meta_field : f
        ));
        
        if (onChange) {
          const fullKey = `${namespace}.${key}`;
          onChange({ ...values, [fullKey]: value });
        }
      }
    } catch (error) {
      console.error('Error updating meta field:', error);
    }
  };

  if (loading && metaFields.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-center text-gray-500 py-4">טוען שדות מטא...</div>
        </div>
      </Card>
    );
  }

  // Get definition for a field
  const getDefinition = (namespace: string, key: string): MetaFieldDefinition | undefined => {
    return definitions.find((d) => d.namespace === namespace && d.key === key);
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiAdjustments className="w-5 h-5" />
            <span>שדות מטא (Meta Fields)</span>
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/settings/meta-fields')}
            className="gap-1"
          >
            <HiExternalLink className="w-4 h-4" />
            <span className="text-sm">נהל שדות</span>
          </Button>
        </div>

        {loading && metaFields.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-500">טוען שדות מטא...</div>
          </div>
        ) : availableDefinitions.length === 0 ? (
          <div className="text-center py-6">
            <HiAdjustments className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">אין שדות מטא מוגדרים</p>
            <p className="text-sm text-gray-400 mb-3">
              צור שדות מטא בהגדרות כדי שיופיעו כאן
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push('/settings/meta-fields')}
              className="gap-2"
            >
              <HiPlus className="w-4 h-4" />
              צור שדה מטא
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableDefinitions.map((def) => {
              const field = metaFields.find(
                (f) => f.namespace === def.namespace && f.key === def.key
              );
              const fullKey = `${def.namespace}.${def.key}`;
              const currentValue = field?.value || values[fullKey] || '';

              return (
                <div key={`${def.namespace}.${def.key}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={fullKey} className="text-sm font-medium text-gray-700">
                      {def.label}
                      {def.required && <span className="text-red-500 mr-1">*</span>}
                    </Label>
                    <span className="text-xs text-gray-400 font-mono">
                      {def.namespace}.{def.key}
                    </span>
                  </div>
                  {def.description && (
                    <p className="text-xs text-gray-500">{def.description}</p>
                  )}
                  <Input
                    id={fullKey}
                    value={currentValue}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      handleUpdateField(def.namespace, def.key, newValue);
                    }}
                    placeholder={`הזן ${def.label.toLowerCase()}`}
                    required={def.required}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

