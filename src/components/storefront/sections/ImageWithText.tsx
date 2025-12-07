/**
 * Storefront - Image with Text Section Component
 * קומפוננטת תמונה עם טקסט
 */

import Image from 'next/image';

interface ImageWithTextProps {
  settings: {
    heading?: string;
    subheading?: string;
    text?: string;
    image_url?: string;
    image_position?: 'left' | 'right';
    text_alignment?: 'right' | 'center' | 'left';
    container_type?: 'container_box' | 'full_width';
    background_color?: string;
    cta_text?: string;
    cta_link?: string;
  };
  blocks?: any[];
  globalSettings?: any;
}

export function ImageWithText({ settings, blocks, globalSettings }: ImageWithTextProps) {
  const imagePosition = settings.image_position || 'right';
  const textAlign = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[settings.text_alignment || 'right'] || 'text-right';

  const containerClass = settings.container_type === 'full_width' 
    ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' 
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <section 
      className="py-12 md:py-16"
      style={{ backgroundColor: settings.background_color || 'transparent' }}
    >
      <div className={containerClass}>
        <div className={`grid md:grid-cols-2 gap-8 items-center ${
          imagePosition === 'left' ? 'md:flex-row-reverse' : ''
        }`}>
          {/* Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden order-2 md:order-1">
            {settings.image_url ? (
              <Image
                src={settings.image_url}
                alt={settings.heading || 'Image'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">אין תמונה</span>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className={`${textAlign} order-1 md:order-2`}>
            {settings.heading && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {settings.heading}
              </h2>
            )}
            
            {settings.subheading && (
              <p className="text-xl text-gray-600 mb-4">{settings.subheading}</p>
            )}
            
            {settings.text && (
              <div 
                className="text-gray-700 mb-6 prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: settings.text }}
              />
            )}

            {settings.cta_text && settings.cta_link && (
              <a
                href={settings.cta_link}
                className="inline-block px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                {settings.cta_text}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

