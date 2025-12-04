'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MediaPicker } from '@/components/MediaPicker';
import { HiPlus, HiPhotograph } from 'react-icons/hi';

interface MediaFile {
  id: number;
  filename: string;
  url: string;
  file_type: string;
  file_size: number;
  created_at: Date;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files?limit=100', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">מדיה</h1>
        <Button onClick={() => setShowMediaPicker(true)} className="flex items-center gap-2">
          העלה קבצים
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiPhotograph className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">אין קבצי מדיה</p>
            <Button onClick={() => setShowMediaPicker(true)} className="flex items-center gap-2">
              העלה קבצים ראשונים
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {file.file_type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <HiPhotograph className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate">{file.filename}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showMediaPicker && (
        <MediaPicker
          open={showMediaPicker}
          onOpenChange={setShowMediaPicker}
          onSelect={(files) => {
            console.log('Selected files:', files);
            loadFiles();
          }}
          multiple
        />
      )}
    </div>
  );
}

