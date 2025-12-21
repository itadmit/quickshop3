"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreId } from "@/hooks/useStoreId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Facebook,
  Tag,
  BarChart3,
  Music,
  Save,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Code,
  Rss,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface TrackingPixel {
  id: number;
  store_id: number;
  name: string;
  pixel_type: string;
  pixel_id: string | null;
  pixel_code: string | null;
  access_token: string | null;
  placement: string;
  is_active: boolean;
  events: string[];
  created_at: string;
}

interface TrackingCode {
  id: number;
  store_id: number;
  name: string;
  code_type: string | null;
  code_content: string;
  placement: string;
}

const PLATFORMS = [
  { value: "facebook", label: "פייסבוק פיקסל", icon: Facebook },
  { value: "google_tag_manager", label: "גוגל טאג מנג'ר", icon: Tag },
  { value: "google_analytics", label: "גוגל אנליטיקס 4", icon: BarChart3 },
  { value: "tiktok", label: "טיקטוק פיקסל", icon: Music },
  { value: "custom", label: "קוד מותאם אישית", icon: Code },
];

const PLACEMENTS = [
  { value: "head", label: "Head (מומלץ)" },
  { value: "body", label: "Body" },
  { value: "footer", label: "Footer" },
];

// כל האירועים האפשריים
const ALL_EVENTS = [
  // אירועי דף
  { name: "PageView", label: "צפייה בדף", category: "דף" },
  { name: "ViewCategory", label: "צפייה בקטגוריה", category: "דף" },
  
  // אירועי מוצר
  { name: "ViewContent", label: "צפייה במוצר", category: "מוצר" },
  { name: "SelectVariant", label: "בחירת וריאנט", category: "מוצר" },
  { name: "ViewProductGallery", label: "צפייה בגלריית מוצר", category: "מוצר" },
  
  // אירועי עגלה
  { name: "AddToCart", label: "הוספה לעגלה", category: "עגלה" },
  { name: "RemoveFromCart", label: "הסרה מעגלה", category: "עגלה" },
  { name: "UpdateCart", label: "עדכון עגלה", category: "עגלה" },
  { name: "ViewCart", label: "צפייה בעגלה", category: "עגלה" },
  
  // אירועי רכישה
  { name: "InitiateCheckout", label: "התחלת צ'קאאוט", category: "רכישה" },
  { name: "AddPaymentInfo", label: "הוספת פרטי תשלום", category: "רכישה" },
  { name: "AddShippingInfo", label: "הוספת פרטי משלוח", category: "רכישה" },
  { name: "Purchase", label: "רכישה הושלמה", category: "רכישה" },
  
  // אירועי משתמש
  { name: "SignUp", label: "הרשמה", category: "משתמש" },
  { name: "Login", label: "התחברות", category: "משתמש" },
  { name: "Logout", label: "התנתקות", category: "משתמש" },
  { name: "Subscribe", label: "הרשמה לניוזלטר", category: "משתמש" },
  
  // אירועי Wishlist
  { name: "AddToWishlist", label: "הוספה לרשימת משאלות", category: "Wishlist" },
  { name: "RemoveFromWishlist", label: "הסרה מרשימת משאלות", category: "Wishlist" },
  
  // אירועי חיפוש
  { name: "Search", label: "חיפוש", category: "חיפוש" },
  { name: "SearchResults", label: "תוצאות חיפוש", category: "חיפוש" },
  
  // אירועים נוספים
  { name: "Contact", label: "יצירת קשר", category: "אחר" },
  { name: "Lead", label: "ליד", category: "אחר" },
  { name: "CompleteRegistration", label: "השלמת הרשמה", category: "אחר" },
  { name: "StartTrial", label: "התחלת ניסיון", category: "אחר" },
  { name: "SubmitApplication", label: "שליחת בקשה", category: "אחר" },
  { name: "Schedule", label: "קביעת פגישה", category: "אחר" },
  { name: "FindLocation", label: "מציאת מיקום", category: "אחר" },
  { name: "CustomizeProduct", label: "התאמת מוצר", category: "אחר" },
  { name: "Donate", label: "תרומה", category: "אחר" },
];

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  google_tag_manager: Tag,
  google_analytics: BarChart3,
  tiktok: Music,
  custom: Code,
};

const platformNames: Record<string, string> = {
  facebook: "פייסבוק פיקסל",
  google_tag_manager: "גוגל טאג מנג'ר",
  google_analytics: "גוגל אנליטיקס 4",
  tiktok: "טיקטוק פיקסל",
  custom: "קוד מותאם אישית",
};

