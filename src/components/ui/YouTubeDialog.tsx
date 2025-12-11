'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface YouTubeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (iframe: string) => void;
}

export function YouTubeDialog({ open, onOpenChange, onInsert }: YouTubeDialogProps) {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState('560');
  const [height, setHeight] = useState('315');
  const [autoplay, setAutoplay] = useState(false);
  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setUrl('');
      setVideoId(null);
      setError(null);
      setWidth('560');
      setHeight('315');
      setAutoplay(false);
      setStartTime('');
    }
  }, [open]);

  const extractVideoId = (url: string): string | null => {
    if (!url) return null;

    // Regular YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Check if it's already a video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim();
    }

    return null;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError(null);
    
    const extractedId = extractVideoId(value);
    if (extractedId) {
      setVideoId(extractedId);
    } else if (value.trim()) {
      setVideoId(null);
    }
  };

  const handleInsert = () => {
    if (!videoId) {
      setError('אנא הזן קישור YouTube תקין');
      return;
    }

    let embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const params: string[] = [];

    if (autoplay) {
      params.push('autoplay=1');
    }

    if (startTime) {
      const seconds = parseStartTime(startTime);
      if (seconds > 0) {
        params.push(`start=${seconds}`);
      }
    }

    if (params.length > 0) {
      embedUrl += `?${params.join('&')}`;
    }

    const iframe = `<iframe width="${width}" height="${height}" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    
    onInsert(iframe);
    onOpenChange(false);
  };

  const parseStartTime = (timeStr: string): number => {
    // Support formats: "1:30", "90", "1m30s"
    const timeStrClean = timeStr.trim();
    
    // Format: MM:SS or HH:MM:SS
    if (timeStrClean.includes(':')) {
      const parts = timeStrClean.split(':').map(Number);
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
    
    // Format: XmYs or just seconds
    const minutesMatch = timeStrClean.match(/(\d+)m/);
    const secondsMatch = timeStrClean.match(/(\d+)s/);
    
    let totalSeconds = 0;
    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1]) * 60;
    }
    if (secondsMatch) {
      totalSeconds += parseInt(secondsMatch[1]);
    }
    
    // If no matches, try to parse as plain seconds
    if (!minutesMatch && !secondsMatch) {
      const seconds = parseInt(timeStrClean);
      if (!isNaN(seconds)) {
        return seconds;
      }
    }
    
    return totalSeconds;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent maxWidth="2xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>הוסף סרטון YouTube</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-2">
            <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700">
              קישור YouTube
            </label>
            <Input
              id="youtube-url"
              placeholder="https://youtube.com/watch?v=... או https://youtu.be/..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              dir="ltr"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {videoId && !error && (
              <p className="text-sm text-green-600">
                ✓ מזהה סרטון: {videoId}
              </p>
            )}
          </div>

          {/* תצוגה מקדימה */}
          {videoId && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">תצוגה מקדימה</label>
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0"
                />
              </div>
            </div>
          )}

          {/* הגדרות נוספות */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="width" className="block text-sm font-medium text-gray-700">רוחב (px)</label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="100"
                max="1920"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">גובה (px)</label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="100"
                max="1080"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">
              זמן התחלה (אופציונלי)
            </label>
            <Input
              id="start-time"
              placeholder="לדוגמה: 1:30 או 90 או 1m30s"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              הזמן שבו הסרטון יתחיל (דקות:שניות, שניות, או פורמט 1m30s)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoplay"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="autoplay" className="text-sm font-medium text-gray-700 cursor-pointer">
              הפעל אוטומטית (autoplay)
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            ביטול
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!videoId}
          >
            הוסף סרטון
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

