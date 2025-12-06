'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { HiSearch, HiX, HiPlus } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface Tag {
  id: number;
  name: string;
}

interface TagSelectorProps {
  selectedTagNames: string[];
  onSelectionChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTagNames, onSelectionChange }: TagSelectorProps) {
  const { toast } = useOptimisticToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadTags();
  }, [debouncedSearchTerm]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await fetch(`/api/products/tags?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load tags');
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/products/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (!response.ok) throw new Error('Failed to create tag');
      const data = await response.json();
      
      setTags(prev => [...prev, data.tag]);
      onSelectionChange([...selectedTagNames, data.tag.name]);
      setNewTagName('');
      
      toast({
        title: 'הצלחה',
        description: 'תגית נוצרה בהצלחה',
      });
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה ביצירת תגית',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleTag = (tagName: string) => {
    if (selectedTagNames.includes(tagName)) {
      onSelectionChange(selectedTagNames.filter(t => t !== tagName));
    } else {
      onSelectionChange([...selectedTagNames, tagName]);
    }
  };

  return (
    <Card className="p-4 mt-2">
      <div className="space-y-4">
        <div className="relative">
          <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="חיפוש תגיות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="תגית חדשה..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createTag();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={createTag}
            disabled={creating || !newTagName.trim()}
            size="sm"
          >
            <HiPlus className="w-4 h-4 ml-1" />
            הוסף
          </Button>
        </div>

        {selectedTagNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTagNames.map(tagName => (
              <span
                key={tagName}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
              >
                {tagName}
                <button
                  type="button"
                  onClick={() => toggleTag(tagName)}
                  className="hover:text-emerald-900"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="max-h-60 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-4 text-gray-500">טוען תגיות...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-4 text-gray-500">לא נמצאו תגיות</div>
          ) : (
            tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => toggleTag(tag.name)}
              >
                <Checkbox
                  checked={selectedTagNames.includes(tag.name)}
                  onCheckedChange={() => toggleTag(tag.name)}
                />
                <Label className="cursor-pointer flex-1">{tag.name}</Label>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

