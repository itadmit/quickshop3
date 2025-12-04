'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiSearch } from 'react-icons/hi';

interface SEOData {
  seoTitle: string;
  slug: string;
  seoDescription: string;
}

interface SEOCardProps {
  data: SEOData;
  onChange: (data: Partial<SEOData>) => void;
  showSlug?: boolean;
}

export function SEOCard({ data, onChange, showSlug = true }: SEOCardProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiSearch className="w-5 h-5" />
          <span>SEO</span>
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">כותרת SEO</Label>
            <Input
              id="seoTitle"
              value={data.seoTitle}
              onChange={(e) => onChange({ seoTitle: e.target.value })}
              placeholder="כותרת לדפדפן ומנועי חיפוש"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              {data.seoTitle?.length || 0} / 60 תווים
            </p>
          </div>

          {showSlug && (
            <div>
              <Label htmlFor="slug">כתובת URL (Slug)</Label>
              <Input
                id="slug"
                value={data.slug}
                onChange={(e) => onChange({ slug: e.target.value })}
                placeholder="לדוגמה: חולצת-טי-שירט"
              />
              <p className="text-sm text-gray-500 mt-1">
                השאר ריק כדי ליצור אוטומטית מהשם
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="seoDescription">תיאור SEO</Label>
            <textarea
              id="seoDescription"
              value={data.seoDescription}
              onChange={(e) => onChange({ seoDescription: e.target.value })}
              placeholder="תיאור קצר למנועי חיפוש..."
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {data.seoDescription?.length || 0} / 160 תווים
            </p>
          </div>

          {/* Google Preview */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">תצוגה מקדימה בגוגל</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-gray-400">›</span>
                <span className="text-gray-500 truncate">
                  {data.slug || 'product-slug'}
                </span>
              </div>
              <h3 className="text-lg text-blue-600 hover:underline cursor-pointer line-clamp-1">
                {data.seoTitle || 'כותרת המוצר'}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {data.seoDescription || 'תיאור המוצר יופיע כאן...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

