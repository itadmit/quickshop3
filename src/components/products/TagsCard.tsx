'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HiTag, HiPlus, HiX } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface TagsCardProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  productId?: number;
}

interface Tag {
  id: number;
  name: string;
}

export function TagsCard({ tags, onAdd, onRemove, productId }: TagsCardProps) {
  const { toast } = useOptimisticToast();
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  useEffect(() => {
    if (newTag.trim()) {
      const filtered = availableTags.filter(
        tag => tag.name.toLowerCase().includes(newTag.toLowerCase()) &&
        !tags.includes(tag.name)
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

  const fetchAvailableTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTag.trim()) return;

    const tagName = newTag.trim();

    // Check if tag already exists in the list
    if (tags.includes(tagName)) {
      toast({
        title: 'שגיאה',
        description: 'התגית כבר קיימת',
        variant: 'destructive',
      });
      return;
    }

    // If productId exists, add tag via API
    if (productId) {
      try {
        // First, check if tag exists in store
        const existingTag = availableTags.find(t => t.name === tagName);
        
        if (existingTag) {
          // Tag exists, link it to product
          const response = await fetch(`/api/products/${productId}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag_id: existingTag.id }),
          });

          if (response.ok) {
            onAdd(tagName);
            setNewTag('');
            setShowSuggestions(false);
            toast({
              title: 'הצלחה',
              description: 'התגית נוספה בהצלחה',
            });
          } else {
            throw new Error('Failed to add tag');
          }
        } else {
          // Create new tag and link it
          const createResponse = await fetch('/api/products/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tagName }),
          });

          if (createResponse.ok) {
            const { tag } = await createResponse.json();
            await fetchAvailableTags(); // Refresh available tags

            // Link tag to product
            const linkResponse = await fetch(`/api/products/${productId}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag_id: tag.id }),
            });

            if (linkResponse.ok) {
              onAdd(tagName);
              setNewTag('');
              setShowSuggestions(false);
              toast({
                title: 'הצלחה',
                description: 'התגית נוצרה ונוספה בהצלחה',
              });
            } else {
              throw new Error('Failed to link tag');
            }
          } else {
            throw new Error('Failed to create tag');
          }
        }
      } catch (error) {
        console.error('Error adding tag:', error);
        toast({
          title: 'שגיאה',
          description: 'אירעה שגיאה בהוספת התגית',
          variant: 'destructive',
        });
      }
    } else {
      // No productId, just add to local state
      onAdd(tagName);
      setNewTag('');
      setShowSuggestions(false);
    }
  };

  const handleRemove = async (tagName: string) => {
    if (productId) {
      // Find tag ID
      const tag = availableTags.find(t => t.name === tagName);
      if (tag) {
        try {
          const response = await fetch(`/api/products/${productId}/tags?tag_id=${tag.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            onRemove(tagName);
            toast({
              title: 'הצלחה',
              description: 'התגית הוסרה בהצלחה',
            });
          } else {
            throw new Error('Failed to remove tag');
          }
        } catch (error) {
          console.error('Error removing tag:', error);
          toast({
            title: 'שגיאה',
            description: 'אירעה שגיאה בהסרת התגית',
            variant: 'destructive',
          });
        }
      } else {
        onRemove(tagName);
      }
    } else {
      onRemove(tagName);
    }
  };

  const handleSelectTag = (tag: Tag) => {
    setNewTag(tag.name);
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
                  placeholder="הוסף תגית או בחר מהרשימה"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {showSuggestions && filteredTags.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleAdd} size="sm" variant="secondary" disabled={!newTag.trim()}>
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
                    className="hover:text-red-500 transition-colors"
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

