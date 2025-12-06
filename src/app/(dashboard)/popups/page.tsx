'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiCollection } from 'react-icons/hi';
import { Popup } from '@/types/content';

export default function PopupsPage() {
  const router = useRouter();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPopups, setSelectedPopups] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPopups();
  }, [searchTerm]);

  const loadPopups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/popups');
      if (!response.ok) throw new Error('Failed to load popups');
      const data = await response.json();
      setPopups(data.popups || []);
    } catch (error) {
      console.error('Error loading popups:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<Popup>[] = [
    {
      key: 'name',
      label: 'שם',
      render: (popup) => (
        <div className="font-medium text-gray-900">{popup.name}</div>
      ),
    },
    {
      key: 'trigger_type',
      label: 'טריגר',
      render: (popup) => (
        <div className="text-sm text-gray-600">
          {popup.trigger_type === 'time' ? 'זמן' :
           popup.trigger_type === 'scroll' ? 'גלילה' :
           popup.trigger_type === 'exit_intent' ? 'כוונת יציאה' :
           'טעינת דף'}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'סטטוס',
      render: (popup) => (
        <div className="flex items-center gap-2">
          {popup.is_active ? (
            <>
              <HiCheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">פעיל</span>
            </>
          ) : (
            <>
              <HiXCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">לא פעיל</span>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="פופאפים"
      description="נהל פופאפים ומודלים"
      primaryAction={{
        label: 'פופאפ חדש',
        onClick: () => router.push('/popups/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש פופאפים..."
      onSearch={setSearchTerm}
      columns={columns}
      data={popups}
      keyExtractor={(popup) => popup.id}
      selectable
      selectedItems={selectedPopups}
      onSelectionChange={(selected) => setSelectedPopups(selected as Set<number>)}
      rowActions={(popup) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/popups/${popup.id}`);
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
          <HiCollection className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין פופאפים</p>
          <button
            onClick={() => router.push('/popups/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור פופאפ ראשון
          </button>
        </div>
      }
    />
  );
}

