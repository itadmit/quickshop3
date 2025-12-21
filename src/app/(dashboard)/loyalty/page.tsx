'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiUserGroup } from 'react-icons/hi';
import { CustomerLoyaltyTier, LoyaltyProgramRule } from '@/types/loyalty';

export default function LoyaltyPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<CustomerLoyaltyTier[]>([]);
  const [rules, setRules] = useState<LoyaltyProgramRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tiers' | 'rules'>('tiers');

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    loadData(signal);

    return () => {
      abortController.abort();
    };
  }, []);

  const loadData = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const [tiersRes, rulesRes] = await Promise.all([
        fetch('/api/loyalty/tiers', { credentials: 'include', signal }),
        fetch('/api/loyalty/rules', { credentials: 'include', signal }),
      ]);

      if (signal?.aborted) return;

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.tiers || []);
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading loyalty data:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">מועדון לקוחות</h1>
        <Button onClick={() => router.push(activeTab === 'tiers' ? '/loyalty/tiers/new' : '/loyalty/rules/new')} className="flex items-center gap-2">
          {activeTab === 'tiers' ? 'הוסף רמה' : 'הוסף חוק'}
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('tiers')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tiers'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            רמות נאמנות
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'rules'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            חוקי צבירת נקודות
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : activeTab === 'tiers' ? (
        <div className="space-y-4">
          {tiers.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <HiUserGroup className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">אין רמות נאמנות מוגדרות</p>
                <Button onClick={() => router.push('/loyalty/tiers/new')} className="flex items-center gap-2">
                  הוסף רמה ראשונה
                  <HiPlus className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ) : (
            tiers.map((tier) => (
              <Card key={tier.id}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        רמה {tier.tier_level} • מינימום {tier.min_points} נקודות
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        הנחה: {parseFloat(tier.discount_percentage)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/loyalty/tiers/${tier.id}`)}
                      >
                        <HiPencil className="w-4 h-4 ml-1" />
                        ערוך
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (confirm('האם אתה בטוח שברצונך למחוק את הרמה?')) {
                            try {
                              const response = await fetch(`/api/loyalty/tiers/${tier.id}`, {
                                method: 'DELETE',
                                credentials: 'include',
                              });
                              
                              const data = await response.json();
                              
                              if (response.ok) {
                                if (data.message) {
                                  alert(data.message);
                                }
                                loadData();
                              } else {
                                alert(data.error || 'שגיאה במחיקת הרמה');
                              }
                            } catch (error: any) {
                              console.error('Error deleting tier:', error);
                              alert(error.message || 'שגיאה במחיקת הרמה');
                            }
                          }
                        }}
                      >
                        <HiTrash className="w-4 h-4 ml-1" />
                        מחק
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <HiUserGroup className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">אין חוקי צבירת נקודות מוגדרים</p>
                <Button onClick={() => router.push('/loyalty/rules/new')} className="flex items-center gap-2">
                  הוסף חוק ראשון
                  <HiPlus className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                        {rule.is_active ? (
                          <HiCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <HiXCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        סוג: {rule.rule_type === 'purchase' ? 'רכישה' :
                              rule.rule_type === 'signup' ? 'הרשמה' :
                              rule.rule_type === 'review' ? 'ביקורת' :
                              rule.rule_type === 'referral' ? 'המלצה' :
                              rule.rule_type}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        נקודות: {rule.points_amount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/loyalty/rules/${rule.id}`)}
                      >
                        <HiPencil className="w-4 h-4 ml-1" />
                        ערוך
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (confirm('האם אתה בטוח שברצונך למחוק את החוק?')) {
                            try {
                              const response = await fetch(`/api/loyalty/rules/${rule.id}`, {
                                method: 'DELETE',
                                credentials: 'include',
                              });
                              if (response.ok) {
                                loadData();
                              }
                            } catch (error) {
                              console.error('Error deleting rule:', error);
                            }
                          }
                        }}
                      >
                        <HiTrash className="w-4 h-4 ml-1" />
                        מחק
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

