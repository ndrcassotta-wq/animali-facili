'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RecuperoPasswordPage() {
  const [email, setEmail] = useState('')
  const [stato, setStato] = useState<'idle' | 'loading' | 'inviato' | 'errore'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStato('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/aggiorna-password`,
    })
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

      {stato === 'errore' && (
        <p className="text-sm text-destructive text-center">
          Qualcosa è andato storto. Riprova.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={stato === 'loading' || !email}>
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