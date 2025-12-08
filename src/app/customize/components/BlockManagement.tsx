/**
 * Customizer Module - Block Management Component
 * ניהול בלוקים בתוך סקשן
 */

'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionBlock, BlockType } from '@/lib/customizer/types';
import { addBlock, updateBlock, deleteBlock } from '../actions';
import { BlockSettings } from './BlockSettings';
import { HiPlus, HiCog, HiTrash, HiEye, HiEyeOff, HiDotsVertical } from 'react-icons/hi';

interface BlockManagementProps {
  sectionId: number;
  blocks: SectionBlock[];
  sectionType: string;
  onBlocksChange: () => void;
}

// רשימת בלוקים זמינים לפי סוג סקשן
const AVAILABLE_BLOCKS: Record<string, BlockType[]> = {
  slideshow: ['image_slide', 'video_slide'],
  collection_list: ['collection'],
  testimonials: ['testimonial'],
  faq: ['question'],
  collapsible_tabs: ['tab'],
  trust_badges: ['badge'],
  footer: ['column'],
  header: ['menu_item'],
  newsletter: ['button'],
  custom_html: ['text', 'link'],
};

// שמות תצוגה לבלוקים
const BLOCK_DISPLAY_NAMES: Record<BlockType, string> = {
  text: 'טקסט',
  link: 'קישור',
  image_slide: 'שקופית תמונה',
  video_slide: 'שקופית וידאו',
  collection: 'קטגוריה',
  tab: 'טאב',
  testimonial: 'ביקורת',
  question: 'שאלה',
  badge: 'תג',
  menu_item: 'פריט תפריט',
  column: 'עמודה',
  button: 'כפתור',
};

function SortableBlockItem({
  block,
  onSettings,
  onDelete,
  onToggleVisibility,
}: {
  block: SectionBlock;
  onSettings: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.block_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-3 rounded-lg border transition-all duration-200 ${
        block.is_visible
          ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
          : 'border-gray-100 bg-gray-50 opacity-75'
      } ${isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50 z-10' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0 p-1 rounded hover:bg-gray-100"
          >
            <HiDotsVertical className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0" onClick={onSettings}>
            <div className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600">
              {BLOCK_DISPLAY_NAMES[block.block_type] || block.block_type}
            </div>
            {block.settings_json && (block.settings_json.heading || block.settings_json.title) && (
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {block.settings_json.heading || block.settings_json.title}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white pl-2">
          <button
            onClick={onToggleVisibility}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
            title={block.is_visible ? 'הסתר' : 'הצג'}
          >
            {block.is_visible ? (
              <HiEye className="w-4 h-4" />
            ) : (
              <HiEyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onSettings}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
            title="הגדרות"
          >
            <HiCog className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded-md text-gray-500 hover:text-red-600 transition-colors"
            title="מחק"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlockManagement({
  sectionId,
  blocks,
  sectionType,
  onBlocksChange,
}: BlockManagementProps) {
  const [localBlocks, setLocalBlocks] = useState<SectionBlock[]>(blocks);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<SectionBlock | null>(null);
  const [showBlockSettings, setShowBlockSettings] = useState(false);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const availableBlockTypes = AVAILABLE_BLOCKS[sectionType] || [];

  async function handleAddBlock(blockType: BlockType) {
    try {
      const position = localBlocks.length;
      const blockId = `block_${Date.now()}`;

      const result = await addBlock({
        section_id: sectionId,
        block_type: blockType,
        position,
        settings: {},
      });

      if (result.success) {
        setShowAddDialog(false);
        onBlocksChange();
      }
    } catch (error) {
      console.error('Error adding block:', error);
    }
  }

  async function handleDeleteBlock(blockId: number) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הבלוק הזה?')) {
      return;
    }

    try {
      const result = await deleteBlock(blockId);
      if (result.success) {
        onBlocksChange();
      }
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  }

  async function handleToggleVisibility(block: SectionBlock) {
    try {
      const result = await updateBlock({
        block_id: block.id,
        is_visible: !block.is_visible,
      });
      if (result.success) {
        onBlocksChange();
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localBlocks.findIndex((b) => b.block_id === active.id);
    const newIndex = localBlocks.findIndex((b) => b.block_id === over.id);

    const newBlocks = arrayMove(localBlocks, oldIndex, newIndex);
    setLocalBlocks(newBlocks);

    // עדכן את המיקומים ב-DB
    for (let i = 0; i < newBlocks.length; i++) {
      if (newBlocks[i].position !== i) {
        await updateBlock({
          block_id: newBlocks[i].id,
          position: i,
        });
      }
    }

    onBlocksChange();
  }

  function handleBlockSettings(block: SectionBlock) {
    setSelectedBlock(block);
    setShowBlockSettings(true);
  }

  function handleBlockSettingsClose() {
    setSelectedBlock(null);
    setShowBlockSettings(false);
    onBlocksChange();
  }

  if (availableBlockTypes.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        סקשן זה לא תומך בבלוקים
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Blocks List */}
      {localBlocks.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">
          אין בלוקים. לחץ על "הוסף בלוק" כדי להתחיל.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localBlocks.map((b) => b.block_id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localBlocks.map((block) => (
                <SortableBlockItem
                  key={block.block_id}
                  block={block}
                  onSettings={() => handleBlockSettings(block)}
                  onDelete={() => handleDeleteBlock(block.id)}
                  onToggleVisibility={() => handleToggleVisibility(block)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Block Button */}
      <div className="pt-2">
        <button
          onClick={() => setShowAddDialog(true)}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center justify-center gap-2 group"
        >
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
            <HiPlus className="w-3 h-3" />
          </div>
          הוסף בלוק
        </button>
      </div>

      {/* Add Block Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              בחר סוג בלוק
            </h3>
            <div className="space-y-2">
              {availableBlockTypes.map((blockType) => (
                <button
                  key={blockType}
                  onClick={() => handleAddBlock(blockType)}
                  className="w-full px-4 py-3 text-right border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {BLOCK_DISPLAY_NAMES[blockType]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddDialog(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Block Settings Panel */}
      {showBlockSettings && selectedBlock && (
        <div className="fixed inset-y-0 left-0 w-96 bg-white shadow-xl z-50">
          <BlockSettings
            block={selectedBlock}
            onClose={handleBlockSettingsClose}
            onUpdate={handleBlockSettingsClose}
          />
        </div>
      )}
    </div>
  );
}

