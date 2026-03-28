import Link from 'next/link'

export const metadata = {
  title: 'Termini di Servizio | Animali Facili',
  description: 'Termini di servizio di Animali Facili.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Termini di Servizio
          </h1>
          <p className="text-sm text-muted-foreground">
            Ultimo aggiornamento: 28 marzo 2026
          </p>
          <p className="text-base text-muted-foreground">
            Utilizzando Animali Facili accetti i presenti termini di servizio.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Oggetto del servizio</h2>
          <p className="text-sm text-muted-foreground">
            Animali Facili è una web app pensata per aiutare gli utenti a
            organizzare informazioni, documenti e attività legate ai propri
            animali.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Account utente</h2>
          <p className="text-sm text-muted-foreground">
            L’utente è responsabile dell’uso del proprio account e della
            correttezza delle informazioni inserite. L’accesso può avvenire
            tramite credenziali dell’app o tramite Google, quando disponibile.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Uso corretto del servizio</h2>
          <p className="text-sm text-muted-foreground">
            L’utente si impegna a utilizzare il servizio in modo lecito, corretto
            e non lesivo dei diritti altrui. Non è consentito tentare di
            compromettere il funzionamento, la sicurezza o l’accesso al servizio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Disponibilità del servizio</h2>
          <p className="text-sm text-muted-foreground">
            Animali Facili può essere aggiornato, modificato o temporaneamente
            sospeso per esigenze tecniche, manutenzione o miglioramenti.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Contenuti e responsabilità</h2>
          <p className="text-sm text-muted-foreground">
            L’utente resta responsabile dei dati e dei contenuti inseriti
            nell’app. Animali Facili non garantisce che il servizio sia sempre
            privo di errori, interruzioni o malfunzionamenti.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Limitazione di responsabilità</h2>
          <p className="text-sm text-muted-foreground">
            Nei limiti consentiti dalla legge, il servizio viene fornito così
            com’è. Animali Facili non risponde di danni indiretti, perdita di
            dati o interruzioni derivanti da cause tecniche o da uso improprio
            del servizio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Modifiche ai termini</h2>
          <p className="text-sm text-muted-foreground">
            I presenti termini possono essere aggiornati nel tempo. L’uso
            continuato del servizio dopo un aggiornamento costituisce
            accettazione della versione più recente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Contatti</h2>
          <p className="text-sm text-muted-foreground">
            Per informazioni sul servizio o su questi termini puoi fare
            riferimento ai canali ufficiali del progetto Animali Facili.
          </p>
        </section>

        <div className="pt-4 text-sm">
          <Link
            href="/app"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Torna alla pagina informativa dell’app
          </Link>
        </div>
      </div>
    </main>
  )
}