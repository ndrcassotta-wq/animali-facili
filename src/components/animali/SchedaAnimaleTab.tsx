// src/components/animali/SchedaAnimaleTab.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  FolderOpen,
  Stethoscope,
  User,
  ArrowLeft,
  ChevronRight,
  PawPrint,
  BookOpen,
  Plus,
} from 'lucide-react'
import { TabProfilo } from '@/components/animali/TabProfilo'
import { TabImpegni } from '@/components/animali/TabImpegni'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import TabTerapie from '@/components/animali/TabTerapie'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Animale, Impegno, Documento } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

type Terapia = Database['public']['Tables']['terapie']['Row']
type SomministrazioneTerapia =
  Database['public']['Tables']['somministrazioni_terapia']['Row']
type TerapiaConUltimaSomministrazione = Terapia & {
  ultimaSomministrazione: SomministrazioneTerapia | null
}
type DiarioVoce = Database['public']['Tables']['diario_voci']['Row']

type TabId = 'home' | 'profilo' | 'impegni' | 'documenti' | 'terapie' | 'diario'

const iconaCategoria: Record<string, string> = {
  cani: '🐕',
  gatti: '🐈',
  pesci: '🐟',
  uccelli: '🦜',
  rettili: '🦎',
  piccoli_mammiferi: '🐹',
  altri_animali: '🐾',
}

const coloreCategoria: Record<string, string> = {
  cani: 'bg-amber-100',
  gatti: 'bg-orange-100',
  pesci: 'bg-sky-100',
  uccelli: 'bg-lime-100',
  rettili: 'bg-green-100',
  piccoli_mammiferi: 'bg-rose-100',
  altri_animali: 'bg-violet-100',
}

const labelCategoria: Record<string, string> = {
  cani: 'Cane',
  gatti: 'Gatto',
  pesci: 'Pesce',
  uccelli: 'Uccello',
  rettili: 'Rettile',
  piccoli_mammiferi: 'Piccolo mammifero',
  altri_animali: 'Altro animale',
}

interface Props {
  animale: Animale
  impegni: Impegno[]
  documenti: Documento[]
  terapie: TerapiaConUltimaSomministrazione[]
  diarioVoci: DiarioVoce[]
  tabIniziale: TabId
}

function QuickCard({
  title,
  subtitle,
  icon,
  onClick,
  tone,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  onClick: () => void
  tone: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex min-h-[150px] flex-col justify-between rounded-[28px] border p-5 text-left shadow-sm transition-all active:scale-[0.98]',
        tone
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
        {icon}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-extrabold">{title}</p>
          <ChevronRight
            size={18}
            strokeWidth={2.4}
            className="opacity-60 transition-transform group-active:translate-x-0.5"
          />
        </div>
        <p className="mt-1 text-xs leading-5 opacity-75">{subtitle}</p>
      </div>
    </button>
  )
}

