'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiPlus, HiPhotograph, HiUpload, HiSearch, HiTrash, HiCheck } from 'react-icons/hi';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: number;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function MediaPage() {
  const { toast } = useOptimisticToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchShopId = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.store?.id) {
            setShopId(String(data.store.id));
          }
        }
      } catch (error) {
        console.error('Error fetching shop ID:', error);
      } finally {
        setInitializing(false);
      }
    };
    fetchShopId();
  }, []);

  useEffect(() => {
    if (shopId) {
      loadFiles();
    }
  }, [shopId]);

  const loadFiles = async () => {
    if (!shopId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        shopId,
        limit: '100',
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await fetch(`/api/files?${params}`, {
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

  // Debounced search
  useEffect(() => {
    if (shopId) {
      const timeoutId = setTimeout(() => {
        loadFiles();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, shopId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;

    if (!shopId) {
      toast({
        title: 'שגיאה',
        description: 'לא נמצא חנות',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const uploadedFiles: string[] = [];
    const errors: string[] = [];
    const fileArray = Array.from(inputFiles);
    const tempFileIds = fileArray.map((_, idx) => `temp-${Date.now()}-${idx}`);
    setUploadingFiles(tempFileIds);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const tempId = tempFileIds[i];

        const isVideo = file.type.startsWith('video/');
        const maxVideoSize = 20 * 1024 * 1024;
        
        if (isVideo && file.size > maxVideoSize) {
          errors.push(`${file.name}: גודל הקובץ גדול מדי. מקסימום 20 מגה`);
          continue;
        }

        setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', 'media');
        formData.append('entityId', 'library');
        formData.append('shopId', shopId);

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[tempId] || 0;
            if (current < 90) {
              return { ...prev, [tempId]: current + 10 };
            }
            return prev;
          });
        }, 100);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }));

        if (response.ok) {
          const data = await response.json();
          uploadedFiles.push(data.file.path);
        } else {
          const errorData = await response.json();
          errors.push(`${file.name}: ${errorData.error || 'שגיאה לא ידועה'}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (uploadedFiles.length > 0) {
        toast({
          title: 'הצלחה',
          description: `${uploadedFiles.length} קבצים הועלו בהצלחה`,
        });
        loadFiles();
      }

      if (errors.length > 0 && uploadedFiles.length === 0) {
        toast({
          title: 'שגיאה',
          description: errors[0],
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהעלאת הקבצים',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadingFiles([]);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const fakeEvent = {
        target: { files: droppedFiles },
      } as React.ChangeEvent<HTMLInputElement>;
      await handleFileUpload(fakeEvent);
    }
  };

  const toggleFileSelection = (path: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedFiles.size} קבצים?`)) return;

    setDeleting(true);
    let deleted = 0;
    
    for (const filePath of selectedFiles) {
      try {
        const response = await fetch(`/api/files/delete?path=${encodeURIComponent(filePath)}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          deleted++;
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    if (deleted > 0) {
      toast({
        title: 'הצלחה',
        description: `${deleted} קבצים נמחקו בהצלחה`,
      });
      setSelectedFiles(new Set());
      loadFiles();
    }
    setDeleting(false);
  };

  const isVideo = (file: MediaFile) => {
    return file.mimeType?.startsWith('video/') || 
           file.path.match(/\.(mp4|webm|ogg|mov|avi)$/i);
  };

  const isLoading = initializing || loading;

  return (
    <div 
      className="p-6 space-y-6 min-h-screen" 
      dir="rtl"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-50/90 border-4 border-dashed border-blue-400 z-50 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm">
          <HiUpload className="w-20 h-20 text-blue-500 mb-4 animate-bounce" />
          <p className="text-xl font-semibold text-blue-700">שחרר קבצים להעלאה</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">מדיה</h1>
        <div className="flex items-center gap-3">
          {selectedFiles.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <HiTrash className="w-4 h-4" />
              מחק {selectedFiles.size} נבחרים
            </Button>
          )}
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={!shopId || uploading} 
            className="flex items-center gap-2"
          >
            <HiPlus className="w-4 h-4" />
            העלה קבצים
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Search Bar Card */}
      <Card>
        <div className="px-4 md:px-6 py-4">
          <div className="relative max-w-md">
            <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="חפש קבצים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </Card>

      {/* Main Content Card */}
      <Card>
        <div className="p-4 md:p-6">
          {/* Upload Area */}
          {!isLoading && (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50/50 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-center mb-6"
              onClick={() => fileInputRef.current?.click()}
            >
              <HiUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">העלה קבצים מהמחשב שלך או גרור אותם לכאן</p>
              <p className="text-sm text-gray-400">תמונות ווידאו (מקסימום 20MB לוידאו)</p>
            </div>
          )}

          {/* Uploading Progress */}
          {uploading && uploadingFiles.length > 0 && (
            <div className="p-4 border border-blue-200 bg-blue-50/30 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-blue-900">מעלה {uploadingFiles.length} קבצים...</p>
                <div className="text-xs text-blue-700 font-medium">
                  {Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / uploadingFiles.length)}%
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${uploadingFiles.length > 0 
                      ? Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / uploadingFiles.length) 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Files Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="py-8 text-center">
              <HiPhotograph className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">אין קבצי מדיה</p>
              <p className="text-sm text-gray-400">העלה קבצים כדי להתחיל</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {files.map((file) => {
                const isSelected = selectedFiles.has(file.path);
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleFileSelection(file.path)}
                    className={cn(
                      "group relative aspect-square rounded-lg border-2 bg-white cursor-pointer transition-all overflow-hidden shadow-sm hover:shadow-md",
                      isSelected 
                        ? "border-emerald-500 ring-2 ring-emerald-200 shadow-md" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-md border-2 bg-white flex items-center justify-center transition-all shadow-sm",
                        isSelected 
                          ? "bg-emerald-500 border-emerald-500" 
                          : "border-gray-300 group-hover:border-gray-400"
                      )}>
                        {isSelected && <HiCheck className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    
                    {/* Image/Video */}
                    <div className="w-full h-full bg-gray-100">
                      {isVideo(file) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={file.path}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <svg className="w-6 h-6 text-gray-700 mr-[-2px]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={file.path}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    {/* File name on hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate font-medium">{file.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
