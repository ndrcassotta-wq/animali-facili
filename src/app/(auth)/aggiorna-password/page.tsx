'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AggiornaPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [conferma, setConferma] = useState('')
  const [stato, setStato] = useState<'idle' | 'loading' | 'errore' | 'completato'>('idle')
  const [errore, setErrore] = useState<string | null>(null)
  const [sessioneValida, setSessioneValida] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setSessioneValida(!!data.session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrore(null)

    if (password.length < 8) {
      setErrore('La password deve essere di almeno 8 caratteri.')
      return
    }
    if (password !== conferma) {
      setErrore('Le password non coincidono.')
      return
    }

    setStato('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrore('Errore durante l\'aggiornamento. Riprova.')
      setStato('errore')
      return
    }

    setStato('completato')
    setTimeout(() => router.push('/login'), 2000)
  }

  if (!sessioneValida) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Link non valido o scaduto.
        </p>
        <a href="/recupero-password" className="text-sm underline underline-offset-4">
          Richiedi un nuovo link
        </a>
      </div>
    )
  }

  if (stato === 'completato') {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">Password aggiornata.</p>
        <p className="text-xs text-muted-foreground">Reindirizzamento al login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="password">Nuova password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Minimo 8 caratteri"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={stato === 'loading'}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="conferma">Conferma password</Label>
        <Input
          id="conferma"
          type="password"
          placeholder="Ripeti la password"
          value={conferma}
          onChange={e => setConferma(e.target.value)}
          disabled={stato === 'loading'}
        />
      </div>

      {errore && <p className="text-sm text-destructive text-center">{errore}</p>}

      <Button type="submit" className="w-full" disabled={stato === 'loading'}>
        {stato === 'loading' ? 'Aggiornamento...' : 'Aggiorna password'}
      </Button>
    </form>
  )
}