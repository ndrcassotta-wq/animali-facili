import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-page h-screen overflow-hidden flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 space-y-2 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo-animali-facili.png"
              alt="Animali Facili"
              width={112}
              height={112}
              priority
              className="rounded-2xl"
            />
          </div>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">
              Animali Facili
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tutti i tuoi animali, in un unico posto
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}