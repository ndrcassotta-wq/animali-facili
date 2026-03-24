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
        const hashIndex = url.indexOf('#')
        if (hashIndex === -1) return

        const hash = url.slice(hashIndex + 1)
        const params = new URLSearchParams(hash)

        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) return

        await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        try {
          await Browser.close()
        } catch {}

        window.location.href = '/home'
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