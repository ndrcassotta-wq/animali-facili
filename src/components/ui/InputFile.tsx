'use client'

import { cn } from '@/lib/utils'

interface InputFileProps {
  id: string
  accept: string
  onChange: (file: File | null) => void
  disabled?: boolean
  capture?: boolean
  label?: string
  descrizione?: string
  fileSelezionato?: File | null
  className?: string
}

export function InputFile({
  id,
  accept,
  onChange,
  disabled,
  capture = false,
  label,
  descrizione,
  fileSelezionato,
  className,
}: InputFileProps) {
  const usaCapture = capture && accept.includes('image')

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        {...(usaCapture ? { capture: 'environment' as const } : {})}
        onChange={e => onChange(e.target.files?.[0] ?? null)}
        disabled={disabled}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      />
      {fileSelezionato && (
        <p className="text-xs text-muted-foreground">
          {fileSelezionato.name} ({(fileSelezionato.size / 1024).toFixed(0)} KB)
        </p>
      )}
      {descrizione && !fileSelezionato && (
        <p className="text-xs text-muted-foreground">{descrizione}</p>
      )}
    </div>
  )
}