export default function TrackingPixelsPage() {
  const router = useRouter();
  const storeId = useStoreId();
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [codes, setCodes] = useState<TrackingCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<TrackingPixel | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pixels");
  
  const [formData, setFormData] = useState({
    name: "",
    pixel_type: "",
    pixel_id: "",
    pixel_code: "",
    access_token: "",
    placement: "head",
    is_active: true,
    events: ALL_EVENTS.map(e => e.name),
  });

  useEffect(() => {
    if (storeId) {
      fetchPixels();
      fetchStoreSlug();
    }
  }, [storeId]);

  const fetchStoreSlug = async () => {
    if (!storeId) return;
    try {
      const response = await fetch(`/api/stores/${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setStoreSlug(data.store?.slug || data.slug || "");
      }
    } catch (error) {
      console.error("Error fetching store slug:", error);
    }
  };

  const fetchPixels = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tracking-pixels?storeId=${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setPixels(data.pixels || []);
        setCodes(data.codes || []);
      }
    } catch (error) {
      console.error("Error fetching pixels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    setSaving(true);
    try {
      const url = editingPixel 
        ? `/api/tracking-pixels/${editingPixel.id}` 
        : "/api/tracking-pixels";
      
      const response = await fetch(url, {
        method: editingPixel ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: storeId,
          ...formData,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        resetForm();
        fetchPixels();
      } else {
        const error = await response.json();
        alert(error.error || "שגיאה בשמירה");
      }
    } catch (error) {
      console.error("Error saving pixel:", error);
      alert("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pixel: TrackingPixel) => {
    try {
      const response = await fetch(`/api/tracking-pixels/${pixel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !pixel.is_active }),
      });

      if (response.ok) {
        fetchPixels();
      }
    } catch (error) {
      console.error("Error toggling pixel:", error);
    }
  };

  const handleDelete = async (pixelId: number) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הפיקסל?")) return;

    try {
      const response = await fetch(`/api/tracking-pixels/${pixelId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPixels();
      }
    } catch (error) {
      console.error("Error deleting pixel:", error);
    }
  };

  const handleEdit = (pixel: TrackingPixel) => {
    setEditingPixel(pixel);
    setFormData({
      name: pixel.name,
      pixel_type: pixel.pixel_type,
      pixel_id: pixel.pixel_id || "",
      pixel_code: pixel.pixel_code || "",
      access_token: pixel.access_token || "",
      placement: pixel.placement,
      is_active: pixel.is_active,
      events: pixel.events || ALL_EVENTS.map(e => e.name),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPixel(null);
    setFormData({
      name: "",
      pixel_type: "",
      pixel_id: "",
      pixel_code: "",
      access_token: "",
      placement: "head",
      is_active: true,
      events: ALL_EVENTS.map(e => e.name),
    });
  };

  const toggleEvent = (eventName: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventName)
        ? prev.events.filter(e => e !== eventName)
        : [...prev.events, eventName],
    }));
  };

  const selectAllEvents = () => {
    setFormData(prev => ({
      ...prev,
      events: ALL_EVENTS.map(e => e.name),
    }));
  };

  const deselectAllEvents = () => {
    setFormData(prev => ({
      ...prev,
      events: [],
    }));
  };

  const copyFeedUrl = (type: string) => {
    if (!storeSlug) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const feedUrl = `${baseUrl}/api/feeds/${storeSlug}/${type}`;
    navigator.clipboard.writeText(feedUrl);
    setCopiedFeed(type);
    setTimeout(() => setCopiedFeed(null), 2000);
  };

  // Group events by category
  const eventsByCategory = ALL_EVENTS.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof ALL_EVENTS>);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">פיקסלים וקודי מעקב</h1>
          <p className="text-gray-600 mt-2">
            ניהול פיקסלים, קודי מעקב ופידים למוצרים
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          פיקסל חדש
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pixels">פיקסלים ({pixels.length})</TabsTrigger>
          <TabsTrigger value="feeds">פידים למוצרים</TabsTrigger>
        </TabsList>

        <TabsContent value="pixels" className="space-y-4">
          {pixels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Tag className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    אין פיקסלים עדיין
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    התחל בהוספת פיקסל חדש למעקב אחר האירועים בחנות שלך. 
                    תומך בפייסבוק, גוגל אנליטיקס, טיקטוק ועוד.
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setDialogOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף פיקסל ראשון
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pixels.map((pixel) => {
                const Icon = platformIcons[pixel.pixel_type] || Tag;
                return (
                  <Card key={pixel.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {pixel.name || platformNames[pixel.pixel_type] || pixel.pixel_type}
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {pixel.pixel_id ? `ID: ${pixel.pixel_id}` : "קוד מותאם אישית"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={pixel.is_active ? "default" : "secondary"}
                          className={
                            pixel.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {pixel.is_active ? "פעיל" : "לא פעיל"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <span className="text-gray-600">אירועים:</span>{" "}
                          <span className="font-medium">
                            {!pixel.events || pixel.events.length === ALL_EVENTS.length
                              ? "כל האירועים"
                              : `${pixel.events.length} אירועים`}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">מיקום:</span>{" "}
                          <span className="font-medium">
                            {pixel.placement === 'head' ? 'Head' : pixel.placement === 'body' ? 'Body' : 'Footer'}
                          </span>
                        </div>
                        {pixel.access_token && (
                          <div className="text-sm text-green-600">
                            ✓ Server-side tracking פעיל
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pixel)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            ערוך
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(pixel)}
                            className="flex-1"
                          >
                            {pixel.is_active ? (
                              <>
                                <PowerOff className="w-4 h-4 ml-2" />
                                כבה
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 ml-2" />
                                הפעל
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(pixel.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="feeds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rss className="w-5 h-5" />
                פידים למוצרים (Product Feeds)
              </CardTitle>
              <p className="text-sm text-gray-600">
                העתק את כתובות הפידים והזן אותן בפלטפורמות הפרסום שלך
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facebook Catalog */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Facebook / Meta Catalog</h4>
                    <p className="text-sm text-gray-500">פיד מוצרים לפייסבוק ואינסטגרם שופינג</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={storeSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/feeds/${storeSlug}/facebook` : ''}
                    readOnly
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyFeedUrl('facebook')}
                  >
                    {copiedFeed === 'facebook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/feeds/${storeSlug}/facebook`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Google Shopping */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Google Merchant Center</h4>
                    <p className="text-sm text-gray-500">פיד מוצרים לגוגל שופינג</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={storeSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/feeds/${storeSlug}/google` : ''}
                    readOnly
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyFeedUrl('google')}
                  >
                    {copiedFeed === 'google' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/feeds/${storeSlug}/google`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* TikTok Catalog */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black rounded-lg">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium">TikTok Shop Catalog</h4>
                    <p className="text-sm text-gray-500">פיד מוצרים לטיקטוק</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={storeSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/feeds/${storeSlug}/tiktok` : ''}
                    readOnly
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyFeedUrl('tiktok')}
                  >
                    {copiedFeed === 'tiktok' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/feeds/${storeSlug}/tiktok`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Generic XML */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Code className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">XML כללי</h4>
                    <p className="text-sm text-gray-500">פיד XML סטנדרטי לכל פלטפורמה</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={storeSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/feeds/${storeSlug}/xml` : ''}
                    readOnly
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyFeedUrl('xml')}
                  >
                    {copiedFeed === 'xml' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/feeds/${storeSlug}/xml`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Add/Edit Pixel */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>
              {editingPixel ? "עריכת פיקסל" : "פיקסל חדש"}
            </DialogTitle>
            <DialogDescription>
              הוסף פיקסל חדש למעקב אחר האירועים בחנות שלך
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">שם הפיקסל</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="לדוגמה: Facebook - Main"
                />
              </div>

              <div>
                <Label htmlFor="pixel_type">פלטפורמה *</Label>
                <Select
                  value={formData.pixel_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, pixel_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר פלטפורמה" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center gap-2">
                          <platform.icon className="w-4 h-4" />
                          {platform.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.pixel_type !== 'custom' && (
              <div>
                <Label htmlFor="pixel_id">
                  {formData.pixel_type === "google_tag_manager"
                    ? "Container ID *"
                    : formData.pixel_type === "google_analytics"
                    ? "Measurement ID (GA4) *"
                    : "Pixel ID *"}
                </Label>
                <Input
                  id="pixel_id"
                  value={formData.pixel_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, pixel_id: e.target.value }))}
                  placeholder={
                    formData.pixel_type === "google_tag_manager"
                      ? "GTM-XXXXXXX"
                      : formData.pixel_type === "google_analytics"
                      ? "G-XXXXXXXXXX"
                      : formData.pixel_type === "facebook"
                      ? "1234567890123456"
                      : "הזן Pixel ID"
                  }
                  required={formData.pixel_type !== 'custom'}
                />
              </div>
            )}

            {formData.pixel_type === 'custom' && (
              <div>
                <Label htmlFor="pixel_code">קוד מותאם אישית *</Label>
                <Textarea
                  id="pixel_code"
                  value={formData.pixel_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, pixel_code: e.target.value }))}
                  placeholder="<script>...</script>"
                  rows={6}
                  className="font-mono text-sm"
                  dir="ltr"
                  required={formData.pixel_type === 'custom'}
                />
              </div>
            )}

            {formData.pixel_type && formData.pixel_type !== 'custom' && formData.pixel_type !== 'google_tag_manager' && (
              <div>
                <Label htmlFor="access_token">Access Token (אופציונלי - ל-Server-Side Tracking)</Label>
                <Input
                  id="access_token"
                  type="password"
                  value={formData.access_token}
                  onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                  placeholder="הזן Access Token"
                />
                <p className="text-xs text-gray-500 mt-1">
                  הוספת Access Token מאפשרת שליחת אירועים גם מהשרת, מה שמשפר את הדיוק ועוקף ad blockers
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="placement">מיקום בדף</Label>
                <Select
                  value={formData.placement}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, placement: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((placement) => (
                      <SelectItem key={placement.value} value={placement.value}>
                        {placement.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Label htmlFor="is_active">פעיל</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>אירועים למעקב</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllEvents}>
                    בחר הכל
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={deselectAllEvents}>
                    נקה הכל
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                {Object.entries(eventsByCategory).map(([category, events]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {events.map((event) => (
                        <label
                          key={event.name}
                          className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={formData.events.includes(event.name)}
                            onChange={() => toggleEvent(event.name)}
                            className="rounded"
                          />
                          <span>{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 ml-2" />
                {saving ? "שומר..." : "שמור"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

