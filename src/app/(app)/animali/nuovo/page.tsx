'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { animaleSchema } from '@/lib/utils/validation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { CategoriaAnimale } from '@/lib/types/app.types'
import type { Database } from '@/lib/types/database.types'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleInsert = Database['public']['Tables']['animali']['Insert']
type AnimaleIdRow  = { id: string }

const valoriIniziali: FormValori = {
  nome:         '',
  categoria:    'cani',
  specie:       '',
  razza:        '',
  sesso:        'non_specificato',
  data_nascita: '',
  peso:         undefined,
  note:         '',
}

const categorie: { valore: CategoriaAnimale; label: string; icona: string }[] = [
  { valore: 'cani',              label: 'Cane',              icona: '🐕' },
  { valore: 'gatti',             label: 'Gatto',             icona: '🐈' },
  { valore: 'pesci',             label: 'Pesce',             icona: '🐟' },
  { valore: 'uccelli',           label: 'Uccello',           icona: '🦜' },
  { valore: 'rettili',           label: 'Rettile',           icona: '🦎' },
  { valore: 'piccoli_mammiferi', label: 'Piccolo mammifero', icona: '🐹' },
  { valore: 'altri_animali',     label: 'Altro',             icona: '🐾' },
]

const metaCampi: Partial<Record<CategoriaAnimale, { label: string; chiave: string }>> = {
  cani:              { label: 'Taglia',        chiave: 'taglia' },
  pesci:             { label: 'Tipo acqua',    chiave: 'tipo_acqua' },
  rettili:           { label: 'Tipo terrario', chiave: 'tipo_terrario' },
  uccelli:           { label: 'Tipo gabbia',   chiave: 'tipo_gabbia' },
  piccoli_mammiferi: { label: 'Tipo habitat',  chiave: 'tipo_habitat' },
}

function specieSuggerita(categoria: CategoriaAnimale): string {
  const mappa: Record<CategoriaAnimale, string> = {
    cani:              'Cane domestico, Canis lupus familiaris',
    gatti:             'Gatto domestico, Felis catus',
    pesci:             'Carassio dorato, Betta splendens',
    uccelli:           'Pappagallino ondulato, Canarino',
    rettili:           'Iguana verde, Geco leopardo',
    piccoli_mammiferi: 'Criceto dorato, Coniglio nano',
    altri_animali:     'Indica la specie del tuo animale',
  }
  return mappa[categoria] ?? ''
}

function metaSuggerito(categoria: CategoriaAnimale): string {
  const mappa: Partial<Record<CategoriaAnimale, string>> = {
    cani:              'piccola, media, grande',
    pesci:             'dolce, salata, salmastra',
    rettili:           'desertico, tropicale, temperato',
    uccelli:           'piccola, media, voliera',
    piccoli_mammiferi: 'gabbia, recinto, libero',
  }
  return mappa[categoria] ?? ''
}

