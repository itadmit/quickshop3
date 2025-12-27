import React from 'react';
import { HiPhotograph, HiVideoCamera, HiTrash, HiPencil } from 'react-icons/hi';
import { SegmentedControl } from './SegmentedControl';

interface MediaUploaderProps {
  mediaType: 'image' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  onMediaTypeChange: (type: 'image' | 'video') => void;
  onImageSelect: () => void;
  onVideoSelect: () => void;
  onClear: () => void;
  label?: string;
  showMediaTypeSelector?: boolean;
}

export function MediaUploader({
  mediaType,
  imageUrl,
  videoUrl,
  onMediaTypeChange,
  onImageSelect,
  onVideoSelect,
  onClear,
  label = 'מדיה',
  showMediaTypeSelector = true
}: MediaUploaderProps) {
  
  const hasContent = mediaType === 'image' ? !!imageUrl : !!videoUrl;

  return (
    <div className="space-y-3">
      {/* Media Type Selector */}
      {showMediaTypeSelector && (
        <SegmentedControl
          label={label}
          value={mediaType}
          onChange={(val) => onMediaTypeChange(val as 'image' | 'video')}
          options={[
            { label: 'תמונה', value: 'image', icon: <HiPhotograph className="w-4 h-4" /> },
            { label: 'וידאו', value: 'video', icon: <HiVideoCamera className="w-4 h-4" /> },
          ]}
        />
      )}

      {/* Media Preview & Actions */}
      <div className="bg-gray-50 rounded-lg border border-gray-200/60 p-3">
        {hasContent ? (
          <div className="relative aspect-video rounded-md overflow-hidden bg-white border border-gray-200 shadow-sm group">
            {mediaType === 'video' && videoUrl ? (
              <video src={videoUrl} className="w-full h-full object-cover" muted playsInline />
            ) : imageUrl ? (
              <img src={imageUrl} className="w-full h-full object-cover" alt="" />
            ) : null}
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
              <button
                onClick={mediaType === 'video' ? onVideoSelect : onImageSelect}
                className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 text-xs font-medium rounded shadow-sm backdrop-blur-sm transition-colors flex items-center gap-1"
              >
                <HiPencil className="w-3 h-3" />
                החלף
              </button>
              <button
                onClick={onClear}
                className="p-1.5 bg-white/90 hover:bg-red-50 hover:text-red-600 text-gray-900 rounded shadow-sm backdrop-blur-sm transition-colors"
                title="מחק"
              >
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={mediaType === 'video' ? onVideoSelect : onImageSelect}
            className="aspect-video border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-white cursor-pointer transition-all bg-white/50"
          >
            {mediaType === 'video' ? (
              <HiVideoCamera className="w-8 h-8 mb-2 opacity-50" />
            ) : (
              <HiPhotograph className="w-8 h-8 mb-2 opacity-50" />
            )}
            <span className="text-xs font-medium">
              לחץ להוספת {mediaType === 'video' ? 'וידאו' : 'תמונה'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

