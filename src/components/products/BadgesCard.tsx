'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiTag, HiPlus, HiTrash } from 'react-icons/hi';

interface ProductBadge {
  id: string;
  text: string;
  color: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface BadgesCardProps {
  badges: ProductBadge[];
  onChange: (badges: ProductBadge[]) => void;
}

const PRESET_COLORS = [
  { value: '#EF4444', label: 'אדום' },
  { value: '#F97316', label: 'כתום' },
  { value: '#22C55E', label: 'ירוק' },
  { value: '#3B82F6', label: 'כחול' },
  { value: '#A855F7', label: 'סגול' },
  { value: '#EC4899', label: 'ורוד' },
];

export function BadgesCard({ badges, onChange }: BadgesCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBadge, setNewBadge] = useState<ProductBadge>({
    id: '',
    text: '',
    color: '#EF4444',
    position: 'top-right',
  });

  const addBadge = () => {
    if (!newBadge.text.trim()) return;

    const badge: ProductBadge = {
      ...newBadge,
      id: `badge-${Date.now()}`,
    };

    onChange([...badges, badge]);
    setNewBadge({
      id: '',
      text: '',
      color: '#EF4444',
      position: 'top-right',
    });
    setShowAddForm(false);
  };

  const removeBadge = (id: string) => {
    onChange(badges.filter(b => b.id !== id));
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiTag className="w-5 h-5" />
          <span>מדבקות</span>
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            הוסף מדבקות למוצר להציג מבצעים, חידושים וסטיקרים נוספים בחנות.
          </p>

          {badges.length > 0 && (
            <div className="space-y-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                >
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: badge.color }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{badge.text}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {badge.position === 'top-right' && 'ימין למעלה'}
                    {badge.position === 'top-left' && 'שמאל למעלה'}
                    {badge.position === 'bottom-right' && 'ימין למטה'}
                    {badge.position === 'bottom-left' && 'שמאל למטה'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBadge(badge.id)}
                  >
                    <HiTrash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showAddForm ? (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div>
                <Label htmlFor="badge-text">טקסט</Label>
                <Input
                  id="badge-text"
                  value={newBadge.text}
                  onChange={(e) => setNewBadge({ ...newBadge, text: e.target.value })}
                  placeholder="לדוגמה: חדש, מבצע"
                />
              </div>

              <div>
                <Label>צבע</Label>
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="color"
                    value={newBadge.color}
                    onChange={(e) => setNewBadge({ ...newBadge, color: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={newBadge.color}
                    onChange={(e) => setNewBadge({ ...newBadge, color: e.target.value })}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewBadge({ ...newBadge, color: color.value })}
                      className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: color.value,
                        borderColor: newBadge.color === color.value ? '#000' : 'transparent',
                      }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addBadge} className="flex-1">
                  הוסף מדבקה
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowAddForm(true)}
              className="w-full"
            >
              <HiPlus className="w-4 h-4 ml-2" />
              הוסף מדבקה נוספת
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

