'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiAdjustments } from 'react-icons/hi';

interface CustomFieldsCardProps {
  productId?: number;
  shopId: number;
  categoryIds?: string[];
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
}

export function CustomFieldsCard({
  productId,
  shopId,
  categoryIds = [],
  values = {},
  onChange,
}: CustomFieldsCardProps) {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    loadFields();
  }, [productId, shopId, categoryIds]);

  const loadFields = async () => {
    try {
      setLoading(true);
      // TODO: Implement API endpoint for custom fields
      // const response = await fetch(`/api/custom-fields?shopId=${shopId}`);
      // if (response.ok) {
      //   const definitions = await response.json();
      //   setFields(definitions);
      // }
      setLoading(false);
    } catch (error) {
      console.error('Error loading custom fields:', error);
      setLoading(false);
    }
  };

  if (loading || fields.length === 0) {
    return null; // Don't show if no custom fields
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiAdjustments className="w-5 h-5" />
          <span>שדות מותאמים אישית</span>
        </h2>
        <div className="space-y-4">
          {fields.map((field: any) => (
            <div key={field.id}>
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
              </Label>
              <Input
                value={values[field.id] || ''}
                onChange={(e) => {
                  if (onChange) {
                    onChange({ ...values, [field.id]: e.target.value });
                  }
                }}
                placeholder={field.description || undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

