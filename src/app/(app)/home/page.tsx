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
import { User, Bell, Plus, ChevronRight } from 'lucide-react'
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
    <div className="min-h-screen bg-[#FDF8F3]">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#FDF8F3]/95 backdrop-blur-sm px-5 pt-12 pb-4">
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

      {/* ── CONTENUTO ─────────────────────────────────────────────────────── */}
      <div className="space-y-8 px-5 py-4 pb-32">

        {/* ── ANIMALI ───────────────────────────────────────────────────── */}
        {nessunAnimale ? (
          <Link href="/animali/nuovo">
            <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-amber-200 bg-white py-10 text-center active:scale-[0.98] transition-transform">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <Plus className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Aggiungi il tuo primo animale</p>
                <p className="mt-0.5 text-xs text-gray-400">Tocca per iniziare 🐾</p>
              </div>
            </div>
          </Link>
        ) : (
          <section>
            <div className="-mx-5 flex gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {animaliList.map(a => {
                const iniziale = a.nome.charAt(0).toUpperCase()
                const colori = [
                  'from-amber-300 to-orange-400',
                  'from-rose-300 to-pink-400',
                  'from-teal-300 to-emerald-400',
                  'from-violet-300 to-purple-400',
                  'from-sky-300 to-blue-400',
                  'from-lime-300 to-green-400',
                ]
                const colore = colori[a.nome.charCodeAt(0) % colori.length]
                return (
                  <Link
                    key={a.id}
                    href={`/animali/${a.id}`}
                    className="flex min-w-[80px] flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    {a.foto_url ? (
                      <img
                        src={a.foto_url}
                        alt={a.nome}
                        className="h-20 w-20 rounded-full border-[3px] border-white object-cover shadow-md"
                      />
                    ) : (
                      <div className={cn(
                        'flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br shadow-md',
                        colore
                      )}>
                        <span className="text-2xl font-bold text-white">{iniziale}</span>
                      </div>
                    )}
                    <span className="max-w-[80px] truncate text-center text-sm font-semibold text-gray-700">
                      {a.nome}
                    </span>
                  </Link>
                )
              })}

              {/* Pulsante aggiungi */}
              <Link
                href="/animali/nuovo"
                className="flex min-w-[80px] flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-amber-300 bg-white">
                  <Plus className="h-6 w-6 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-amber-500">Aggiungi</span>
              </Link>
            </div>
          </section>
        )}

        {/* ── PROSSIMI IMPEGNI ──────────────────────────────────────────── */}
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
                      scaduta
                        ? 'border-red-200 bg-red-50'
                        : imminente
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-gray-100 bg-white'
                    )}
                  >
                    <div className={cn(
                      'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl',
                      scaduta   ? 'bg-red-100' :
                      imminente ? 'bg-amber-100' :
                                  'bg-gray-50'
                    )}>
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wide',
                        scaduta   ? 'text-red-500' :
                        imminente ? 'text-amber-600' :
                                    'text-gray-400'
                      )}>
                        {formatData(s.data)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-800">{s.titolo}</p>
                        {scaduta && (
                          <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Scaduto
                          </span>
                        )}
                        {!scaduta && imminente && (
                          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Urgente
                          </span>
                        )}
                      </div>
                      {s.animali && (
                        <p className="mt-0.5 text-xs text-gray-400">{s.animali.nome}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── TERAPIE ATTIVE ────────────────────────────────────────────── */}
        {terapieList.length > 0 && (
          <section>
            <SectionHeader titolo="Terapie attive" linkHref="/terapie" linkLabel="Vedi tutti" />
            <div className="space-y-2.5">
              {terapieList.map(terapia => (
                <Link
                  key={terapia.id}
                  href={`/terapie/${terapia.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-colors active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                    <span className="text-xl">💊</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{terapia.nome_farmaco}</p>
                    {terapia.animali && (
                      <p className="mt-0.5 text-xs text-gray-400">{terapia.animali.nome}</p>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 text-xs text-gray-400">
                    dal {formatData(terapia.data_inizio)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── ULTIMI DOCUMENTI ──────────────────────────────────────────── */}
        {documentiList.length > 0 && (
          <section>
            <SectionHeader titolo="Ultimi documenti" linkHref="/documenti" linkLabel="Vedi tutti" />
            <div className="space-y-2.5">
              {documentiList.map((d: DocumentoConAnimale) => (
                <Link
                  key={d.id}
                  href={`/documenti/${d.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-colors active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <span className="text-xl">📄</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{d.titolo}</p>
                    {d.animali && (
                      <p className="mt-0.5 text-xs text-gray-400">{d.animali.nome}</p>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 text-xs text-gray-400">
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