/**
 * Customizer Module - Sortable Section Item
 * פריט סקשן שניתן לגרירה
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageSection } from '@/lib/customizer/types';
import { HiDotsVertical, HiCog, HiEye, HiEyeOff, HiTrash } from 'react-icons/hi';
import { getSectionName } from '@/lib/customizer/sectionNames';

interface SortableSectionItemProps {
  section: PageSection;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSettings: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SortableSectionItem({
  section,
  isSelected,
  onSelect,
  onSettings,
  onDelete,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.section_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(section.section_id)}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <HiDotsVertical className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {getSectionName(section.section_type)}
            </div>
            {section.custom_classes && (
              <div className="text-xs text-gray-500 mt-1">
                {section.custom_classes}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSettings(section.section_id);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="הגדרות"
          >
            <HiCog className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Toggle visibility
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="הצג/הסתר"
          >
            {section.is_visible ? (
              <HiEye className="w-4 h-4" />
            ) : (
              <HiEyeOff className="w-4 h-4" />
            )}
          </button>
          {!section.is_locked && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(section.section_id);
              }}
              className="p-1 hover:bg-red-100 rounded text-red-500"
              title="מחק"
            >
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

