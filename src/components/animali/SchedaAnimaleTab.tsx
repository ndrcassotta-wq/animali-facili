'use client'

import { useEffect, useRef, useState } from 'react'
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
  Camera,
} from 'lucide-react'
import { TabProfilo } from '@/components/animali/TabProfilo'
import { TabImpegni } from '@/components/animali/TabImpegni'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import TabTerapie from '@/components/animali/TabTerapie'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CropFoto } from '@/components/ui/CropFoto'
import { createClient } from '@/lib/supabase/client'
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
type DiarioVoceInsert = Database['public']['Tables']['diario_voci']['Insert']

type TabId = 'home' | 'profilo' | 'impegni' | 'documenti' | 'terapie' | 'diario'

const BUCKET_FOTO_ANIMALI = 'foto-animali'
const MAX_FOTO_SIZE_MB = 10
const MAX_FOTO_SIZE_BYTES = MAX_FOTO_SIZE_MB * 1024 * 1024

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

function resetAppScrollToTop(target?: HTMLElement | null) {
  if (typeof window === 'undefined') return

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  const appRoot = document.getElementById('app-scroll-root')
  appRoot?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  target?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

function getEstensioneFile(file: File) {
  const parti = file.name.split('.')
  return parti[parti.length - 1]?.toLowerCase() || 'jpg'
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
        'group flex min-h-[132px] flex-col justify-between rounded-[28px] border p-4 text-left shadow-sm transition-all active:scale-[0.98]',
        tone
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
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

function TabDiario({
  animaleId,
  animaleNome,
  vociIniziali,
}: {
  animaleId: string
  animaleNome: string
  vociIniziali: DiarioVoce[]
}) {
  const router = useRouter()
  const oggi = new Date().toISOString().split('T')[0]

  const [voci, setVoci] = useState<DiarioVoce[]>(vociIniziali)
  const [mostraForm, setMostraForm] = useState(false)
  const [data, setData] = useState(oggi)
  const [titolo, setTitolo] = useState('')
  const [nota, setNota] = useState('')
  const [erroreTitolo, setErroreTitolo] = useState('')
  const [erroreNota, setErroreNota] = useState('')
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setVoci(vociIniziali)
  }, [vociIniziali])

  useEffect(() => {
    resetAppScrollToTop()
  }, [])

  async function aggiungiVoce() {
    const titoloPulito = titolo.trim()
    const notaPulita = nota.trim()

    setErroreTitolo('')
    setErroreNota('')
    setErroreSrv(null)

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

    setIsSaving(true)

    try {
      const supabase = createClient()

      const payload: DiarioVoceInsert = {
        animale_id: animaleId,
        data,
        titolo: titoloPulito,
        nota: notaPulita,
      }

      const response = await supabase
        .from('diario_voci')
        .insert(payload)
        .select('*')
        .single()

      const nuovaVoce = (response.data ?? null) as DiarioVoce | null
      const error = response.error

      if (error || !nuovaVoce) {
        setErroreSrv(
          `Errore durante il salvataggio: ${error?.message ?? 'sconosciuto'}`
        )
        setIsSaving(false)
        return
      }

      const next: DiarioVoce[] = [nuovaVoce, ...voci].sort(
        (a, b) =>
          b.data.localeCompare(a.data) ||
          b.created_at.localeCompare(a.created_at)
      )

      setVoci(next)
      setData(oggi)
      setTitolo('')
      setNota('')
      setMostraForm(false)
      router.refresh()
      resetAppScrollToTop()
    } catch (error) {
      console.error(error)
      setErroreSrv('Errore durante il salvataggio. Riprova.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 px-5 py-5 pb-32">
      <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
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
          onClick={() => {
            setMostraForm((prev) => !prev)
            setErroreSrv(null)
            resetAppScrollToTop()
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.5} />
          {mostraForm ? 'Chiudi' : 'Nuova voce'}
        </button>
      </div>

      {mostraForm && (
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
                className="rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-base"
              />
              {erroreNota && (
                <p className="text-xs font-medium text-red-500">{erroreNota}</p>
              )}
            </div>

            {erroreSrv && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
              </div>
            )}

            <button
              type="button"
              onClick={aggiungiVoce}
              disabled={isSaving}
              className="w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isSaving ? 'Salvataggio in corso...' : 'Salva voce'}
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
  const inputFotoRef = useRef<HTMLInputElement | null>(null)
  const contenutoInternoRef = useRef<HTMLDivElement | null>(null)

  const [tabAttivo, setTabAttivo] = useState<TabId>(
    tabIniziale === 'profilo' ||
      tabIniziale === 'impegni' ||
      tabIniziale === 'documenti' ||
      tabIniziale === 'terapie' ||
      tabIniziale === 'diario'
      ? tabIniziale
      : 'home'
  )
  const [fotoUrl, setFotoUrl] = useState<string | null>(animale.foto_url ?? null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropNome, setCropNome] = useState('')
  const [isUploadingFoto, setIsUploadingFoto] = useState(false)
  const [erroreFoto, setErroreFoto] = useState<string | null>(null)

  useEffect(() => {
    setFotoUrl(animale.foto_url ?? null)
  }, [animale.foto_url])

  useEffect(() => {
    const reset = () => resetAppScrollToTop(contenutoInternoRef.current)
    reset()
    const frame = window.requestAnimationFrame(reset)

    return () => window.cancelAnimationFrame(frame)
  }, [tabAttivo])

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

  function apriCambioFoto() {
    if (isUploadingFoto) return
    inputFotoRef.current?.click()
  }

  async function aggiornaFotoAnimale(file: File) {
    setErroreFoto(null)
    setIsUploadingFoto(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const estensione = getEstensioneFile(file)
      const filePath = `${user.id}/animali/${animale.id}/foto-${Date.now()}.${estensione}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_FOTO_ANIMALI)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        })

      if (uploadError) {
        throw new Error(`Upload foto non riuscito: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_FOTO_ANIMALI)
        .getPublicUrl(filePath)

      const nuovaFotoUrl = publicUrlData.publicUrl

      const { error: updateError } = await supabase
        .from('animali')
        .update({ foto_url: nuovaFotoUrl })
        .eq('id', animale.id)

      if (updateError) {
        throw new Error(
          `Aggiornamento foto non riuscito: ${updateError.message}`
        )
      }

      setFotoUrl(nuovaFotoUrl)
      router.refresh()
      resetAppScrollToTop(contenutoInternoRef.current)
    } catch (error) {
      console.error(error)
      setErroreFoto(
        error instanceof Error
          ? error.message
          : 'Errore durante il cambio foto. Riprova.'
      )
    } finally {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc)
      }
      setCropSrc(null)
      setIsUploadingFoto(false)
    }
  }

  const avatarFoto = fotoUrl
  const avatarFallback = iconaCategoria[animale.categoria] ?? '🐾'

  if (tabAttivo !== 'home') {
    return (
      <div
        className="flex flex-col bg-[#F7F1EA]"
        style={{ minHeight: '100dvh' }}
      >
        {cropSrc && (
          <CropFoto
            imageSrc={cropSrc}
            fileName={cropNome}
            onConfirm={aggiornaFotoAnimale}
            onCancel={() => {
              URL.revokeObjectURL(cropSrc)
              setCropSrc(null)
            }}
          />
        )}

        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null

            if (file && file.size > MAX_FOTO_SIZE_BYTES) {
              setErroreFoto(`La foto non può superare ${MAX_FOTO_SIZE_MB}MB.`)
              e.target.value = ''
              return
            }

            if (file) {
              setCropNome(file.name)
              setCropSrc(URL.createObjectURL(file))
            }

            e.target.value = ''
          }}
        />

        <header className="rounded-b-[30px] bg-gradient-to-b from-[#FFF4E8] to-[#F7F1EA] px-5 pb-4 pt-10">
          <button
            onClick={() => cambiaTab('home')}
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#EEE4D9] bg-white shadow-sm active:opacity-70"
          >
            <ArrowLeft
              size={20}
              strokeWidth={2.2}
              className="text-gray-600"
            />
          </button>

          <div className="rounded-[24px] border border-[#F1E4D7] bg-white/90 p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm',
                    !avatarFoto &&
                      (coloreCategoria[animale.categoria] ?? 'bg-gray-100')
                  )}
                >
                  {avatarFoto ? (
                    <img
                      src={avatarFoto}
                      alt={animale.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl leading-none">{avatarFallback}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={apriCambioFoto}
                  disabled={isUploadingFoto}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-gray-900 text-white shadow-md transition-all active:scale-95 disabled:opacity-60"
                  aria-label="Cambia foto"
                >
                  <Camera size={14} strokeWidth={2.4} />
                </button>
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

        <div ref={contenutoInternoRef} className="flex-1 overflow-y-auto">
          {erroreFoto && (
            <div className="px-5 pt-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-600">{erroreFoto}</p>
              </div>
            </div>
          )}

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
      {cropSrc && (
        <CropFoto
          imageSrc={cropSrc}
          fileName={cropNome}
          onConfirm={aggiornaFotoAnimale}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc)
            setCropSrc(null)
          }}
        />
      )}

      <input
        ref={inputFotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null

          if (file && file.size > MAX_FOTO_SIZE_BYTES) {
            setErroreFoto(`La foto non può superare ${MAX_FOTO_SIZE_MB}MB.`)
            e.target.value = ''
            return
          }

          if (file) {
            setCropNome(file.name)
            setCropSrc(URL.createObjectURL(file))
          }

          e.target.value = ''
        }}
      />

      <div className="relative w-full overflow-hidden rounded-b-[32px]">
        <div className="relative h-[220px] w-full">
          {avatarFoto ? (
            <img
              src={avatarFoto}
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
              <span style={{ fontSize: '5.5rem', lineHeight: 1 }}>
                {avatarFallback}
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

          <button
            type="button"
            onClick={apriCambioFoto}
            disabled={isUploadingFoto}
            className="absolute right-4 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white shadow-md backdrop-blur-sm transition-all active:scale-95 disabled:opacity-60"
            aria-label="Cambia foto"
          >
            <Camera size={18} strokeWidth={2.4} />
          </button>

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {categoriaLabel}
              </span>
              {animale.sesso && animale.sesso !== 'non_specificato' ? (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold capitalize text-white backdrop-blur-sm">
                  {animale.sesso}
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl leading-tight font-extrabold tracking-tight text-white">
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

      <div className="-mt-3 px-5 pt-0 pb-32">
        {erroreFoto && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">{erroreFoto}</p>
          </div>
        )}

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
            icon={
              <Calendar size={24} strokeWidth={2} className="text-blue-600" />
            }
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