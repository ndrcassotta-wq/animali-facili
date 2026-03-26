// src/components/scadenze/AnimaleSelect.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

type AnimaleBase = {
  id: string
  nome: string
  categoria: string
  foto_url: string | null
}

const iconaCategoria: Record<string, string> = {
  cani: '🐕',
  gatti: '🐈',
  pesci: '🐟',
  uccelli: '🦜',
  rettili: '🦎',
  piccoli_mammiferi: '🐹',
  altri_animali: '🐾',
}

function FotoAnimale({
  foto_url,
  nome,
  categoria,
}: {
  foto_url: string | null
  nome: string
  categoria: string
}) {
  if (foto_url) {
    return (
      <img
        src={foto_url}
        alt={nome}
        className="h-6 w-6 shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <span className="shrink-0 text-base leading-none">
      {iconaCategoria[categoria] ?? '🐾'}
    </span>
  )
}

export function AnimaleSelect({
  valore,
  onChange,
  disabled,
  mostraLabel = true,
}: {
  valore: string
  onChange: (id: string) => void
  disabled?: boolean
  mostraLabel?: boolean
}) {
  const [animali, setAnimali] = useState<AnimaleBase[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('animali')
      .select('id, nome, categoria, foto_url')
      .order('nome')
      .then(({ data }) => setAnimali((data ?? []) as AnimaleBase[]))
  }, [])

  function handleChange(value: string | null) {
    if (value) onChange(value)
  }

  const animaleSelezionato = animali.find((a) => a.id === valore)

  return (
    <div className="space-y-1">
      {mostraLabel && (
        <Label>
          Animale <span className="text-destructive">*</span>
        </Label>
      )}

      <Select value={valore} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger>
          {animaleSelezionato ? (
            <div className="flex items-center gap-2">
              <FotoAnimale
                foto_url={animaleSelezionato.foto_url}
                nome={animaleSelezionato.nome}
                categoria={animaleSelezionato.categoria}
              />
              <span>{animaleSelezionato.nome}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {valore ? 'Caricamento...' : 'Seleziona un animale'}
            </span>
          )}
        </SelectTrigger>

        <SelectContent>
          {animali.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              <div className="flex items-center gap-2">
                <FotoAnimale
                  foto_url={a.foto_url}
                  nome={a.nome}
                  categoria={a.categoria}
                />
                <span>{a.nome}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}