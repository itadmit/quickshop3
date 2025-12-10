'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/Sheet';
import {
  Play,
  Plus,
  Trash2,
  Mail,
  Tag,
  Package,
  Bell,
  Webhook,
  CheckCircle2,
  X,
  Clock,
  Ticket,
  FileText,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AutomationCondition, AutomationAction } from '@/lib/automations/automations';

interface AutomationFlowBuilderProps {
  trigger: { type: string; filters?: any } | null;
  onTriggerChange: (trigger: { type: string; filters?: any } | null) => void;
  conditions: AutomationCondition[];
  onConditionsChange: (conditions: AutomationCondition[]) => void;
  actions: AutomationAction[];
  onActionsChange: (actions: AutomationAction[]) => void;
  eventTypes: { value: string; label: string }[];
}

// Custom Node Components
const TriggerNode = ({ data }: { data: any }) => {
  return (
    <div className="px-5 py-4 bg-white border-2 border-emerald-200 rounded-xl shadow-md hover:shadow-lg transition-shadow min-w-[220px] cursor-move group">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-1.5 bg-emerald-50 rounded-lg">
          <Play className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="font-semibold text-gray-900 text-sm">התחל כאשר...</div>
      </div>
      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium">
        {data.label || 'בחר אירוע'}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md" />
      <div className="text-xs text-gray-400 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        לחיצה כפולה לעריכה
      </div>
    </div>
  );
};

const ConditionNode = ({ data }: { data: any }) => {
  return (
    <div className="px-5 py-4 bg-white border-2 border-blue-200 rounded-xl shadow-md hover:shadow-lg transition-shadow min-w-[220px] cursor-move relative pb-20 group">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-50 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
        </div>
        <div className="font-semibold text-gray-900 text-sm">בדוק אם...</div>
      </div>
      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2 font-medium">
        {data.label || 'תנאי'}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white" />
      
      <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-3">
        <div className="flex flex-col items-center gap-1.5 relative" style={{ width: '50%' }}>
          <span className="text-xs text-green-700 font-semibold mb-1">אז</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="then"
            className="!bg-green-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md"
          />
        </div>
        <div className="flex flex-col items-center gap-1.5 relative" style={{ width: '50%' }}>
          <span className="text-xs text-red-700 font-semibold mb-1">אחרת</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="otherwise"
            className="!bg-red-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md"
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-400 text-center absolute bottom-2 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        לחיצה כפולה לעריכה
      </div>
    </div>
  );
};

