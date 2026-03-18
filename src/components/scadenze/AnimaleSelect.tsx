'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type AnimaleBase = { id: string; nome: string; categoria: string }

export function AnimaleSelect({
  valore,
  onChange,
  disabled,
}: {
  valore: string
  onChange: (id: string) => void
  disabled?: boolean
}) {
  const [animali, setAnimali] = useState<AnimaleBase[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('animali')
      .select('id, nome, categoria')
      .order('nome')
      .then(({ data }) => setAnimali((data ?? []) as AnimaleBase[]))
  }, [])

  function handleChange(value: string | null) {
    if (value) onChange(value)
  }

  return (
    <div className="space-y-1">
      <Label>
        Animale <span className="text-destructive">*</span>
      </Label>
      <Select value={valore} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Seleziona un animale" />
        </SelectTrigger>
        <SelectContent>
          {animali.map(a => (
            <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}