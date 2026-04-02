export type GuideIndexItem = {
  id: string
  label: string
}

export type FaqItemData = {
  question: string
  answer: string
}

export const GUIDE_INDEX: GuideIndexItem[] = [
  { id: 'come-iniziare', label: 'Come iniziare' },
  { id: 'registrazione-accesso', label: 'Registrazione e accesso' },
  { id: 'gestione-animali', label: 'Gestione animali' },
  { id: 'documenti', label: 'Documenti' },
  { id: 'impegni-notifiche', label: 'Impegni e notifiche' },
  { id: 'condivisione-familiari', label: 'Condivisione familiari' },
  { id: 'problemi-comuni', label: 'Problemi comuni' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contatti', label: 'Contatti assistenza' },
]

export const FAQS: FaqItemData[] = [
  {
    question: 'Devo usare per forza il login con Google?',
    answer:
      'No. Puoi usare sia email e password sia Google. La cosa importante è continuare a entrare con lo stesso metodo usato per creare l’account.',
  },
  {
    question: 'Ho sempre usato Google. Posso recuperare la password?',
    answer:
      'Se il tuo account è stato creato con Google, in genere devi continuare ad accedere con Google. Il recupero password è utile soprattutto per gli account creati con email e password.',
  },
  {
    question: 'Posso modificare i dati di un animale dopo averlo creato?',
    answer:
      'Sì. Puoi aggiornare i dati dell’animale direttamente dall’app, in base alle funzioni già disponibili nella sua scheda.',
  },
  {
    question: 'Se condivido un animale con un familiare, cosa succede?',
    answer:
      'L’animale resta unico e condiviso. Gli account collegati vedono gli stessi dati e le modifiche fatte vengono viste anche dagli altri utenti collegati.',
  },
  {
    question: 'Se rimuovo un animale dal mio account, sparisce anche agli altri?',
    answer:
      'No. La rimozione è personale: l’animale sparisce solo dal tuo account e resta visibile agli altri account che lo hanno ancora collegato.',
  },
  {
    question: 'L’app unisce automaticamente due animali duplicati?',
    answer:
      'No. Al momento non è previsto un merge automatico dei duplicati. Questo serve a evitare unioni errate o perdita di informazioni.',
  },
  {
    question: 'Perché non ricevo l’email di conferma o recupero password?',
    answer:
      'Controlla la cartella spam, verifica di aver scritto correttamente l’email e assicurati di usare il metodo di accesso giusto. Se hai usato Google fin dall’inizio, devi continuare con Google.',
  },
  {
    question: 'Perché non vedo una notifica?',
    answer:
      'Controlla che le notifiche siano abilitate sul telefono, che l’app non sia limitata dal risparmio energetico e che l’impegno sia stato salvato correttamente.',
  },
  {
    question: 'A chi scrivo se ho bisogno di aiuto?',
    answer:
      'Per informazioni generali, supporto tecnico o dubbi pratici puoi scrivere a info@animalifacili.it.',
  },
]

export const SUPPORT_EMAILS = {
  info: 'info@animalifacili.it',
}