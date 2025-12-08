'use client';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface StatusCardProps {
  status: 'draft' | 'active' | 'archived';
  onChange: (status: 'draft' | 'active' | 'archived') => void;
  scheduledPublishDate?: string;
  onScheduledPublishDateChange?: (date: string) => void;
  scheduledArchiveDate?: string;
  onScheduledArchiveDateChange?: (date: string) => void;
  notifyOnPublish?: boolean;
  onNotifyOnPublishChange?: (notify: boolean) => void;
}

export function StatusCard({
  status,
  onChange,
  scheduledPublishDate,
  onScheduledPublishDateChange,
  scheduledArchiveDate,
  onScheduledArchiveDateChange,
  notifyOnPublish,
  onNotifyOnPublishChange,
}: StatusCardProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">סטטוס</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">סטטוס פרסום</Label>
            <Select value={status} onValueChange={(value: any) => onChange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">פורסם</SelectItem>
                <SelectItem value="draft">טיוטה</SelectItem>
                <SelectItem value="archived">ארכיון</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <Label htmlFor="scheduledPublishDate">תאריך פרסום</Label>
              <Input
                id="scheduledPublishDate"
                type="datetime-local"
                value={scheduledPublishDate || ''}
                onChange={(e) => onScheduledPublishDateChange?.(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">השאר ריק לפרסום מיידי</p>
            </div>

            {scheduledPublishDate && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifyOnPublish"
                  checked={notifyOnPublish || false}
                  onChange={(e) => onNotifyOnPublishChange?.(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="notifyOnPublish" className="cursor-pointer text-sm">
                  עדכן אותי במייל כשהמוצר עולה
                </Label>
              </div>
            )}

            <div className="border-t pt-4">
              <div>
                <Label htmlFor="scheduledArchiveDate">תאריך הסתרה</Label>
                <Input
                  id="scheduledArchiveDate"
                  type="datetime-local"
                  value={scheduledArchiveDate || ''}
                  onChange={(e) => onScheduledArchiveDateChange?.(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">תאריך אוטומטי להסתרת המוצר</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

