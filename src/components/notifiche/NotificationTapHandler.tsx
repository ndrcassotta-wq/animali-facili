'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

type NotificationPayload = {
  entityType?: string
  entityId?: string
  impegnoId?: string
  route?: string | null
}

export function NotificationTapHandler() {
  const router = useRouter()
  const lastNavigationKeyRef = useRef<string>('')

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let isMounted = true
    let removeListener: (() => void) | undefined

    const setup = async () => {
      const listener = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (event) => {
          const notification = event.notification as typeof event.notification & {
            extra?: NotificationPayload
            data?: NotificationPayload
          }

          const payload = notification.extra ?? notification.data ?? {}

          if (payload.entityType !== 'impegno') return
          if (!payload.route) return

          const navigationKey = `${notification.id}-${payload.route}`

          if (lastNavigationKeyRef.current === navigationKey) return
          lastNavigationKeyRef.current = navigationKey

          router.push(payload.route)
        }
      )

      if (!isMounted) {
        await listener.remove()
        return
      }

      removeListener = () => {
        listener.remove()
      }
    }

    setup()

    return () => {
      isMounted = false
      removeListener?.()
    }
  }, [router])

  return null
}