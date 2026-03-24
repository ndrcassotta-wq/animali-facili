'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from '@/hooks/useForm'
import { loginSchema } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function isSafeRedirect(path: string): boolean {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes(':')
  )
}

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next         = searchParams.get('next') ?? '/home'
  const safeNext     = isSafeRedirect(next) ? next : '/home'

  const [erroreSrv,     setErroreSrv]    = useState<string | null>(null)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const { values, errors, isSubmitting, setValue, validate, setSubmitting } =
    useForm(loginSchema, { email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)
    const data = validate()
    if (!data) return

    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    })
    setSubmitting(false)

    if (error) {
      setErroreSrv('Email o password non corretti.')
      return
    }

    router.push(safeNext)
    router.refresh()
  }

  async function handleGoogle() {
    setErroreSrv(null)
    setLoadingGoogle(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.animalifacili.app://home',
          skipBrowserRedirect: true,
        },
      })

      if (error || !data.url) {
        setErroreSrv('Errore durante il login con Google. Riprova.')
        setLoadingGoogle(false)
        return
      }

      // Apri il browser di Capacitor invece del browser di sistema
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({
        url: data.url,
        windowName: '_self',
      })

      // Ascolta quando il browser si chiude e ricarica la sessione
      Browser.addListener('browserFinished', async () => {
        await supabase.auth.getSession()
        router.push('/home')
        router.refresh()
        setLoadingGoogle(false)
      })

    } catch {
      setErroreSrv('Errore durante il login con Google. Riprova.')
      setLoadingGoogle(false)
    }
  }

  const isAnyLoading = isSubmitting || loadingGoogle

  return (
    <div className="space-y-4">

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={isAnyLoading}
      >
        {loadingGoogle ? 'Reindirizzamento...' : 'Continua con Google'}
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">oppure</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nome@esempio.it"
            value={values.email}
            onChange={e => setValue('email', e.target.value)}
            disabled={isAnyLoading}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="La tua password"
            value={values.password}
            onChange={e => setValue('password', e.target.value)}
            disabled={isAnyLoading}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        {erroreSrv && (
          <p className="text-sm text-destructive text-center">{erroreSrv}</p>
        )}

        <Button type="submit" className="w-full" disabled={isAnyLoading}>
          {isSubmitting ? 'Accesso...' : 'Accedi'}
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link href="/recupero-password" className="text-foreground underline underline-offset-4">
            Password dimenticata?
          </Link>
          <span>
            Non hai un account?{' '}
            <Link href="/registrazione" className="text-foreground underline underline-offset-4">
              Registrati
            </Link>
          </span>
        </div>
      </form>
    </div>
  )
}