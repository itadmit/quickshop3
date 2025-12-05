'use client';

import { useState, useEffect } from 'react';
import { RealtimeMap } from '@/components/analytics/RealtimeMap';
import { HiUsers, HiShoppingCart, HiCurrencyDollar, HiGlobeAlt, HiTrendingUp } from 'react-icons/hi';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface Visitor {
  visitor_id: string;
  coordinates: { lat: number; lon: number } | null;
  city?: string; // עיר - לא תמיד זמינה
  country: string;
  country_code?: string;
  current_page: string;
}

interface BehaviorData {
  active_carts: number;
  checking_out: number;
  purchased: number;
}

interface DashboardData {
  visitors_count: number;
  active_carts: number;
  checking_out: number;
  purchased: number;
  revenue: number;
  orders_count: number;
  top_products: Array<{ title: string; revenue: number }>;
  locations: Array<{ name: string; count: number }>;
}

export default function RealtimeDashboard() {
  const [markers, setMarkers] = useState<Array<{ location: [number, number]; size: number }>>([]);
  const [data, setData] = useState<DashboardData>({
    visitors_count: 0,
    active_carts: 0,
    checking_out: 0,
    purchased: 0,
    revenue: 0,
    orders_count: 0,
    top_products: [],
    locations: [],
  });
  const [salesHistory, setSalesHistory] = useState<Array<{ value: number }>>(
    new Array(20).fill(0).map(() => ({ value: 0 }))
  );

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // עדכון כל 20 שניות
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [visitorsRes, salesRes, productsRes, geoRes, hourlySalesRes] = await Promise.all([
        fetch('/api/analytics/visitors'),
        fetch('/api/analytics/sales?period=today'),
        fetch('/api/analytics/top-products?limit=5'),
        fetch('/api/analytics/geography'),
        fetch('/api/analytics/sales-hourly'),
      ]);

      if (visitorsRes.ok) {
        const visitorsData = await visitorsRes.json();
        const visitors = visitorsData.visitors as Visitor[];
        const behavior = visitorsData.behavior as BehaviorData;

        // Update Markers - Group by city (אם יש) או country (אם אין עיר)
        const locationGroups: Record<string, { 
          coords: [number, number]; 
          count: number; 
          country: string;
          city?: string;
          label: string;
        }> = {};
        
        visitors.forEach((v) => {
          if (v.coordinates && v.country_code) {
            // אם יש עיר, נקבץ לפי עיר+מדינה, אחרת לפי מדינה בלבד
            const key = v.city && v.country_code 
              ? `${v.city}_${v.country_code}` // עיר+מדינה
              : v.country_code; // רק מדינה
            
            if (!locationGroups[key]) {
              locationGroups[key] = {
                coords: [v.coordinates.lat, v.coordinates.lon],
                count: 0,
                country: v.country || 'Unknown',
                city: v.city,
                label: v.city && v.country 
                  ? `${v.city}, ${v.country}` // עיר, מדינה
                  : v.country || 'Unknown', // רק מדינה
              };
            }
            locationGroups[key].count++;
          }
        });

        // Create markers - size based on visitor count per location
        const newMarkers = Object.values(locationGroups).map((group) => ({
          location: group.coords,
          size: Math.min(0.1 + (group.count * 0.02), 0.3), // גדול יותר כשיש יותר מבקרים
          country: group.country,
          city: group.city,
          label: group.label,
          count: group.count,
        }));
        
        console.log('[Dashboard] Setting markers:', newMarkers);
        setMarkers(newMarkers);

        setData((prev) => ({
          ...prev,
          visitors_count: visitorsData.total,
          active_carts: behavior?.active_carts || 0,
          checking_out: behavior?.checking_out || 0,
          purchased: behavior?.purchased || 0,
        }));
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        const currentRevenue = parseFloat(salesData.totals?.total_revenue || '0');
        
        setData((prev) => ({
          ...prev,
          revenue: currentRevenue,
          orders_count: salesData.totals?.total_orders || 0,
        }));
      }

      if (hourlySalesRes.ok) {
        const hourlyData = await hourlySalesRes.json();
        if (hourlyData.sales && hourlyData.sales.length > 0) {
            setSalesHistory(hourlyData.sales);
        } else {
            // Fallback: Empty chart if no sales
            setSalesHistory(new Array(10).fill({ value: 0 })); 
        }
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setData((prev) => ({
          ...prev,
          top_products: productsData.products.map((p: any) => ({
            title: p.product_title,
            revenue: parseFloat(p.total_revenue),
          })),
        }));
      }
      
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        setData(prev => ({
            ...prev,
            locations: geoData.cities.slice(0, 5)
        }))
      }

    } catch (error) {
      console.error('Failed to load realtime data', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row overflow-hidden font-sans" dir="rtl">
      
      {/* סרגל צדדי לנתונים (Dashboard Panel) */}
      <div className="w-full md:w-[400px] bg-white border-l border-gray-200 z-10 flex flex-col h-[calc(100vh-64px)] overflow-y-auto shadow-xl">
        
        {/* כותרת הפאנל */}
        <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-gray-900">פעילות חיה</h2>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            </div>
            <p className="text-sm text-gray-500">מתעדכן בזמן אמת</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
            
            {/* מטריקה ראשית: מבקרים */}
            <div className="text-center py-4 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100">
                <div className="text-sm text-indigo-600 font-medium mb-2 flex items-center justify-center gap-2">
                    <HiUsers className="w-5 h-5" />
                    מבקרים באתר כרגע
                </div>
                <div className="text-6xl font-extrabold text-indigo-900 tracking-tight">
                    {data.visitors_count}
                </div>
            </div>

            {/* משפך המרה (Funnel) */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">התנהגות גולשים</h3>
                <div className="space-y-3">
                    <div className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <HiShoppingCart className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">עגלות פעילות</span>
                        </div>
                        <span className="font-bold text-gray-900">{data.active_carts}</span>
                    </div>

                    <div className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                <HiTrendingUp className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">בתהליך תשלום</span>
                        </div>
                        <span className="font-bold text-gray-900">{data.checking_out}</span>
                    </div>

                    <div className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 transition-colors cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                <HiCurrencyDollar className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">רכישות שהושלמו</span>
                        </div>
                        <span className="font-bold text-gray-900">{data.purchased}</span>
                    </div>
                </div>
            </div>

            {/* מכירות והזמנות */}
            <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-gray-400 text-xs mb-1">סה"כ מכירות היום</p>
                        <h3 className="text-2xl font-bold">₪{data.revenue.toLocaleString()}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-xs mb-1">הזמנות</p>
                        <h3 className="text-xl font-bold">{data.orders_count}</h3>
                    </div>
                </div>
                <div className="h-16 w-full -mb-2 -ml-2" style={{ minHeight: 64 }}>
                    <ResponsiveContainer width="100%" height={64}>
                        <AreaChart data={salesHistory}>
                            <defs>
                                <linearGradient id="colorSalesDark" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#34d399" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorSalesDark)" 
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* מיקומים מובילים */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">מוקדי פעילות</h3>
                {data.locations.length > 0 ? (
                    <div className="space-y-3">
                        {data.locations.map((loc, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 text-xs font-bold text-gray-400">#{i + 1}</span>
                                    <span className="text-gray-700 truncate max-w-[150px]">{loc.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full" 
                                            style={{ width: `${Math.min((loc.count / Math.max(data.visitors_count, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="font-medium text-gray-900 w-4 text-left">{loc.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 text-center py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">אין נתוני מיקום זמינים</div>
                )}
            </div>

        </div>

        {/* קטע תחתון אפור */}
        <div className="mt-auto bg-gray-100 border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500 text-center">
                10 דקות אחרונות
            </p>
        </div>
      </div>

      {/* אזור הגלובוס (Main Area) */}
      <div className="flex-1 relative bg-gradient-to-l from-transparent to-slate-50 flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full p-4">
            {/* מפה אינטראקטיבית */}
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm shadow-inner">
                <RealtimeMap markers={markers} />
            </div>
        </div>

        {/* מוצרים מובילים (Floating Card) */}
        <div className="absolute bottom-8 left-8 right-8 md:right-auto md:w-80 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/50 z-10">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <HiTrendingUp className="text-green-500" />
                נמכר עכשיו
            </h3>
            {data.top_products.length > 0 ? (
                <div className="space-y-3">
                    {data.top_products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                            <span className="text-gray-600 truncate flex-1 ml-2">{p.title}</span>
                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">₪{p.revenue.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-xs text-gray-400 text-center">אין מכירות בדקות האחרונות</div>
            )}
        </div>
      </div>

    </div>
  );
}
