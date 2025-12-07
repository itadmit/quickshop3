/**
 * Storefront - Collection List Section Component
 * קומפוננטת רשימת קטגוריות
 */

import Link from 'next/link';
import Image from 'next/image';

interface CollectionListProps {
  settings: {
    heading?: string;
    subheading?: string;
    text_alignment?: 'right' | 'center' | 'left';
    collections_per_row?: number;
    container_type?: 'container_box' | 'full_width';
    background_color?: string;
  };
  blocks?: any[];
  globalSettings?: any;
}

export async function CollectionList({ settings, blocks, globalSettings }: CollectionListProps) {
  // TODO: Fetch collections from API based on settings
  // For now, return placeholder
  const collections: Array<{
    id: number;
    handle: string;
    title: string;
    image_url?: string;
  }> = [];

  if (collections.length === 0) {
    return null;
  }

  const colsPerRow = settings.collections_per_row || 3;
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }[colsPerRow] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  const textAlign = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[settings.text_alignment || 'right'] || 'text-right';

  const containerClass = settings.container_type === 'full_width' 
    ? 'w-full' 
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <section 
      className="py-12 md:py-16"
      style={{ backgroundColor: settings.background_color || 'transparent' }}
    >
      <div className={containerClass}>
        {/* Heading */}
        {(settings.heading || settings.subheading) && (
          <div className={`mb-8 ${textAlign}`}>
            {settings.heading && (
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                {settings.heading}
              </h2>
            )}
            {settings.subheading && (
              <p className="text-lg text-gray-600">{settings.subheading}</p>
            )}
          </div>
        )}

        {/* Collections Grid */}
        <div className={`grid ${gridCols} gap-6`}>
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group relative overflow-hidden rounded-lg aspect-square bg-gray-100"
            >
              {collection.image_url ? (
                <Image
                  src={collection.image_url}
                  alt={collection.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <span className="text-gray-500 text-lg">{collection.title}</span>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <h3 className="text-white text-xl font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

