'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { HiMail, HiSave, HiPlus } from 'react-icons/hi';
import { DataTable, TableColumn } from '@/components/ui/DataTable';

interface EmailTemplate {
  id: number;
  template_type: string;
  subject: string;
  body_html: string;
  is_active: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'ORDER_CONFIRMATION', label: 'אישור הזמנה' },
  { value: 'WELCOME', label: 'מייל ברכה' },
  { value: 'ORDER_SHIPPED', label: 'הזמנה נשלחה' },
  { value: 'ORDER_CANCELLED', label: 'הזמנה בוטלה' },
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    template_type: '',
    subject: '',
    body_html: '',
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-templates', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('שגיאה בטעינת תבניות');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      template_type: template.template_type,
      subject: template.subject,
      body_html: template.body_html,
      is_active: template.is_active,
    });
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setFormData({
      template_type: '',
      subject: '',
      body_html: '',
      is_active: true,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = selectedTemplate 
        ? `/api/email-templates/${selectedTemplate.id}`
        : '/api/email-templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      await loadTemplates();
      setSelectedTemplate(null);
      alert('תבנית נשמרה בהצלחה');
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(`שגיאה בשמירת תבנית: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumn<EmailTemplate>[] = [
    {
      key: 'template_type',
      label: 'סוג תבנית',
      render: (template) => {
        const type = TEMPLATE_TYPES.find(t => t.value === template.template_type);
        return <div className="font-medium">{type?.label || template.template_type}</div>;
      },
    },
    {
      key: 'subject',
      label: 'נושא',
      render: (template) => (
        <div className="text-sm text-gray-700">{template.subject}</div>
      ),
    },
    {
      key: 'is_active',
      label: 'סטטוס',
      render: (template) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          template.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {template.is_active ? 'פעיל' : 'לא פעיל'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">תבניות מייל</h1>
        <Button onClick={handleNew}>
          <HiPlus className="w-4 h-4 ml-2" />
          תבנית חדשה
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">תבניות קיימות</h2>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleEdit(template)}
                    className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {TEMPLATE_TYPES.find(t => t.value === template.template_type)?.label || template.template_type}
                  </button>
                ))}
                {templates.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">אין תבניות</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <HiMail className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold">
                  {selectedTemplate ? 'עריכת תבנית' : 'תבנית חדשה'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="template_type">סוג תבנית</Label>
                  <select
                    id="template_type"
                    value={formData.template_type}
                    onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                    disabled={!!selectedTemplate}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2 disabled:bg-gray-100"
                  >
                    <option value="">בחר סוג תבנית</option>
                    {TEMPLATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">נושא המייל</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="נושא המייל (ניתן להשתמש ב-{{variables}})"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    משתנים זמינים: {'{{order_number}}'}, {'{{customer_name}}'}, {'{{store_name}}'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="body_html">תוכן המייל (HTML)</Label>
                  <textarea
                    id="body_html"
                    value={formData.body_html}
                    onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                    placeholder="תוכן המייל ב-HTML..."
                    rows={15}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ניתן להשתמש ב-HTML ובמשתנים {'{{variable}}'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    תבנית פעילה
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Button onClick={handleSave} disabled={saving || !formData.template_type || !formData.subject}>
                  <HiSave className="w-4 h-4 ml-2" />
                  {saving ? 'שומר...' : 'שמור תבנית'}
                </Button>
                {selectedTemplate && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setFormData({
                        template_type: '',
                        subject: '',
                        body_html: '',
                        is_active: true,
                      });
                    }}
                  >
                    ביטול
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

