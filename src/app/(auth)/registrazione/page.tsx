'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useForm } from '@/hooks/useForm'
import { registrazioneSchema } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegistrazionePage() {
  const router = useRouter()
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [confermaEmail, setConfermaEmail] = useState(false)
  const { values, errors, isSubmitting, setValue, validate, setSubmitting } =
    useForm(registrazioneSchema, { nome: '', email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)
    const data = validate()
    if (!data) return

    setSubmitting(true)
    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { nome: data.nome } },
    })
    setSubmitting(false)

    if (error) {
  setErroreSrv(error.message)
  return
}

    if (authData.session) {
      router.push('/onboarding')
    } else {
      setConfermaEmail(true)
    }
  }

  if (confermaEmail) {
    return (
      <div className="text-center space-y-3">
        <h2 className="text-lg font-semibold">Controlla la tua email</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Abbiamo inviato un link di conferma a{' '}
          <strong>{values.email}</strong>.
          Clicca il link per attivare il tuo account.
        </p>
        <p className="text-xs text-muted-foreground">
          Già confermato?{' '}
          <Link href="/login" className="underline underline-offset-4 text-foreground">
            Accedi
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          placeholder="Il tuo nome"
          value={values.nome}
          onChange={e => setValue('nome', e.target.value)}
          disabled={isSubmitting}
        />
        {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
      </div>

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
          placeholder="Minimo 8 caratteri"
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
        {isSubmitting ? 'Registrazione...' : 'Crea account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Hai già un account?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Accedi
        </Link>
      </p>
    </form>
  )
}