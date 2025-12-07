/**
 * Storefront - Custom HTML Section Component
 * קומפוננטת HTML מותאם
 */

interface CustomHTMLProps {
  settings: {
    html?: string;
    container_type?: 'container_box' | 'full_width';
  };
  blocks?: any[];
  globalSettings?: any;
}

export function CustomHTML({ settings, blocks, globalSettings }: CustomHTMLProps) {
  const html = settings.html || '';

  if (!html) {
    return null;
  }

  const containerClass = settings.container_type === 'full_width' 
    ? 'w-full' 
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <section className="py-8">
      <div className={containerClass}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </section>
  );
}

