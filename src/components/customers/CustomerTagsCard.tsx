'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HiTag, HiPlus, HiX } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface CustomerTagsCardProps {
  customerId: number;
  initialTags?: string[];
  onTagsChange?: () => void;
}

export function CustomerTagsCard({ customerId, initialTags = [], onTagsChange }: CustomerTagsCardProps) {
  const { toast } = useOptimisticToast();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (newTag.trim()) {
      const filtered = availableTags.filter(
        tag => tag.toLowerCase().includes(newTag.toLowerCase()) &&
        !tags.includes(tag)
      );
      setFilteredTags(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredTags([]);
      setShowSuggestions(false);
    }
  }, [newTag, availableTags, tags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/tags`);
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
        
        // Fetch all available tags from store
        // For now, we'll extract tags from the tags we already have
        // In the future, we can create a dedicated endpoint for all tags
        const allTagsSet = new Set<string>();
        // Add existing tags to suggestions
        (data.tags || []).forEach((tag: string) => allTagsSet.add(tag));
        setAvailableTags(Array.from(allTagsSet));
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleAdd = async () => {
    if (!newTag.trim()) return;

    const tagName = newTag.trim();

    if (tags.includes(tagName)) {
      toast({
        title: 'שגיאה',
        description: 'התגית כבר קיימת',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_name: tagName }),
      });

      if (response.ok) {
        setTags(prev => [...prev, tagName]);
        setNewTag('');
        setShowSuggestions(false);
        onTagsChange?.();
        toast({
          title: 'הצלחה',
          description: 'התגית נוספה בהצלחה',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add tag');
      }
    } catch (error: any) {
      console.error('Error adding tag:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בהוספת התגית',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (tagName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}/tags?tag_name=${encodeURIComponent(tagName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTags(prev => prev.filter(t => t !== tagName));
        onTagsChange?.();
        toast({
          title: 'הצלחה',
          description: 'התגית הוסרה בהצלחה',
        });
      } else {
        throw new Error('Failed to remove tag');
      }
    } catch (error: any) {
      console.error('Error removing tag:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהסרת התגית',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTag = (tag: string) => {
    setNewTag(tag);
    setShowSuggestions(false);
    handleAdd();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
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
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => {
                    if (filteredTags.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="הוסף תגית"
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {showSuggestions && filteredTags.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleAdd} size="sm" variant="secondary" disabled={loading || !newTag.trim()}>
                <HiPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-sm text-gray-500">אין תגיות עדיין</p>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemove(tag)}
                    disabled={loading}
                    className="hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <HiX className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

