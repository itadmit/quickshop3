'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Save,
  Eye,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  Brain,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { 
  AdvisorQuiz, 
  AdvisorQuestionWithAnswers,
} from '@/types/advisor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SmartAdvisorEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast, toasts } = useOptimisticToast();
  
  const [quiz, setQuiz] = useState<AdvisorQuiz | null>(null);
  const [questions, setQuestions] = useState<AdvisorQuestionWithAnswers[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set()); // Track individual saving items
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [products, setProducts] = useState<any[]>([]);
  
  // Expanded questions
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  // Rule dialog
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [ruleWeights, setRuleWeights] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchQuiz();
    fetchProducts();
    fetchStoreSlug();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/advisor/quizzes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
        setQuestions(data.quiz.questions || []);
        setRules(data.quiz.rules || []);
        // Expand all questions by default
        const allIds = new Set((data.quiz.questions || []).map((q: any) => q.id));
        setExpandedQuestions(allIds);
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בטעינת הנתונים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchStoreSlug = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setStoreSlug(data.store?.slug || null);
      }
    } catch (error) {
      console.error('Error fetching store slug:', error);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quiz) return;
    
    try {
      setSaving(true);
      const res = await fetch(`/api/advisor/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          is_active: quiz.is_active,
          primary_color: quiz.primary_color,
          background_color: quiz.background_color,
          show_floating_button: quiz.show_floating_button,
        }),
      });

      if (res.ok) {
        toast({ title: '✅ נשמר', description: 'השינויים נשמרו בהצלחה' });
      } else {
        toast({ title: 'שגיאה', description: 'שגיאה בשמירה', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בשמירה', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ========== Question Functions ==========
  
  const addQuestion = async () => {
    const key = 'add-question';
    try {
      setSavingItems(prev => new Set(prev).add(key));
      const res = await fetch('/api/advisor/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: parseInt(id),
          question_text: 'שאלה חדשה',
          question_type: 'single',
          answers_layout: 'grid',
          columns: 2,
          is_required: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newQuestion = data.question || data;
        setQuestions(prev => [...prev, { ...newQuestion, answers: [] }]);
        setExpandedQuestions(prev => new Set(prev).add(newQuestion.id));
        toast({ title: 'הצלחה', description: 'השאלה נוספה' });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בהוספת שאלה', variant: 'destructive' });
    } finally {
      setSavingItems(prev => { const newSet = new Set(prev); newSet.delete(key); return newSet; });
    }
  };

  const updateQuestion = async (questionId: number, field: string, value: any) => {
    // Update locally first
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const saveQuestion = async (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const key = `save-question-${questionId}`;
    try {
      setSavingItems(prev => new Set(prev).add(key));
      await fetch(`/api/advisor/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: question.question_text,
          question_subtitle: question.question_subtitle,
          question_type: question.question_type,
          answers_layout: question.answers_layout,
          columns: question.columns,
          is_required: question.is_required,
        }),
      });
      // Silent save - no toast for question text updates
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בשמירת השאלה', variant: 'destructive' });
    } finally {
      setSavingItems(prev => { const newSet = new Set(prev); newSet.delete(key); return newSet; });
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('האם למחוק את השאלה?')) return;

    try {
      const res = await fetch(`/api/advisor/questions/${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        toast({ title: 'הצלחה', description: 'השאלה נמחקה' });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה במחיקה', variant: 'destructive' });
    }
  };

  // ========== Answer Functions ==========

  const addAnswer = async (questionId: number) => {
    const key = `add-answer-${questionId}`;
    try {
      setSavingItems(prev => new Set(prev).add(key));
      const res = await fetch('/api/advisor/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          answer_text: 'תשובה חדשה',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newAnswer = data.answer || data;
        setQuestions(prev => prev.map(q => 
          q.id === questionId
            ? { ...q, answers: [...(q.answers || []), newAnswer] }
            : q
        ));
        toast({ title: 'הצלחה', description: 'התשובה נוספה' });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בהוספת תשובה', variant: 'destructive' });
    } finally {
      setSavingItems(prev => { const newSet = new Set(prev); newSet.delete(key); return newSet; });
    }
  };

  const updateAnswer = (questionId: number, answerId: number, field: string, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId
        ? {
            ...q,
            answers: q.answers.map(a => 
              a.id === answerId ? { ...a, [field]: value } : a
            )
          }
        : q
    ));
  };

  const saveAnswer = async (answerId: number) => {
    const answer = questions.flatMap(q => q.answers || []).find(a => a.id === answerId);
    if (!answer) return;

    const key = `save-answer-${answerId}`;
    try {
      setSavingItems(prev => new Set(prev).add(key));
      await fetch(`/api/advisor/answers/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer_text: answer.answer_text,
          answer_subtitle: answer.answer_subtitle,
        }),
      });
      // Silent save - no toast for answer text updates
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בשמירה', variant: 'destructive' });
    } finally {
      setSavingItems(prev => { const newSet = new Set(prev); newSet.delete(key); return newSet; });
    }
  };

  const deleteAnswer = async (questionId: number, answerId: number) => {
    if (!confirm('האם למחוק את התשובה?')) return;

    try {
      const res = await fetch(`/api/advisor/answers/${answerId}`, { method: 'DELETE' });
      if (res.ok) {
        setQuestions(prev => prev.map(q => 
          q.id === questionId
            ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
            : q
        ));
        toast({ title: 'הצלחה', description: 'התשובה נמחקה' });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה במחיקה', variant: 'destructive' });
    }
  };

  // ========== Rules Functions ==========

  const openRuleDialog = (productId?: number) => {
    if (productId) {
      setSelectedProduct(productId);
      const existingRule = rules.find(r => r.product_id === productId);
      if (existingRule && existingRule.answer_weights) {
        const weights: Record<number, number> = {};
        for (const w of existingRule.answer_weights) {
          weights[w.answer_id] = w.weight;
        }
        setRuleWeights(weights);
      } else {
        setRuleWeights({});
      }
    } else {
      setSelectedProduct(null);
      setRuleWeights({});
    }
    setShowRuleDialog(true);
  };

  const handleSaveRule = async () => {
    if (!selectedProduct) {
      toast({ title: 'שגיאה', description: 'נא לבחור מוצר', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);

      const answerWeights = Object.entries(ruleWeights)
        .filter(([_, weight]) => weight > 0)
        .map(([answerId, weight]) => ({
          answer_id: parseInt(answerId),
          weight,
        }));

      const existingRule = rules.find(r => r.product_id === selectedProduct);

      if (existingRule) {
        await fetch(`/api/advisor/rules/${existingRule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer_weights: answerWeights }),
        });
      } else {
        await fetch('/api/advisor/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_id: parseInt(id),
            product_id: selectedProduct,
            answer_weights: answerWeights,
          }),
        });
      }

      toast({ title: 'הצלחה', description: 'החוקים נשמרו' });
      setShowRuleDialog(false);
      fetchQuiz(); // Refresh rules
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בשמירת החוקים', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/smart-advisor')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-semibold">{quiz.title}</h1>
              <p className="text-sm text-gray-500">עריכת יועץ חכם</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`/shops/${storeSlug}/advisor/${quiz.slug}`, '_blank')}
              disabled={!quiz.is_active || !storeSlug}
            >
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה
            </Button>
            <Button onClick={handleSaveQuiz} disabled={saving}>
              <Save className="h-4 w-4 ml-2" />
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="questions">שאלות ותשובות</TabsTrigger>
            <TabsTrigger value="rules">התאמת מוצרים</TabsTrigger>
            <TabsTrigger value="settings">הגדרות</TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="space-y-4">
              {questions.map((question, qIndex) => (
                <Card key={question.id} className="overflow-hidden">
                  {/* Question Header */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                        {qIndex + 1}
                      </span>
                      <span className="font-medium">{question.question_text}</span>
                      <span className="text-sm text-gray-500">
                        ({question.answers?.length || 0} תשובות)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedQuestions.has(question.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  {expandedQuestions.has(question.id) && (
                    <CardContent className="pt-4 space-y-4">
                      {/* Question Text */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>טקסט השאלה</Label>
                          <Input
                            value={question.question_text}
                            onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                            onBlur={() => saveQuestion(question.id)}
                          />
                        </div>
                        <div>
                          <Label>כותרת משנה (אופציונלי)</Label>
                          <Input
                            value={question.question_subtitle || ''}
                            onChange={(e) => updateQuestion(question.id, 'question_subtitle', e.target.value)}
                            onBlur={() => saveQuestion(question.id)}
                          />
                        </div>
                      </div>

                      {/* Answers Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-semibold">תשובות</Label>
                          <Button 
                            size="sm" 
                            onClick={() => addAnswer(question.id)}
                            disabled={savingItems.has(`add-answer-${question.id}`)}
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף תשובה
                          </Button>
                        </div>

                        {/* Answers List */}
                        <div className="space-y-2">
                          {question.answers?.map((answer, aIndex) => (
                            <div 
                              key={answer.id || `answer-${aIndex}`} 
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs font-medium">
                                {aIndex + 1}
                              </span>
                              <Input
                                className="flex-1"
                                value={answer.answer_text}
                                onChange={(e) => updateAnswer(question.id, answer.id, 'answer_text', e.target.value)}
                                onBlur={() => saveAnswer(answer.id)}
                                placeholder="טקסט התשובה"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAnswer(question.id, answer.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {(!question.answers || question.answers.length === 0) && (
                            <p className="text-center text-gray-400 py-4">
                              אין תשובות. לחץ "הוסף תשובה" להוספת תשובה ראשונה.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}

              {/* Add Question Button */}
              <Button 
                onClick={addQuestion} 
                disabled={savingItems.has('add-question')}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף שאלה חדשה
              </Button>
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  התאמת מוצרים לתשובות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  בחר מוצר והגדר משקל לכל תשובה. המוצרים עם הציון הגבוה ביותר יוצגו ללקוח.
                </p>
                <Button onClick={() => openRuleDialog()}>
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף כלל התאמה
                </Button>

                {/* Existing Rules */}
                {rules.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {rules.map((rule) => {
                      const product = products.find(p => p.id === rule.product_id);
                      return (
                        <div 
                          key={rule.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => openRuleDialog(rule.product_id)}
                        >
                          <span>{product?.title || 'מוצר לא ידוע'}</span>
                          <span className="text-sm text-gray-500">
                            {rule.answer_weights?.length || 0} כללים
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות כלליות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>שם השאלון</Label>
                  <Input
                    value={quiz.title}
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>תיאור</Label>
                  <Input
                    value={quiz.description || ''}
                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={quiz.is_active}
                    onCheckedChange={(checked) => setQuiz({ ...quiz, is_active: checked })}
                  />
                  <Label>שאלון פעיל</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={quiz.show_floating_button || false}
                    onCheckedChange={(checked) => setQuiz({ ...quiz, show_floating_button: checked })}
                  />
                  <Label>הצג כפתור צף בדף הבית</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>צבע ראשי</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="relative">
                        <input
                          type="color"
                          value={quiz.primary_color || '#22c55e'}
                          onChange={(e) => setQuiz({ ...quiz, primary_color: e.target.value })}
                          className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer p-0 overflow-hidden"
                          style={{ WebkitAppearance: 'none' }}
                        />
                      </div>
                      <div 
                        className="flex-1 h-10 rounded-lg border border-gray-200"
                        style={{ backgroundColor: quiz.primary_color || '#22c55e' }}
                      />
                      <Input
                        type="text"
                        value={quiz.primary_color || '#22c55e'}
                        onChange={(e) => setQuiz({ ...quiz, primary_color: e.target.value })}
                        className="w-28 font-mono text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>צבע רקע</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="relative">
                        <input
                          type="color"
                          value={quiz.background_color || '#ffffff'}
                          onChange={(e) => setQuiz({ ...quiz, background_color: e.target.value })}
                          className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer p-0 overflow-hidden"
                          style={{ WebkitAppearance: 'none' }}
                        />
                      </div>
                      <div 
                        className="flex-1 h-10 rounded-lg border border-gray-200"
                        style={{ backgroundColor: quiz.background_color || '#ffffff' }}
                      />
                      <Input
                        type="text"
                        value={quiz.background_color || '#ffffff'}
                        onChange={(e) => setQuiz({ ...quiz, background_color: e.target.value })}
                        className="w-28 font-mono text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent maxWidth="3xl">
          <DialogHeader>
            <DialogTitle>הגדרת כללי התאמה למוצר</DialogTitle>
          </DialogHeader>
          <DialogBody className="min-h-[400px] max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <Label>בחר מוצר</Label>
                <Select
                  value={selectedProduct?.toString() || ''}
                  onValueChange={(v) => setSelectedProduct(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מוצר..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && questions.length > 0 && (
                <div className="space-y-4 mt-4">
                  <p className="text-sm font-medium">קבע משקל לכל תשובה (0-100):</p>
                  {questions.map((question) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <p className="font-medium mb-3">{question.question_text}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {question.answers?.map((answer) => (
                          <div key={answer.id} className="flex items-center gap-2">
                            <span className="text-sm flex-1">{answer.answer_text}</span>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20"
                              value={ruleWeights[answer.id] || 0}
                              onChange={(e) => setRuleWeights({
                                ...ruleWeights,
                                [answer.id]: parseInt(e.target.value) || 0,
                              })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>ביטול</Button>
            <Button onClick={handleSaveRule} disabled={saving || !selectedProduct}>
              {saving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-left-5 ${
              t.variant === 'destructive'
                ? 'bg-red-500 text-white'
                : 'bg-green-600 text-white'
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.description && (
              <div className="text-sm opacity-90">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
