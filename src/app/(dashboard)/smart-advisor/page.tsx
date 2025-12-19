'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  ChevronRight,
  HelpCircle,
  Zap,
  Brain,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { AdvisorQuiz } from '@/types/advisor';

export default function SmartAdvisorPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  
  const [quizzes, setQuizzes] = useState<AdvisorQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<AdvisorQuiz | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuizzes();
    fetchStoreSlug();
  }, []);

  const fetchStoreSlug = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.store?.slug) {
        setStoreSlug(data.store.slug);
      }
    } catch (error) {
      console.error('Error fetching store slug:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/advisor/quizzes');
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'שגיאה', description: 'נא להזין שם ליועץ', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/advisor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'הצלחה', description: 'היועץ נוצר בהצלחה' });
        setShowCreateDialog(false);
        setFormData({ title: '', description: '', is_active: false });
        router.push(`/smart-advisor/${data.quiz.id}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message || 'שגיאה ביצירת היועץ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!selectedQuiz) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/advisor/quizzes/${selectedQuiz.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ title: 'הצלחה', description: 'היועץ נמחק בהצלחה' });
        setShowDeleteDialog(false);
        setSelectedQuiz(null);
        fetchQuizzes();
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message || 'שגיאה במחיקת היועץ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (quiz: AdvisorQuiz) => {
    try {
      const res = await fetch(`/api/advisor/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !quiz.is_active }),
      });

      if (res.ok) {
        toast({ 
          title: 'הצלחה', 
          description: quiz.is_active ? 'היועץ הושבת' : 'היועץ הופעל' 
        });
        fetchQuizzes();
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'שגיאה בעדכון הסטטוס', variant: 'destructive' });
    }
  };

  const handleDuplicate = async (quiz: AdvisorQuiz) => {
    try {
      const res = await fetch(`/api/advisor/quizzes/${quiz.id}/duplicate`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'הצלחה', description: 'היועץ שוכפל בהצלחה' });
        fetchQuizzes();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message || 'שגיאה בשכפול', variant: 'destructive' });
    }
  };

  const copyEmbedCode = (quiz: AdvisorQuiz) => {
    const code = `<iframe src="${window.location.origin}/shops/${storeSlug}/advisor/${quiz.slug}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    toast({ title: 'הועתק!', description: 'קוד ההטמעה הועתק ללוח' });
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">יועץ חכם</h1>
            <p className="text-sm text-gray-500">צור שאלונים שממליצים על מוצרים ללקוחות</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          יועץ חדש
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">סה"כ יועצים</p>
                <p className="text-2xl font-bold">{quizzes.length}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">פעילים</p>
                <p className="text-2xl font-bold">{quizzes.filter(q => q.is_active).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">סה"כ השלמות</p>
                <p className="text-2xl font-bold">
                  {quizzes.reduce((acc, q) => acc + (q.total_completions || 0), 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">יחס המרה</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="חפש יועץ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-48">
                <div className="bg-gray-200 h-full rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'לא נמצאו יועצים' : 'עדיין אין יועצים'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'נסה לחפש עם מילות מפתח אחרות'
                : 'צור יועץ חכם ראשון שיעזור ללקוחות למצוא מוצרים'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 ml-2" />
                צור יועץ ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map(quiz => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{quiz.title}</h3>
                      {quiz.is_active ? (
                        <Badge className="bg-green-100 text-green-700">פעיל</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">טיוטה</Badge>
                      )}
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{quiz.description}</p>
                    )}
                  </div>
                  <DropdownMenu
                    trigger={
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="h-5 w-5 text-gray-400" />
                      </button>
                    }
                    items={[
                      { label: 'עריכה', icon: <Edit className="h-4 w-4" />, onClick: () => router.push(`/smart-advisor/${quiz.id}`) },
                      { label: 'צפייה', icon: <Eye className="h-4 w-4" />, onClick: () => window.open(`/shops/${storeSlug}/advisor/${quiz.slug}`, '_blank') },
                      { label: 'שכפול', icon: <Copy className="h-4 w-4" />, onClick: () => handleDuplicate(quiz) },
                      { label: 'קוד הטמעה', icon: <ExternalLink className="h-4 w-4" />, onClick: () => copyEmbedCode(quiz) },
                      { label: quiz.is_active ? 'השבת' : 'הפעל', icon: quiz.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />, onClick: () => handleToggleActive(quiz) },
                      { label: 'מחק', icon: <Trash2 className="h-4 w-4" />, onClick: () => { setSelectedQuiz(quiz); setShowDeleteDialog(true); }, variant: 'destructive' as const },
                    ]}
                  />
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    {(quiz as any).questions_count || 0} שאלות
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    {quiz.total_completions || 0} השלמות
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/smart-advisor/${quiz.id}`)}
                  >
                    <Edit className="h-4 w-4 ml-1" />
                    עריכה
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`/shops/${storeSlug}/advisor/${quiz.slug}`, '_blank')}
                    disabled={!quiz.is_active}
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    צפייה
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>יצירת יועץ חדש</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <Label>שם היועץ *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="למשל: מצא את השמפו המושלם עבורך"
                />
              </div>
              <div>
                <Label>תיאור</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="תיאור קצר של היועץ"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>פרסם מיד</Label>
                  <p className="text-sm text-gray-500">היועץ יהיה זמין ללקוחות מיד</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateQuiz} disabled={saving}>
              {saving ? 'יוצר...' : 'צור יועץ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת יועץ</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p>
              האם אתה בטוח שברצונך למחוק את "{selectedQuiz?.title}"?
              פעולה זו לא ניתנת לביטול.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuiz} disabled={saving}>
              {saving ? 'מוחק...' : 'מחק'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
