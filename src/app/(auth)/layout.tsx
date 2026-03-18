export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Animali Facili</h1>
          <p className="text-sm text-muted-foreground mt-1">Il tuo animale, tutto in un posto</p>
        </div>
        {children}
      </div>
    </div>
  )
}