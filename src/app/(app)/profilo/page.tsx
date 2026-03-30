import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfiloContent } from '@/components/profilo/ProfiloContent'
import type { PreferenzeNotifiche } from '@/lib/types/database.types'
import { normalizzaPreferenzeNotifiche } from '@/hooks/useNotifiche'

function formattaAnticipo(giorniPrima: number) {
  if (giorniPrima === 0) return 'Il giorno stesso'
  if (giorniPrima === 1) return '1 giorno prima'
  return `${giorniPrima} giorni prima`
}

export default async function ProfiloPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfilo } = await supabase
    .from('profili')
    .select('nome, email, preferenze_notifiche')
    .eq('id', user.id)
    .single()

  const profilo = rawProfilo as {
    nome: string
    email: string
    preferenze_notifiche: PreferenzeNotifiche | null
  } | null

  const preferenze = normalizzaPreferenzeNotifiche(
    profilo?.preferenze_notifiche ?? null
  )

  const compleanniAttivi =
    preferenze.attive && preferenze.tipi_abilitati.includes('compleanno')

  const terapieAttive =
    preferenze.attive && preferenze.tipi_abilitati.includes('terapia')

  const riepilogoCompleanni = compleanniAttivi
    ? `${formattaAnticipo(preferenze.giorni_prima)} alle ${String(
        preferenze.ore
      ).padStart(2, '0')}:00`
    : 'Disattivati'

  const riepilogoTerapie = terapieAttive
    ? `Seguono l’orario della terapia o il default delle ${String(
        preferenze.ore
      ).padStart(2, '0')}:00`
    : 'Disattivate'

  return (
    <div>
      <PageHeader titolo="Profilo" />
      <ProfiloContent
        userId={user.id}
        nomeIniziale={profilo?.nome ?? ''}
        email={profilo?.email ?? ''}
        notificheAttive={preferenze.attive}
        riepilogoCompleanni={riepilogoCompleanni}
        riepilogoTerapie={riepilogoTerapie}
      />
    </div>
  )
}