'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiFilter, HiX } from 'react-icons/hi';

export interface CustomerFilters {
  state?: string;
  accepts_marketing?: boolean;
  tag?: string;
  min_orders?: number;
  max_orders?: number;
  min_total_spent?: number;
  max_total_spent?: number;
  created_after?: string;
  created_before?: string;
}

interface CustomerFiltersProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
  availableTags?: string[];
}

export function CustomerFilters({ filters, onFiltersChange, availableTags = [] }: CustomerFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof CustomerFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' || value === undefined ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <HiFilter className="w-4 h-4" />
          <span>פילטרים</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
              {Object.values(filters).filter(v => v !== undefined && v !== '').length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-gray-600"
          >
            <HiX className="w-4 h-4" />
            נקה פילטרים
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* State Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-state">סטטוס</Label>
                <select
                  id="filter-state"
                  value={filters.state || ''}
                  onChange={(e) => updateFilter('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">כל הסטטוסים</option>
                  <option value="enabled">פעיל</option>
                  <option value="disabled">מושבת</option>
                  <option value="invited">הוזמן</option>
                </select>
              </div>

              {/* Accepts Marketing Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-marketing">משווק</Label>
                <select
                  id="filter-marketing"
                  value={filters.accepts_marketing === undefined ? '' : filters.accepts_marketing ? 'true' : 'false'}
                  onChange={(e) => updateFilter('accepts_marketing', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">כל הלקוחות</option>
                  <option value="true">משווקים</option>
                  <option value="false">לא משווקים</option>
                </select>
              </div>

              {/* Tag Filter */}
              {availableTags.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="filter-tag">תגית</Label>
                  <select
                    id="filter-tag"
                    value={filters.tag || ''}
                    onChange={(e) => updateFilter('tag', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">כל התגיות</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Min Orders */}
              <div className="space-y-2">
                <Label htmlFor="filter-min-orders">מינימום הזמנות</Label>
                <Input
                  id="filter-min-orders"
                  type="number"
                  value={filters.min_orders || ''}
                  onChange={(e) => updateFilter('min_orders', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>

              {/* Max Orders */}
              <div className="space-y-2">
                <Label htmlFor="filter-max-orders">מקסימום הזמנות</Label>
                <Input
                  id="filter-max-orders"
                  type="number"
                  value={filters.max_orders || ''}
                  onChange={(e) => updateFilter('max_orders', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="∞"
                />
              </div>

              {/* Min Total Spent */}
              <div className="space-y-2">
                <Label htmlFor="filter-min-spent">מינימום הוצאות (₪)</Label>
                <Input
                  id="filter-min-spent"
                  type="number"
                  value={filters.min_total_spent || ''}
                  onChange={(e) => updateFilter('min_total_spent', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>

              {/* Max Total Spent */}
              <div className="space-y-2">
                <Label htmlFor="filter-max-spent">מקסימום הוצאות (₪)</Label>
                <Input
                  id="filter-max-spent"
                  type="number"
                  value={filters.max_total_spent || ''}
                  onChange={(e) => updateFilter('max_total_spent', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="∞"
                />
              </div>

              {/* Created After */}
              <div className="space-y-2">
                <Label htmlFor="filter-created-after">נוצר אחרי</Label>
                <Input
                  id="filter-created-after"
                  type="date"
                  value={filters.created_after || ''}
                  onChange={(e) => updateFilter('created_after', e.target.value)}
                />
              </div>

              {/* Created Before */}
              <div className="space-y-2">
                <Label htmlFor="filter-created-before">נוצר לפני</Label>
                <Input
                  id="filter-created-before"
                  type="date"
                  value={filters.created_before || ''}
                  onChange={(e) => updateFilter('created_before', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

