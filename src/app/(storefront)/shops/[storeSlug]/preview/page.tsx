/**
 * Customizer Module - Preview Mode Page
 * דף תצוגה מקדימה של עמוד עם הגדרות draft
 */

import { getPageConfig } from '@/lib/customizer/getPageConfig';
import { getStoreBySlug } from '@/lib/utils/store';
import { DynamicSection } from '@/components/storefront/DynamicSection';
import { PageType } from '@/lib/customizer/types';
import { notFound } from 'next/navigation';

interface PreviewPageProps {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ token?: string; page?: string; handle?: string }>;
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { storeSlug } = await params;
  const { token, page, handle } = await searchParams;

  // TODO: Validate preview token properly
  if (!token || token !== 'preview-token-placeholder') {
    notFound();
  }

  // Get store
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  const pageType = (page || 'home') as PageType;

  // Read DRAFT config from DB
  const config = await getPageConfig(store.id, pageType, handle, true);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">עמוד לא נמצא</h1>
          <p className="text-gray-600">לא נמצאו הגדרות עבור עמוד זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Preview Mode Banner */}
      <div className="bg-yellow-500 text-white text-center py-2 text-sm font-medium">
        👁️ מצב תצוגה מקדימה - שינויים לא פורסמו
      </div>

      {/* Render Sections */}
      {config.section_order.map((sectionId) => {
        const section = config.sections[sectionId];
        if (!section) return null;

        return (
          <DynamicSection
            key={sectionId}
            section={section}
            globalSettings={config.global_settings}
          />
        );
      })}

      {/* Custom CSS */}
      {config.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: config.custom_css }} />
      )}

      {/* Custom JS */}
      {config.custom_js && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){${config.custom_js}})();`,
          }}
        />
      )}
    </div>
  );
}

