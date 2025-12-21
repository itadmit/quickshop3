'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiGift, HiCog } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';

interface GiftCard {
  id: number;
  code: string;
  initial_value: string;
  current_value: string;
  expires_at: Date | null;
  is_active: boolean;
}

export default function GiftCardsPage() {
  const router = useRouter();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadGiftCards();
  }, [searchTerm]);

  const loadGiftCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gift-cards');
      if (!response.ok) throw new Error('Failed to load gift cards');
      const data = await response.json();
      setGiftCards(data.gift_cards || []);
    } catch (error) {
      console.error('Error loading gift cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הגיפט קארד? פעולה זו תשבית אותו לצמיתות.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/gift-cards/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete gift card');
      setGiftCards(giftCards.filter(card => card.id !== id));
    } catch (error) {
      console.error('Error deleting gift card:', error);
      alert('שגיאה במחיקת גיפט קארד');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumn<GiftCard>[] = [
    {
      key: 'code',
      label: 'קוד',
      render: (card) => (
        <div className="font-medium text-gray-900 font-mono">{card.code}</div>
      ),
    },
    {
      key: 'initial_value',
      label: 'ערך התחלתי',
      render: (card) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(card.initial_value).toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'current_value',
      label: 'יתרה',
      render: (card) => {
        const initial = parseFloat(card.initial_value);
        const current = parseFloat(card.current_value);
        const percentage = initial > 0 ? (current / initial) * 100 : 0;
        return (
          <div>
            <div className={`font-semibold ${current === 0 ? 'text-red-600' : current < initial ? 'text-orange-600' : 'text-green-600'}`}>
              ₪{current.toLocaleString('he-IL')}
            </div>
            {current !== initial && (
              <div className="text-xs text-gray-500">
                {percentage.toFixed(0)}% נותר
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'expires_at',
      label: 'תוקף',
      render: (card) => (
        <div className="text-sm text-gray-600">
          {card.expires_at
            ? new Date(card.expires_at).toLocaleDateString('he-IL')
            : 'ללא הגבלה'}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'סטטוס',
      render: (card) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          card.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {card.is_active ? 'פעיל' : 'לא פעיל'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">גיפט קארד</h1>
          <p className="text-gray-500 mt-1">נהל גיפט קארד</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/settings?tab=gift-cards')}
            className="flex items-center gap-2"
          >
            <HiCog className="w-4 h-4" />
            הגדרות עיצוב
          </Button>
          <Button
            onClick={() => router.push('/gift-cards/new')}
            className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            גיפט קארד חדש
          </Button>
        </div>
      </div>

      <DataTable
        title=""
        description=""
        searchPlaceholder="חיפוש גיפט קארד..."
        onSearch={setSearchTerm}
        columns={columns}
        data={giftCards}
        keyExtractor={(card) => card.id}
        selectable
        selectedItems={selectedCards}
        onSelectionChange={(selected) => setSelectedCards(selected as Set<number>)}
        rowActions={(card) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/gift-cards/${card.id}`);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="ערוך"
            >
              <HiPencil className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(card.id);
              }}
              disabled={deletingId === card.id}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="מחק"
            >
              <HiTrash className={`w-5 h-5 ${deletingId === card.id ? 'text-gray-400' : 'text-red-600'}`} />
            </button>
          </div>
        )}
        loading={loading}
        emptyState={
          <div className="text-center py-12">
            <HiGift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין גיפט קארד</p>
            <button
              onClick={() => router.push('/gift-cards/new')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              צור גיפט קארד ראשון
            </button>
          </div>
        }
      />
    </div>
  );
}

