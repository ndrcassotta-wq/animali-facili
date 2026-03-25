import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatData, isImminente, isScaduta } from '@/lib/utils/date'
import {
  asImpegniConAnimale,
  asDocumentiConAnimale,
  type ImpegnoConAnimale,
  type DocumentoConAnimale,
} from '@/lib/types/query.types'
import type { Animale } from '@/lib/types/query.types'
import { User, Bell, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type HomeTerapia = {
  id: string
  nome_farmaco: string
  stato: 'attiva' | 'conclusa' | 'archiviata'
  data_inizio: string
  animali: { nome: string } | null
}

// ─── Colori placeholder ───────────────────────────────────────────────────────

const COLORI = [
  'from-amber-300 to-orange-400',
  'from-rose-300 to-pink-400',
  'from-teal-300 to-emerald-400',
  'from-violet-300 to-purple-400',
  'from-sky-300 to-blue-400',
  'from-lime-300 to-green-400',
]

function colorePerNome(nome: string) {
  return COLORI[nome.charCodeAt(0) % COLORI.length]
}

// ─── Layout griglia animali ───────────────────────────────────────────────────
// Restituisce le righe: ogni riga è un array di indici degli animali

function calcolaRighe(n: number): number[][] {
  if (n === 1) return [[0]]
  if (n === 2) return [[0], [1]]
  if (n === 3) return [[0], [1, 2]]
  if (n === 4) return [[0, 1], [2, 3]]
  if (n === 5) return [[0, 1], [2, 3, 4]]
  if (n === 6) return [[0, 1, 2], [3, 4, 5]]
  // 7+: righe da 3
  const righe: number[][] = []
  for (let i = 0; i < n; i += 3) {
    righe.push(
      Array.from({ length: Math.min(3, n - i) }, (_, j) => i + j)
    )
  }
  return righe
}

// ─── Dimensione cerchio in base al numero di animali ─────────────────────────

function dimensioneCerchio(n: number): string {
  if (n === 1) return 'h-44 w-44'
  if (n === 2) return 'h-40 w-40'
  if (n === 3) return 'h-36 w-36'
  if (n <= 4)  return 'h-36 w-36'
  if (n <= 6)  return 'h-28 w-28'
  return 'h-24 w-24'
}

function dimensioneTesto(n: number): string {
  if (n <= 2) return 'text-base'
  if (n <= 4) return 'text-sm'
  return 'text-xs'
}

// ─── Componente singolo animale ───────────────────────────────────────────────

function AvatarAnimale({
  animale,
  sizeCls,
  textCls,
}: {
  animale: Pick<Animale, 'id' | 'nome' | 'categoria' | 'foto_url'>
  sizeCls: string
  textCls: string
}) {
  const iniziale = animale.nome.charAt(0).toUpperCase()
  const colore   = colorePerNome(animale.nome)

  return (
    <Link
      href={`/animali/${animale.id}`}
      className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
    >
      {animale.foto_url ? (
        <img
          src={animale.foto_url}
          alt={animale.nome}
          className={cn(sizeCls, 'rounded-full border-4 border-white object-cover shadow-xl')}
        />
      ) : (
        <div className={cn(
          sizeCls,
          'rounded-full border-4 border-white bg-gradient-to-br shadow-xl flex items-center justify-center',
          colore
        )}>
          <span className="font-bold text-white" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
            {iniziale}
          </span>
        </div>
      )}
      <span className={cn('font-semibold text-gray-800 max-w-[120px] truncate text-center', textCls)}>
        {animale.nome}
      </span>
    </Link>
  )
}

// ─── Griglia animali ──────────────────────────────────────────────────────────

function GrigliaAnimali({
  animali,
}: {
  animali: Pick<Animale, 'id' | 'nome' | 'categoria' | 'foto_url'>[]
}) {
  const n       = animali.length
  const righe   = calcolaRighe(n)
  const sizeCls = dimensioneCerchio(n)
  const textCls = dimensioneTesto(n)

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {righe.map((riga, ri) => (
        <div key={ri} className="flex items-center justify-center gap-8 w-full">
          {riga.map(idx => (
            <AvatarAnimale
              key={animali[idx].id}
              animale={animali[idx]}
              sizeCls={sizeCls}
              textCls={textCls}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

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
    <div className="flex min-h-screen flex-col bg-[#FDF8F3]">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-animali-facili.png"
              alt="Animali Facili"
              width={44}
              height={44}
              className="rounded-2xl shadow-md"
            />
            <span className="text-xl font-extrabold tracking-tight text-gray-900">
              Animali Facili
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/notifiche" aria-label="Notifiche">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
                <Bell className="h-5 w-5 text-gray-500" />
                {badge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
            </Link>
            <Link href="/profilo" aria-label="Profilo utente">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ── SEZIONE ANIMALI — occupa tutto lo spazio disponibile ────────── */}
      <section className="flex flex-1 items-center justify-center px-6 py-6">
        {nessunAnimale ? (
          <Link href="/animali/nuovo">
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-amber-200 bg-white px-10 py-14 text-center active:scale-[0.98] transition-transform">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                <span className="text-4xl">🐾</span>
              </div>
              <div>
                <p className="text-base font-bold text-gray-700">Aggiungi il tuo primo animale</p>
                <p className="mt-1 text-sm text-gray-400">Tocca per iniziare</p>
              </div>
            </div>
          </Link>
        ) : (
          <GrigliaAnimali animali={animaliList} />
        )}
      </section>

      {/* ── SEZIONI SECONDARIE (impegni, terapie, documenti) ────────────── */}
      {(impegniList.length > 0 || terapieList.length > 0 || documentiList.length > 0) && (
        <div className="shrink-0 space-y-6 px-5 pb-32">

          {impegniList.length > 0 && (
            <section>
              <SectionHeader titolo="Prossimi impegni" linkHref="/impegni" linkLabel="Vedi tutti" />
              <div className="space-y-2.5">
                {impegniList.map((s: ImpegnoConAnimale) => {
                  const scaduta   = isScaduta(s.data)
                  const imminente = isImminente(s.data)
                  return (
                    <Link
                      key={s.id}
                      href={`/impegni/${s.id}`}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border p-4 transition-colors active:scale-[0.98]',
                        scaduta   ? 'border-red-200 bg-red-50' :
                        imminente ? 'border-amber-200 bg-amber-50' :
                                    'border-gray-100 bg-white'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-800">{s.titolo}</p>
                          {scaduta && (
                            <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">Scaduto</span>
                          )}
                          {!scaduta && imminente && (
                            <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">Urgente</span>
                          )}
                        </div>
                        {s.animali && (
                          <p className="mt-0.5 text-xs text-gray-400">{s.animali.nome}</p>
                        )}
                      </div>
                      <span className={cn(
                        'ml-2 shrink-0 text-xs font-medium',
                        scaduta   ? 'text-red-500' :
                        imminente ? 'text-amber-600' :
                                    'text-gray-400'
                      )}>
                        {formatData(s.data)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {terapieList.length > 0 && (
            <section>
              <SectionHeader titolo="Terapie attive" linkHref="/terapie" linkLabel="Vedi tutti" />
              <div className="space-y-2.5">
                {terapieList.map(terapia => (
                  <Link
                    key={terapia.id}
                    href={`/terapie/${terapia.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:scale-[0.98]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                      <span className="text-lg">💊</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">{terapia.nome_farmaco}</p>
                      {terapia.animali && (
                        <p className="mt-0.5 text-xs text-gray-400">{terapia.animali.nome}</p>
                      )}
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-gray-400">dal {formatData(terapia.data_inizio)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {documentiList.length > 0 && (
            <section>
              <SectionHeader titolo="Ultimi documenti" linkHref="/documenti" linkLabel="Vedi tutti" />
              <div className="space-y-2.5">
                {documentiList.map((d: DocumentoConAnimale) => (
                  <Link
                    key={d.id}
                    href={`/documenti/${d.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:scale-[0.98]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <span className="text-lg">📄</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">{d.titolo}</p>
                      {d.animali && (
                        <p className="mt-0.5 text-xs text-gray-400">{d.animali.nome}</p>
                      )}
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-gray-400">{labelCategoriaDoc(d.categoria)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      <h2 className="text-base font-bold text-gray-800">{titolo}</h2>
      {linkHref && linkLabel && (
        <Link href={linkHref} className="text-xs font-semibold text-amber-500">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

function labelCategoriaDoc(categoria: string): string {
  const m: Record<string, string> = {
    ricetta: 'Ricetta', referto: 'Referto', analisi: 'Analisi',
    certificato: 'Certificato', documento_sanitario: 'Doc. sanitario',
    ricevuta: 'Ricevuta', altro: 'Documento',
  }
  return m[categoria] ?? 'Documento'
}