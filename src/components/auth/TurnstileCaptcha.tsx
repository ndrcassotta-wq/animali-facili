'use client'

import Script from 'next/script'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          theme?: 'auto' | 'light' | 'dark'
          size?: 'normal' | 'compact' | 'flexible'
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

type TurnstileCaptchaProps = {
  onTokenChange: (token: string | null) => void
  resetKey?: number
  className?: string
  enabled?: boolean
}

export function TurnstileCaptcha({
  onTokenChange,
  resetKey = 0,
  className,
  enabled = true,
}: TurnstileCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const widgetDomId = useId().replace(/:/g, '_')
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.turnstile) {
      setScriptReady(true)
    }
  }, [])

  const renderWidget = useCallback(() => {
    if (!enabled || !siteKey || !scriptReady || !window.turnstile || !containerRef.current) {
      return
    }

    if (widgetIdRef.current) return

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'auto',
      size: 'flexible',
      callback: (token: string) => {
        onTokenChange(token)
      },
      'expired-callback': () => {
        onTokenChange(null)
        if (widgetIdRef.current) {
          window.turnstile?.reset(widgetIdRef.current)
        }
      },
      'error-callback': () => {
        onTokenChange(null)
      },
    })
  }, [enabled, onTokenChange, scriptReady, siteKey])

  useEffect(() => {
    renderWidget()

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [renderWidget])

  useEffect(() => {
    if (!widgetIdRef.current || !window.turnstile) return
    onTokenChange(null)
    window.turnstile.reset(widgetIdRef.current)
  }, [resetKey, onTokenChange])

  if (!enabled || !siteKey) return null

  return (
    <>
      <Script
        id="cf-turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div id={widgetDomId} ref={containerRef} className={className} />
    </>
  )
}