import Image from 'next/image'

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/logo-animali-facili.png"
          alt="Animali Facili"
          width={96}
          height={96}
          priority
          className="rounded-2xl"
        />
        <div>
          <p className="text-xl font-bold tracking-tight text-foreground">
            Animali Facili
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Caricamento…</p>
        </div>
      </div>
    </div>
  )
}