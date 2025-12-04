'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HiTag, HiPlus, HiX } from 'react-icons/hi';

interface TagsCardProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function TagsCard({ tags, onAdd, onRemove }: TagsCardProps) {
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    if (newTag.trim()) {
      onAdd(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiTag className="w-5 h-5" />
          <span>תגיות</span>
        </h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="הוסף תגית"
            />
            <Button onClick={handleAdd} size="sm" variant="secondary">
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="hover:text-red-500"
                >
                  <HiX className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

