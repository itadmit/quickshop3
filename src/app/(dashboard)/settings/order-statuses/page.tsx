'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
// Select removed - using checkbox instead
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiPlus, HiPencil, HiTrash, HiCheck } from 'react-icons/hi';

interface CustomOrderStatus {
  id: number;
  name: string;
  display_name: string;
  status_type: 'financial' | 'fulfillment' | 'custom';
  color: string | null;
  is_default: boolean;
  position: number;
  created_at: Date;
  updated_at: Date;
}

const STATUS_TYPE_LABELS: Record<string, string> = {
  financial: 'תשלום',
  fulfillment: 'ביצוע',
  custom: 'מותאם אישית',
};

const COLOR_OPTIONS = [
  { value: 'orange', label: 'כתום', class: 'bg-orange-500' },
  { value: 'blue', label: 'כחול', class: 'bg-blue-500' },
  { value: 'green', label: 'ירוק', class: 'bg-green-500' },
  { value: 'purple', label: 'סגול', class: 'bg-purple-500' },
  { value: 'cyan', label: 'כחול בהיר', class: 'bg-cyan-500' },
  { value: 'red', label: 'אדום', class: 'bg-red-500' },
  { value: 'gray', label: 'אפור', class: 'bg-gray-500' },
  { value: 'yellow', label: 'צהוב', class: 'bg-yellow-500' },
];

