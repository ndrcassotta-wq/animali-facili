'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TurnstileCaptcha } from '@/components/auth/TurnstileCaptcha'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RecuperoPasswordPage() {
  const [email, setEmail] = useState('')
  const [stato, setStato] = useState<'idle' | 'loading' | 'inviato' | 'errore'>('idle')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaResetKey, setCaptchaResetKey] = useState(0)

  const captchaEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    if (captchaEnabled && !captchaToken) {
      setStato('errore')
      return
    }

    setStato('loading')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/aggiorna-password`,
      ...(captchaEnabled && captchaToken ? { captchaToken } : {}),
    })

    setCaptchaToken(null)
    setCaptchaResetKey(prev => prev + 1)

    setStato(error ? 'errore' : 'inviato')
  }

  if (stato === 'inviato') {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-foreground">
          Abbiamo inviato un link a <strong>{email}</strong>.
          Controlla la tua casella email.
        </p>
        <Link href="/login" className="text-sm underline underline-offset-4">
          Torna al login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nome@esempio.it"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={stato === 'loading'}
        />
      </div>

      <TurnstileCaptcha
        onTokenChange={setCaptchaToken}
        resetKey={captchaResetKey}
        className="pt-1"
        enabled={captchaEnabled}
      />

      {stato === 'errore' && (
        <p className="text-sm text-destructive text-center">
          Qualcosa è andato storto. Riprova e completa il controllo di sicurezza.
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={stato === 'loading' || !email}
      >
        {stato === 'loading' ? 'Invio...' : 'Invia link di recupero'}
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground underline underline-offset-4">
          Torna al login
        </Link>
      </p>
    </form>
  )
}