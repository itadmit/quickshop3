'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { 
  HiSearch, 
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheckCircle, 
  HiXCircle, 
  HiStar,
  HiCube,
  HiCreditCard,
  HiChartBar,
  HiChat,
  HiCog as HiSettings,
  HiShoppingBag,
  HiSparkles
} from 'react-icons/hi';
import { Plugin } from '@/types/plugin';

const categoryLabels: Record<string, string> = {
  LOYALTY: 'נאמנות',
  MARKETING: 'שיווק',
  PAYMENT: 'תשלום',
  INVENTORY: 'מלאי',
  ANALYTICS: 'אנליטיקס',
  COMMUNICATION: 'תקשורת',
  OPERATIONS: 'פעולות',
  CUSTOMIZATION: 'התאמה אישית',
};

const typeLabels: Record<string, string> = {
  CORE: 'ליבה',
  SCRIPT: 'סקריפט',
};

interface PluginWithDetails extends Plugin {
  definition?: any;
}

export default function AdminPluginsPage() {
  const { toast } = useOptimisticToast();
  const [loading, setLoading] = useState(true);
  const [plugins, setPlugins] = useState<PluginWithDetails[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<PluginWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<PluginWithDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'SCRIPT' as 'CORE' | 'SCRIPT',
    category: 'CUSTOMIZATION' as any,
    is_free: true,
    price: '',
    script_content: '',
    inject_location: 'BODY_END' as 'HEAD' | 'BODY_START' | 'BODY_END',
    icon: '',
    author: '',
    version: '1.0.0',
    display_order: 0,
    is_active: false,
  });

  useEffect(() => {
    loadPlugins();
  }, []);

  useEffect(() => {
    filterPlugins();
  }, [plugins, searchQuery]);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/plugins', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPlugins(data.plugins || []);
      } else if (response.status === 403) {
        toast({
          title: 'גישה נדחתה',
          description: 'רק סופר אדמין יכול לגשת לדף זה',
          variant: 'destructive',
        });
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error loading plugins:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את התוספים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPlugins = () => {
    let filtered = [...plugins];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPlugins(filtered);
  };

  const handleAdd = () => {
    setEditingPlugin(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'SCRIPT',
      category: 'CUSTOMIZATION',
      is_free: true,
      price: '',
      script_content: '',
      inject_location: 'BODY_END',
      icon: '',
      author: '',
      version: '1.0.0',
      display_order: 0,
      is_active: false,
    });
    setShowAddModal(true);
  };

  const handleEdit = (plugin: PluginWithDetails) => {
    setEditingPlugin(plugin);
    setFormData({
      name: plugin.name,
      slug: plugin.slug,
      description: plugin.description || '',
      type: plugin.type,
      category: plugin.category,
      is_free: plugin.is_free,
      price: plugin.price?.toString() || '',
      script_content: plugin.script_content || '',
      inject_location: plugin.inject_location || 'BODY_END',
      icon: plugin.icon || '',
      author: plugin.author || '',
      version: plugin.version,
      display_order: plugin.display_order,
      is_active: plugin.is_active,
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        is_free: formData.is_free,
        script_content: formData.script_content,
        inject_location: formData.inject_location,
        icon: formData.icon,
        author: formData.author,
        version: formData.version,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (!formData.is_free) {
        payload.price = parseFloat(formData.price);
      }

      let response;
      if (editingPlugin) {
        // עדכון
        response = await fetch(`/api/admin/plugins/${editingPlugin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } else {
        // יצירה
        payload.slug = formData.slug;
        response = await fetch('/api/admin/plugins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: editingPlugin ? 'התוסף עודכן בהצלחה' : 'התוסף נוצר בהצלחה',
        });
        setShowAddModal(false);
        loadPlugins();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן לשמור את התוסף',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving plugin:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את התוסף',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plugin: PluginWithDetails) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את התוסף "${plugin.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plugins/${plugin.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'הצלחה',
          description: 'התוסף נמחק בהצלחה',
        });
        loadPlugins();
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן למחוק את התוסף',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting plugin:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק את התוסף',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול תוספים</h1>
          <p className="text-gray-600 mt-1">
            ניהול מרכזי של כל התוספים במערכת (סופר אדמין בלבד)
          </p>
        </div>
        <Button onClick={handleAdd}>
          <HiPlus className="w-4 h-4 ml-1" />
          הוסף תוסף חדש
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="חפש תוספים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </Card>

      {/* Plugins List */}
      {filteredPlugins.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiCube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">לא נמצאו תוספים</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPlugins.map((plugin) => (
            <Card key={plugin.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
                      {plugin.is_built_in && (
                        <Badge variant="outline" className="text-xs">
                          מובנה
                        </Badge>
                      )}
                      {plugin.is_active ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          פעיל
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          לא פעיל
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{plugin.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[plugin.type]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[plugin.category]}
                      </Badge>
                      {plugin.is_free ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">חינמי</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          ₪{plugin.price}/חודש
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">v{plugin.version}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {plugin.is_editable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plugin)}
                      >
                        <HiPencil className="w-4 h-4 ml-1" />
                        ערוך
                      </Button>
                    )}
                    {plugin.is_deletable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plugin)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <HiTrash className="w-4 h-4 ml-1" />
                        מחק
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlugin ? 'ערוך תוסף' : 'הוסף תוסף חדש'}
            </DialogTitle>
            <DialogDescription>
              {editingPlugin ? 'עדכן את פרטי התוסף' : 'הזן את פרטי התוסף החדש'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שם התוסף *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="לדוגמה: Google Analytics"
                  className="mt-2"
                />
              </div>
              {!editingPlugin && (
                <div>
                  <Label>Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="google-analytics"
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>תיאור</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תיאור התוסף..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>סוג *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'CORE' | 'SCRIPT' })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">ליבה (Core)</SelectItem>
                    <SelectItem value="SCRIPT">סקריפט (Script)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>קטגוריה *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'SCRIPT' && (
              <>
                <div>
                  <Label>תוכן הסקריפט</Label>
                  <Textarea
                    value={formData.script_content}
                    onChange={(e) => setFormData({ ...formData, script_content: e.target.value })}
                    placeholder="<script>...</script>"
                    className="mt-2 font-mono text-sm"
                    rows={5}
                  />
                </div>
                <div>
                  <Label>מיקום הזרקה</Label>
                  <Select
                    value={formData.inject_location}
                    onValueChange={(value) => setFormData({ ...formData, inject_location: value as any })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="BODY_START">תחילת BODY</SelectItem>
                      <SelectItem value="BODY_END">סוף BODY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>מחיר חודשי</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked, price: '' })}
                    className="w-4 h-4"
                  />
                  <Label className="text-sm">תוסף חינמי</Label>
                </div>
                {!formData.is_free && (
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="49.90"
                    className="mt-2"
                    step="0.01"
                    min="0"
                  />
                )}
              </div>
              <div>
                <Label>סדר תצוגה</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>אייקון (URL)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="https://..."
                  className="mt-2"
                />
              </div>
              <div>
                <Label>מחבר</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="שם המחבר"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>גרסה</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0.0"
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>התוסף פעיל</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || (!editingPlugin && !formData.slug)}
            >
              {saving ? 'שומר...' : editingPlugin ? 'עדכן' : 'צור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

