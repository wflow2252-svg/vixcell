import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VIXCELL AI — Build websites with AI',
  description: 'Full-stack AI website builder. Describe what you need, get a complete site in seconds. 100% local, free, no API keys.',
  metadataBase: new URL('https://vixcell.com'),
  openGraph: {
    title: 'VIXCELL AI',
    description: 'Build complete websites with AI — instantly.',
    url: 'https://vixcell.com',
    siteName: 'VIXCELL',
    locale: 'en_US',
    type: 'website',
  },
  icons: { icon: '/logo.png' },
}

export const viewport: Viewport = {
  themeColor: '#0c0c0e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Instrument+Serif:ital,wght@0,400;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-brand-bg text-brand-text antialiased">
        {children}
      </body>
    </html>
  )
}
