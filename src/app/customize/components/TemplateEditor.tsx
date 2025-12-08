/**
 * Customizer Module - Template Editor Component
 * עורך Template לעמודי לופ (product/collection)
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
import { TemplateWidget } from '@/lib/customizer/types';
import {
  getAllDynamicWidgets,
  getAllStaticWidgets,
  getWidgetDefinition,
} from '@/lib/customizer/widgets';
import { HiPlus, HiCog, HiEye, HiEyeOff, HiTrash, HiX, HiDotsVertical } from 'react-icons/hi';
import { WidgetSettings } from './WidgetSettings';

interface TemplateEditorProps {
  templateType: 'product' | 'collection';
  onClose?: () => void;
}

function SortableWidgetItem({
  widget,
  onSettings,
  onDelete,
  onToggleVisibility,
}: {
  widget: TemplateWidget;
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
  } = useSortable({ id: widget.widget_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const widgetDef = getWidgetDefinition(
    widget.widget_type,
    widget.is_dynamic ? (widget.widget_type.includes('product') ? 'product' : 'collection') : 'product'
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border ${
        widget.is_visible
          ? 'border-gray-200 bg-white'
          : 'border-gray-100 bg-gray-50 opacity-60'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <HiDotsVertical className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {widgetDef?.name || widget.widget_type}
            </div>
            {widget.is_dynamic && (
              <div className="text-xs text-blue-600 mt-1">
                {widgetDef?.variable || 'דינמי'}
              </div>
            )}
            {!widget.is_dynamic && (
              <div className="text-xs text-gray-500 mt-1">סטטי</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleVisibility}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
            title={widget.is_visible ? 'הסתר' : 'הצג'}
          >
            {widget.is_visible ? (
              <HiEye className="w-4 h-4" />
            ) : (
              <HiEyeOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onSettings}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
            title="הגדרות"
          >
            <HiCog className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-100 rounded text-gray-600 hover:text-red-600"
            title="מחק"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplateEditor({ templateType, onClose }: TemplateEditorProps) {
  const [widgets, setWidgets] = useState<TemplateWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<TemplateWidget | null>(null);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dynamicWidgets = getAllDynamicWidgets(templateType);
  const staticWidgets = getAllStaticWidgets();

  useEffect(() => {
    loadTemplate();
  }, [templateType]);

  async function loadTemplate() {
    try {
      setLoading(true);
      const response = await fetch(`/api/customizer/templates?type=${templateType}`);
      if (response.ok) {
        const data = await response.json();
        setWidgets(data.widgets || []);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddWidget(widgetType: string, isDynamic: boolean) {
    try {
      const position = widgets.length;
      const widgetId = `widget_${Date.now()}`;

      const response = await fetch('/api/customizer/templates/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_type: templateType,
          widget_type: widgetType,
          widget_id: widgetId,
          position,
          is_dynamic: isDynamic,
          settings: {},
        }),
      });

      if (response.ok) {
        setShowAddDialog(false);
        loadTemplate();
      }
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  }

  async function handleDeleteWidget(widgetId: number) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הוידג\'ט הזה?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customizer/templates/widgets/${widgetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadTemplate();
      }
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  }

  async function handleToggleVisibility(widget: TemplateWidget) {
    try {
      const response = await fetch(`/api/customizer/templates/widgets/${widget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_visible: !widget.is_visible,
        }),
      });

      if (response.ok) {
        loadTemplate();
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

    const oldIndex = widgets.findIndex((w) => w.widget_id === active.id);
    const newIndex = widgets.findIndex((w) => w.widget_id === over.id);

    const newWidgets = arrayMove(widgets, oldIndex, newIndex);
    setWidgets(newWidgets);

    // עדכן את המיקומים ב-DB
    for (let i = 0; i < newWidgets.length; i++) {
      if (newWidgets[i].position !== i) {
        await fetch(`/api/customizer/templates/widgets/${newWidgets[i].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: i }),
        });
      }
    }

    loadTemplate();
  }

  function handleWidgetSettings(widget: TemplateWidget) {
    setSelectedWidget(widget);
    setShowWidgetSettings(true);
  }

  function handleWidgetSettingsClose() {
    setSelectedWidget(null);
    setShowWidgetSettings(false);
    loadTemplate();
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        טוען template...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            עריכת Template: {templateType === 'product' ? 'עמוד מוצר' : 'עמוד קטגוריה'}
          </h3>
          <p className="text-sm text-gray-500">
            שינויים ישפיעו על כל עמודי ה-{templateType === 'product' ? 'מוצר' : 'קטגוריה'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
            title="סגור"
          >
            <HiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Widgets List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
            וידג'טים
          </div>

          {widgets.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              אין וידג'טים. לחץ על "הוסף וידג'ט" כדי להתחיל.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={widgets.map((w) => w.widget_id)}
                strategy={verticalListSortingStrategy}
              >
                {widgets.map((widget) => (
                  <SortableWidgetItem
                    key={widget.widget_id}
                    widget={widget}
                    onSettings={() => handleWidgetSettings(widget)}
                    onDelete={() => handleDeleteWidget(widget.id)}
                    onToggleVisibility={() => handleToggleVisibility(widget)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          <button
            onClick={() => setShowAddDialog(true)}
            className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            הוסף וידג'ט
          </button>
        </div>
      </div>

      {/* Add Widget Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              בחר סוג וידג'ט
            </h3>

            {/* Dynamic Widgets */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                וידג'טים דינמיים
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(dynamicWidgets).map(([key, widget]) => (
                  <button
                    key={key}
                    onClick={() => handleAddWidget(key, true)}
                    className="px-4 py-3 text-right border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{widget.name}</div>
                    <div className="text-xs text-blue-600 mt-1">{widget.variable}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Static Widgets */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                וידג'טים סטטיים
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(staticWidgets).map(([key, widget]) => (
                  <button
                    key={key}
                    onClick={() => handleAddWidget(key, false)}
                    className="px-4 py-3 text-right border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{widget.name}</div>
                    <div className="text-xs text-gray-500 mt-1">תוכן קבוע</div>
                  </button>
                ))}
              </div>
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

      {/* Widget Settings Panel */}
      {showWidgetSettings && selectedWidget && (
        <div className="fixed inset-y-0 left-0 w-96 bg-white shadow-xl z-50">
          <WidgetSettings
            widget={selectedWidget}
            templateType={templateType}
            onClose={handleWidgetSettingsClose}
            onUpdate={(updatedWidget) => {
              loadTemplate();
            }}
          />
        </div>
      )}
    </div>
  );
}

