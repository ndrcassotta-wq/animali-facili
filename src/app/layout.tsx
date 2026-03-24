import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

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
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            if (typeof window === 'undefined') return;
            var hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
              var params = new URLSearchParams(hash.substring(1));
              var accessToken = params.get('access_token');
              var refreshToken = params.get('refresh_token');
              if (accessToken && refreshToken) {
                var url = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
                var projectId = url.split('//')[1].split('.')[0];
                var key = 'sb-' + projectId + '-auth-token';
                localStorage.setItem(key, JSON.stringify({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  token_type: 'bearer'
                }));
                window.location.href = '/home';
              }
            }
          })();
        `}} />
        {children}
      </body>
    </html>
  )
}