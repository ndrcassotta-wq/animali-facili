import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { formatData, isImminente, isScaduta } from '@/lib/utils/date'
import {
  asScadenzeConAnimale,
  asEventiConAnimale,
  asDocumentiConAnimale,
  type ScadenzaConAnimale,
  type EventoConAnimale,
  type DocumentoConAnimale,
} from '@/lib/types/query.types'
import type { Animale } from '@/lib/types/query.types'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: animaliRaw },
    { data: scadenzeRaw },
    { data: eventiRaw },
    { data: documentiRaw },
  ] = await Promise.all([
    supabase
      .from('animali')
      .select('id, nome, categoria, foto_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('scadenze')
      .select('id, titolo, data, tipo, stato, animali(nome)')
      .eq('stato', 'attiva')
      .order('data', { ascending: true })
      .limit(5),
    supabase
      .from('eventi')
      .select('id, titolo, tipo, data, animali(nome)')
      .order('data', { ascending: false })
      .limit(5),
    supabase
      .from('documenti')
      .select('id, titolo, categoria, created_at, animali(nome)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const animaliList   = (animaliRaw ?? []) as Pick<Animale, 'id' | 'nome' | 'categoria' | 'foto_url'>[]
  const scadenzeList  = asScadenzeConAnimale(scadenzeRaw)
  const eventiList    = asEventiConAnimale(eventiRaw)
  const documentiList = asDocumentiConAnimale(documentiRaw)
  const nessunAnimale = animaliList.length === 0

  return (
    <div>
      {/* Header personalizzato con logo */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-animali-facili.png"
            alt="Animali Facili"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-base font-semibold">Animali Facili</span>
        </div>
        <Link href="/profilo" aria-label="Profilo utente">
          <User className="w-5 h-5 text-muted-foreground" />
        </Link>
      </header>

      <div className="px-4 py-4 space-y-6">

        {nessunAnimale && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Non hai ancora aggiunto nessun animale.
            </p>
            <Button asChild size="sm">
              <Link href="/animali/nuovo">Aggiungi il tuo animale</Link>
            </Button>
          </div>
        )}

        {!nessunAnimale && (
          <section>
            <SectionHeader titolo="I tuoi animali" linkHref="/animali" linkLabel="Vedi tutti" />
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
              {animaliList.map(a => (
                <Link
                  key={a.id}
                  href={`/animali/${a.id}`}
                  className="flex-none flex flex-col items-center gap-1.5 w-16"
                >
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {a.foto_url
                      ? <img src={a.foto_url} alt={a.nome} width={56} height={56} className="w-full h-full object-cover" />
                      : <span className="text-xl" role="img" aria-label={a.categoria}>{iconaCategoria(a.categoria)}</span>
                    }
                  </div>
                  <span className="text-xs text-center truncate w-full">{a.nome}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {scadenzeList.length > 0 && (
          <section>
            <SectionHeader titolo="Prossime scadenze" linkHref="/scadenze" linkLabel="Vedi tutte" />
            <div className="space-y-2">
              {scadenzeList.map((s: ScadenzaConAnimale) => {
                const scaduta   = isScaduta(s.data)
                const imminente = isImminente(s.data)
                return (
                  <Link
                    key={s.id}
                    href={`/scadenze/${s.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.titolo}</p>
                      {s.animali && <p className="text-xs text-muted-foreground">{s.animali.nome}</p>}
                    </div>
                    <span className={cn(
                      'text-xs font-medium shrink-0 ml-3',
                      scaduta   ? 'text-destructive' :
                      imminente ? 'text-amber-600 dark:text-amber-400' :
                                  'text-muted-foreground'
                    )}>
                      {formatData(s.data)}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {eventiList.length > 0 && (
          <section>
            <SectionHeader titolo="Ultimi eventi" />
            <div className="space-y-2">
              {eventiList.map((ev: EventoConAnimale) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {ev.titolo ?? labelTipoEvento(ev.tipo)}
                    </p>
                    {ev.animali && <p className="text-xs text-muted-foreground">{ev.animali.nome}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">
                    {formatData(ev.data)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {documentiList.length > 0 && (
          <section>
            <SectionHeader titolo="Ultimi documenti" linkHref="/documenti" linkLabel="Vedi tutti" />
            <div className="space-y-2">
              {documentiList.map((d: DocumentoConAnimale) => (
                <Link
                  key={d.id}
                  href={`/documenti/${d.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.titolo}</p>
                    {d.animali && <p className="text-xs text-muted-foreground">{d.animali.nome}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">
                    {labelCategoriaDoc(d.categoria)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function SectionHeader({
  titolo,
  linkHref,
  linkLabel,
}: {
  titolo: string
  linkHref?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {titolo}
      </h2>
      {linkHref && linkLabel && (
        <Link href={linkHref} className="text-xs text-muted-foreground underline underline-offset-4">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

function iconaCategoria(categoria: string): string {
  const m: Record<string, string> = {
    cani: '🐕', gatti: '🐈', pesci: '🐟', uccelli: '🦜',
    rettili: '🦎', piccoli_mammiferi: '🐹', altri_animali: '🐾',
  }
  return m[categoria] ?? '🐾'
}

function labelTipoEvento(tipo: string): string {
  const m: Record<string, string> = {
    visita: 'Visita', trattamento: 'Trattamento', controllo: 'Controllo',
    aggiornamento_peso: 'Peso aggiornato', analisi_esame: 'Analisi',
    nota: 'Nota', altro: 'Evento',
  }
  return m[tipo] ?? 'Evento'
}

function labelCategoriaDoc(categoria: string): string {
  const m: Record<string, string> = {
    ricetta: 'Ricetta', referto: 'Referto', analisi: 'Analisi',
    certificato: 'Certificato', documento_sanitario: 'Doc. sanitario',
    ricevuta: 'Ricevuta', altro: 'Documento',
  }
  return m[categoria] ?? 'Documento'
}