export default function OrderStatusesPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statuses, setStatuses] = useState<CustomOrderStatus[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CustomOrderStatus | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    status_type: 'custom' as 'financial' | 'fulfillment' | 'custom',
    color: 'gray',
    replaces_paid: false, // האם מחליף את סטטוס "שולם"
  });

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/order-statuses', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatuses(data.statuses || []);
      } else {
        toast({
          title: 'שגיאה',
          description: 'אירעה שגיאה בטעינת הסטטוסים',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת הסטטוסים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (status?: CustomOrderStatus) => {
    if (status) {
      setEditingStatus(status);
      setFormData({
        name: status.name,
        display_name: status.display_name,
        status_type: status.status_type,
        color: status.color || 'gray',
        replaces_paid: status.status_type === 'financial', // אם זה financial זה מחליף paid
      });
    } else {
      setEditingStatus(null);
      setFormData({
        name: '',
        display_name: '',
        status_type: 'custom',
        color: 'gray',
        replaces_paid: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStatus(null);
    setFormData({
      name: '',
      display_name: '',
      status_type: 'custom',
      color: 'gray',
      replaces_paid: false,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.display_name) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    // Validate name format (should be lowercase, no spaces, alphanumeric and underscores)
    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(formData.name)) {
      toast({
        title: 'שגיאה',
        description: 'שם הסטטוס חייב להיות באנגלית, אותיות קטנות, מספרים ותווים תחתונים בלבד',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      if (editingStatus) {
        // Update existing status
        const response = await fetch(`/api/order-statuses/${editingStatus.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            display_name: formData.display_name,
            color: formData.color,
          }),
        });

        if (response.ok) {
          toast({
            title: 'הצלחה',
            description: 'הסטטוס עודכן בהצלחה',
          });
          handleCloseDialog();
          loadStatuses();
        } else {
          const error = await response.json();
          toast({
            title: 'שגיאה',
            description: error.error || 'אירעה שגיאה בעדכון הסטטוס',
            variant: 'destructive',
          });
        }
      } else {
        // Create new status
        const response = await fetch('/api/order-statuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast({
            title: 'הצלחה',
            description: 'הסטטוס נוצר בהצלחה',
          });
          handleCloseDialog();
          loadStatuses();
        } else {
          const error = await response.json();
          toast({
            title: 'שגיאה',
            description: error.error || 'אירעה שגיאה ביצירת הסטטוס',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error saving status:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת הסטטוס',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (status: CustomOrderStatus) => {
    if (status.is_default) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק סטטוס ברירת מחדל',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק את הסטטוס "${status.display_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/order-statuses/${status.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'הסטטוס נמחק בהצלחה',
        });
        loadStatuses();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'אירעה שגיאה במחיקת הסטטוס',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting status:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת הסטטוס',
        variant: 'destructive',
      });
    }
  };

  const getColorDot = (color: string | null) => {
    const colorOption = COLOR_OPTIONS.find(c => c.value === color);
    if (colorOption) {
      return <div className={`w-4 h-4 rounded-full ${colorOption.class}`}></div>;
    }
    return <div className="w-4 h-4 rounded-full bg-gray-500"></div>;
  };

  const columns: TableColumn<CustomOrderStatus>[] = [
    {
      key: 'display_name',
      label: 'שם תצוגה',
      render: (status) => (
        <div className="flex items-center gap-3">
          {getColorDot(status.color)}
          <span className="font-medium">{status.display_name}</span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'שם טכני',
      render: (status) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{status.name}</code>
      ),
    },
    {
      key: 'status_type',
      label: 'סוג',
      render: (status) => (
        <span className={`text-sm px-2 py-1 rounded ${
          status.status_type === 'financial' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {status.status_type === 'financial' ? 'מחליף שולם' : 'מותאם אישית'}
        </span>
      ),
    },
    {
      key: 'position',
      label: 'מיקום',
      render: (status) => (
        <span className="text-sm text-gray-600">{status.position}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">סטטוסי הזמנות מותאמים אישית</h1>
          <p className="text-sm md:text-base text-gray-600">
            נהל וצור סטטוסי הזמנות מותאמים אישית לשימוש בהזמנות שלך
          </p>
        </div>
        
        <Button onClick={() => handleOpenDialog()}>
          <HiPlus className="w-4 h-4 ml-2" />
          סטטוס חדש
        </Button>
      </div>

      {/* Statuses Table */}
      <Card>
        <DataTable
          title=""
          description=""
          primaryAction={undefined}
          secondaryActions={undefined}
          searchPlaceholder=""
          onSearch={undefined}
          filters={undefined}
          columns={columns}
          data={statuses}
          keyExtractor={(status) => status.id}
          loading={loading}
          selectable={false}
          rowActions={(status) => (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleOpenDialog(status)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="ערוך"
              >
                <HiPencil className="w-4 h-4 text-gray-600" />
              </button>
              {!status.is_default && (
                <button
                  onClick={() => handleDelete(status)}
                  className="p-2 hover:bg-red-50 rounded transition-colors"
                  title="מחק"
                >
                  <HiTrash className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          )}
          emptyState={
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">אין סטטוסים מותאמים אישית</p>
              <Button onClick={() => handleOpenDialog()}>
                <HiPlus className="w-4 h-4 ml-2" />
                צור סטטוס חדש
              </Button>
            </div>
          }
        />
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'ערוך סטטוס' : 'סטטוס חדש'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="display_name">שם תצוגה *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="לדוגמה: בהכנה"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">השם שיוצג בממשק</p>
            </div>

            <div>
              <Label htmlFor="name">שם טכני *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="לדוגמה: preparing"
                disabled={saving || !!editingStatus}
              />
              <p className="text-xs text-gray-500 mt-1">
                {editingStatus 
                  ? 'לא ניתן לשנות את השם הטכני' 
                  : 'אנגלית, אותיות קטנות, מספרים ותווים תחתונים בלבד'}
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="replaces_paid"
                checked={formData.replaces_paid}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  replaces_paid: e.target.checked,
                  status_type: e.target.checked ? 'financial' : 'custom'
                })}
                disabled={saving}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <Label htmlFor="replaces_paid" className="cursor-pointer font-medium">
                  החלף את סטטוס &quot;שולם&quot;
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  אם מסומן, סטטוס זה יופיע כאפשרות בסטטוס תשלום במקום &quot;שולם&quot;
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="color">צבע</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`flex items-center gap-2 p-2 border-2 rounded-lg transition-all ${
                      formData.color === color.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={saving}
                  >
                    <div className={`w-4 h-4 rounded-full ${color.class}`}></div>
                    <span className="text-xs">{color.label}</span>
                    {formData.color === color.value && (
                      <HiCheck className="w-4 h-4 text-green-600 mr-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : editingStatus ? 'עדכן' : 'צור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

