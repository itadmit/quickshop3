'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiGift } from 'react-icons/hi';

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

  useEffect(() => {
    loadGiftCards();
  }, [searchTerm]);

  const loadGiftCards = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/gift-cards
      setGiftCards([]);
    } catch (error) {
      console.error('Error loading gift cards:', error);
    } finally {
      setLoading(false);
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
      key: 'value',
      label: 'ערך',
      render: (card) => (
        <div>
          <div className="font-semibold text-gray-900">
            ₪{parseFloat(card.current_value).toLocaleString('he-IL')}
          </div>
          <div className="text-sm text-gray-500">
            מתוך ₪{parseFloat(card.initial_value).toLocaleString('he-IL')}
          </div>
        </div>
      ),
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
    <DataTable
      title="כרטיסי מתנה"
      description="נהל כרטיסי מתנה"
      primaryAction={{
        label: 'כרטיס מתנה חדש',
        onClick: () => router.push('/gift-cards/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש כרטיסי מתנה..."
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
        </div>
      )}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiGift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין כרטיסי מתנה</p>
          <button
            onClick={() => router.push('/gift-cards/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור כרטיס מתנה ראשון
          </button>
        </div>
      }
    />
  );
}