const ActionNode = ({ data }: { data: any }) => {
  const Icon = data.icon || Package;
  const isDelay = data.action?.type === 'delay';
  const isEnd = data.action?.type === 'end';
  
  if (isDelay) {
    const { amount, unit } = data.action?.config || {};
    const unitLabels: Record<string, string> = {
      seconds: 'שניות',
      minutes: 'דקות',
      hours: 'שעות',
      days: 'ימים',
      weeks: 'שבועות',
    };
    
    return (
      <div className="px-5 py-4 bg-white border-2 border-orange-200 rounded-xl shadow-md hover:shadow-lg transition-shadow min-w-[220px] cursor-move group">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 bg-orange-50 rounded-lg">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="font-semibold text-gray-900 text-sm">המתן...</div>
        </div>
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium">
          {amount && unit ? `${amount} ${unitLabels[unit] || unit}` : 'המתן'}
        </div>
        <Handle type="target" position={Position.Top} className="!bg-orange-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md" />
        <Handle type="source" position={Position.Bottom} className="!bg-orange-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md" />
        <div className="text-xs text-gray-400 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          לחיצה כפולה לעריכה
        </div>
      </div>
    );
  }
  
  if (isEnd) {
    return (
      <div className="px-5 py-4 bg-white border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow min-w-[220px] cursor-move group">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 bg-gray-50 rounded-lg">
            <X className="w-4 h-4 text-gray-600" />
          </div>
          <div className="font-semibold text-gray-900 text-sm">סיים אוטומציה</div>
        </div>
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium">
          האוטומציה מסתיימת כאן
        </div>
        <Handle type="target" position={Position.Top} className="!bg-gray-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md" />
        <div className="text-xs text-gray-400 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          לחיצה כפולה לעריכה
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-5 py-4 bg-white border-2 border-green-200 rounded-xl shadow-md hover:shadow-lg transition-shadow min-w-[220px] cursor-move group">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-1.5 bg-green-50 rounded-lg">
          <Icon className="w-4 h-4 text-green-600" />
        </div>
        <div className="font-semibold text-gray-900 text-sm">בצע פעולה...</div>
      </div>
      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium">
        {data.label || 'פעולה'}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-green-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md" />
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3.5 !h-3.5 !border-2 !border-white shadow-md" />
      <div className="text-xs text-gray-400 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        לחיצה כפולה לעריכה
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};

export default function AutomationFlowBuilder({
  trigger,
  onTriggerChange,
  conditions,
  onConditionsChange,
  actions,
  onActionsChange,
  eventTypes,
}: AutomationFlowBuilderProps) {
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Condition form state
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [conditionLogicalOp, setConditionLogicalOp] = useState<'AND' | 'OR'>('AND');

  // Action form state
  const [actionType, setActionType] = useState('send_email');
  const [actionConfig, setActionConfig] = useState<any>({});
  const [emailTab, setEmailTab] = useState('edit');

  const actionTypes = [
    {
      value: 'send_email',
      label: 'שלח אימייל',
      icon: Mail,
      description: 'שלח אימייל ללקוח או למשתמש',
    },
    {
      value: 'add_order_note',
      label: 'הוסף הערה להזמנה',
      icon: FileText,
      description: 'הוסף הערה להזמנה',
    },
    {
      value: 'add_customer_note',
      label: 'הוסף הערה ללקוח',
      icon: User,
      description: 'הוסף הערה ללקוח',
    },
    {
      value: 'add_product_tag',
      label: 'הוסף תג למוצר',
      icon: Tag,
      description: 'הוסף תג למוצר',
    },
    {
      value: 'update_order_status',
      label: 'עדכן סטטוס הזמנה',
      icon: Package,
      description: 'עדכן את סטטוס ההזמנה',
    },
    {
      value: 'create_coupon',
      label: 'צור קופון',
      icon: Ticket,
      description: 'צור קופון חדש במערכת',
    },
    {
      value: 'webhook',
      label: 'שלח Webhook',
      icon: Webhook,
      description: 'שלח Webhook ל-URL חיצוני',
    },
    {
      value: 'delay',
      label: 'המתן',
      icon: Clock,
      description: 'המתן לפני ביצוע הפעולה הבאה',
    },
    {
      value: 'end',
      label: 'סיים אוטומציה',
      icon: X,
      description: 'סיים את האוטומציה כאן',
    },
  ];

  const operators = [
    { value: 'equals', label: 'שווה ל' },
    { value: 'not_equals', label: 'לא שווה ל' },
    { value: 'greater_than', label: 'גדול מ' },
    { value: 'less_than', label: 'קטן מ' },
    { value: 'contains', label: 'מכיל' },
    { value: 'not_contains', label: 'לא מכיל' },
    { value: 'in', label: 'נמצא ב' },
    { value: 'not_in', label: 'לא נמצא ב' },
  ];

  const conditionFields = [
    // Order fields
    { value: 'order.total', label: 'סכום הזמנה', category: 'הזמנות' },
    { value: 'order.financial_status', label: 'סטטוס תשלום', category: 'הזמנות' },
    { value: 'order.fulfillment_status', label: 'סטטוס ביצוע', category: 'הזמנות' },
    { value: 'order.order_number', label: 'מספר הזמנה', category: 'הזמנות' },
    { value: 'order.email', label: 'אימייל לקוח', category: 'הזמנות' },
    { value: 'order.customer_id', label: 'מזהה לקוח', category: 'הזמנות' },
    
    // Customer fields
    { value: 'customer.email', label: 'אימייל', category: 'לקוחות' },
    { value: 'customer.first_name', label: 'שם פרטי', category: 'לקוחות' },
    { value: 'customer.last_name', label: 'שם משפחה', category: 'לקוחות' },
    { value: 'customer.phone', label: 'טלפון', category: 'לקוחות' },
    { value: 'customer.total_spent', label: 'סכום כולל שהוצא', category: 'לקוחות' },
    { value: 'customer.orders_count', label: 'מספר הזמנות', category: 'לקוחות' },
    
    // Cart fields
    { value: 'cart.total', label: 'סכום עגלה', category: 'עגלות' },
    { value: 'cart.items', label: 'מספר פריטים בעגלה', category: 'עגלות' },
    
    // Product fields
    { value: 'product.name', label: 'שם מוצר', category: 'מוצרים' },
    { value: 'product.price', label: 'מחיר מוצר', category: 'מוצרים' },
  ];

  // Helper function to create action nodes recursively
  const createActionNodes = (
    actions: AutomationAction[],
    startYPos: number,
    startXPos: number,
    prefix: string
  ): { nodes: Node[]; maxY: number } => {
    const nodes: Node[] = [];
    let yPos = startYPos;
    
    actions.forEach((action, index) => {
      const actionTypeInfo = actionTypes.find((at: any) => at.value === action.type);
      
      let label = actionTypeInfo?.label || action.type;
      if (action.type === 'delay' && action.config?.amount && action.config?.unit) {
        const unitLabels: Record<string, string> = {
          seconds: 'שניות',
          minutes: 'דקות',
          hours: 'שעות',
          days: 'ימים',
          weeks: 'שבועות',
        };
        label = `${action.config.amount} ${unitLabels[action.config.unit] || action.config.unit}`;
      }
      
      if (action.type === 'create_coupon' && action.config?.code) {
        label = `קופון: ${action.config.code}`;
      }
      
      nodes.push({
        id: `${prefix}-${index}`,
        type: 'action',
        position: { x: startXPos, y: yPos },
        data: {
          label,
          icon: actionTypeInfo?.icon || Package,
          action,
          index,
        },
      });
      yPos += 200;
    });
    
    return { nodes, maxY: yPos };
  };

  // Create nodes and edges with useMemo
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];
    let yPos = 100;

    // Trigger node
    if (trigger) {
      const eventLabel = eventTypes.find((e: any) => e.value === trigger.type)?.label || trigger.type;
      nodes.push({
        id: 'trigger',
        type: 'trigger',
        position: { x: 400, y: yPos },
        data: {
          label: eventLabel,
          type: trigger.type,
        },
      });
      yPos += 200;
    }

    // Actions before conditions (main flow)
    actions.forEach((action, index) => {
      const actionTypeInfo = actionTypes.find((at: any) => at.value === action.type);
      
      let label = actionTypeInfo?.label || action.type;
      if (action.type === 'delay' && action.config?.amount && action.config?.unit) {
        const unitLabels: Record<string, string> = {
          seconds: 'שניות',
          minutes: 'דקות',
          hours: 'שעות',
          days: 'ימים',
          weeks: 'שבועות',
        };
        label = `${action.config.amount} ${unitLabels[action.config.unit] || action.config.unit}`;
      }
      
      if (action.type === 'create_coupon' && action.config?.code) {
        label = `קופון: ${action.config.code}`;
      }
      
      nodes.push({
        id: `action-${index}`,
        type: 'action',
        position: { x: 400, y: yPos },
        data: {
          label,
          icon: actionTypeInfo?.icon || Package,
          action,
          index,
        },
      });
      yPos += 200;
    });

    // Condition nodes with branches
    conditions.forEach((condition, index) => {
      const conditionLabel = `${conditionFields.find((f) => f.value === condition.field)?.label || condition.field} ${operators.find((op: any) => op.value === condition.operator)?.label || condition.operator} ${condition.value}`;
      nodes.push({
        id: `condition-${index}`,
        type: 'condition',
        position: { x: 400, y: yPos },
        data: {
          label: conditionLabel,
          condition,
          index,
        },
      });
      yPos += 250;
      
      // Create "then" branch nodes
      if (condition.thenActions && condition.thenActions.length > 0) {
        const thenResult = createActionNodes(condition.thenActions, yPos, 200, `then-${index}`);
        nodes.push(...thenResult.nodes);
      }
      
      // Create "else" branch nodes
      if (condition.elseActions && condition.elseActions.length > 0) {
        const elseResult = createActionNodes(condition.elseActions, yPos, 600, `else-${index}`);
        nodes.push(...elseResult.nodes);
      }
    });

    return nodes;
  }, [trigger, conditions, actions, eventTypes, actionTypes, operators, conditionFields]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    // Connect trigger to first action (if exists) or first condition
    if (trigger) {
      if (actions.length > 0) {
        edges.push({
          id: 'trigger-action-0',
          source: 'trigger',
          target: 'action-0',
          type: 'smoothstep',
          animated: true,
        });
      } else if (conditions.length > 0) {
        edges.push({
          id: 'trigger-condition-0',
          source: 'trigger',
          target: 'condition-0',
          type: 'smoothstep',
          animated: true,
        });
      }
    }

    // Connect actions in sequence
    actions.forEach((action, index) => {
      if (index > 0) {
        const prevAction = actions[index - 1];
        if (prevAction?.type !== 'end') {
          edges.push({
            id: `action-${index - 1}-action-${index}`,
            source: `action-${index - 1}`,
            target: `action-${index}`,
            type: 'smoothstep',
            animated: true,
          });
        }
      }
    });

    // Connect last action to first condition
    if (actions.length > 0 && conditions.length > 0) {
      const lastAction = actions[actions.length - 1];
      if (lastAction?.type !== 'end') {
        edges.push({
          id: `action-${actions.length - 1}-condition-0`,
          source: `action-${actions.length - 1}`,
          target: 'condition-0',
          type: 'smoothstep',
          animated: true,
        });
      }
    }

    // Connect conditions and their branches
    conditions.forEach((condition, index) => {
      if (condition.thenActions && condition.thenActions.length > 0) {
        edges.push({
          id: `condition-${index}-then-${index}-0`,
          source: `condition-${index}`,
          target: `then-${index}-0`,
          sourceHandle: 'then',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981' },
        });
        
        condition.thenActions.forEach((_: any, actionIndex: number) => {
          if (actionIndex > 0) {
            const prevAction = condition.thenActions[actionIndex - 1];
            if (prevAction?.type !== 'end') {
              edges.push({
                id: `then-${index}-${actionIndex - 1}-then-${index}-${actionIndex}`,
                source: `then-${index}-${actionIndex - 1}`,
                target: `then-${index}-${actionIndex}`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#10b981' },
              });
            }
          }
        });
      }
      
      if (condition.elseActions && condition.elseActions.length > 0) {
        edges.push({
          id: `condition-${index}-else-${index}-0`,
          source: `condition-${index}`,
          target: `else-${index}-0`,
          sourceHandle: 'otherwise',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#ef4444' },
        });
        
        condition.elseActions.forEach((_: any, actionIndex: number) => {
          if (actionIndex > 0) {
            const prevAction = condition.elseActions[actionIndex - 1];
            if (prevAction?.type !== 'end') {
              edges.push({
                id: `else-${index}-${actionIndex - 1}-else-${index}-${actionIndex}`,
                source: `else-${index}-${actionIndex - 1}`,
                target: `else-${index}-${actionIndex}`,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#ef4444' },
              });
            }
          }
        });
      }
    });

    return edges;
  }, [trigger, conditions, actions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const prevNodesRef = useRef<string>('');
  const prevEdgesRef = useRef<string>('');

  useEffect(() => {
    const nodesKey = initialNodes.map((n) => n.id).join(',');
    const edgesKey = initialEdges.map((e) => e.id).join(',');
    
    if (nodesKey !== prevNodesRef.current) {
      setNodes(initialNodes);
      prevNodesRef.current = nodesKey;
    }
    
    if (edgesKey !== prevEdgesRef.current) {
      setEdges(initialEdges);
      prevEdgesRef.current = edgesKey;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if ((event as any).detail === 2) {
      if (node.type === 'condition') {
        const condition = node.data.condition as AutomationCondition;
        setConditionField(condition.field);
        setConditionOperator(condition.operator);
        setConditionValue(String(condition.value || ''));
        setConditionLogicalOp(condition.logicalOperator || 'AND');
        setEditingNodeId(node.id);
        setConditionDialogOpen(true);
      } else if (node.type === 'action') {
        const action = node.data.action as AutomationAction;
        setActionType(action.type);
        setActionConfig(action.config || {});
        setEditingNodeId(node.id);
        setActionDialogOpen(true);
      }
    }
  };

  const handleNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (node.id !== 'trigger') {
      handleDeleteNode(node.id);
    }
  };

  const handleAddCondition = () => {
    if (!conditionField || !conditionValue) return;

    const newCondition: AutomationCondition = {
      field: conditionField,
      operator: conditionOperator as any,
      value: conditionValue,
      logicalOperator: conditionLogicalOp,
    };

    if (editingNodeId) {
      const index = parseInt(editingNodeId.split('-')[1]);
      const updated = [...conditions];
      updated[index] = newCondition;
      onConditionsChange(updated);
      setEditingNodeId(null);
    } else {
      onConditionsChange([...conditions, newCondition]);
    }

    setConditionField('');
    setConditionValue('');
    setConditionOperator('equals');
    setConditionDialogOpen(false);
  };

  const handleAddAction = () => {
    if (!actionType) return;

    const newAction: AutomationAction = {
      type: actionType,
      config: actionConfig,
    };

    if (editingNodeId) {
      const index = parseInt(editingNodeId.split('-')[1]);
      const updated = [...actions];
      updated[index] = newAction;
      onActionsChange(updated);
      setEditingNodeId(null);
    } else {
      onActionsChange([...actions, newAction]);
    }

    setActionType('send_email');
    setActionConfig({});
    setActionDialogOpen(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId.startsWith('condition-')) {
      const index = parseInt(nodeId.split('-')[1]);
      onConditionsChange(conditions.filter((_, i) => i !== index));
    } else if (nodeId.startsWith('action-')) {
      const index = parseInt(nodeId.split('-')[1]);
      onActionsChange(actions.filter((_, i) => i !== index));
    }
  };

  const getFieldValueOptions = (field: string): Array<{ value: string; label: string }> | null => {
    switch (field) {
      case 'order.financial_status':
      case 'order.fulfillment_status':
        return [
          { value: 'pending', label: 'ממתין' },
          { value: 'paid', label: 'שולם' },
          { value: 'shipped', label: 'נשלח' },
          { value: 'delivered', label: 'נמסר' },
          { value: 'cancelled', label: 'בוטל' },
          { value: 'refunded', label: 'הוחזר' },
        ];
      default:
        return null;
    }
  };

  const renderActionConfig = () => {
    switch (actionType) {
      case 'send_email': {
        const defaultEmailTemplate = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #15b981 0%, #10b981 100%); padding: 30px 20px; text-align: center; color: white; }
    .content { padding: 30px 20px; color: #333; line-height: 1.6; }
    .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>שלום {{customer.first_name}}!</h1>
    </div>
    <div class="content">
      <p>תודה על העניין שלך בחנות שלנו.</p>
    </div>
    <div class="footer">
      <p>הודעה זו נשלחה אוטומטית</p>
    </div>
  </div>
</body>
</html>`;

        const dynamicVariables = [
          { variable: '{{customer.first_name}}', description: 'שם פרטי הלקוח' },
          { variable: '{{customer.email}}', description: 'אימייל הלקוח' },
          { variable: '{{order.order_number}}', description: 'מספר הזמנה' },
          { variable: '{{order.total}}', description: 'סכום הזמנה' },
          { variable: '{{cart.total}}', description: 'סכום עגלה' },
          { variable: '{{coupon.code}}', description: 'קוד קופון' },
        ];

        return (
          <div className="space-y-4">
            <div>
              <Label>אל</Label>
              <Select
                value={actionConfig.toType || 'customer'}
                onValueChange={(value) => {
                  let to = '';
                  if (value === 'customer') {
                    to = '{{customer.email}}';
                  } else if (value === 'admin') {
                    to = '{{shop.email}}';
                  }
                  setActionConfig({ ...actionConfig, toType: value, to });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר נמען" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">אימייל הלקוח</SelectItem>
                  <SelectItem value="admin">מנהל האתר</SelectItem>
                  <SelectItem value="custom">מייל אחר</SelectItem>
                </SelectContent>
              </Select>
              {actionConfig.toType === 'custom' && (
                <Input
                  value={actionConfig.to || ''}
                  onChange={(e) => setActionConfig({ ...actionConfig, to: e.target.value })}
                  placeholder="הזן כתובת אימייל"
                  className="mt-2"
                />
              )}
              {actionConfig.toType !== 'custom' && (
                <Input
                  value={actionConfig.to || (actionConfig.toType === 'customer' ? '{{customer.email}}' : '{{shop.email}}')}
                  onChange={(e) => setActionConfig({ ...actionConfig, to: e.target.value })}
                  placeholder="אימייל או משתנה דינמי"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <Label>נושא</Label>
              <Input
                value={actionConfig.subject || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, subject: e.target.value })}
                placeholder="נושא האימייל"
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>תוכן (HTML)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionConfig({ ...actionConfig, template: defaultEmailTemplate });
                  }}
                >
                  טען תבנית ברירת מחדל
                </Button>
              </div>
              <Tabs value={emailTab} onValueChange={setEmailTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="edit">עריכה</TabsTrigger>
                  <TabsTrigger value="preview">תצוגה מקדימה</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <textarea
                    value={actionConfig.template || ''}
                    onChange={(e) => setActionConfig({ ...actionConfig, template: e.target.value })}
                    placeholder="תוכן האימייל (HTML)"
                    className="w-full min-h-[300px] p-3 border rounded-md font-mono text-xs"
                    rows={12}
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="border rounded-md bg-gray-50 p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                    <div
                      className="bg-white rounded shadow-sm p-4"
                      dangerouslySetInnerHTML={{
                        __html: (actionConfig.template || '<p>התצוגה המקדימה תופיע כאן...</p>')
                          .replace(/\{\{customer\.first_name\}\}/g, 'יוסי')
                          .replace(/\{\{customer\.email\}\}/g, 'yossi@example.com')
                          .replace(/\{\{order\.order_number\}\}/g, 'ORD-12345')
                          .replace(/\{\{order\.total\}\}/g, '₪299.00')
                          .replace(/\{\{cart\.total\}\}/g, '₪199.00')
                          .replace(/\{\{coupon\.code\}\}/g, 'SAVE10'),
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <Label className="mb-2 block">משתנים דינמיים זמינים</Label>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="text-xs text-gray-600 mb-2">לחץ על משתנה כדי להעתיק אותו:</p>
                <div className="grid grid-cols-2 gap-2">
                  {dynamicVariables.map((item: any) => (
                    <button
                      key={item.variable}
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('textarea[placeholder*="תוכן האימייל"]') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart || 0;
                          const end = textarea.selectionEnd || 0;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + item.variable + text.substring(end);
                          setActionConfig({ ...actionConfig, template: newText });
                        }
                      }}
                      className="text-right p-2 bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors text-xs"
                    >
                      <code className="text-emerald-600 font-semibold">{item.variable}</code>
                      <div className="text-gray-500 mt-1">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'add_order_note':
        return (
          <div className="space-y-4">
            <div>
              <Label>הערה</Label>
              <textarea
                value={actionConfig.note || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, note: e.target.value })}
                placeholder="הזן הערה להזמנה"
                className="mt-1 w-full min-h-[100px] p-3 border rounded-md"
                rows={4}
              />
            </div>
          </div>
        );

      case 'add_customer_note':
        return (
          <div className="space-y-4">
            <div>
              <Label>הערה</Label>
              <textarea
                value={actionConfig.note || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, note: e.target.value })}
                placeholder="הזן הערה ללקוח"
                className="mt-1 w-full min-h-[100px] p-3 border rounded-md"
                rows={4}
              />
            </div>
          </div>
        );

      case 'add_product_tag':
        return (
          <div className="space-y-4">
            <div>
              <Label>תגים (מופרדים בפסיק)</Label>
              <Input
                value={actionConfig.tags || ''}
                onChange={(e) =>
                  setActionConfig({
                    ...actionConfig,
                    tags: e.target.value.split(',').map((t: any) => t.trim()),
                  })
                }
                placeholder="VIP, Premium, וכו'"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'update_order_status':
        return (
          <div className="space-y-4">
            <div>
              <Label>סוג סטטוס</Label>
              <Select
                value={actionConfig.statusType || 'fulfillment_status'}
                onValueChange={(value) => setActionConfig({ ...actionConfig, statusType: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fulfillment_status">סטטוס ביצוע</SelectItem>
                  <SelectItem value="financial_status">סטטוס תשלום</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סטטוס חדש</Label>
              <Select
                value={actionConfig.status || ''}
                onValueChange={(value) => setActionConfig({ ...actionConfig, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="paid">שולם</SelectItem>
                  <SelectItem value="shipped">נשלח</SelectItem>
                  <SelectItem value="delivered">נמסר</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                  <SelectItem value="refunded">הוחזר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'create_coupon':
        return (
          <div className="space-y-4">
            <div>
              <Label>קוד קופון (אופציונלי)</Label>
              <Input
                value={actionConfig.code || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, code: e.target.value })}
                placeholder="לדוגמה: WELCOME10"
                className="mt-1"
              />
            </div>
            <div>
              <Label>סוג הנחה</Label>
              <Select
                value={actionConfig.type || 'PERCENTAGE'}
                onValueChange={(value) => setActionConfig({ ...actionConfig, type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">אחוז</SelectItem>
                  <SelectItem value="FIXED">סכום קבוע</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ערך הנחה</Label>
              <Input
                type="number"
                value={actionConfig.value || ''}
                onChange={(e) =>
                  setActionConfig({
                    ...actionConfig,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="לדוגמה: 10"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="uniquePerCustomer"
                checked={actionConfig.uniquePerCustomer || false}
                onChange={(e) =>
                  setActionConfig({ ...actionConfig, uniquePerCustomer: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="uniquePerCustomer" className="cursor-pointer">
                <div className="font-semibold text-blue-900">קופון ייחודי חד פעמי לכל לקוח</div>
              </Label>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <Label>כמות</Label>
              <Input
                type="number"
                value={actionConfig.amount || ''}
                onChange={(e) =>
                  setActionConfig({
                    ...actionConfig,
                    amount: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="לדוגמה: 5"
                className="mt-1"
              />
            </div>
            <div>
              <Label>יחידת זמן</Label>
              <Select
                value={actionConfig.unit || 'seconds'}
                onValueChange={(value) => setActionConfig({ ...actionConfig, unit: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">שניות</SelectItem>
                  <SelectItem value="minutes">דקות</SelectItem>
                  <SelectItem value="hours">שעות</SelectItem>
                  <SelectItem value="days">ימים</SelectItem>
                  <SelectItem value="weeks">שבועות</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                value={actionConfig.url || ''}
                onChange={(e) => setActionConfig({ ...actionConfig, url: e.target.value })}
                placeholder="https://example.com/webhook"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Method</Label>
              <Select
                value={actionConfig.method || 'POST'}
                onValueChange={(value) => setActionConfig({ ...actionConfig, method: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                האוטומציה תסתיים כאן. לא תתבצע שום פעולה נוספת לאחר נקודה זו.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Trigger Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-600" />
            התחל כאשר...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={trigger?.type || ''}
            onValueChange={(value) => {
              // אם משנים את הטריגר, ננקה את ה-conditions וה-actions
              // כי הם יכולים להיות תלויים בטריגר הספציפי
              if (trigger?.type && trigger.type !== value) {
                onConditionsChange([]);
                onActionsChange([]);
              }
              onTriggerChange({ type: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר אירוע">
                {trigger?.type ? eventTypes.find((e: any) => e.value === trigger.type)?.label : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((event: any) => (
                <SelectItem key={event.value} value={event.value}>
                  {event.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Flow Canvas */}
      {trigger && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>זרימת האוטומציה</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConditionDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף תנאי
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף פעולה
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '600px', direction: 'rtl' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onNodeContextMenu={handleNodeContextMenu}
                nodeTypes={nodeTypes}
                defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                className="bg-gray-50"
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                }}
                deleteKeyCode="Delete"
                snapToGrid
                snapGrid={[20, 20]}
                proOptions={{ hideAttribution: true }}
              >
                <Background />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.type === 'trigger') return '#9333ea';
                    if (node.type === 'condition') return '#3b82f6';
                    if (node.type === 'action') return '#10b981';
                    return '#6b7280';
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Condition Sheet */}
      <Sheet open={conditionDialogOpen} onOpenChange={setConditionDialogOpen} side="left">
        <SheetContent>
          <SheetHeader onClose={() => setConditionDialogOpen(false)}>
            <div>
              <SheetTitle>הוסף תנאי</SheetTitle>
              <SheetDescription>הגדר תנאי שיקבע מתי האוטומציה תרוץ</SheetDescription>
            </div>
          </SheetHeader>
          <SheetBody>
            <div className="space-y-4">
              <div>
                <Label>שדה</Label>
                <Select value={conditionField} onValueChange={setConditionField}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר שדה לבדיקה" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      conditionFields.reduce(
                        (acc, field) => {
                          if (!acc[field.category]) {
                            acc[field.category] = [];
                          }
                          acc[field.category].push(field);
                          return acc;
                        },
                        {} as Record<string, Array<{ value: string; label: string; category: string }>>
                      )
                    ).map(([category, fields]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                          {category}
                        </div>
                        {fields.map((field: any) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>אופרטור</Label>
                <Select value={conditionOperator} onValueChange={setConditionOperator}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op: any) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ערך</Label>
                {getFieldValueOptions(conditionField) ? (
                  <Select value={conditionValue} onValueChange={setConditionValue}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="בחר ערך" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFieldValueOptions(conditionField)?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    placeholder="הערך לבדיקה"
                    className="mt-1"
                  />
                )}
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConditionDialogOpen(false);
                setEditingNodeId(null);
              }}
            >
              ביטול
            </Button>
            <Button onClick={handleAddCondition}>{editingNodeId ? 'עדכן' : 'הוסף'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Action Sheet */}
      <Sheet open={actionDialogOpen} onOpenChange={setActionDialogOpen} side="left">
        <SheetContent>
          <SheetHeader onClose={() => setActionDialogOpen(false)}>
            <div>
              <SheetTitle>הוסף פעולה</SheetTitle>
              <SheetDescription>בחר פעולה שתתבצע כאשר האוטומציה תרוץ</SheetDescription>
            </div>
          </SheetHeader>
          <SheetBody>
            <div className="space-y-4">
              <div>
                <Label>סוג פעולה</Label>
                <Select
                  value={actionType}
                  onValueChange={(value) => {
                    setActionType(value);
                    setEmailTab('edit');
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="בחר סוג פעולה">
                      {(() => {
                        const selected = actionTypes.find((at: any) => at.value === actionType);
                        if (!selected) return null;
                        const Icon = selected.icon;
                        return (
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{selected.label}</span>
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((at: any) => {
                      const Icon = at.icon;
                      return (
                        <SelectItem key={at.value} value={at.value}>
                          <div className="flex items-center gap-2 w-full">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 text-right">
                              <div className="font-medium">{at.label}</div>
                              <div className="text-xs text-gray-500">{at.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {renderActionConfig()}
            </div>
          </SheetBody>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setEditingNodeId(null);
              }}
            >
              ביטול
            </Button>
            <Button onClick={handleAddAction}>{editingNodeId ? 'עדכן' : 'הוסף'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

