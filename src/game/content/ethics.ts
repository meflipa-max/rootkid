export interface EthicsScenario {
  d: number;
  scenario: string;
  choices: { text: string; kind: 'white' | 'grey' | 'black'; outcome: string }[];
  glossary: string[];
}

export const ETHICS_SCENARIOS: EthicsScenario[] = [
  {
    d: 1,
    scenario:
      'Stai navigando sul sito della tua scuola e noti che cambiando un numero nell\'URL (/voti?id=123) puoi vedere i voti di altri studenti. Cosa fai?',
    choices: [
      { text: 'Segnalo la falla al responsabile IT della scuola, senza guardare altri dati', kind: 'white', outcome: 'Perfetto. Questo è "responsible disclosure": hai protetto gli studenti senza abusare dell\'accesso. La scuola corregge l\'IDOR.' },
      { text: 'Guardo i voti dei miei amici "solo per curiosità"', kind: 'grey', outcome: 'Anche senza cattive intenzioni, hai appena acceduto a dati personali altrui senza permesso. È già una violazione della privacy.' },
      { text: 'Cambio i miei voti e quelli di chi non mi piace', kind: 'black', outcome: 'Questo è accesso abusivo e frode informatica. Un reato serio, che può rovinarti il futuro oltre a danneggiare altri.' },
    ],
    glossary: ['idor', 'disclosure'],
  },
  {
    d: 1,
    scenario:
      'Un amico ti chiede di "hackerare" l\'account Instagram della sua ex per vedere i messaggi. Ti dice che è importante. Come rispondi?',
    choices: [
      { text: 'Rifiuto e spiego che è illegale e sbagliato, qualunque sia il motivo', kind: 'white', outcome: 'Giusto. Accedere all\'account di qualcun altro è reato e una grave violazione. Un vero white hat conosce il confine.' },
      { text: 'Lo aiuto ma gli dico di non dirlo a nessuno', kind: 'black', outcome: 'Complicità in accesso abusivo e stalking. Il fatto che sia "segreto" lo rende peggiore, non meno grave.' },
      { text: 'Gli insegno a "indovinare" la password provandone tante', kind: 'black', outcome: 'Insegnare o facilitare un attacco ti rende responsabile. Il brute force su account altrui è illegale.' },
    ],
    glossary: ['ethics', 'law'],
  },
  {
    d: 2,
    scenario:
      'Durante un pentest autorizzato per un cliente, scopri una vulnerabilità che ti permetterebbe di accedere anche a un\'ALTRA azienda collegata, NON inclusa nel contratto. Cosa fai?',
    choices: [
      { text: 'Mi fermo, lo documento nel report e avviso il cliente: l\'altra azienda è fuori scope', kind: 'white', outcome: 'Esatto. Le "regole di ingaggio" definiscono il perimetro. Uscirne, anche se tecnicamente possibile, è illegale.' },
      { text: 'La esploro un po\' "per completezza del report"', kind: 'grey', outcome: 'No: anche con buone intenzioni, hai superato il perimetro autorizzato. Questo può invalidare il pentest e esporti legalmente.' },
      { text: 'La sfrutto: "più trovo, meglio è per il cliente"', kind: 'black', outcome: 'Accesso non autorizzato a terzi. Hai appena trasformato un pentest legale in un crimine.' },
    ],
    glossary: ['scope', 'roe'],
  },
  {
    d: 2,
    scenario:
      'Trovi una vulnerabilità grave in un\'app usata da milioni di persone. L\'azienda non ha un programma di bug bounty e non risponde alle tue email da 2 settimane. Cosa fai?',
    choices: [
      { text: 'Continuo a tentare contatti (PEC, CERT nazionale) e do tempo prima di rendere pubblico', kind: 'white', outcome: 'Corretto. La "coordinated disclosure" prevede tempi ragionevoli (spesso 90 giorni) e il coinvolgimento di un CERT come intermediario.' },
      { text: 'Pubblico subito i dettagli tecnici online per "costringerli" a correggere', kind: 'grey', outcome: 'Rischioso: i criminali potrebbero sfruttare la falla prima della correzione. La pubblicazione immediata (0-day) mette a rischio gli utenti.' },
      { text: 'Vendo la vulnerabilità a chi paga di più', kind: 'black', outcome: 'Vendere exploit sul mercato nero alimenta i criminali. Tradisce completamente l\'etica del white hat.' },
    ],
    glossary: ['disclosure', 'zeroday', 'cert'],
  },
  {
    d: 3,
    scenario:
      'Un recruiter ti offre molti soldi per testare la sicurezza di un\'azienda, ma "senza contratto, tutto informale, fidati". Come procedi?',
    choices: [
      { text: 'Rifiuto finché non c\'è un\'autorizzazione scritta e formale', kind: 'white', outcome: 'Saggio. Senza autorizzazione scritta, qualsiasi test è accesso abusivo. Il contratto protegge te e il cliente.' },
      { text: 'Accetto ma tengo screenshot come "prova" che ero autorizzato', kind: 'grey', outcome: 'Gli screenshot di una chat non sono un\'autorizzazione legale valida. Ti stai esponendo a enormi rischi legali.' },
      { text: 'Accetto, i soldi sono troppi per rifiutare', kind: 'black', outcome: 'Potresti essere usato per un attacco reale a insaputa del vero proprietario. Senza contratto, la responsabilità penale è tutta tua.' },
    ],
    glossary: ['authorization', 'contract'],
  },
  {
    d: 3,
    scenario:
      'Durante un test, ottieni per sbaglio accesso al database con i dati personali di migliaia di clienti. Il report è già pronto. Cosa fai con quella copia del database che hai scaricato?',
    choices: [
      { text: 'La elimino in modo sicuro e lo documento, tenendo solo prove minime anonimizzate', kind: 'white', outcome: 'Corretto. Il principio di minimizzazione: raccogli solo le prove necessarie, proteggi i dati, cancella il resto in modo tracciabile.' },
      { text: 'La tengo "per sicurezza" in caso servisse dopo', kind: 'grey', outcome: 'Conservare dati personali oltre il necessario viola il GDPR e ti rende un bersaglio: se TU vieni hackerato, esponi quei clienti.' },
      { text: 'La carico sul mio cloud personale come backup', kind: 'black', outcome: 'Esfiltrare dati personali su servizi personali è una grave violazione del GDPR e del contratto. Mai.' },
    ],
    glossary: ['gdpr', 'minimization'],
  },
  {
    d: 4,
    scenario:
      'Sei a capo di un red team. Un membro junior propone di usare una tecnica che funzionerebbe ma potrebbe mandare offline il sistema di produzione (e bloccare il servizio per utenti reali). È fuori orario. Cosa decidi?',
    choices: [
      { text: 'No: anche fuori orario il rischio per gli utenti è reale. Propongo un test su ambiente isolato', kind: 'white', outcome: 'Leadership matura. Un white hat minimizza i danni: il valore di un test non giustifica un disservizio reale.' },
      { text: 'OK ma solo su pochi utenti, "il campione è piccolo"', kind: 'grey', outcome: 'Causare un disservizio anche a pochi utenti reali senza necessità è un danno evitabile. Meglio un ambiente di staging.' },
      { text: 'Procediamo: "i risultati valgono il rischio"', kind: 'black', outcome: 'Causare deliberatamente un denial of service su produzione danneggia persone reali. Un leader etico non lo permette.' },
    ],
    glossary: ['dos', 'minimization', 'staging'],
  },
  {
    d: 4,
    scenario:
      'Un tuo collega, durante un incarico legittimo, si vanta di aver "dato un\'occhiata" alle email private del CEO del cliente "per curiosità". Cosa fai?',
    choices: [
      { text: 'Glielo faccio notare e, se necessario, lo segnalo: ha violato la fiducia e la legge', kind: 'white', outcome: 'Giusto. L\'etica professionale richiede di non coprire abusi. La reputazione di tutto il team dipende dall\'integrità.' },
      { text: 'Non sono affari miei, faccio finta di niente', kind: 'grey', outcome: 'Il silenzio rende complici. Se emerge, l\'intero team (e tu) ne risponde. L\'integrità non è opzionale.' },
      { text: 'Gli chiedo se ha visto qualcosa di interessante', kind: 'black', outcome: 'Partecipare alla violazione della privacy, anche solo con curiosità, ti rende parte del problema.' },
    ],
    glossary: ['ethics', 'privacy', 'integrity'],
  },
  {
    d: 5,
    scenario:
      'Rispondi a un incidente in un ospedale: un ransomware sta cifrando i sistemi. Gli attaccanti chiedono un riscatto e "garantiscono" la chiave. I backup sono parziali. Vite potrebbero essere a rischio. Cosa consigli alla direzione?',
    choices: [
      { text: 'Isolare subito i sistemi, attivare procedure di continuità manuale, coinvolgere autorità e CERT, valutare il ripristino dai backup', kind: 'white', outcome: 'Risposta corretta. La priorità è contenere e mantenere la continuità delle cure. Pagare finanzia il crimine e non garantisce nulla. Si coinvolgono le autorità.' },
      { text: 'Pagare subito: "è più veloce e ci sono vite in gioco"', kind: 'grey', outcome: 'Comprensibile sotto pressione, ma pagare finanzia altri attacchi, non garantisce la chiave, e spesso i sistemi restano compromessi. È sempre l\'ultima opzione e va coordinata con le autorità.' },
      { text: 'Contrattaccare gli hacker per recuperare la chiave', kind: 'black', outcome: '"Hack back" è illegale e pericoloso: potresti colpire vittime innocenti (server compromessi di terzi) e peggiorare la situazione legale dell\'ospedale.' },
    ],
    glossary: ['ransomware', 'incident', 'hackback'],
  },
  {
    d: 5,
    scenario:
      'Hai scoperto una vulnerabilità critica in un software open source mantenuto da un volontario solo, non pagato. Sfruttarla sarebbe banale. Come agisci da leader del settore?',
    choices: [
      { text: 'Contatto il maintainer in privato, offro aiuto per la patch e tempo, poi disclosure coordinata', kind: 'white', outcome: 'Esemplare. L\'open source regge su volontari: un white hat di valore aiuta a correggere, non espone né umilia. Collaborazione prima di tutto.' },
      { text: 'Apro una issue pubblica con tutti i dettagli "per trasparenza"', kind: 'grey', outcome: 'La trasparenza è un valore, ma i dettagli pubblici di una 0-day prima della patch mettono a rischio tutti gli utenti del software.' },
      { text: 'Scrivo un exploit e lo pubblico per "dimostrare le mie capacità"', kind: 'black', outcome: 'Pubblicare un exploit funzionante prima della patch, per vanità, danneggia migliaia di utenti. L\'ego non è etica.' },
    ],
    glossary: ['disclosure', 'opensource', 'responsible'],
  },
];
