'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiSearch, HiUpload, HiCheck, HiTrash, HiPhotograph, HiFilter, HiVideoCamera } from 'react-icons/hi';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface MediaFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string | null;
  createdAt: string;
  entityType: string | null;
  entityId: string | null;
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: string[]) => void;
  selectedFiles?: string[];
  shopId?: string;
  entityType?: string;
  entityId?: string;
  multiple?: boolean;
  title?: string;
  accept?: 'image' | 'video' | 'file' | 'all';
}

// Constant empty array for default prop to avoid infinite loop in useEffect
const DEFAULT_SELECTED_FILES: string[] = [];

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  selectedFiles = DEFAULT_SELECTED_FILES,
  shopId,
  entityType,
  entityId,
  multiple = true,
  title = 'בחר תמונות',
  accept = 'all',
}: MediaPickerProps) {
  // Determine the accept attribute for the file input
  const getAcceptAttribute = () => {
    switch (accept) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'file':
        return '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
      case 'all':
      default:
        return 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx';
    }
  };

  // Check if a file is a document (PDF, DOC, etc.)
  const isDocument = (file: MediaFile) => {
    return file.mimeType?.startsWith('application/') || 
           file.path.match(/\.(pdf|doc|docx|xls|xlsx|txt|csv)$/i);
  };

  // Check if a file is a PDF
  const isPdf = (file: MediaFile) => {
    return file.mimeType === 'application/pdf' || 
           file.path.toLowerCase().endsWith('.pdf');
  };

  // Check if a file is a video
  const isVideo = (file: MediaFile) => {
    return file.mimeType?.startsWith('video/') || 
           file.path.match(/\.(mp4|webm|ogg|mov|avi)$/i);
  };
  const { toast } = useOptimisticToast();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedFiles));
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const prevSelectedFilesRef = useRef<string>('');

  // Update selected state when open changes or selectedFiles prop changes
  useEffect(() => {
    if (!open) return;
    
    // ✅ אם אין shopId, סגור את ה-modal והצג הודעת שגיאה (רק פעם אחת)
    if (!shopId) {
      toast({
        title: 'שגיאה',
        description: 'לא נמצא חנות. אנא רענן את הדף',
        variant: 'destructive',
      });
      // Use setTimeout to avoid calling onOpenChange during render
      setTimeout(() => {
        onOpenChange(false);
      }, 0);
      return;
    }
    
    // Create a stable string representation for comparison
    const currentSelectedStr = JSON.stringify([...selectedFiles].sort());
    
    // Only update if the actual content changed, not just the reference
    if (prevSelectedFilesRef.current !== currentSelectedStr) {
      setSelected(new Set(selectedFiles));
      prevSelectedFilesRef.current = currentSelectedStr;
    }
    
    setSearchQuery('');
    setPage(1);
    fetchFiles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shopId, onOpenChange]); // Include onOpenChange in dependencies

  // Separate effect to sync selectedFiles when they actually change
  useEffect(() => {
    if (!open) return;
    const currentSelectedStr = JSON.stringify([...selectedFiles].sort());
    if (prevSelectedFilesRef.current !== currentSelectedStr) {
      setSelected(new Set(selectedFiles));
      prevSelectedFilesRef.current = currentSelectedStr;
    }
  }, [open, selectedFiles]);

  const fetchFiles = async (reset = false) => {
    if (!shopId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        shopId,
        page: reset ? '1' : page.toString(),
        limit: '50',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      // Filter by file type
      if (accept === 'image') {
        params.append('type', 'image');
      } else if (accept === 'video') {
        params.append('type', 'video');
      }

      const response = await fetch(`/api/files?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setFiles(data.files || []);
        } else {
          setFiles((prev) => [...prev, ...(data.files || [])]);
        }
        setHasMore(data.pagination?.page < data.pagination?.totalPages);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בטעינת התמונות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (open && shopId) {
      const timeoutId = setTimeout(() => {
        fetchFiles(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, open, shopId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!shopId) {
      toast({
        title: 'שגיאה',
        description: 'לא נמצא חנות. אנא בחר חנות תחילה',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const uploadedFiles: string[] = [];
    const errors: string[] = [];
    const fileArray = Array.from(files);

    // For overall progress tracking
    const tempFileIds = fileArray.map((_, idx) => `temp-${Date.now()}-${idx}`);
    setUploadingFiles(tempFileIds);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const tempId = tempFileIds[i];

        // Validate video file size (20MB max)
        const isVideo = file.type.startsWith('video/');
        const maxVideoSize = 20 * 1024 * 1024; // 20MB in bytes
        
        if (isVideo && file.size > maxVideoSize) {
          errors.push(`${file.name}: גודל הקובץ גדול מדי. מקסימום 20 מגה`);
          continue;
        }

        setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType || 'products');
        formData.append('entityId', entityId || 'new');
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
          console.error('Upload error:', errorData);
          errors.push(`${file.name}: ${errorData.error || 'שגיאה לא ידועה'}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (uploadedFiles.length > 0) {
        const mediaType = accept === 'video' ? 'וידאו' : accept === 'image' ? 'תמונות' : 'קבצים';
        toast({
          title: 'הצלחה',
          description: `${uploadedFiles.length} ${mediaType} הועלו בהצלחה${errors.length > 0 ? `, ${errors.length} נכשלו` : ''}`,
        });
        setFiles((prev) => [
          ...uploadedFiles.map((path: string) => {
            // Determine mimeType based on file extension
            const ext = path.split('.').pop()?.toLowerCase();
            let mimeType = 'image/jpeg';
            if (ext === 'mp4') mimeType = 'video/mp4';
            else if (ext === 'webm') mimeType = 'video/webm';
            else if (ext === 'mov') mimeType = 'video/quicktime';
            else if (ext === 'avi') mimeType = 'video/x-msvideo';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'gif') mimeType = 'image/gif';
            else if (ext === 'webp') mimeType = 'image/webp';
            
            return {
              id: `new-${Date.now()}-${Math.random()}`,
              name: path.split('/').pop() || 'קובץ',
              path,
              size: 0,
              mimeType,
              createdAt: new Date().toISOString(),
              entityType: entityType || null,
              entityId: entityId || null,
            };
          }),
          ...prev,
        ]);
        
        // If single selection mode, only select the last uploaded file
        const newSelected = new Set<string>();
        if (multiple) {
          selected.forEach(path => newSelected.add(path));
          uploadedFiles.forEach((path: string) => newSelected.add(path));
        } else {
          // Only select the last uploaded file in single mode
          newSelected.add(uploadedFiles[uploadedFiles.length - 1]);
        }
        setSelected(newSelected);
      }

      if (errors.length > 0 && uploadedFiles.length === 0) {
        toast({
          title: 'שגיאה',
          description: errors[0] || 'אירעה שגיאה בהעלאת הקבצים',
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

  const handleDelete = async (filePath: string) => {
    const file = files.find(f => f.path === filePath);
    const isVideo = file?.mimeType?.startsWith('video/');
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ה-${isVideo ? 'וידאו' : 'תמונה'}?`)) return

    setDeleting((prev) => new Set(prev).add(filePath));

    try {
      const response = await fetch(`/api/files/delete?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f.path !== filePath));
        setSelected((prev) => {
          const newSet = new Set(prev);
          newSet.delete(filePath);
          return newSet;
        });
        const deletedFile = files.find(f => f.path === filePath);
        const isVideo = deletedFile?.mimeType?.startsWith('video/');
        toast({
          title: 'הצלחה',
          description: `ה-${isVideo ? 'וידאו' : 'תמונה'} נמחק בהצלחה`,
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
        toast({
          title: 'שגיאה',
          description: 'אירעה שגיאה במחיקת הקובץ',
          variant: 'destructive',
        });
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    }
  };

  const handleToggleSelect = (filePath: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      if (!multiple && newSelected.size > 0) {
        newSelected.clear();
      }
      newSelected.add(filePath);
    }
    setSelected(newSelected);
  };

  const handleDone = () => {
    const selectedArray = Array.from(selected);
    if (selectedArray.length > 0) {
      onSelect(selectedArray);
      onOpenChange(false);
    } else {
      const mediaType = accept === 'video' ? 'וידאו' : accept === 'image' ? 'תמונה' : 'קובץ';
      toast({
        title: 'שגיאה',
        description: `אנא בחר ${mediaType}`,
        variant: 'destructive',
      });
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
        target: {
          files: droppedFiles,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      await handleFileUpload(fakeEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1100px] max-h-[80vh] flex flex-col p-0 rounded-lg overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 py-3.5 border-b bg-white">
          <DialogTitle className="text-base font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          {/* Search and Filter Bar */}
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חפש קבצים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-9 text-sm bg-white border-gray-300 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
                 <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="default"
                    size="sm"
                    className="gap-2 h-9 px-4 font-medium"
                  >
                     <HiUpload className="w-4 h-4" />
                     <span>העלה קבצים</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={getAcceptAttribute()}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
            </div>
          </div>

          {/* Files Grid */}
          <div 
            className="flex-1 overflow-y-auto p-4 relative bg-white"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
             {isDragging && (
              <div className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-400 z-50 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm transition-all m-4 rounded-lg">
                <HiUpload className="w-16 h-16 text-blue-500 mb-3 animate-bounce" />
                <p className="text-lg font-semibold text-blue-700">שחרר קבצים להעלאה</p>
              </div>
            )}

            {uploading && files.length === 0 ? (
               <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4 bg-gray-50/30">
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6 animate-pulse">
                        <HiUpload className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">מעלה קבצים...</h3>
                    <div className="w-full max-w-md px-8">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${uploadingFiles.length > 0 
                              ? Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / uploadingFiles.length) 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        {uploadingFiles.length > 0 && `${Object.values(uploadProgress).filter(p => p === 100).length} מתוך ${uploadingFiles.length} קבצים`}
                      </p>
                    </div>
                  </div>
               </div>
            ) : loading && files.length === 0 ? (
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-md border border-gray-200 bg-white overflow-hidden">
                            <Skeleton className="w-full h-full" />
                        </div>
                    ))}
                  </div>
               </div>
            ) : files.length === 0 && uploadingFiles.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg mb-4 bg-gray-50/30 cursor-pointer hover:border-gray-400 hover:bg-gray-50/50 transition-all" onClick={() => fileInputRef.current?.click()}>
                  <div className="flex flex-col items-center justify-center text-center py-24">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        {accept === 'video' ? (
                          <HiVideoCamera className="w-8 h-8 text-gray-400" />
                        ) : accept === 'image' ? (
                          <HiPhotograph className="w-8 h-8 text-gray-400" />
                        ) : accept === 'file' ? (
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <HiUpload className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {accept === 'video' ? 'אין וידאו עדיין' : accept === 'image' ? 'אין תמונות עדיין' : accept === 'file' ? 'אין קבצים עדיין' : 'אין קבצים עדיין'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-md leading-relaxed">
                      {accept === 'video' 
                        ? 'העלה וידאו מהמחשב שלך או גרור אותו לכאן כדי להתחיל (מקסימום 20 מגה)'
                        : accept === 'image'
                        ? 'העלה תמונות מהמחשב שלך או גרור אותן לכאן כדי להתחיל'
                        : accept === 'file'
                        ? 'העלה קבצים (PDF, DOC, XLS) מהמחשב שלך או גרור אותם לכאן'
                        : 'העלה קבצים מהמחשב שלך או גרור אותם לכאן כדי להתחיל'}
                    </p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      {accept === 'video' ? 'העלה וידאו' : accept === 'image' ? 'העלה תמונה' : accept === 'file' ? 'העלה קובץ' : 'העלה קבצים'}
                    </Button>
                  </div>
                </div>
            ) : (
              <>
                {/* Upload Area - Always show when there are files */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 bg-gray-50/30 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-center"
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-sm text-gray-600 mb-3">
                      {accept === 'video' 
                        ? 'העלה וידאו מהמחשב שלך או גרור אותו לכאן (מקסימום 20 מגה)'
                        : accept === 'image'
                        ? 'העלה תמונות מהמחשב שלך או גרור אותן לכאן'
                        : 'העלה קבצים מהמחשב שלך או גרור אותם לכאן'}
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <HiUpload className="w-4 h-4 ml-2" />
                      העלה קבצים
                    </Button>
                  </div>
                </div>

                {/* Uploading Skeletons */}
                {uploading && uploadingFiles.length > 0 && (
                  <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-blue-900">מעלה {uploadingFiles.length} קבצים...</p>
                      <div className="text-xs text-blue-700 font-medium">
                        {Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / uploadingFiles.length)}%
                      </div>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${uploadingFiles.length > 0 
                            ? Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / uploadingFiles.length) 
                            : 0}%` 
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {uploadingFiles.map((tempId) => (
                        <div key={tempId} className="aspect-square rounded-md border-2 border-blue-300 bg-white overflow-hidden relative">
                          <Skeleton className="w-full h-full" />
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10">
                            <div className="text-xs font-semibold text-blue-700">
                              {uploadProgress[tempId] || 0}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Grid */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {/* Existing Files */}
                    {files.map((file) => {
                  const isSelected = selected.has(file.path);
                  return (
                    <div
                      key={file.id}
                      onClick={() => handleToggleSelect(file.path)}
                      className={cn(
                        "group relative aspect-square rounded-md border bg-white cursor-pointer transition-all overflow-hidden",
                        isSelected 
                            ? "border-blue-500 ring-2 ring-blue-200 shadow-sm" 
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      )}
                    >
                       <div className="absolute top-1 right-1 z-10">
                           <div className={cn(
                               "w-4 h-4 rounded border-2 bg-white flex items-center justify-center transition-all",
                               isSelected 
                                ? "bg-blue-500 border-blue-500" 
                                : "border-gray-300 group-hover:border-gray-400"
                           )}>
                               {isSelected && <HiCheck className="w-2.5 h-2.5 text-white font-bold" />}
                           </div>
                       </div>
                       
                       <div className="w-full h-full p-1">
                           <div className="w-full h-full relative rounded-sm overflow-hidden bg-gray-50">
                                {isVideo(file) ? (
                                  <div className="relative w-full h-full">
                                    <video
                                      src={file.path}
                                      className="w-full h-full object-cover"
                                      muted
                                      preload="metadata"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                        <svg className="w-3.5 h-3.5 text-gray-700 mr-[-1px]" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                ) : isDocument(file) ? (
                                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPdf(file) ? 'bg-red-100' : 'bg-blue-100'}`}>
                                      <svg className={`w-6 h-6 ${isPdf(file) ? 'text-red-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <span className={`text-[8px] font-bold mt-1 uppercase ${isPdf(file) ? 'text-red-600' : 'text-blue-600'}`}>
                                      {file.path.split('.').pop()?.toUpperCase() || 'FILE'}
                                    </span>
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
                       </div>

                       <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-1 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <p className="text-white text-[9px] truncate font-medium">{file.name}</p>
                       </div>
                    </div>
                  );
                    })}
                  </div>
                </div>
              </>
            )}
             {hasMore && !loading && files.length > 0 && (
              <div className="mt-6 text-center pb-3">
                <Button
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchFiles(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="min-w-[100px]"
                >
                  טען עוד
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t bg-gray-50 px-5 py-3">
            <div className="flex items-center justify-between w-full">
                <div className="text-sm text-gray-600">
                    {selected.size > 0 ? (
                        <span className="font-medium text-gray-900">{selected.size} נבחרו</span>
                    ) : (
                        <span className="text-gray-500">לא נבחרו קבצים</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>ביטול</Button>
                    <Button size="sm" onClick={handleDone} disabled={selected.size === 0}>
                        הוסף
                    </Button>
                </div>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
