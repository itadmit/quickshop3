'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { sectionPropsAreEqual } from '../sectionMemoUtils';

interface ButtonProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  editorDevice?: 'mobile' | 'tablet' | 'desktop';
}

function ButtonComponent({ section, onUpdate, editorDevice }: ButtonProps) {
  const settings = section.settings || {};
  const style = section.style || {};

  const buttonText = settings.button_text || 'לחץ כאן';
  const buttonUrl = settings.button_url || '#';
  const buttonSize = settings.button_size || 'medium';
  const buttonStyleType = settings.button_style_type || 'solid';
  const textAlign = settings.text_align || 'right';

  // Typography settings - use specific typography for button
  const buttonTypography = style.typography?.button || {};
  
  const bgColor = style.button?.background_color || '#000000';
  const textColor = buttonTypography.color || style.button?.text_color || '#FFFFFF';
  const hoverBgColor = style.button?.hover_background_color || '#333333';
  const hoverTextColor = style.button?.hover_text_color || '#FFFFFF';
  const borderRadius = style.button?.border_radius || '8px';
  
  const fontFamily = buttonTypography.font_family || style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';

  const getButtonSizeClasses = () => {
    switch (buttonSize) {
      case 'small': return 'px-4 py-2 text-sm';
      case 'large': return 'px-8 py-3 text-lg';
      case 'medium':
      default: return 'px-6 py-2.5 text-base';
    }
  };

  const getButtonStyles = () => {
    let classes = '';
    let inlineStyle: React.CSSProperties = {
      borderRadius: borderRadius,
      transition: 'all 0.2s ease-in-out',
    };

    switch (buttonStyleType) {
      case 'outline':
        classes = `border-2 border-current text-current bg-transparent hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]`;
        inlineStyle = {
          ...inlineStyle,
          color: textColor,
          borderColor: textColor,
          '--hover-bg': hoverBgColor,
          '--hover-text': hoverTextColor,
        } as React.CSSProperties;
        break;
      case 'link':
        classes = `text-current bg-transparent hover:underline`;
        inlineStyle = {
          ...inlineStyle,
          color: textColor,
          '--hover-text': hoverTextColor,
        } as React.CSSProperties;
        break;
      case 'solid':
      default:
        classes = `bg-current text-white hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]`;
        inlineStyle = {
          ...inlineStyle,
          backgroundColor: bgColor,
          color: textColor,
          '--hover-bg': hoverBgColor,
          '--hover-text': hoverTextColor,
        } as React.CSSProperties;
        break;
    }
    return { classes, inlineStyle };
  };

  const { classes, inlineStyle } = getButtonStyles();

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left': return 'justify-start';
      case 'center': return 'justify-center';
      case 'right': return 'justify-end';
      default: return 'justify-end';
    }
  };

  return (
    <div className={`w-full flex ${getTextAlignClass()}`} style={{ fontFamily }}>
      <Link
        href={buttonUrl}
        className={cn(
          "inline-flex items-center",
          getButtonSizeClasses(),
          classes
        )}
        style={{
          ...inlineStyle,
          fontFamily: buttonTypography.font_family || fontFamily,
          fontSize: buttonTypography.font_size || undefined,
          fontWeight: buttonTypography.font_weight || undefined,
          lineHeight: buttonTypography.line_height || undefined,
          letterSpacing: buttonTypography.letter_spacing || undefined,
          textTransform: buttonTypography.text_transform || undefined,
        }}
      >
        {buttonText}
      </Link>
    </div>
  );
}

export const Button = React.memo(ButtonComponent, sectionPropsAreEqual);
