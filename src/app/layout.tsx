import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quickshop3 - פלטפורמת SaaS להקמת חנויות',
  description: 'פלטפורמת SaaS מודרנית להקמת וניהול חנויות וירטואליות',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@100..900&family=Pacifico&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
