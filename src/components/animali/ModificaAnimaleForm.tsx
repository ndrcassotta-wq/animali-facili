'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { animaleSchema } from '@/lib/utils/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Animale } from '@/lib/types/query.types'
import type { Database } from '@/lib/types/database.types'

type FormValori = z.infer<typeof animaleSchema>
type AnimaleUpdate = Database['public']['Tables']['animali']['Update']

const metaCampi: Partial<Record<string, { label: string; chiave: string }>> = {
  cani:              { label: 'Taglia',        chiave: 'taglia' },
  pesci:             { label: 'Tipo acqua',    chiave: 'tipo_acqua' },
  rettili:           { label: 'Tipo terrario', chiave: 'tipo_terrario' },
  uccelli:           { label: 'Tipo gabbia',   chiave: 'tipo_gabbia' },
  piccoli_mammiferi: { label: 'Tipo habitat',  chiave: 'tipo_habitat' },
}

export function ModificaAnimaleForm({ animale }: { animale: Animale }) {
  const router = useRouter()
  const [erroreSrv, setErroreSrv] = useState<string | null>(null)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErroreSrv(null)
    const data = validate()
    if (!data) return

    const meta = metaCampo && metaValore
      ? { [metaCampo.chiave]: metaValore }
      : null

    const payload: AnimaleUpdate = {
      nome:           data.nome,
      specie:         data.specie ?? '',
      razza:          data.razza || null,
      sesso:          data.sesso ?? 'non_specificato',
      data_nascita:   data.data_nascita || null,
      peso:           data.peso ?? null,
      note:           data.note || null,
      meta_categoria: meta,
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('animali')
      .update(payload)
      .eq('id', animale.id)
    setIsSubmitting(false)

    if (error) { setErroreSrv('Errore durante il salvataggio. Riprova.'); return }

    router.push(`/animali/${animale.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">

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
        <p className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md capitalize">
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

      {erroreSrv && <p className="text-sm text-destructive text-center">{erroreSrv}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
      </Button>

    </form>
  )
}