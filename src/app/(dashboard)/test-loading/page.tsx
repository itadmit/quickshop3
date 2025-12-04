'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus } from 'react-icons/hi';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function TestLoadingPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Simulate loading for 2 seconds
    setTimeout(() => {
      setProducts([
        { id: 1, name: 'מוצר 1', price: 100 },
        { id: 2, name: 'מוצר 2', price: 200 },
      ]);
      setLoading(false);
    }, 2000);
  }, []);

  const columns: TableColumn<Product>[] = [
    { key: 'name', label: 'שם מוצר' },
    { key: 'price', label: 'מחיר', render: (p) => `₪${p.price}` },
  ];

  return (
    <DataTable
      title="בדיקת טעינה"
      description="תראה את אפקט הסקלטון למשך 2 שניות"
      
      primaryAction={{
        label: 'מוצר חדש',
        onClick: () => {},
        icon: <HiPlus className="w-4 h-4" />,
      }}
      
      searchPlaceholder="חיפוש..."
      onSearch={() => {}}
      
      columns={columns}
      data={products}
      keyExtractor={(p) => p.id}
      
      loading={loading}
    />
  );
}

