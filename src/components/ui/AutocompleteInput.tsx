'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  id?: string
  value: string
  onChange: (val: string) => void
  suggerimenti: string[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function AutocompleteInput({
  id, value, onChange, suggerimenti, placeholder, disabled, className,
}: Props) {
  const [aperto, setAperto]     = useState(false)
  const [filtrati, setFiltrati] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(val: string) {
    onChange(val)
    if (val.trim().length >= 1) {
      const risultati = suggerimenti.filter(s =>
        s.toLowerCase().includes(val.toLowerCase())
      )
      setFiltrati(risultati)
      setAperto(risultati.length > 0)
    } else {
      setAperto(false)
    }
  }

  function seleziona(s: string) {
    onChange(s)
    setAperto(false)
  }

  return (
    <div ref={ref} className="relative">
      <Input
        id={id}
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />
      {aperto && filtrati.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
          {filtrati.slice(0, 6).map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => seleziona(s)}
              className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-amber-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}