export default function NuovoAnimalePage() {
  const router = useRouter()
  const [step, setStep] = useState<'categoria' | 'form'>('categoria')
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)
  const [metaValore, setMetaValore] = useState('')
  const [valori, setValori] = useState<FormValori>(valoriIniziali)
  const [erroriForm, setErroriForm] = useState<Partial<Record<keyof FormValori, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setValue(field: keyof FormValori, value: unknown) {
    setValori(prev => ({ ...prev, [field]: value }))
    setErroriForm(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): FormValori | null {
    const result = animaleSchema.safeParse(valori)
    if (!result.success) {
      const fe: Partial<Record<keyof FormValori, string>> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof FormValori
        if (field && !fe[field]) fe[field] = issue.message
      })
      setErroriForm(fe)
      return null
    }
    return result.data
  }

  const metaCampo = metaCampi[valori.categoria as CategoriaAnimale]
  const categoriaSelezionata = categorie.find(c => c.valore === valori.categoria)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)
    const data = validate()
    if (!data) return

    setIsSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const meta = metaCampo && metaValore
      ? { [metaCampo.chiave]: metaValore }
      : null

    const payload: AnimaleInsert = {
      user_id:        user.id,
      nome:           data.nome,
      categoria:      data.categoria,
      specie:         data.specie ?? '',
      razza:          data.razza ?? null,
      sesso:          data.sesso ?? 'non_specificato',
      data_nascita:   data.data_nascita ?? null,
      peso:           data.peso ?? null,
      note:           data.note ?? null,
      foto_url:       null,
      meta_categoria: meta,
    }

    const { data: risultato, error } = await supabase
      .from('animali')
      .insert(payload)
      .select('id')
      .single()

    setIsSubmitting(false)

    if (error || !risultato) {
      setErroreSrv('Errore durante il salvataggio. Riprova.')
      return
    }

    const { id } = risultato as AnimaleIdRow
    router.push(`/animali/${id}`)
  }

  if (step === 'categoria') {
    return (
      <div>
        <PageHeader titolo="Che animale hai?" backHref="/animali" />
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {categorie.map(c => (
              <button
                key={c.valore}
                onClick={() => {
                  setValue('categoria', c.valore)
                  setStep('form')
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-center"
              >
                <span className="text-3xl" role="img" aria-label={c.label}>{c.icona}</span>
                <span className="text-sm font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        titolo={`Nuovo ${categoriaSelezionata?.label.toLowerCase() ?? 'animale'}`}
        onBack={() => setStep('categoria')}
      />
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">

        <div className="space-y-1">
          <Label htmlFor="nome">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            placeholder="Il nome del tuo animale"
            value={valori.nome}
            onChange={e => setValue('nome', e.target.value)}
            disabled={isSubmitting}
          />
          {erroriForm.nome && <p className="text-xs text-destructive">{erroriForm.nome}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="specie">
            Specie <span className="text-destructive">*</span>
          </Label>
          <Input
            id="specie"
            placeholder={`es. ${specieSuggerita(valori.categoria as CategoriaAnimale)}`}
            value={valori.specie}
            onChange={e => setValue('specie', e.target.value)}
            disabled={isSubmitting}
          />
          {erroriForm.specie && <p className="text-xs text-destructive">{erroriForm.specie}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="razza">
            Razza <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Input
            id="razza"
            placeholder="Razza o varietà"
            value={valori.razza ?? ''}
            onChange={e => setValue('razza', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label>Sesso</Label>
          <Select
            value={valori.sesso ?? 'non_specificato'}
            onValueChange={v => setValue('sesso', v)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maschio">Maschio</SelectItem>
              <SelectItem value="femmina">Femmina</SelectItem>
              <SelectItem value="non_specificato">Non specificato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="data_nascita">
            Data di nascita <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Input
            id="data_nascita"
            type="date"
            value={valori.data_nascita ?? ''}
            onChange={e => setValue('data_nascita', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="peso">
            Peso in kg <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Input
            id="peso"
            type="number"
            step="0.001"
            min="0"
            placeholder="es. 4.250"
            value={valori.peso ?? ''}
            onChange={e => setValue('peso', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {metaCampo && (
          <div className="space-y-1">
            <Label htmlFor="meta">
              {metaCampo.label} <span className="text-xs text-muted-foreground">(opzionale)</span>
            </Label>
            <Input
              id="meta"
              placeholder={`es. ${metaSuggerito(valori.categoria as CategoriaAnimale)}`}
              value={metaValore}
              onChange={e => setMetaValore(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="note">
            Note <span className="text-xs text-muted-foreground">(opzionale)</span>
          </Label>
          <Textarea
            id="note"
            placeholder="Informazioni aggiuntive"
            value={valori.note ?? ''}
            onChange={e => setValue('note', e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {erroreSrv && (
          <p className="text-sm text-destructive text-center">{erroreSrv}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvataggio...' : 'Salva animale'}
        </Button>

      </form>
    </div>
  )
}