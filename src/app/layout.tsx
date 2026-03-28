import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { CapacitorAuthRedirectHandler } from '@/components/CapacitorAuthRedirectHandler'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Animali Facili',
  description: 'Il tuo animale, tutto in un posto',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={geist.className}>
        <CapacitorAuthRedirectHandler />
        {children}
      </body>
    </html>
  )
}