'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/home'
  const safeNext = isSafeRedirect(next) ? next : '/home'

  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [mostraPassword, setMostraPassword] = useState(false)

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
      email: data.email,
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

    const supabase = createClient()

    try {
      const { Browser } = await import('@capacitor/browser')

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

      await Browser.open({
        url: data.url,
        windowName: '_self',
      })

      Browser.addListener('browserFinished', async () => {
        let tentativi = 0
        const intervallo = setInterval(async () => {
          tentativi++
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData.session) {
            clearInterval(intervallo)
            router.push('/home')
            router.refresh()
            setLoadingGoogle(false)
          } else if (tentativi >= 10) {
            clearInterval(intervallo)
            setErroreSrv('Login non completato. Riprova.')
            setLoadingGoogle(false)
          }
        }, 1000)
      })
    } catch {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', safeNext)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      })

      if (error) {
        setErroreSrv('Errore durante il login con Google. Riprova.')
        setLoadingGoogle(false)
      }
    }
  }

  const isAnyLoading = isSubmitting || loadingGoogle

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full border-border/80 bg-white text-foreground shadow-sm hover:bg-muted/40 dark:bg-background"
        onClick={handleGoogle}
        disabled={isAnyLoading}
      >
        <span className="flex items-center justify-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.239 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.167 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.091 26.715 36 24 36c-5.218 0-9.62-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
            />
          </svg>
          <span>{loadingGoogle ? 'Reindirizzamento...' : 'Continua con Google'}</span>
        </span>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">oppure</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nome@esempio.it"
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
            disabled={isAnyLoading}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={mostraPassword ? 'text' : 'password'}
              placeholder="La tua password"
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              disabled={isAnyLoading}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setMostraPassword((prev) => !prev)}
              disabled={isAnyLoading}
              aria-label={
                mostraPassword ? 'Nascondi password' : 'Mostra password'
              }
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors active:scale-95 disabled:opacity-50"
            >
              {mostraPassword ? (
                <EyeOff size={18} strokeWidth={2.2} />
              ) : (
                <Eye size={18} strokeWidth={2.2} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        {erroreSrv && (
          <p className="text-center text-sm text-destructive">{erroreSrv}</p>
        )}

        <Button type="submit" className="h-11 w-full" disabled={isAnyLoading}>
          {isSubmitting ? 'Accesso...' : 'Accedi'}
        </Button>

        <div className="flex flex-col items-center gap-2 pt-1 text-sm text-muted-foreground">
          <Link
            href="/recupero-password"
            className="text-foreground underline underline-offset-4"
          >
            Password dimenticata?
          </Link>
          <span>
            Non hai un account?{' '}
            <Link
              href="/registrazione"
              className="text-foreground underline underline-offset-4"
            >
              Registrati
            </Link>
          </span>
        </div>
      </form>
    </div>
  )
}