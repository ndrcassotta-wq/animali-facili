import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-page h-screen overflow-hidden flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 space-y-3">
          <div className="flex justify-center">
            <Image
              src="/logo-animali-facili.png"
              alt="Animali Facili"
              width={96}
              height={96}
              priority
              className="rounded-2xl"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Animali Facili</h1>
            <p className="text-sm text-muted-foreground mt-1">Il tuo animale, tutto in un posto</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}