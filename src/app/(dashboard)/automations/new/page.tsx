'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import {
  Workflow,
  Save,
  X,
  Play,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AutomationCondition, AutomationAction } from '@/lib/automations/automations';

// Dynamic import עם loading state לספרייה הכבדה
const AutomationFlowBuilder = dynamic(
  () => import('@/components/automations/AutomationFlowBuilder'),
  {
    loading: () => (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Workflow className="w-6 h-6 animate-spin text-gray-400" />
            <span className="mr-2 text-gray-500">טוען בונה זרימה...</span>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

export default function NewAutomationPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [trigger, setTrigger] = useState<{ type: string; filters?: any } | null>(null);
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [saving, setSaving] = useState(false);

  const eventTypes = [
    // Order events
    { value: 'order.created', label: 'הזמנה נוצרה' },
    { value: 'order.updated', label: 'הזמנה עודכנה' },
    { value: 'order.paid', label: 'הזמנה שולמה' },
    { value: 'order.cancelled', label: 'הזמנה בוטלה' },
    { value: 'order.fulfilled', label: 'הזמנה בוצעה' },
    { value: 'order.refunded', label: 'הזמנה הוחזרה' },
    
    // Cart events
    { value: 'cart.created', label: 'עגלה נוצרה' },
    { value: 'cart.abandoned', label: 'עגלה ננטשה' },
    
    // Customer events
    { value: 'customer.created', label: 'לקוח נוצר' },
    { value: 'customer.updated', label: 'לקוח עודכן' },
    { value: 'customer.deleted', label: 'לקוח נמחק' },
    
    // Product events
    { value: 'product.created', label: 'מוצר נוצר' },
    { value: 'product.updated', label: 'מוצר עודכן' },
    { value: 'product.deleted', label: 'מוצר נמחק' },
    { value: 'product.published', label: 'מוצר פורסם' },
    
    // Transaction events
    { value: 'transaction.created', label: 'טרנזקציה נוצרה' },
    { value: 'transaction.succeeded', label: 'טרנזקציה הצליחה' },
    { value: 'transaction.failed', label: 'טרנזקציה נכשלה' },
    
    // Discount events
    { value: 'discount.created', label: 'קוד הנחה נוצר' },
    { value: 'discount.updated', label: 'קוד הנחה עודכן' },
    { value: 'discount.deleted', label: 'קוד הנחה נמחק' },
    { value: 'automatic_discount.created', label: 'הנחה אוטומטית נוצרה' },
    { value: 'automatic_discount.updated', label: 'הנחה אוטומטית עודכנה' },
    { value: 'automatic_discount.deleted', label: 'הנחה אוטומטית נמחקה' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'שם האוטומציה חובה',
        variant: 'destructive',
      });
      return;
    }

    if (!trigger) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור טריגר',
        variant: 'destructive',
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'יש להוסיף לפחות אקשן אחד',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          trigger_type: trigger.type,
          trigger_conditions: trigger.filters || null,
          conditions: conditions.length > 0 ? conditions : null,
          actions,
          is_active: isActive,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'הצלחה',
          description: 'האוטומציה נוצרה בהצלחה',
        });
        router.push(`/automations/${data.id}`);
      } else {
        const error = await response.json();
        toast({
          title: 'שגיאה',
          description: error.error || 'לא ניתן ליצור את האוטומציה',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating automation:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה ביצירת האוטומציה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">אוטומציה חדשה</h1>
          <p className="text-gray-500 mt-1">בנה אוטומציה חדשה לניהול אירועים בחנות שלך</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <X className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Workflow className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                שמור
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>פרטים בסיסיים</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">שם האוטומציה *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: שליחת מייל לאחר הזמנה"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">תיאור</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של האוטומציה..."
              className="mt-1 w-full min-h-[80px] p-3 border rounded-md"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Flow Builder */}
      <AutomationFlowBuilder
        trigger={trigger}
        onTriggerChange={setTrigger}
        conditions={conditions}
        onConditionsChange={setConditions}
        actions={actions}
        onActionsChange={setActions}
        eventTypes={eventTypes}
      />
    </div>
  );
}

