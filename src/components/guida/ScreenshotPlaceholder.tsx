type ScreenshotPlaceholderProps = {
  title: string
  note?: string
}

export function ScreenshotPlaceholder({
  title,
  note = 'Area pronta per screenshot o immagine illustrativa futura.',
}: ScreenshotPlaceholderProps) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/40 p-5">
      <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{note}</p>
      </div>
    </div>
  )
}