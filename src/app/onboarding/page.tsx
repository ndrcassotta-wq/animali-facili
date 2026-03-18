import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: animali } = await supabase
    .from('animali')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (animali && animali.length > 0) redirect('/home')

  const { data: profilo } = await supabase
    .from('profili')
    .select('nome')
    .eq('id', user.id)
    .single()

  const nome = (profilo as { nome: string } | null)?.nome ?? ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6 max-w-xs">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Ciao{nome ? `, ${nome}` : ''}!
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Benvenuto su Animali Facili. Inizia aggiungendo il profilo
            del tuo primo animale.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/animali/nuovo">Aggiungi il tuo animale</Link>
        </Button>
      </div>
    </div>
  )
}