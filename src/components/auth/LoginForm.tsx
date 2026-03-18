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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/home'
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
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

    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="nome@esempio.it"
          value={values.email}
          onChange={e => setValue('email', e.target.value)}
          disabled={isSubmitting}
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
          disabled={isSubmitting}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      {erroreSrv && (
        <p className="text-sm text-destructive text-center">{erroreSrv}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
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
  )
}