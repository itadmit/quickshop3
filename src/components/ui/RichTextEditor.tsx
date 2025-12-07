'use client';

import { useRef, useEffect, useState } from 'react';
import { HiCode } from 'react-icons/hi';
import { YouTubeDialog } from './YouTubeDialog';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'הזן תיאור המוצר...', 
  className = '' 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      // Only update if content is different to avoid cursor jumping
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
        
        // זיהוי אוטומטי של כיוון הטקסט
        const text = editorRef.current.textContent || '';
        const hasRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(text);
        const hasLTR = /[a-zA-Z0-9]/.test(text);
        
        if (hasRTL && !hasLTR) {
          editorRef.current.style.direction = 'rtl';
          editorRef.current.style.textAlign = 'right';
        } else if (hasLTR && !hasRTL) {
          editorRef.current.style.direction = 'ltr';
          editorRef.current.style.textAlign = 'left';
        } else {
          // מעורב - נשתמש ב-auto
          editorRef.current.style.direction = 'auto';
          editorRef.current.style.textAlign = 'start';
        }
      }
    }
  }, [value, isHtmlMode]);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('הזן קישור:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('הזן כתובת תמונה:');
    if (url) {
      formatText('insertImage', url);
    }
  };

  const insertYouTube = () => {
    setYoutubeDialogOpen(true);
  };

  const handleYouTubeInsert = (iframe: string) => {
    if (editorRef.current) {
      document.execCommand('insertHTML', false, iframe);
      updateContent();
    }
  };

  const changeFormat = (format: string) => {
    formatText('formatBlock', format);
  };

  const toggleHTMLMode = () => {
    if (isHtmlMode) {
      // Switch back to visual mode
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlValue;
        onChange(htmlValue);
      }
    } else {
      // Switch to HTML mode
      if (editorRef.current) {
        setHtmlValue(editorRef.current.innerHTML);
      }
    }
    setIsHtmlMode(!isHtmlMode);
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center gap-2 bg-gray-50 flex-wrap">
        {!isHtmlMode && (
          <>
            <select
              className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-600"
              onChange={(e) => changeFormat(e.target.value)}
              defaultValue="p"
            >
              <option value="p">פסקה</option>
              <option value="h1">כותרת 1</option>
              <option value="h2">כותרת 2</option>
              <option value="h3">כותרת 3</option>
            </select>

            <div className="h-4 w-px bg-gray-300"></div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                onClick={() => formatText('bold')}
                title="מודגש"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                onClick={() => formatText('italic')}
                title="נטוי"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                onClick={() => formatText('underline')}
                title="קו תחתון"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h10M7 4v6a5 5 0 0010 0V4" />
                </svg>
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300"></div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                onClick={() => formatText('insertUnorderedList')}
                title="רשימה"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                onClick={() => formatText('insertOrderedList')}
                title="רשימה ממוספרת"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300"></div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                onClick={insertLink}
                title="קישור"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                onClick={insertImage}
                title="תמונה"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-1.5 hover:bg-gray-200 rounded text-red-600 transition-colors"
                onClick={insertYouTube}
                title="הטמעת יוטיוב"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300"></div>
          </>
        )}

        <button
          type="button"
          className={`p-1.5 hover:bg-gray-200 rounded transition-colors ${isHtmlMode ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
          onClick={toggleHTMLMode}
          title="מצב HTML"
        >
          <HiCode className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      {isHtmlMode ? (
        <textarea
          className="w-full p-4 font-mono text-sm focus:outline-none min-h-[200px] resize-y bg-white"
          value={htmlValue}
          onChange={(e) => setHtmlValue(e.target.value)}
          dir="ltr"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          className="w-full p-4 focus:outline-none min-h-[200px] prose prose-sm max-w-none bg-white"
          onInput={(e) => {
            updateContent();
            // זיהוי אוטומטי של כיוון הטקסט
            const target = e.currentTarget;
            const text = target.textContent || '';
            const hasRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(text);
            const hasLTR = /[a-zA-Z0-9]/.test(text);
            
            if (hasRTL && !hasLTR) {
              target.style.direction = 'rtl';
              target.style.textAlign = 'right';
            } else if (hasLTR && !hasRTL) {
              target.style.direction = 'ltr';
              target.style.textAlign = 'left';
            } else {
              // מעורב - נשתמש ב-auto
              target.style.direction = 'auto';
              target.style.textAlign = 'start';
            }
          }}
          onBlur={updateContent}
          data-placeholder={placeholder}
          suppressContentEditableWarning
          dir="auto"
          style={{ unicodeBidi: 'isolate' }}
        />
      )}

      <style jsx>{`
        [contentEditable=true]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>

      {/* YouTube Dialog */}
      <YouTubeDialog
        open={youtubeDialogOpen}
        onOpenChange={setYoutubeDialogOpen}
        onInsert={handleYouTubeInsert}
      />
    </div>
  );
}

