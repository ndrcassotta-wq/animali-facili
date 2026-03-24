'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { animaleSchema } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Animale } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleUpdate = Database['public']['Tables']['animali']['Update']
type ImpegnoInsert = Database['public']['Tables']['impegni']['Insert']

const BUCKET_FOTO_ANIMALI = 'foto-animali'

const metaCampi: Partial<Record<string, { label: string; chiave: string }>> = {
  cani:              { label: 'Taglia',        chiave: 'taglia' },
  pesci:             { label: 'Tipo acqua',    chiave: 'tipo_acqua' },
  rettili:           { label: 'Tipo terrario', chiave: 'tipo_terrario' },
  uccelli:           { label: 'Tipo gabbia',   chiave: 'tipo_gabbia' },
  piccoli_mammiferi: { label: 'Tipo habitat',  chiave: 'tipo_habitat' },
}

function getEstensioneFile(file: File) {
  const nome = file.name.split('.')
  return nome[nome.length - 1]?.toLowerCase() || 'jpg'
}

function prossimCompleanno(dataNascita: string): string {
  const nascita = new Date(dataNascita)
  const oggi = new Date()
  const anno = oggi.getFullYear()
  const candidato = new Date(anno, nascita.getMonth(), nascita.getDate())
  if (candidato < oggi) candidato.setFullYear(anno + 1)
  return candidato.toISOString().split('T')[0]
}

export function ModificaAnimaleForm({ animale }: { animale: Animale }) {
  const router = useRouter()

  const [erroreSrv,    setErroreSrv]    = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fotoFile,     setFotoFile]     = useState<File | null>(null)

  const metaEsistente = animale.meta_categoria as Record<string, string> | null
  const metaCampo     = metaCampi[animale.categoria]

  const [metaValore, setMetaValore] = useState(
    metaCampo ? (metaEsistente?.[metaCampo.chiave] ?? '') : ''
  )

  const [valori, setValori] = useState<FormValori>({
    nome:         animale.nome,
    categoria:    animale.categoria,
    specie:       animale.specie,
    razza:        animale.razza ?? '',
    sesso:        animale.sesso ?? 'non_specificato',
    data_nascita: animale.data_nascita ?? '',
    peso:         animale.peso ?? undefined,
    note:         animale.note ?? '',
  })

  const [erroriForm, setErroriForm] = useState<Partial<Record<keyof FormValori, string>>>({})

  const previewFoto = useMemo(() => {
    if (fotoFile) return URL.createObjectURL(fotoFile)
    return animale.foto_url ?? null
  }, [fotoFile, animale.foto_url])

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

  async function uploadFotoSePresente() {
    if (!fotoFile) return animale.foto_url ?? null
    const supabase = createClient()
    const estensione = getEstensioneFile(fotoFile)
    const filePath = `animali/${animale.id}/foto-${Date.now()}.${estensione}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_FOTO_ANIMALI)
      .upload(filePath, fotoFile, { cacheControl: '3600', upsert: true, contentType: fotoFile.type || undefined })
    if (uploadError) throw new Error('Upload foto non riuscito.')
    const { data } = supabase.storage.from(BUCKET_FOTO_ANIMALI).getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)

    const data = validate()
    if (!data) return

    setIsSubmitting(true)

    try {
      const fotoUrl = await uploadFotoSePresente()
      const meta = metaCampo && metaValore ? { [metaCampo.chiave]: metaValore } : null
      const dataNascita = data.data_nascita || null

      const payload: AnimaleUpdate = {
        nome:           data.nome,
        specie:         data.specie ?? '',
        razza:          data.razza || null,
        sesso:          data.sesso ?? 'non_specificato',
        data_nascita:   dataNascita,
        peso:           data.peso ?? null,
        note:           data.note || null,
        meta_categoria: meta,
        foto_url:       fotoUrl,
      }

      const supabase = createClient()
      const { error } = await supabase
        .from('animali')
        .update(payload)
        .eq('id', animale.id)

      if (error) throw new Error('Errore durante il salvataggio.')

      // Gestione compleanno automatico
      if (dataNascita) {
        // Cerca se esiste già un impegno compleanno per questo animale
        const { data: esistente } = await supabase
          .from('impegni')
          .select('id')
          .eq('animale_id', animale.id)
          .eq('tipo', 'compleanno')
          .single()

        const nuovaData = prossimCompleanno(dataNascita)

        if (esistente) {
          // Aggiorna la data del compleanno esistente
          await supabase
            .from('impegni')
            .update({ data: nuovaData, titolo: 'Compleanno' })
            .eq('id', esistente.id)
        } else {
          // Crea nuovo impegno compleanno
          const impegnoCompleanno: ImpegnoInsert = {
            animale_id:       animale.id,
            titolo:           'Compleanno',
            tipo:             'compleanno',
            data:             nuovaData,
            frequenza:        'annuale',
            notifiche_attive: true,
            stato:            'programmato',
            note:             `Compleanno di ${data.nome}`,
          }
          await supabase.from('impegni').insert(impegnoCompleanno)
        }
      } else {
        // Se la data di nascita è stata rimossa, elimina l'impegno compleanno
        await supabase
          .from('impegni')
          .delete()
          .eq('animale_id', animale.id)
          .eq('tipo', 'compleanno')
      }

      router.push(`/animali/${animale.id}`)
      router.refresh()
    } catch (error) {
      setErroreSrv(error instanceof Error ? error.message : 'Errore durante il salvataggio. Riprova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">

      <div className="space-y-2">
        <Label>Foto animale</Label>
        <div className="flex items-center gap-4 rounded-xl border border-border p-3">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-muted">
            {previewFoto
              ? <img src={previewFoto} alt={animale.nome} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Nessuna foto</div>
            }
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id="foto"
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isSubmitting}
              onChange={e => setFotoFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Puoi scegliere una foto dalla galleria o scattarla dal telefono.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="nome">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nome"
          value={valori.nome}
          onChange={e => setValue('nome', e.target.value)}
          disabled={isSubmitting}
        />
        {erroriForm.nome && <p className="text-xs text-destructive">{erroriForm.nome}</p>}
      </div>

      <div className="space-y-1">
        <Label>Categoria</Label>
        <p className="rounded-md bg-muted px-3 py-2 text-sm capitalize text-muted-foreground">
          {animale.categoria.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-muted-foreground">La categoria non può essere modificata.</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="specie">
          Specie <span className="text-destructive">*</span>
        </Label>
        <Input
          id="specie"
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
          <SelectTrigger><SelectValue /></SelectTrigger>
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
          value={valori.peso ?? ''}
          onChange={e => setValue('peso', e.target.value === '' ? undefined : Number(e.target.value))}
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
          value={valori.note ?? ''}
          onChange={e => setValue('note', e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      {erroreSrv && <p className="text-center text-sm text-destructive">{erroreSrv}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
      </Button>

    </form>
  )
}