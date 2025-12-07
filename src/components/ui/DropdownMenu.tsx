'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  checked?: boolean; // לתמיכה בצ'קבוקסים
  showCheckbox?: boolean; // האם להציג צ'קבוקס
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: 'start' | 'end';
  closeOnSelect?: boolean; // האם לסגור את התפריט לאחר בחירה (ברירת מחדל: true)
}

export function DropdownMenu({ trigger, items, align = 'end', closeOnSelect = true }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate position before showing menu to prevent flicker
  const calculatePosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 192; // w-48 = 192px
    const menuHeight = items.length * 40 + 8; // Approximate height
    
    // Check if menu would go off screen
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top = rect.bottom + 8;
    // If not enough space below, show above
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      top = rect.top - menuHeight - 8;
    }
    
    // For RTL: align 'end' means align to the right edge of trigger
    // align 'start' means align to the left edge of trigger
    let left = align === 'end' ? rect.right - menuWidth : rect.left;
    
    // Ensure menu doesn't go off screen horizontally
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    
    return { top, left };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsPositioned(false);
      }
    };

    if (isOpen) {
      // Calculate position immediately before showing
      const pos = calculatePosition();
      setPosition(pos);
      setIsPositioned(true);
      
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      setIsPositioned(false);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, align, items.length]);

  const menuContent = isOpen && isPositioned ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100]"
        onClick={() => {
          setIsOpen(false);
          setIsPositioned(false);
        }}
      />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-[101] w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity: isPositioned ? 1 : 0,
        }}
        dir="rtl"
      >
        <div className="py-1" role="menu">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                if (closeOnSelect) {
                  setIsOpen(false);
                  setIsPositioned(false);
                }
                item.onClick();
              }}
              className={`w-full text-right px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors ${
                item.variant === 'destructive' 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-gray-700'
              }`}
              role="menuitem"
            >
              {item.showCheckbox && (
                <span className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                  item.checked 
                    ? 'bg-green-600 border-green-600' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {item.checked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              )}
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  ) : null;

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div 
        ref={triggerRef} 
        className="inline-block relative"
      >
        <div onClick={handleTriggerClick}>
          {trigger}
        </div>
      </div>
      {typeof window !== 'undefined' && isOpen && createPortal(menuContent, document.body)}
    </>
  );
}

