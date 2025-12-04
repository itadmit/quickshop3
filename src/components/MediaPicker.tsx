'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { HiSearch, HiUpload, HiX, HiCheck, HiTrash, HiPhotograph } from 'react-icons/hi';
import { cn } from '@/lib/utils';

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
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  selectedFiles = [],
  shopId,
  entityType,
  entityId,
  multiple = true,
  title = 'בחר תמונות',
}: MediaPickerProps) {
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

  useEffect(() => {
    if (open) {
      setSelected(new Set(selectedFiles));
      setSearchQuery('');
      setPage(1);
      fetchFiles(true);
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

  useEffect(() => {
    if (open && shopId) {
      const timeoutId = setTimeout(() => {
        fetchFiles(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
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

    const tempFileIds = fileArray.map(() => `temp-${Date.now()}-${Math.random()}`);
    setUploadingFiles(tempFileIds);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const tempId = tempFileIds[i];

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
        toast({
          title: 'הצלחה',
          description: `${uploadedFiles.length} תמונות הועלו בהצלחה${errors.length > 0 ? `, ${errors.length} נכשלו` : ''}`,
        });
        setFiles((prev) => [
          ...uploadedFiles.map((path: string) => ({
            id: `new-${Date.now()}-${Math.random()}`,
            name: path.split('/').pop() || 'תמונה',
            path,
            size: 0,
            mimeType: 'image/jpeg',
            createdAt: new Date().toISOString(),
            entityType: entityType || null,
            entityId: entityId || null,
          })),
          ...prev,
        ]);
        const newSelected = new Set(selected);
        uploadedFiles.forEach((path: string) => newSelected.add(path));
        setSelected(newSelected);
      }

      if (errors.length > 0 && uploadedFiles.length === 0) {
        toast({
          title: 'שגיאה',
          description: errors[0] || 'אירעה שגיאה בהעלאת התמונות',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בהעלאת התמונות',
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
    if (!confirm("האם אתה בטוח שברצונך למחוק את התמונה?")) return

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
        toast({
          title: 'הצלחה',
          description: 'התמונה נמחקה בהצלחה',
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת התמונה',
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

  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selected);
    if (selectedArray.length === 0) {
      toast({
        title: 'שים לב',
        description: 'לא נבחרו תמונות למחיקה',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedArray.length} תמונות?`)) return;

    setDeleting(new Set(selectedArray));

    try {
      const deletePromises = selectedArray.map((filePath) =>
        fetch(`/api/files/delete?path=${encodeURIComponent(filePath)}`, {
          method: 'DELETE',
        })
      );

      const results = await Promise.allSettled(deletePromises);

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast({
          title: 'הצלחה',
          description: `${successful} תמונות נמחקו בהצלחה${failed > 0 ? `, ${failed} נכשלו` : ''}`,
        });

        setFiles((prev) => prev.filter((f) => !selectedArray.includes(f.path)));
        setSelected(new Set());
      } else {
        toast({
          title: 'שגיאה',
          description: 'לא ניתן למחוק את התמונות',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error bulk deleting files:', error);
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה במחיקת התמונות',
        variant: 'destructive',
      });
    } finally {
      setDeleting(new Set());
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
      toast({
        title: 'שגיאה',
        description: 'אנא בחר תמונה',
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
      // Create a fake event to pass to handleFileUpload
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
      <DialogContent className="max-w-[95vw] w-[1600px] max-h-[92vh] flex flex-col p-0" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search and Upload Bar */}
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="חפש קבצים לפי שם..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-9 text-sm bg-white"
                />
              </div>

              {selected.size > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  disabled={deleting.size > 0}
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 h-9 px-3 text-sm"
                >
                  <HiTrash className="w-3.5 h-3.5" />
                  <span>מחק ({selected.size})</span>
                </Button>
              )}

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="default"
                size="sm"
                className="gap-1.5 h-9 px-3 text-sm font-medium whitespace-nowrap"
              >
                {uploading ? (
                  <>
                    <HiPhotograph className="w-4 h-4" />
                    <span>מעלה...</span>
                  </>
                ) : (
                  <>
                    <HiUpload className="w-4 h-4" />
                    <span>העלה קבצים</span>
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {selected.size > 0 && (
              <div className="mt-2 text-xs text-gray-600 bg-green-50 border border-green-200 rounded px-3 py-1.5">
                <span className="font-medium text-green-700">{selected.size}</span> קבצים נבחרו
              </div>
            )}
          </div>

          {/* Files Grid with Drag & Drop */}
          <div 
            className="flex-1 overflow-y-auto p-6 relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-green-50/95 border-4 border-dashed border-green-500 rounded-lg z-50 flex flex-col items-center justify-center pointer-events-none">
                <HiUpload className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                <p className="text-xl font-semibold text-green-700">שחרר כדי להעלות</p>
                <p className="text-sm text-green-600 mt-2">הקבצים יועלו אוטומטית</p>
              </div>
            )}
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <HiPhotograph className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : files.length === 0 && uploadingFiles.length === 0 ? (
              <div 
                className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="pointer-events-none">
                  <HiPhotograph className="w-16 h-16 text-gray-300 mb-3 mx-auto" />
                  <p className="text-base font-medium text-gray-700 mb-2">גרור תמונות לכאן</p>
                  <p className="text-sm text-gray-500 mb-3">או</p>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 pointer-events-auto h-9 px-4 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <HiUpload className="w-4 h-4" />
                    בחר קבצים מהמחשב
                  </Button>
                  <p className="text-xs text-gray-400 mt-3">תמיכה ב-JPG, PNG, GIF, WEBP</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
                {uploadingFiles.map((tempId) => {
                  const progress = uploadProgress[tempId] || 0;
                  return (
                    <div
                      key={tempId}
                      className="relative rounded-lg border-2 border-green-300 overflow-hidden"
                    >
                      <div className="aspect-square relative bg-gray-100">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <HiPhotograph className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 text-center font-medium">{progress}%</p>
                      </div>
                    </div>
                  );
                })}

                {files.map((file) => {
                  const isSelected = selected.has(file.path);
                  const isDeleting = deleting.has(file.path);

                  return (
                    <div
                      key={file.id}
                      className={cn(
                        'relative group cursor-pointer rounded-lg border-2 transition-all shadow-sm hover:shadow-md',
                        isSelected
                          ? 'border-green-500 ring-2 ring-green-200 shadow-green-100'
                          : 'border-gray-200 hover:border-green-300'
                      )}
                      onClick={() => handleToggleSelect(file.path)}
                    >
                      <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
                        <img
                          src={file.path}
                          alt={file.name}
                          className="w-full h-full object-cover bg-gray-100"
                        />
                        {isDeleting && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <HiPhotograph className="w-6 h-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      <div className="absolute top-2 right-2 z-10">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all shadow-sm',
                            isSelected
                              ? 'bg-green-500 border-green-500 scale-110'
                              : 'bg-white/90 backdrop-blur-sm border-gray-300 group-hover:border-green-400 group-hover:scale-105'
                          )}
                        >
                          {isSelected && <HiCheck className="w-5 h-5 text-white font-bold" />}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.path);
                        }}
                        disabled={isDeleting}
                        className="absolute top-2 left-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"
                        title="מחק מהשרת לצמיתות"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>

                      <div className="p-2 bg-white rounded-b-lg border-t">
                        <p className="text-[11px] text-gray-700 truncate font-medium leading-tight" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && !loading && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchFiles(false);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  טען עוד
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full bg-gray-50 border-t px-6 py-3 -mx-6 -mb-6 mt-0">
            <div className="text-xs font-medium text-gray-700">
              {selected.size > 0 ? (
                <span className="flex items-center gap-1.5">
                  <HiCheck className="w-4 h-4 text-green-500" />
                  <span>{selected.size} קבצים נבחרו</span>
                </span>
              ) : (
                <span className="text-gray-400">לא נבחרו קבצים</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 text-sm"
              >
                ביטול
              </Button>
              <Button 
                onClick={handleDone} 
                disabled={selected.size === 0}
                size="sm"
                className="h-9 px-4 gap-1.5 font-medium text-sm"
              >
                <HiCheck className="w-4 h-4" />
                <span>הוסף ({selected.size})</span>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

