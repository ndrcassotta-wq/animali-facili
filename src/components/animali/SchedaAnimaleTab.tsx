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
  BookOpen,
  Plus,
  Camera,
  X,
} from 'lucide-react'
import { TabProfilo } from '@/components/animali/TabProfilo'
import { TabImpegni } from '@/components/animali/TabImpegni'
import { TabDocumenti } from '@/components/animali/TabDocumenti'
import TabTerapie from '@/components/animali/TabTerapie'
import TabStorico from '@/components/animali/TabStorico'
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
type DiarioVoceUpdate = Database['public']['Tables']['diario_voci']['Update']

type TabId =
  | 'home'
  | 'profilo'
  | 'impegni'
  | 'documenti'
  | 'terapie'
  | 'diario'
  | 'storico'

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
  somministrazioni: SomministrazioneTerapia[]
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

function getDataOggi() {
  return new Date().toISOString().split('T')[0]
}

function ordinaVociDiario(voci: DiarioVoce[]) {
  return [...voci].sort(
    (a, b) =>
      b.data.localeCompare(a.data) ||
      (b.created_at ?? '').localeCompare(a.created_at ?? '')
  )
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

function formatDataOraDiario(data?: string | null) {
  if (!data) return ''
  return new Date(data).toLocaleString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FotoSourceSheet({
  isOpen,
  onClose,
  onPickCamera,
  onPickGallery,
  isUploading,
  title = 'Cambia foto',
  description = 'Scegli come vuoi aggiornare la foto profilo.',
  cameraLabel = 'Usa fotocamera',
  cameraDescription = 'Scatta subito una nuova foto.',
  galleryLabel = 'Scegli da galleria',
  galleryDescription = 'Apri le foto già presenti sul telefono.',
}: {
  isOpen: boolean
  onClose: () => void
  onPickCamera: () => void
  onPickGallery: () => void
  isUploading: boolean
  title?: string
  description?: string
  cameraLabel?: string
  cameraDescription?: string
  galleryLabel?: string
  galleryDescription?: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]">
      <button
        type="button"
        aria-label="Chiudi scelta foto"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-[30px] bg-white px-5 pb-7 pt-5 shadow-[0_-18px_40px_rgba(15,23,42,0.16)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-extrabold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 active:opacity-70"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onPickCamera}
            disabled={isUploading}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] px-4 py-4 text-left transition-all active:scale-[0.99] disabled:opacity-60"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
              <Camera size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{cameraLabel}</p>
              <p className="text-xs text-gray-500">{cameraDescription}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onPickGallery}
            disabled={isUploading}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#EADFD3] bg-white px-4 py-4 text-left transition-all active:scale-[0.99] disabled:opacity-60"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F4F5] text-slate-700 shadow-sm">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{galleryLabel}</p>
              <p className="text-xs text-gray-500">{galleryDescription}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
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

  const [voci, setVoci] = useState<DiarioVoce[]>(ordinaVociDiario(vociIniziali))
  const [modalita, setModalita] = useState<'lista' | 'dettaglio' | 'form'>(
    'lista'
  )
  const [voceSelezionataId, setVoceSelezionataId] = useState<string | null>(null)
  const [voceInModificaId, setVoceInModificaId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [data, setData] = useState(getDataOggi())
  const [titolo, setTitolo] = useState('')
  const [nota, setNota] = useState('')
  const [erroreTitolo, setErroreTitolo] = useState('')
  const [erroreNota, setErroreNota] = useState('')
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditing = voceInModificaId !== null
  const voceSelezionata =
    voci.find((voce) => voce.id === voceSelezionataId) ?? null
  const puoModificareVoceSelezionata =
    !!currentUserId &&
    !!voceSelezionata &&
    voceSelezionata.created_by === currentUserId

  useEffect(() => {
    const vociOrdinate = ordinaVociDiario(vociIniziali)
    setVoci(vociOrdinate)

    if (voceSelezionataId) {
      const esiste = vociOrdinate.some((voce) => voce.id === voceSelezionataId)
      if (!esiste) {
        setVoceSelezionataId(null)
        setModalita('lista')
      }
    }
  }, [vociIniziali, voceSelezionataId])

  useEffect(() => {
    resetAppScrollToTop()
  }, [modalita])

  useEffect(() => {
    let isMounted = true

    async function caricaUtenteCorrente() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted) return
      setCurrentUserId(user?.id ?? null)
    }

    caricaUtenteCorrente()

    return () => {
      isMounted = false
    }
  }, [])

  function resetForm() {
    setData(getDataOggi())
    setTitolo('')
    setNota('')
    setErroreTitolo('')
    setErroreNota('')
    setErroreSrv(null)
    setVoceInModificaId(null)
  }

  function apriLista() {
    resetForm()
    setVoceSelezionataId(null)
    setModalita('lista')
  }

  function apriNuovaVoce() {
    resetForm()
    setModalita('form')
  }

  function apriDettaglioVoce(voce: DiarioVoce) {
    setVoceSelezionataId(voce.id)
    setVoceInModificaId(null)
    setErroreSrv(null)
    setModalita('dettaglio')
  }

  function apriModificaVoce(voce: DiarioVoce) {
    if (!currentUserId || voce.created_by !== currentUserId) {
      setErroreSrv('Puoi modificare solo le voci che hai creato tu.')
      return
    }

    setVoceSelezionataId(voce.id)
    setVoceInModificaId(voce.id)
    setData(voce.data)
    setTitolo(voce.titolo ?? '')
    setNota(voce.nota ?? '')
    setErroreTitolo('')
    setErroreNota('')
    setErroreSrv(null)
    setModalita('form')
  }

  async function salvaVoce() {
    const titoloPulito = titolo.trim()
    const notaPulita = nota.trim()

    setErroreTitolo('')
    setErroreNota('')
    setErroreSrv(null)

    let hasError = false

    if (!titoloPulito) {
      setErroreTitolo('Inserisci un titolo.')
      hasError = true
    }

    if (!notaPulita) {
      setErroreNota('Scrivi il contenuto della voce.')
      hasError = true
    }

    if (hasError) return

    setIsSaving(true)

    try {
      const supabase = createClient()

      if (isEditing && voceInModificaId) {
        if (!currentUserId) {
          setErroreSrv('Sessione non valida. Ricarica la pagina e riprova.')
          setIsSaving(false)
          return
        }

        const payload: DiarioVoceUpdate = {
          data,
          titolo: titoloPulito,
          nota: notaPulita,
          updated_at: new Date().toISOString(),
        }

        const response = await supabase
          .from('diario_voci')
          .update(payload)
          .eq('id', voceInModificaId)
          .eq('animale_id', animaleId)
          .eq('created_by', currentUserId)
          .select('*')
          .single()

        const voceAggiornata = (response.data ?? null) as DiarioVoce | null
        const error = response.error

        if (error || !voceAggiornata) {
          setErroreSrv(
            `Errore durante il salvataggio: ${error?.message ?? 'sconosciuto'}`
          )
          setIsSaving(false)
          return
        }

        const next = ordinaVociDiario(
          voci.map((voce) =>
            voce.id === voceInModificaId ? voceAggiornata : voce
          )
        )

        setVoci(next)
        setVoceSelezionataId(voceAggiornata.id)
        setVoceInModificaId(null)
        setModalita('dettaglio')
        router.refresh()
        return
      }

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

      const next = ordinaVociDiario([nuovaVoce, ...voci])

      setVoci(next)
      setVoceSelezionataId(nuovaVoce.id)
      setModalita('dettaglio')
      resetForm()
      router.refresh()
    } catch (error) {
      console.error(error)
      setErroreSrv(
        error instanceof Error
          ? error.message
          : 'Errore durante il salvataggio. Riprova.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function eliminaVoce(voce: DiarioVoce) {
    if (!currentUserId || voce.created_by !== currentUserId) {
      setErroreSrv('Puoi eliminare solo le voci che hai creato tu.')
      return
    }

    const conferma = window.confirm(
      'Vuoi eliminare questa voce del diario? Questa azione non si può annullare.'
    )

    if (!conferma) return

    setErroreSrv(null)
    setIsDeleting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('diario_voci')
        .delete()
        .eq('id', voce.id)
        .eq('animale_id', animaleId)
        .eq('created_by', currentUserId)

      if (error) {
        setErroreSrv(`Errore durante l’eliminazione: ${error.message}`)
        setIsDeleting(false)
        return
      }

      const next = voci.filter((item) => item.id !== voce.id)
      setVoci(next)
      setVoceSelezionataId(null)
      setVoceInModificaId(null)
      setModalita('lista')
      router.refresh()
    } catch (error) {
      console.error(error)
      setErroreSrv(
        error instanceof Error
          ? error.message
          : 'Errore durante l’eliminazione. Riprova.'
      )
    } finally {
      setIsDeleting(false)
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
              Uno spazio personale per osservazioni, momenti importanti e cose
              da ricordare, separato dallo Storico automatico dell’app.
            </p>
          </div>
        </div>

        {modalita === 'lista' && (
          <button
            type="button"
            onClick={apriNuovaVoce}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nuova voce
          </button>
        )}

        {modalita !== 'lista' && (
          <button
            type="button"
            onClick={apriLista}
            className="mt-5 w-full rounded-2xl border border-[#EADFD3] bg-white py-3.5 text-sm font-bold text-gray-700 transition-all active:scale-[0.98]"
          >
            Torna all’elenco
          </button>
        )}
      </div>

      {erroreSrv && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{erroreSrv}</p>
        </div>
      )}

      {modalita === 'form' && (
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-500">
              {isEditing ? 'Modifica voce' : 'Nuova voce'}
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-gray-900">
              {isEditing
                ? 'Aggiorna questa nota personale'
                : 'Aggiungi una nuova nota'}
            </h3>
          </div>

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
                Titolo
              </Label>
              <Input
                placeholder="es. Prima passeggiata tranquilla"
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
              <Label className="text-sm font-semibold text-gray-700">
                Contenuto
              </Label>
              <Textarea
                rows={6}
                placeholder="Scrivi qui la tua osservazione o il momento che vuoi ricordare..."
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

            <div className="space-y-3">
              <button
                type="button"
                onClick={salvaVoce}
                disabled={isSaving}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isSaving
                  ? 'Salvataggio in corso...'
                  : isEditing
                    ? 'Salva modifiche'
                    : 'Salva voce'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (voceSelezionataId) {
                    setModalita('dettaglio')
                    return
                  }
                  apriLista()
                }}
                disabled={isSaving}
                className="w-full rounded-2xl border border-[#EADFD3] bg-white py-3.5 text-sm font-bold text-gray-700 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {modalita === 'dettaglio' && voceSelezionata && (
        <div className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-[#FCF8F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600">
                {formatDataDiario(voceSelezionata.data)}
              </span>
              <h3 className="mt-3 text-xl font-extrabold text-gray-900">
                {voceSelezionata.titolo}
              </h3>
            </div>
          </div>

          <div className="rounded-2xl bg-[#FCF8F3] px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {voceSelezionata.nota}
            </p>
          </div>

          <div className="mt-4 space-y-1 text-xs text-gray-400">
            {voceSelezionata.created_at && (
              <p>Creata il {formatDataOraDiario(voceSelezionata.created_at)}</p>
            )}
            {voceSelezionata.updated_at &&
              voceSelezionata.updated_at !== voceSelezionata.created_at && (
                <p>
                  Modificata il {formatDataOraDiario(voceSelezionata.updated_at)}
                </p>
              )}
            {!puoModificareVoceSelezionata && (
              <p>Questa voce è stata creata da un altro account collegato.</p>
            )}
          </div>

          {puoModificareVoceSelezionata && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => apriModificaVoce(voceSelezionata)}
                disabled={isDeleting}
                className="rounded-2xl border border-[#EADFD3] bg-[#FCF8F3] py-3 text-sm font-bold text-amber-700 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                Modifica
              </button>

              <button
                type="button"
                onClick={() => eliminaVoce(voceSelezionata)}
                disabled={isDeleting}
                className="rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isDeleting ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          )}
        </div>
      )}

      {modalita === 'lista' && (
        <>
          {voci.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#EADFD3] bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCF8F3] text-amber-600">
                <BookOpen size={24} strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Nessuna voce nel diario
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Inizia con una nota semplice per ricordare un’osservazione, un
                cambiamento o un momento importante.
              </p>

              <button
                type="button"
                onClick={apriNuovaVoce}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={2.5} />
                Crea la prima voce
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {voci.map((voce) => (
                <button
                  key={voce.id}
                  type="button"
                  onClick={() => apriDettaglioVoce(voce)}
                  className="w-full rounded-[28px] border border-[#EADFD3] bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all active:scale-[0.99]"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-[#FCF8F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600">
                      {formatDataDiario(voce.data)}
                    </span>

                    <ChevronRight
                      size={18}
                      strokeWidth={2.4}
                      className="text-gray-400"
                    />
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900">
                    {voce.titolo}
                  </h3>

                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                    {voce.nota}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function SchedaAnimaleTab({
  animale,
  impegni,
  documenti,
  terapie,
  somministrazioni,
  diarioVoci,
  tabIniziale,
}: Props) {
  const router = useRouter()
  const inputFotoCameraRef = useRef<HTMLInputElement | null>(null)
  const inputFotoGalleriaRef = useRef<HTMLInputElement | null>(null)
  const contenutoInternoRef = useRef<HTMLDivElement | null>(null)

  const [tabAttivo, setTabAttivo] = useState<TabId>(
    tabIniziale === 'profilo' ||
      tabIniziale === 'impegni' ||
      tabIniziale === 'documenti' ||
      tabIniziale === 'terapie' ||
      tabIniziale === 'diario' ||
      tabIniziale === 'storico'
      ? tabIniziale
      : 'home'
  )
  const [fotoUrl, setFotoUrl] = useState<string | null>(animale.foto_url ?? null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropNome, setCropNome] = useState('')
  const [isUploadingFoto, setIsUploadingFoto] = useState(false)
  const [erroreFoto, setErroreFoto] = useState<string | null>(null)
  const [mostraSceltaFoto, setMostraSceltaFoto] = useState(false)

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

  const impegniProssimi = impegni.filter(
    (i) => i.stato === 'programmato' && i.tipo !== 'terapia'
  ).length
  const terapieAttive = terapie.filter((t) => t.stato === 'attiva').length
  const eventiStorico =
    documenti.length +
    impegni.filter((i) => i.tipo !== 'terapia').length +
    terapie.length +
    somministrazioni.length
  const vociDiario = diarioVoci.length

  const categoriaLabel = labelCategoria[animale.categoria] ?? 'Animale'
  const sottotitoloHeader = [categoriaLabel, animale.specie, animale.razza]
    .filter(Boolean)
    .join(' · ')

  function apriCambioFoto() {
    if (isUploadingFoto) return
    setErroreFoto(null)
    setMostraSceltaFoto(true)
  }

  function gestisciFileFoto(file: File | null) {
    if (!file) return

    if (file.size > MAX_FOTO_SIZE_BYTES) {
      setErroreFoto(`La foto non può superare ${MAX_FOTO_SIZE_MB}MB.`)
      return
    }

    if (cropSrc) {
      URL.revokeObjectURL(cropSrc)
    }

    setErroreFoto(null)
    setCropNome(file.name)
    setCropSrc(URL.createObjectURL(file))
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

  const fotoPickerShared = (
    <>
      <FotoSourceSheet
        isOpen={mostraSceltaFoto}
        isUploading={isUploadingFoto}
        onClose={() => setMostraSceltaFoto(false)}
        onPickCamera={() => {
          setMostraSceltaFoto(false)
          inputFotoCameraRef.current?.click()
        }}
        onPickGallery={() => {
          setMostraSceltaFoto(false)
          inputFotoGalleriaRef.current?.click()
        }}
      />

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
        ref={inputFotoCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          gestisciFileFoto(file)
          e.target.value = ''
        }}
      />

      <input
        ref={inputFotoGalleriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          gestisciFileFoto(file)
          e.target.value = ''
        }}
      />
    </>
  )

  if (tabAttivo !== 'home') {
    return (
      <div
        className="flex flex-col bg-[#F7F1EA]"
        style={{ minHeight: '100dvh' }}
      >
        {fotoPickerShared}

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
          {tabAttivo === 'storico' && (
            <TabStorico
              animaleId={animale.id}
              documenti={documenti}
              impegni={impegni}
              terapie={terapie}
              somministrazioni={somministrazioni}
            />
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
    <div
      className="flex flex-col overflow-hidden bg-[#F7F1EA]"
      style={{ height: 'calc(100dvh - 80px)' }}
    >
      {fotoPickerShared}

      <div className="w-full shrink-0 px-5 pt-6">
        <div className="relative">
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#EEE4D9] bg-white shadow-sm active:opacity-70"
          >
            <ArrowLeft
              size={20}
              strokeWidth={2.2}
              className="text-gray-600"
            />
          </button>

          <button
            type="button"
            onClick={apriCambioFoto}
            disabled={isUploadingFoto}
            className="absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#EEE4D9] bg-white text-gray-700 shadow-sm transition-all active:scale-95 disabled:opacity-60"
            aria-label="Cambia foto"
          >
            <Camera size={18} strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                'mt-2 flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]',
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
                <span style={{ fontSize: '5.5rem', lineHeight: 1 }}>
                  {avatarFallback}
                </span>
              )}
            </div>

            <div className="mt-4 px-2">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-gray-900">
                {animale.nome}
              </h1>

              <p className="mt-1 text-sm font-semibold text-gray-600">
                {sottotitoloHeader}
              </p>

              {animale.data_nascita && (
                <p className="mt-1 text-xs text-gray-400">
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
      </div>

      <div className="flex-1 px-5 pb-6 pt-5">
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
                ? `${impegniProssimi} ${
                    impegniProssimi === 1 ? 'programmato' : 'programmati'
                  }`
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
            subtitle={
              vociDiario > 0
                ? `${vociDiario} ${vociDiario === 1 ? 'voce salvata' : 'voci salvate'}`
                : 'Note personali e manuali'
            }
            onClick={() => cambiaTab('diario')}
            tone="border-amber-100 bg-amber-50 text-amber-900"
            icon={
              <BookOpen size={24} strokeWidth={2} className="text-amber-600" />
            }
          />

          <QuickCard
            title="Storico"
            subtitle={
              eventiStorico > 0
                ? `${eventiStorico} eventi registrati`
                : 'Ancora vuoto'
            }
            onClick={() => cambiaTab('storico')}
            tone="border-slate-200 bg-[#FCF8F3] text-slate-800"
            icon={
              <Calendar size={24} strokeWidth={2} className="text-slate-600" />
            }
          />
        </div>
      </div>
    </div>
  )
}