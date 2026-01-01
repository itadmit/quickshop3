'use client';

import { useState, useEffect } from 'react';
import { HiTrash, HiPlus, HiSearch, HiRefresh, HiChat, HiCheck, HiX, HiArrowUp, HiArrowDown, HiEye, HiHeart, HiPhotograph } from 'react-icons/hi';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Story {
  id: number;
  product_id: number;
  position: number;
  is_active: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  product_title: string;
  product_handle: string;
  product_price: number;
  product_compare_at_price: number | null;
  product_image: string | null;
}

interface Settings {
  is_enabled: boolean;
  display_mode: 'home_only' | 'category' | 'everywhere';
  auto_advance_seconds: number;
  show_product_info: boolean;
  allow_likes: boolean;
  allow_comments: boolean;
  allow_quick_add: boolean;
  circle_border_color: string;
  viewed_border_color: string;
}

interface Product {
  id: number;
  title: string;
  handle: string;
  images?: { src: string }[];
  variants?: { price: number }[];
}

interface Comment {
  id: number;
  story_id: number;
  author_name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  product_title: string;
}

// Sortable Story Item Component
function SortableStoryItem({ story, onRemove }: { story: Story; onRemove: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm"
    >
      <button {...attributes} {...listeners} className="cursor-grab p-2 hover:bg-gray-100 rounded">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-pink-500">
        {story.product_image ? (
          <img src={story.product_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
            <HiPhotograph className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{story.product_title}</h4>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <HiEye className="w-4 h-4" />
            {story.views_count}
          </span>
          <span className="flex items-center gap-1">
            <HiHeart className="w-4 h-4" />
            {story.likes_count}
          </span>
          <span className="flex items-center gap-1">
            <HiChat className="w-4 h-4" />
            {story.comments_count}
          </span>
        </div>
      </div>

      <span className="text-sm font-medium text-gray-900">₪{story.product_price?.toFixed(2)}</span>

      <button
        onClick={() => onRemove(story.id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <HiTrash className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function StoriesSettingsPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [settings, setSettings] = useState<Settings>({
    is_enabled: false,
    display_mode: 'home_only',
    auto_advance_seconds: 5,
    show_product_info: true,
    allow_likes: true,
    allow_comments: true,
    allow_quick_add: true,
    circle_border_color: '#e91e63',
    viewed_border_color: '#9e9e9e',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'stories' | 'comments'>('settings');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentFilter, setCommentFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch stories and settings
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/stories');
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories || []);
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch comments
  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab, commentFilter]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/stories/comments?status=${commentFilter}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        // Show success toast
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Search products
  const searchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        // Filter out products already in stories
        const storyProductIds = new Set(stories.map((s) => s.product_id));
        setProducts(data.products?.filter((p: Product) => !storyProductIds.has(p.id)) || []);
      }
    } catch (error) {
      console.error('Failed to search products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (showProductPicker) {
      searchProducts();
    }
  }, [showProductPicker, searchQuery]);

  // Add product to stories
  const addProductToStories = async (productId: number) => {
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        // Refresh stories
        const storiesRes = await fetch('/api/stories');
        if (storiesRes.ok) {
          const data = await storiesRes.json();
          setStories(data.stories || []);
        }
        setShowProductPicker(false);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  // Remove story
  const removeStory = async (storyId: number) => {
    try {
      const res = await fetch(`/api/stories?id=${storyId}`, { method: 'DELETE' });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      }
    } catch (error) {
      console.error('Failed to remove story:', error);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stories.findIndex((s) => s.id === active.id);
      const newIndex = stories.findIndex((s) => s.id === over.id);
      const newStories = arrayMove(stories, oldIndex, newIndex);
      setStories(newStories);

      // Save new order
      await fetch('/api/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newStories.map((s) => s.id) }),
      });
    }
  };

  // Approve/reject comment
  const updateComment = async (commentId: number, isApproved: boolean) => {
    try {
      await fetch('/api/stories/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, isApproved }),
      });
      fetchComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  // Delete comment
  const deleteComment = async (commentId: number) => {
    try {
      await fetch(`/api/stories/comments?id=${commentId}`, { method: 'DELETE' });
      fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">סטוריז מוצרים</h1>
          <p className="text-gray-500 mt-1">הצג מוצרים בפורמט סטוריז אינטראקטיבי</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'settings'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          הגדרות
        </button>
        <button
          onClick={() => setActiveTab('stories')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'stories'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          מוצרים ({stories.length})
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'comments'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          תגובות
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">הפעל סטוריז</h3>
                <p className="text-sm text-gray-500">הצג סטוריז בחנות</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.is_enabled}
                  onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
          </div>

          {/* Display Mode */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium text-gray-900 mb-4">מיקום תצוגה</h3>
            <div className="space-y-3">
              {[
                { value: 'home_only', label: 'דף בית בלבד', desc: 'הצג רק בדף הבית' },
                { value: 'category', label: 'דף בית + קטגוריות', desc: 'הצג בדף הבית ובעמודי קטגוריה' },
                { value: 'everywhere', label: 'כל האתר', desc: 'הצג בכל עמוד באתר' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    settings.display_mode === option.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="display_mode"
                    value={option.value}
                    checked={settings.display_mode === option.value}
                    onChange={(e) =>
                      setSettings({ ...settings, display_mode: e.target.value as any })
                    }
                    className="hidden"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                  {settings.display_mode === option.value && (
                    <HiCheck className="w-5 h-5 text-pink-500" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Auto Advance */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium text-gray-900 mb-4">זמן מעבר אוטומטי</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="3"
                max="15"
                value={settings.auto_advance_seconds}
                onChange={(e) =>
                  setSettings({ ...settings, auto_advance_seconds: parseInt(e.target.value) })
                }
                className="flex-1"
              />
              <span className="text-gray-700 font-medium w-16">
                {settings.auto_advance_seconds} שניות
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium text-gray-900 mb-4">תכונות</h3>
            <div className="space-y-4">
              {[
                { key: 'show_product_info', label: 'הצג מידע על המוצר', desc: 'שם, מחיר ותיאור' },
                { key: 'allow_likes', label: 'אפשר לייקים', desc: 'משתמשים יכולים לעשות לייק' },
                { key: 'allow_comments', label: 'אפשר תגובות', desc: 'משתמשים יכולים להגיב' },
                { key: 'allow_quick_add', label: 'הוספה מהירה לעגלה', desc: 'כפתור הוסף לעגלה מהסטורי' },
              ].map((feature) => (
                <label key={feature.key} className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-700">{feature.label}</span>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(settings as any)[feature.key]}
                    onChange={(e) =>
                      setSettings({ ...settings, [feature.key]: e.target.checked })
                    }
                    className="w-5 h-5 text-pink-500 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-medium text-gray-900 mb-4">צבעים</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">צבע מסגרת (לא נצפה)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.circle_border_color}
                    onChange={(e) =>
                      setSettings({ ...settings, circle_border_color: e.target.value })
                    }
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.circle_border_color}
                    onChange={(e) =>
                      setSettings({ ...settings, circle_border_color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">צבע מסגרת (נצפה)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.viewed_border_color}
                    onChange={(e) =>
                      setSettings({ ...settings, viewed_border_color: e.target.value })
                    }
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.viewed_border_color}
                    onChange={(e) =>
                      setSettings({ ...settings, viewed_border_color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'שמור הגדרות'}
          </button>
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowProductPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <HiPlus className="w-5 h-5" />
            הוסף מוצר לסטוריז
          </button>

          {stories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <HiPhotograph className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין מוצרים בסטוריז</h3>
              <p className="text-gray-500">הוסף מוצרים כדי להציג אותם בפורמט סטוריז</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {stories.map((story) => (
                    <SortableStoryItem key={story.id} story={story} onRemove={removeStory} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {[
              { value: 'pending', label: 'ממתין לאישור' },
              { value: 'approved', label: 'מאושר' },
              { value: 'all', label: 'הכל' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCommentFilter(filter.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  commentFilter === filter.value
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <HiChat className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין תגובות</h3>
              <p className="text-gray-500">תגובות חדשות יופיעו כאן</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{comment.author_name}</span>
                        <span className="text-sm text-gray-500">על</span>
                        <span className="text-sm text-pink-600">{comment.product_title}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(comment.created_at).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!comment.is_approved && (
                        <button
                          onClick={() => updateComment(comment.id, true)}
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                          title="אשר"
                        >
                          <HiCheck className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="מחק"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">בחר מוצר</h3>
              <button onClick={() => setShowProductPicker(false)}>
                <HiX className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש מוצר..."
                  className="w-full pr-10 pl-4 py-2 border rounded-lg"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingProducts ? (
                <div className="text-center py-8 text-gray-500">טוען...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">לא נמצאו מוצרים</div>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => {
                    const productImage = product.images?.[0]?.src;
                    const productPrice = product.variants?.[0]?.price;
                    return (
                      <button
                        key={product.id}
                        onClick={() => addProductToStories(product.id)}
                        className="w-full flex items-center gap-4 p-3 border rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-right"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {productImage ? (
                            <img src={productImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <HiPhotograph className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{product.title}</h4>
                          {productPrice && (
                            <span className="text-sm text-gray-500">₪{Number(productPrice).toFixed(2)}</span>
                          )}
                        </div>
                        <HiPlus className="w-5 h-5 text-pink-500" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

