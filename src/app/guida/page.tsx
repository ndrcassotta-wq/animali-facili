import type { Metadata } from 'next'
import { GuideIndex } from '@/components/guida/GuideIndex'
import { GuideSection } from '@/components/guida/GuideSection'
import { FaqItem } from '@/components/guida/FaqItem'
import { FAQS, GUIDE_INDEX, SUPPORT_EMAILS } from '@/lib/guida-content'

export const metadata: Metadata = {
  title: 'Guida e supporto | Animali Facili App',
  description:
    'Guida pubblica di Animali Facili App con spiegazioni, FAQ e contatti assistenza.',
}

export default function GuidaPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Guida pubblica
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Guida e supporto di Animali Facili App
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            In questa pagina trovi una panoramica semplice delle funzioni principali,
            una raccolta di problemi comuni, le FAQ iniziali e i contatti utili per
            ricevere assistenza.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/login"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              Apri l’app
            </a>

            <a
              href="#contatti"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Contatta l’assistenza
            </a>
          </div>
        </section>

        <div className="mt-6">
          <GuideIndex items={GUIDE_INDEX} />
        </div>

        <div className="mt-6 space-y-6">
          <GuideSection
            id="come-iniziare"
            title="Come iniziare"
            description="Il flusso base per usare l’app in modo semplice fin dal primo accesso."
            screenshotTitle="Placeholder screenshot — flusso base iniziale"
          >
            <p>
              Per iniziare, entra nell’app con il metodo che preferisci tra email e
              password oppure Google. Una volta dentro, aggiungi il tuo animale e
              completa le informazioni principali.
            </p>
            <p>
              Da lì puoi iniziare a usare le funzioni base più utili: documenti per
              conservare materiale importante, impegni per ricordare attività e
              scadenze, notifiche per essere avvisato al momento giusto.
            </p>
            <p>
              L’obiettivo della prima esperienza deve essere semplice: accedere,
              inserire l’animale, iniziare a organizzare le informazioni davvero utili.
            </p>
          </GuideSection>

          <GuideSection
            id="registrazione-accesso"
            title="Registrazione e accesso"
            description="Accesso semplice, con note utili per i casi più comuni."
            screenshotTitle="Placeholder screenshot — registrazione e accesso"
          >
            <ul className="space-y-3">
              <li>
                <strong>Email e password:</strong> puoi creare un account classico e
                accedere con le credenziali scelte da te.
              </li>
              <li>
                <strong>Login Google:</strong> puoi entrare anche con Google, in modo
                rapido e comodo.
              </li>
              <li>
                <strong>Importante:</strong> è meglio continuare a usare lo stesso metodo
                con cui hai creato l’account, per evitare confusione in fase di accesso.
              </li>
              <li>
                <strong>Recupero password:</strong> è utile per gli account creati con
                email e password. Se hai sempre usato Google, normalmente devi continuare
                ad accedere con Google.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="gestione-animali"
            title="Gestione animali"
            description="Panoramica semplice della logica attuale di gestione."
            screenshotTitle="Placeholder screenshot — scheda animale"
          >
            <p>
              L’app ti permette di gestire i dati del tuo animale in modo ordinato,
              così da avere un punto unico di riferimento.
            </p>
            <p>
              In base alle funzioni già presenti, puoi consultare le informazioni
              dell’animale e aggiornare i dati quando necessario.
            </p>
            <p>
              L’idea è avere una base chiara e facile da leggere, senza complicare
              l’esperienza con passaggi inutili.
            </p>
          </GuideSection>

          <GuideSection
            id="documenti"
            title="Documenti"
            description="Una sezione pensata per tenere raccolto il materiale importante."
            screenshotTitle="Placeholder screenshot — sezione documenti"
          >
            <p>
              La sezione Documenti serve per conservare e consultare contenuti utili
              legati al tuo animale, in un unico spazio più ordinato.
            </p>
            <ul className="space-y-3">
              <li>
                <strong>Caricamento:</strong> puoi aggiungere documenti e materiali utili
                direttamente nell’app.
              </li>
              <li>
                <strong>Consultazione:</strong> una volta caricati, puoi rivederli quando
                ti servono senza doverli cercare altrove.
              </li>
              <li>
                <strong>Organizzazione base:</strong> la logica è tenere tutto il più
                possibile semplice, accessibile e collegato al profilo dell’animale.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="impegni-notifiche"
            title="Impegni e notifiche"
            description="Per ricordare le cose importanti al momento giusto."
            screenshotTitle="Placeholder screenshot — impegni e notifiche"
          >
            <p>
              La sezione Impegni ti aiuta a creare promemoria utili legati alla gestione
              quotidiana del tuo animale.
            </p>
            <ul className="space-y-3">
              <li>
                <strong>Crea un impegno:</strong> inserisci titolo, data e, quando
                previsto, anche l’orario.
              </li>
              <li>
                <strong>Ricevi una notifica:</strong> se le notifiche del dispositivo sono
                abilitate, l’app può avvisarti al momento previsto.
              </li>
              <li>
                <strong>Consiglio utile:</strong> se non vedi una notifica, controlla sia
                le autorizzazioni del telefono sia eventuali limitazioni di batteria o
                risparmio energetico.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="condivisione-familiari"
            title="Condivisione familiari"
            description="Spiegazione semplice della logica attuale, senza tecnicismi."
            screenshotTitle="Placeholder screenshot — condivisione familiari"
          >
            <ul className="space-y-3">
              <li>
                <strong>Animale unico condiviso:</strong> quando un animale viene
                condiviso, il record resta unico.
              </li>
              <li>
                <strong>Più account, stessi dati:</strong> gli account collegati vedono e
                modificano gli stessi dati dell’animale condiviso.
              </li>
              <li>
                <strong>Rimozione personale:</strong> se un utente rimuove l’animale dal
                proprio account, la rimozione vale solo per lui.
              </li>
              <li>
                <strong>Nessun merge automatico:</strong> se esistono possibili duplicati,
                l’app non li unisce da sola.
              </li>
            </ul>
            <p>
              Questa logica è stata scelta per mantenere il comportamento più prudente,
              chiaro e sicuro possibile.
            </p>
          </GuideSection>

          <GuideSection
            id="problemi-comuni"
            title="Problemi comuni"
            description="Piccola raccolta iniziale dei casi più realistici."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-4">
                <h3 className="font-semibold text-foreground">Non ricevo email</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Controlla spam e promozioni, verifica l’indirizzo inserito e assicurati
                  di stare usando il metodo di accesso corretto.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <h3 className="font-semibold text-foreground">Non vedo una notifica</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verifica le autorizzazioni del telefono, il salvataggio corretto
                  dell’impegno e le eventuali restrizioni energetiche del dispositivo.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <h3 className="font-semibold text-foreground">
                  Non capisco la condivisione
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Se l’animale è condiviso, gli utenti collegati vedono gli stessi dati.
                  Se uno lo rimuove, la rimozione vale solo per il suo account.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <h3 className="font-semibold text-foreground">Problemi di accesso</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prova prima con il metodo corretto usato in registrazione. Se l’account
                  è nato con Google, continua con Google. Se è nato con email e password,
                  usa anche il recupero password quando serve.
                </p>
              </div>
            </div>
          </GuideSection>

          <section
            id="faq"
            className="scroll-mt-24 rounded-2xl border border-border bg-transparent"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">FAQ</h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Risposte brevi alle domande più frequenti.
              </p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq) => (
                <FaqItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </section>

          <GuideSection
            id="contatti"
            title="Contatti assistenza"
            description="Per informazioni generali, supporto pratico o dubbi sull’utilizzo dell’app."
          >
            <div className="grid gap-4 md:grid-cols-1">
              <a
                href={`mailto:${SUPPORT_EMAILS.info}`}
                className="rounded-2xl border border-border bg-background p-5 transition hover:bg-muted"
              >
                <p className="text-sm font-semibold text-foreground">Contatto supporto</p>
                <p className="mt-2 text-sm text-muted-foreground">{SUPPORT_EMAILS.info}</p>
              </a>
            </div>

            <p>
              Per informazioni generali, supporto tecnico o dubbi pratici puoi scrivere a{' '}
              <strong>{SUPPORT_EMAILS.info}</strong>.
            </p>
          </GuideSection>
        </div>
      </div>
    </main>
  )
}