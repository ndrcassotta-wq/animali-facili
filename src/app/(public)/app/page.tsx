import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Animali Facili',
  description: 'Gestisci i tuoi animali, documenti, impegni e promemoria.',
}

export default function AppInfoPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo-animali-facili.png"
            alt="Animali Facili"
            width={110}
            height={110}
            priority
            className="rounded-2xl"
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Animali Facili
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Animali Facili è una web app pensata per aiutare i proprietari a
            tenere tutto in ordine in un unico posto: profili degli animali,
            documenti, impegni, promemoria e informazioni utili da consultare
            rapidamente.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Cosa puoi fare con l’app</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• gestire i profili dei tuoi animali</li>
            <li>• tenere sotto controllo documenti e informazioni utili</li>
            <li>• organizzare impegni e promemoria</li>
            <li>• accedere in modo semplice e veloce anche da mobile</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Accesso e account</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Per accedere ad Animali Facili è possibile utilizzare le credenziali
            dell’app oppure il login con Google, quando disponibile.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Informazioni utili</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Termini di Servizio
            </Link>
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Vai al login
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}