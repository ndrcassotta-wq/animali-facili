import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { formatData, isImminente, isScaduta } from '@/lib/utils/date'
import {
  asImpegniConAnimale,
  asDocumentiConAnimale,
  type ImpegnoConAnimale,
  type DocumentoConAnimale,
} from '@/lib/types/query.types'
import type { Animale } from '@/lib/types/query.types'
import { User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

type HomeTerapia = {
  id: string
  nome_farmaco: string
  stato: 'attiva' | 'conclusa' | 'archiviata'
  data_inizio: string
  animali: { nome: string } | null
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: animaliRaw },
    { data: impegniRaw },
    { data: documentiRaw },
    { data: terapieRaw },
    { count: notificheNonLette },
  ] = await Promise.all([
    supabase
      .from('animali')
      .select('id, nome, categoria, foto_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),

    supabase
      .from('impegni')
      .select('id, titolo, data, tipo, stato, animali(nome)')
      .eq('stato', 'programmato')
      .order('data', { ascending: true })
      .limit(5),

    supabase
      .from('documenti')
      .select('id, titolo, categoria, created_at, animali(nome)')
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('terapie')
      .select('id, nome_farmaco, stato, data_inizio, animali(nome)')
      .eq('stato', 'attiva')
      .order('data_inizio', { ascending: false })
      .limit(5),

    supabase
      .from('notifiche')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('letta', false),
  ])

  const animaliList   = (animaliRaw ?? []) as Pick<Animale, 'id' | 'nome' | 'categoria' | 'foto_url'>[]
  const impegniList   = asImpegniConAnimale(impegniRaw)
  const documentiList = asDocumentiConAnimale(documentiRaw)
  const terapieList   = (terapieRaw ?? []) as HomeTerapia[]
  const nessunAnimale = animaliList.length === 0
  const badge         = notificheNonLette ?? 0

  return (
    <div>
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
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

        <div className="flex items-center gap-3">
          <Link href="/notifiche" className="relative" aria-label="Notifiche">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium leading-none text-destructive-foreground">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
          <Link href="/profilo" aria-label="Profilo utente">
            <User className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      <div className="space-y-6 px-4 py-4">

        {nessunAnimale && (
          <div className="space-y-3 rounded-xl border border-dashed border-border p-6 text-center">
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
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {animaliList.map(a => (
                <Link
                  key={a.id}
                  href={`/animali/${a.id}`}
                  className="flex w-16 flex-none flex-col items-center gap-1.5"
                >
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                    {a.foto_url
                      ? <img src={a.foto_url} alt={a.nome} width={56} height={56} className="h-full w-full object-cover" />
                      : <span className="text-xl" role="img" aria-label={a.categoria}>{iconaCategoria(a.categoria)}</span>
                    }
                  </div>
                  <span className="w-full truncate text-center text-xs">{a.nome}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {impegniList.length > 0 && (
          <section>
            <SectionHeader titolo="Prossimi impegni" linkHref="/impegni" linkLabel="Vedi tutti" />
            <div className="space-y-2">
              {impegniList.map((s: ImpegnoConAnimale) => {
                const scaduta   = isScaduta(s.data)
                const imminente = isImminente(s.data)
                return (
                  <Link
                    key={s.id}
                    href={`/impegni/${s.id}`}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-3 transition-colors',
                      scaduta
                        ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                        : imminente
                        ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30'
                        : 'border-border bg-card hover:bg-muted/50'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{s.titolo}</p>
                        {scaduta && (
                          <span className="shrink-0 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground">
                            Scaduto
                          </span>
                        )}
                        {!scaduta && imminente && (
                          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                            Urgente
                          </span>
                        )}
                      </div>
                      {s.animali && (
                        <p className="text-xs text-muted-foreground">{s.animali.nome}</p>
                      )}
                    </div>
                    <span className={cn(
                      'ml-3 shrink-0 text-xs font-medium',
                      scaduta   ? 'text-destructive' :
                      imminente ? 'text-amber-700 dark:text-amber-300' :
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

        {terapieList.length > 0 && (
          <section>
            <SectionHeader titolo="Terapie attive" />
            <div className="space-y-2">
              {terapieList.map(terapia => (
                <Link
                  key={terapia.id}
                  href={`/terapie/${terapia.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{terapia.nome_farmaco}</p>
                    {terapia.animali && (
                      <p className="text-xs text-muted-foreground">{terapia.animali.nome}</p>
                    )}
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                    dal {formatData(terapia.data_inizio)}
                  </span>
                </Link>
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
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.titolo}</p>
                    {d.animali && (
                      <p className="text-xs text-muted-foreground">{d.animali.nome}</p>
                    )}
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">
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
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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

function labelCategoriaDoc(categoria: string): string {
  const m: Record<string, string> = {
    ricetta: 'Ricetta', referto: 'Referto', analisi: 'Analisi',
    certificato: 'Certificato', documento_sanitario: 'Doc. sanitario',
    ricevuta: 'Ricevuta', altro: 'Documento',
  }
  return m[categoria] ?? 'Documento'
}