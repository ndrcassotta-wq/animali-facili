'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'

type NotificationPayload = {
  entityType?: string
  entityId?: string
  impegnoId?: string
  route?: string | null
}

function getRouteFromPayload(payload?: NotificationPayload | null): string | null {
  if (!payload) return null

  if (typeof payload.route === 'string' && payload.route.startsWith('/')) {
    return payload.route
  }

  const entityType = payload.entityType ?? (payload.impegnoId ? 'impegno' : undefined)
  const entityId = payload.entityId ?? payload.impegnoId

  if (entityType === 'impegno' && entityId) {
    return `/impegni/${entityId}`
  }

  return null
}

function getRouteFromUrl(url?: string | null): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)

    const explicitRoute = parsed.searchParams.get('route')
    if (explicitRoute && explicitRoute.startsWith('/')) {
      return explicitRoute
    }

    const type = parsed.searchParams.get('type')
    const id =
      parsed.searchParams.get('id') ??
      parsed.searchParams.get('entityId') ??
      parsed.searchParams.get('impegnoId')

    if (type === 'impegno' && id) {
      return `/impegni/${id}`
    }

    if (parsed.pathname.startsWith('/impegni/')) {
      return parsed.pathname
    }

    return null
  } catch {
    return null
  }
}

export function NotificationTapHandler() {
  const router = useRouter()
  const lastNavigationKeyRef = useRef<string>('')

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let isMounted = true
    let removeNotificationListener: (() => Promise<void>) | undefined
    let removeAppUrlListener: (() => Promise<void>) | undefined

    const navigateOnce = (navigationKey: string, route: string | null) => {
      if (!route) return
      if (lastNavigationKeyRef.current === navigationKey) return

      lastNavigationKeyRef.current = navigationKey
      router.replace(route)
    }

    const setup = async () => {
      const notificationListener = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (event) => {
          const notification = event.notification as typeof event.notification & {
            extra?: NotificationPayload
            data?: NotificationPayload
          }

          const payload = notification.data ?? notification.extra ?? {}
          const route = getRouteFromPayload(payload)

          if (!route) return

          const navigationKey = `notification:${notification.id}:${route}`
          navigateOnce(navigationKey, route)
        }
      )

      if (!isMounted) {
        await notificationListener.remove()
        return
      }

      removeNotificationListener = () => notificationListener.remove()

      const launch = await App.getLaunchUrl()
      const launchRoute = getRouteFromUrl(launch?.url)

      if (launch?.url && launchRoute) {
        navigateOnce(`launch:${launch.url}`, launchRoute)
      }

      const appUrlListener = await App.addListener('appUrlOpen', ({ url }) => {
        const route = getRouteFromUrl(url)
        if (!route) return

        navigateOnce(`appUrlOpen:${url}`, route)
      })

      if (!isMounted) {
        await appUrlListener.remove()
        return
      }

      removeAppUrlListener = () => appUrlListener.remove()
    }

    void setup()

    return () => {
      isMounted = false
      if (removeNotificationListener) void removeNotificationListener()
      if (removeAppUrlListener) void removeAppUrlListener()
    }
  }, [router])

  return null
}