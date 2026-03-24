'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { createClient } from '@/lib/supabase/client'

export function CapacitorAuthRedirectHandler() {
  useEffect(() => {
    const supabase = createClient()

    async function handleAuthUrl(url: string) {
      if (!url.startsWith('com.animalifacili.app://')) return

      try {
        const parsedUrl = new URL(url)

        // Caso PKCE: ritorna con ?code=...
        const code = parsedUrl.searchParams.get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('Errore exchangeCodeForSession:', error)
            return
          }

          try {
            await Browser.close()
          } catch {}

          window.location.href = '/home'
          return
        }

        // Fallback: caso implicit flow con #access_token=...
        const hash = parsedUrl.hash?.startsWith('#')
          ? parsedUrl.hash.substring(1)
          : parsedUrl.hash

        if (hash) {
          const params = new URLSearchParams(hash)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })

            if (error) {
              console.error('Errore setSession:', error)
              return
            }

            try {
              await Browser.close()
            } catch {}

            window.location.href = '/home'
          }
        }
      } catch (e) {
        console.error('Errore gestione deep link auth:', e)
      }
    }

    let listenerHandle: { remove: () => Promise<void> } | null = null

    App.addListener('appUrlOpen', async ({ url }) => {
      await handleAuthUrl(url)
    }).then(handle => {
      listenerHandle = handle
    })

    App.getLaunchUrl().then(async result => {
      if (result?.url) {
        await handleAuthUrl(result.url)
      }
    })

    return () => {
      if (listenerHandle) {
        void listenerHandle.remove()
      }
    }
  }, [])

  return null
}