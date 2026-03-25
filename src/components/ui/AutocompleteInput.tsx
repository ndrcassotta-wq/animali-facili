'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  id,
  value,
  onChange,
  suggerimenti,
  placeholder,
  disabled,
  className,
}: Props) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAperto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const risultati = useMemo(() => {
    const listaUnica = [...new Set(suggerimenti)]

    if (!value.trim()) {
      return listaUnica.slice(0, 8)
    }

    const q = value.toLowerCase().trim()

    const startsWith = listaUnica.filter(s =>
      s.toLowerCase().startsWith(q)
    )

    const includes = listaUnica.filter(
      s =>
        !s.toLowerCase().startsWith(q) &&
        s.toLowerCase().includes(q)
    )

    return [...startsWith, ...includes].slice(0, 8)
  }, [suggerimenti, value])

  function handleSelect(s: string) {
    onChange(s)
    setAperto(false)
  }

  return (
    <div ref={ref} className="relative">
      <Input
        id={id}
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setAperto(true)
        }}
        onFocus={() => setAperto(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />

      {aperto && risultati.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          {risultati.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                handleSelect(s)
              }}
              className="w-full border-b border-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-amber-50 last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}