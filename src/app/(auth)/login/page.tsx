import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from '@/components/auth/LoginForm'

function LoginFallback() {
  return (
    <div className="auth-page flex h-screen flex-col items-center justify-start overflow-hidden bg-background px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 space-y-1.5 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo-animali-facili.png"
              alt="Animali Facili"
              width={120}
              height={120}
              priority
              className="rounded-2xl"
            />
          </div>
          <div>
            <h1 className="text-[29px] font-bold tracking-tight text-foreground">
              Animali Facili
            </h1>
            <p className="mt-1 text-[15px] text-foreground/65">
              Tutti i tuoi animali, in un unico posto
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}