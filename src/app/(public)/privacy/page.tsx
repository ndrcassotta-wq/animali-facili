import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Animali Facili',
  description: 'Informativa privacy di Animali Facili.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Ultimo aggiornamento: 28 marzo 2026
          </p>
          <p className="text-base text-muted-foreground">
            Questa informativa descrive come Animali Facili raccoglie, utilizza
            e protegge i dati personali degli utenti che utilizzano la web app.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Titolare del trattamento</h2>
          <p className="text-sm text-muted-foreground">
            Il titolare del trattamento dei dati relativi all’utilizzo di
            Animali Facili è il gestore del progetto Animali Facili.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Dati raccolti</h2>
          <p className="text-sm text-muted-foreground">
            Durante l’utilizzo dell’app possono essere raccolti i dati necessari
            al funzionamento del servizio, tra cui:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• dati di accesso e autenticazione</li>
            <li>• indirizzo email dell’account utilizzato</li>
            <li>• eventuali informazioni inserite volontariamente nell’app</li>
            <li>• dati tecnici necessari al corretto funzionamento del servizio</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            3. Accesso con account Google
          </h2>
          <p className="text-sm text-muted-foreground">
            Se scegli di accedere tramite Google, Animali Facili utilizza i dati
            minimi necessari per autenticarti e creare o associare il tuo
            account. I dati ricevuti vengono utilizzati esclusivamente per
            consentire l’accesso al servizio e la gestione della sessione.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Finalità del trattamento</h2>
          <p className="text-sm text-muted-foreground">
            I dati vengono trattati per:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• permettere l’accesso e l’utilizzo dell’app</li>
            <li>• garantire la sicurezza dell’account</li>
            <li>• salvare e mostrare i contenuti inseriti dall’utente</li>
            <li>• migliorare stabilità, affidabilità e funzionamento del servizio</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Conservazione dei dati</h2>
          <p className="text-sm text-muted-foreground">
            I dati vengono conservati per il tempo necessario a fornire il
            servizio e a garantire il corretto funzionamento dell’account,
            salvo obblighi di legge o richieste di cancellazione ove applicabili.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Condivisione dei dati</h2>
          <p className="text-sm text-muted-foreground">
            I dati non vengono venduti a terzi. Possono essere trattati tramite
            fornitori tecnici indispensabili per il funzionamento del servizio,
            come infrastruttura hosting, autenticazione e database.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Sicurezza</h2>
          <p className="text-sm text-muted-foreground">
            Animali Facili adotta misure tecniche e organizzative ragionevoli
            per proteggere i dati da accessi non autorizzati, perdita o uso
            improprio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Diritti dell’utente</h2>
          <p className="text-sm text-muted-foreground">
            L’utente può richiedere l’accesso, la rettifica o la cancellazione
            dei propri dati nei limiti previsti dalla normativa applicabile.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contatti</h2>
          <p className="text-sm text-muted-foreground">
            Per richieste relative alla privacy o alla gestione dei dati puoi
            contattare il referente del progetto Animali Facili tramite i canali
            ufficiali del servizio.
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