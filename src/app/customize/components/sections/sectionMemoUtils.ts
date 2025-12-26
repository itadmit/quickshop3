import { SectionSettings } from '@/lib/customizer/types';

/**
 * Utility function to compare sections for React.memo
 * Returns true if sections are equal (should skip re-render)
 */
export function areSectionsEqual(
  prevSection: SectionSettings | undefined,
  nextSection: SectionSettings | undefined
): boolean {
  if (!prevSection || !nextSection) {
    return prevSection === nextSection;
  }

  // Compare basic properties
  if (
    prevSection.id !== nextSection.id ||
    prevSection.type !== nextSection.type ||
    prevSection.visible !== nextSection.visible ||
    prevSection.order !== nextSection.order
  ) {
    return false;
  }

  // Deep compare settings
  const prevSettings = prevSection.settings || {};
  const nextSettings = nextSection.settings || {};
  if (JSON.stringify(prevSettings) !== JSON.stringify(nextSettings)) {
    return false;
  }

  // Deep compare style
  const prevStyle = prevSection.style || {};
  const nextStyle = nextSection.style || {};
  if (JSON.stringify(prevStyle) !== JSON.stringify(nextStyle)) {
    return false;
  }

  // Deep compare blocks - needed for image_with_text and other block-based sections
  const prevBlocks = prevSection.blocks || [];
  const nextBlocks = nextSection.blocks || [];
  if (prevBlocks.length !== nextBlocks.length) {
    return false;
  }
  
  // Compare each block's content and style
  for (let i = 0; i < prevBlocks.length; i++) {
    const prevBlock = prevBlocks[i];
    const nextBlock = nextBlocks[i];
    
    if (
      prevBlock.id !== nextBlock.id ||
      prevBlock.type !== nextBlock.type ||
      JSON.stringify(prevBlock.content) !== JSON.stringify(nextBlock.content) ||
      JSON.stringify(prevBlock.style) !== JSON.stringify(nextBlock.style)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Comparison function for React.memo for section components
 */
export function sectionPropsAreEqual(
  prevProps: { section: SectionSettings; [key: string]: any },
  nextProps: { section: SectionSettings; [key: string]: any }
): boolean {
  // Compare section
  if (!areSectionsEqual(prevProps.section, nextProps.section)) {
    return false;
  }

  // Compare other props (except onUpdate which is a function that may change reference)
  const keysToCompare = Object.keys(prevProps).filter(
    key => key !== 'section' && key !== 'onUpdate'
  );

  for (const key of keysToCompare) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  // onUpdate is intentionally ignored - it's a callback function
  // that may have a new reference even if it does the same thing
  return true;
}

