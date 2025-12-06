'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { HiSearch, HiX } from 'react-icons/hi';
import { useDebounce } from '@/hooks/useDebounce';

interface Collection {
  id: number;
  title: string;
  handle: string;
}

interface CollectionSelectorProps {
  selectedCollectionIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function CollectionSelector({ selectedCollectionIds, onSelectionChange }: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadCollections();
  }, [debouncedSearchTerm]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await fetch(`/api/collections?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to load collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = (collectionId: number) => {
    if (selectedCollectionIds.includes(collectionId)) {
      onSelectionChange(selectedCollectionIds.filter(id => id !== collectionId));
    } else {
      onSelectionChange([...selectedCollectionIds, collectionId]);
    }
  };

  return (
    <Card className="p-4 mt-2">
      <div className="space-y-4">
        <div className="relative">
          <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="חיפוש אוספים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {selectedCollectionIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {collections
              .filter(c => selectedCollectionIds.includes(c.id))
              .map(collection => (
                <span
                  key={collection.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                >
                  {collection.title}
                  <button
                    type="button"
                    onClick={() => toggleCollection(collection.id)}
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
            <div className="text-center py-4 text-gray-500">טוען אוספים...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-4 text-gray-500">לא נמצאו אוספים</div>
          ) : (
            collections.map(collection => (
              <div
                key={collection.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => toggleCollection(collection.id)}
              >
                <Checkbox
                  checked={selectedCollectionIds.includes(collection.id)}
                  onCheckedChange={() => toggleCollection(collection.id)}
                />
                <Label className="cursor-pointer flex-1">{collection.title}</Label>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