function formatDataDiario(data: string) {
  if (!data) return ''
  return new Date(`${data}T12:00:00`).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function generaId() {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function TabDiario({
  animaleId,
  animaleNome,
  vociIniziali,
}: {
  animaleId: string
  animaleNome: string
  vociIniziali: DiarioVoce[]
}) {
  const oggi = new Date().toISOString().split('T')[0]

  const [voci, setVoci] = useState<DiarioVoce[]>(vociIniziali)
  const [mostraForm, setMostraForm] = useState(false)
  const [data, setData] = useState(oggi)
  const [titolo, setTitolo] = useState('')
  const [nota, setNota] = useState('')
  const [erroreTitolo, setErroreTitolo] = useState('')
  const [erroreNota, setErroreNota] = useState('')

  function aggiungiVoceLocale() {
    const titoloPulito = titolo.trim()
    const notaPulita = nota.trim()

    setErroreTitolo('')
    setErroreNota('')

    let hasError = false

    if (!titoloPulito) {
      setErroreTitolo('Inserisci un titolo o una categoria.')
      hasError = true
    }

    if (!notaPulita) {
      setErroreNota('Scrivi una nota.')
      hasError = true
    }

    if (hasError) return

    const nowIso = new Date().toISOString()

    const nuovaVoce: DiarioVoce = {
      id: generaId(),
      animale_id: animaleId,
      data,
      titolo: titoloPulito,
      nota: notaPulita,
      created_at: nowIso,
      updated_at: nowIso,
    }

    const next = [nuovaVoce, ...voci].sort(
      (a, b) =>
        b.data.localeCompare(a.data) ||
        b.created_at.localeCompare(a.created_at)
    )

    setVoci(next)
    setData(oggi)
    setTitolo('')
    setNota('')
    setMostraForm(false)
  }

  return (
    <div className="px-5 py-5 pb-32">
      <div className="mb-4 rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <BookOpen size={22} strokeWidth={2.2} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
              Diario
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
              Le note di {animaleNome}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Tieni traccia di peso, sintomi, cambiamenti, progressi e note
              utili nel tempo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMostraForm((prev) => !prev)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} />
          {mostraForm ? 'Chiudi' : 'Nuova voce'}
        </button>
      </div>

      {mostraForm && (
        <div className="mb-4 rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Titolo o categoria
              </Label>
              <Input
                placeholder="es. Peso, Feci molli, Umore, Nota generale..."
                value={titolo}
                onChange={(e) => {
                  setTitolo(e.target.value)
                  setErroreTitolo('')
                }}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 text-base"
              />
              {erroreTitolo && (
                <p className="text-xs font-medium text-red-500">
                  {erroreTitolo}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Nota</Label>
              <Textarea
                rows={4}
                placeholder="Scrivi cosa è successo o cosa vuoi ricordare..."
                value={nota}
                onChange={(e) => {
                  setNota(e.target.value)
                  setErroreNota('')
                }}
                className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
              />
              {erroreNota && (
                <p className="text-xs font-medium text-red-500">{erroreNota}</p>
              )}
            </div>

            <button
              type="button"
              onClick={aggiungiVoceLocale}
              className="w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
            >
              Salva voce
            </button>
          </div>
        </div>
      )}

      {voci.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#EADFD3] bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCF8F3] text-amber-600">
            <BookOpen size={24} strokeWidth={2.2} />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">
            Nessuna voce nel diario
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Inizia con una nota semplice per ricordare peso, sintomi, progressi
            o qualsiasi cambiamento utile.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {voci.map((voce) => (
            <div
              key={voce.id}
              className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-[#FCF8F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600">
                  {voce.titolo}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {formatDataDiario(voce.data)}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {voce.nota}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SchedaAnimaleTab({
  animale,
  impegni,
  documenti,
  terapie,
  diarioVoci,
  tabIniziale,
}: Props) {
  const router = useRouter()
  const [tabAttivo, setTabAttivo] = useState<TabId>(
    tabIniziale === 'profilo' ||
      tabIniziale === 'impegni' ||
      tabIniziale === 'documenti' ||
      tabIniziale === 'terapie' ||
      tabIniziale === 'diario'
      ? tabIniziale
      : 'home'
  )

  function cambiaTab(tab: TabId) {
    setTabAttivo(tab)
    const url = new URL(window.location.href)
    if (tab === 'home') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    window.history.replaceState(null, '', url.toString())
  }

  const impegniProssimi = impegni.filter((i) => i.stato === 'programmato').length
  const terapieAttive = terapie.filter((t) => t.stato === 'attiva').length
  const categoriaLabel = labelCategoria[animale.categoria] ?? 'Animale'

  if (tabAttivo !== 'home') {
    return (
      <div
        className="flex flex-col bg-[#F7F1EA]"
        style={{ minHeight: '100dvh' }}
      >
        <header className="rounded-b-[34px] bg-gradient-to-b from-[#FFF4E8] to-[#F7F1EA] px-5 pb-5 pt-10">
          <button
            onClick={() => cambiaTab('home')}
            className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-[#EEE4D9] bg-white shadow-sm active:opacity-70"
          >
            <ArrowLeft
              size={20}
              strokeWidth={2.2}
              className="text-gray-600"
            />
          </button>

          <div className="rounded-[28px] border border-[#F1E4D7] bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm',
                  !animale.foto_url &&
                    (coloreCategoria[animale.categoria] ?? 'bg-gray-100')
                )}
              >
                {animale.foto_url ? (
                  <img
                    src={animale.foto_url}
                    alt={animale.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl leading-none">
                    {iconaCategoria[animale.categoria] ?? '🐾'}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#EEE4D9] bg-[#FCF8F3] px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                    {categoriaLabel}
                  </span>
                </div>
                <p className="truncate text-lg font-extrabold text-gray-900">
                  {animale.nome}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {animale.specie}
                  {animale.razza ? ` · ${animale.razza}` : ''}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {tabAttivo === 'profilo' && <TabProfilo animale={animale} />}
          {tabAttivo === 'impegni' && (
            <TabImpegni animaleId={animale.id} impegni={impegni} />
          )}
          {tabAttivo === 'documenti' && (
            <TabDocumenti animaleId={animale.id} documenti={documenti} />
          )}
          {tabAttivo === 'terapie' && (
            <TabTerapie animaleId={animale.id} terapie={terapie} />
          )}
          {tabAttivo === 'diario' && (
            <TabDiario
              animaleId={animale.id}
              animaleNome={animale.nome}
              vociIniziali={diarioVoci}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#F7F1EA]" style={{ minHeight: '100dvh' }}>
      <div className="relative w-full overflow-hidden rounded-b-[36px]">
        <div className="relative h-[300px] w-full">
          {animale.foto_url ? (
            <img
              src={animale.foto_url}
              alt={animale.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center',
                coloreCategoria[animale.categoria] ?? 'bg-gray-100'
              )}
            >
              <span style={{ fontSize: '7rem', lineHeight: 1 }}>
                {iconaCategoria[animale.categoria] ?? '🐾'}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

          <button
            onClick={() => router.back()}
            className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm active:opacity-70"
          >
            <ArrowLeft size={20} strokeWidth={2.2} className="text-white" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {categoriaLabel}
              </span>
              {animale.sesso && animale.sesso !== 'non_specificato' ? (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold capitalize text-white backdrop-blur-sm">
                  {animale.sesso}
                </span>
              ) : null}
            </div>

            <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-white">
              {animale.nome}
            </h1>

            <p className="mt-1 text-sm text-white/85">
              {animale.specie}
              {animale.razza ? ` · ${animale.razza}` : ''}
            </p>

            {animale.data_nascita && (
              <p className="mt-1 text-xs text-white/70">
                🎂{' '}
                {new Date(animale.data_nascita).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="-mt-6 px-5 pt-0 pb-32">
        <div className="mb-4 rounded-[28px] border border-[#EADFD3] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-[#FCF8F3] px-3 py-3">
              <p className="text-lg font-extrabold text-gray-900">
                {impegniProssimi}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Impegni
              </p>
            </div>

            <div className="rounded-2xl bg-[#FCF8F3] px-3 py-3">
              <p className="text-lg font-extrabold text-gray-900">
                {terapieAttive}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Terapie attive
              </p>
            </div>

            <div className="rounded-2xl bg-[#FCF8F3] px-3 py-3">
              <p className="text-lg font-extrabold text-gray-900">
                {documenti.length}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Documenti
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <QuickCard
            title="Impegni"
            subtitle={
              impegniProssimi > 0
                ? `${impegniProssimi} programmati`
                : 'Nessuno in arrivo'
            }
            onClick={() => cambiaTab('impegni')}
            tone="border-blue-100 bg-blue-50 text-blue-900"
            icon={<Calendar size={24} strokeWidth={2} className="text-blue-600" />}
          />

          <QuickCard
            title="Terapie"
            subtitle={
              terapieAttive > 0 ? `${terapieAttive} attive` : 'Nessuna attiva'
            }
            onClick={() => cambiaTab('terapie')}
            tone="border-teal-100 bg-teal-50 text-teal-900"
            icon={
              <Stethoscope
                size={24}
                strokeWidth={2}
                className="text-teal-600"
              />
            }
          />

          <QuickCard
            title="Documenti"
            subtitle={
              documenti.length > 0
                ? `${documenti.length} salvati`
                : 'Nessun documento'
            }
            onClick={() => cambiaTab('documenti')}
            tone="border-slate-200 bg-slate-100 text-slate-800"
            icon={
              <FolderOpen
                size={24}
                strokeWidth={2}
                className="text-slate-600"
              />
            }
          />

          <QuickCard
            title="Profilo"
            subtitle="Info e dettagli"
            onClick={() => cambiaTab('profilo')}
            tone="border-violet-100 bg-violet-50 text-violet-900"
            icon={<User size={24} strokeWidth={2} className="text-violet-600" />}
          />

          <QuickCard
            title="Diario"
            subtitle="Peso, sintomi e note"
            onClick={() => cambiaTab('diario')}
            tone="border-amber-100 bg-amber-50 text-amber-900"
            icon={
              <BookOpen size={24} strokeWidth={2} className="text-amber-600" />
            }
          />
        </div>

        {animale.note && (
          <div className="mt-4 rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-3 flex items-center gap-2 text-gray-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#EEE4D9] bg-[#FCF8F3]">
                <PawPrint size={18} strokeWidth={2.1} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">
                Note
              </p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
              {animale.note}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}