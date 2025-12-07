/**
 * Storefront - Rich Text Section Component
 * קומפוננטת טקסט עשיר
 */

interface RichTextProps {
  settings: {
    content?: string;
    text_alignment?: 'right' | 'center' | 'left';
    container_type?: 'container_box' | 'full_width';
    background_color?: string;
  };
  blocks?: any[];
  globalSettings?: any;
}

export function RichText({ settings, blocks, globalSettings }: RichTextProps) {
  const content = settings.content || '';

  if (!content) {
    return null;
  }

  const textAlign = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[settings.text_alignment || 'right'] || 'text-right';

  const containerClass = settings.container_type === 'full_width' 
    ? 'w-full px-4 sm:px-6 lg:px-8' 
    : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <section 
      className="py-12 md:py-16"
      style={{ backgroundColor: settings.background_color || 'transparent' }}
    >
      <div className={containerClass}>
        <div 
          className={`prose prose-lg max-w-none ${textAlign}`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}

