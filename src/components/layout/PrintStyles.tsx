'use client';

export function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        /* Hide navigation elements */
        aside,
        header,
        footer,
        nav,
        [class*="Sidebar"],
        [class*="Header"],
        [class*="Footer"],
        .no-print {
          display: none !important;
        }
        
        /* Remove margins and padding for clean print */
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        
        /* Full width for main content */
        main {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        /* Remove container padding */
        main > div {
          padding: 0 !important;
          max-width: 100% !important;
        }
        
        /* Print break support */
        .print-break {
          page-break-after: always;
        }
      }
    `}</style>
  );
}



