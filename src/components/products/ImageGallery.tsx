'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPhotograph, HiPlus, HiTrash, HiX, HiStar } from 'react-icons/hi';
import { ProductImage } from '@/types/product';
import { MediaPicker } from '@/components/MediaPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ImageGalleryProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  productId: number;
  shopId: number;
}

interface SortableImageItemProps {
  image: ProductImage;
  index: number;
  onDelete: (imageId: number, index: number) => void;
  onSetPrimary: (index: number) => void;
  isPrimary: boolean;
}

function SortableImageItem({ image, index, onDelete, onSetPrimary, isPrimary }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id?.toString() || `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 ${isPrimary ? 'border-green-500 shadow-md shadow-green-200' : 'border-gray-200'}`}>
        <img
          src={image.src}
          alt={image.alt || `Product image ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-black/70 text-white rounded-full p-1.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="גרור לשינוי סדר"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>

      {/* Actions overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        {!isPrimary && (
          <button
            onClick={() => onSetPrimary(index)}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 text-sm font-medium"
            title="הגדר כתמונה ראשית"
          >
            <HiStar className="w-4 h-4" />
            <span>ראשית</span>
          </button>
        )}
        <button
          onClick={() => onDelete(image.id || 0, index)}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          title="הסר מהטופס"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Primary badge */}
      {isPrimary && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 shadow-md">
          <HiStar className="w-3 h-3" />
          <span>ראשית</span>
        </div>
      )}
    </div>
  );
}

export function ImageGallery({ images, onImagesChange, productId, shopId }: ImageGalleryProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleMediaSelect = (selectedFiles: string[]) => {
    const newImages: ProductImage[] = selectedFiles.map((src, i) => ({
      id: Date.now() + i,
      product_id: productId,
      position: images.length + i + 1,
      src,
      alt: null,
      width: null,
      height: null,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);

    // אם המוצר קיים, עדכן את התמונות ב-DB
    if (productId > 0) {
      fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: newImages.map(img => ({
            src: img.src,
            position: img.position,
            alt: img.alt,
          }))
        }),
      }).catch(error => {
        console.error('Error saving images to DB:', error);
      });
    }
  };

  const handleDelete = async (imageId: number, index: number) => {
    // הסרה מהטופס בלבד, לא מחיקה מהשרת
    const newImages = images.filter((_, i) => i !== index);
    // Reorder positions
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      position: i + 1,
    }));
    onImagesChange(reorderedImages);

    // If product exists, update in DB
    if (productId > 0 && imageId > 0) {
      await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      }).catch(error => {
        console.error('Error deleting image from DB:', error);
      });
    }
  };

  const handleSetPrimary = (newPrimaryIndex: number) => {
    if (newPrimaryIndex === 0) return; // Already primary
    
    const reorderedImages = [...images];
    const [movedImage] = reorderedImages.splice(newPrimaryIndex, 1);
    reorderedImages.unshift(movedImage);
    
    // Update positions
    const reorderedWithPositions = reorderedImages.map((img, i) => ({
      ...img,
      position: i + 1,
    }));
    
    onImagesChange(reorderedWithPositions);

    // If product exists, update positions on server
    if (productId > 0) {
      fetch(`/api/products/${productId}/images/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageIds: reorderedWithPositions.map(img => img.id) 
        }),
      }).catch(error => {
        console.error('Error reordering images:', error);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => (img.id?.toString() || `image-${images.indexOf(img)}`) === active.id);
      const newIndex = images.findIndex((img) => (img.id?.toString() || `image-${images.indexOf(img)}`) === over?.id);
      
      const reorderedImages = arrayMove(images, oldIndex, newIndex);
      const reorderedWithPositions = reorderedImages.map((img, i) => ({
        ...img,
        position: i + 1,
      }));
      
      onImagesChange(reorderedWithPositions);

      // If product exists, update positions on server
      if (productId > 0) {
        fetch(`/api/products/${productId}/images/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageIds: reorderedWithPositions.map(img => img.id) 
          }),
        }).catch(error => {
          console.error('Error reordering images:', error);
        });
      }
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiPhotograph className="w-5 h-5" />
              <span>תמונות</span>
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            התמונה הראשונה תוצג ככיסוי המוצר. גרור תמונות לשינוי סדר.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map((img, i) => img.id?.toString() || `image-${i}`)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={image.id || `image-${index}`}
                    image={image}
                    index={index}
                    onDelete={handleDelete}
                    onSetPrimary={handleSetPrimary}
                    isPrimary={index === 0}
                  />
                ))}

                {/* Upload button */}
                <button
                  onClick={() => setMediaPickerOpen(true)}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all bg-gray-50"
                >
                  <HiPlus className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">הוסף תמונות</span>
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </Card>

      {/* Media Picker Modal */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        selectedFiles={images.map(img => img.src)}
        shopId={shopId.toString()}
        entityType="products"
        entityId={productId > 0 ? productId.toString() : 'new'}
        multiple={true}
        title="בחר תמונות למוצר"
      />
    </>
  );
}
