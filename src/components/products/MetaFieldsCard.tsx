'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { HiAdjustments, HiPlus, HiX, HiTrash } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface MetaField {
  id?: number;
  namespace: string;
  key: string;
  value: string;
  value_type: string;
}

interface MetaFieldsCardProps {
  productId?: number;
  shopId: number;
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

export function MetaFieldsCard({
  productId,
  shopId,
  values = {},
  onChange,
}: MetaFieldsCardProps) {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(false);
  const [metaFields, setMetaFields] = useState<MetaField[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newField, setNewField] = useState<MetaField>({
    namespace: 'custom',
    key: '',
    value: '',
    value_type: 'string',
  });

  useEffect(() => {
    if (productId) {
      loadMetaFields();
    }
  }, [productId]);

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

  const handleAddField = async () => {
    if (!newField.key.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם שדה',
        variant: 'destructive',
      });
      return;
    }

    if (!productId) {
      // Just add to local state if no product ID yet
      const field: MetaField = { ...newField };
      setMetaFields([...metaFields, field]);
      if (onChange) {
        const fullKey = `${newField.namespace}.${newField.key}`;
        onChange({ ...values, [fullKey]: newField.value });
      }
      setNewField({ namespace: 'custom', key: '', value: '', value_type: 'string' });
      setShowAddForm(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}/meta-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newField),
      });

      if (response.ok) {
        const data = await response.json();
        setMetaFields([...metaFields, data.meta_field]);
        
        if (onChange) {
          const fullKey = `${newField.namespace}.${newField.key}`;
          onChange({ ...values, [fullKey]: newField.value });
        }

        toast({
          title: 'הצלחה',
          description: 'השדה נוסף בהצלחה',
        });

        setNewField({ namespace: 'custom', key: '', value: '', value_type: 'string' });
        setShowAddForm(false);
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה בהוספת השדה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding meta field:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהוספת השדה',
        variant: 'destructive',
      });
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
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1"
          >
            <HiPlus className="w-4 h-4" />
            <span className="text-sm">הוסף שדה</span>
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="meta-namespace">Namespace</Label>
                <Input
                  id="meta-namespace"
                  value={newField.namespace}
                  onChange={(e) => setNewField({ ...newField, namespace: e.target.value })}
                  placeholder="custom"
                />
              </div>
              <div>
                <Label htmlFor="meta-key">שם השדה (Key)</Label>
                <Input
                  id="meta-key"
                  value={newField.key}
                  onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                  placeholder="field_name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="meta-value">ערך</Label>
              <Input
                id="meta-value"
                value={newField.value}
                onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                placeholder="ערך השדה"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddField}
                size="sm"
                disabled={loading || !newField.key.trim()}
              >
                הוסף
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewField({ namespace: 'custom', key: '', value: '', value_type: 'string' });
                }}
              >
                ביטול
              </Button>
            </div>
          </div>
        )}

        {metaFields.length === 0 ? (
          <div className="text-center py-6">
            <HiAdjustments className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">אין שדות מטא עדיין</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="gap-2"
            >
              <HiPlus className="w-4 h-4" />
              הוסף שדה ראשון
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {metaFields.map((field, index) => (
              <div key={`${field.namespace}.${field.key}`} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Namespace</Label>
                    <Input
                      value={field.namespace}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Key</Label>
                    <Input
                      value={field.key}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">ערך</Label>
                    <Input
                      value={field.value || ''}
                      onChange={(e) =>
                        handleUpdateField(field.namespace, field.key, e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteField(field.namespace, field.key)}
                  className="text-red-500 hover:text-red-700 mt-6"
                >
                  <HiTrash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

