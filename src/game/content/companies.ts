import type { Company, MissionDef } from '../types';

export const COMPANIES: Company[] = [
  {
    id: 'freelance',
    name: 'Freelance',
    tagline: 'La tua cameretta. Un laptop. Tanta curiosità.',
    jobTitle: 'Script Kiddie (per ora)',
    color: '#8b95a5',
    icon: '🛏️',
    contact: 'Zero',
    contactRole: 'Mentore',
    intro:
      'Nessuno ti conosce ancora. Ma io sì: ho visto come guardi i terminali. Facciamo un patto: io ti insegno, tu prometti di usare tutto solo per difendere. Iniziamo dalle basi.',
    req: { level: 1, rep: 0 },
    salary: 0,
  },
  {
    id: 'pizzabyte',
    name: 'PizzaByte',
    tagline: 'Pizzeria con consegne online. Il sito lo ha fatto il cugino del titolare.',
    jobTitle: 'IT Helper',
    color: '#ffb347',
    icon: '🍕',
    contact: 'Gennaro',
    contactRole: 'Titolare',
    intro:
      "Uagliò, il sito della pizzeria fa cose strane e qualcuno ha ordinato 400 margherite a nome mio. Mi hanno detto che ci capisci. Ti pago in pizze e crediti, ok?",
    req: { level: 1, rep: 0 },
    salary: 10,
  },
  {
    id: 'liceo',
    name: 'Liceo Turing',
    tagline: 'Una scuola con 1200 studenti e un server nello sgabuzzino.',
    jobTitle: 'Junior Security Assistant',
    color: '#33d1ff',
    icon: '🏫',
    contact: 'Prof.ssa Rossi',
    contactRole: 'Referente informatica',
    intro:
      "Il registro elettronico è andato giù due volte questa settimana e il preside è convinto che sia colpa di 'quelli della 4B'. Ho bisogno di qualcuno che sappia davvero cosa sta succedendo. Con autorizzazione scritta, ovviamente.",
    req: { level: 3, rep: 10 },
    salary: 20,
  },
  {
    id: 'shopfast',
    name: 'ShopFast',
    tagline: 'E-commerce in crescita. 50 dipendenti, 0 esperti di sicurezza.',
    jobTitle: 'Junior Penetration Tester',
    color: '#b58cff',
    icon: '🛒',
    contact: 'Marta',
    contactRole: 'CTO',
    intro:
      'Abbiamo appena chiuso un round di investimento e gli investitori vogliono un pentest. Ho letto il tuo report per il Liceo Turing: pulito e chiaro. Ti va di fare il nostro primo pentester?',
    req: { level: 6, rep: 25, cert: 'fondamenti' },
    salary: 40,
  },
  {
    id: 'banca',
    name: 'BancaDigitale',
    tagline: 'Banca 100% online. Qui gli errori costano milioni.',
    jobTitle: 'Penetration Tester',
    color: '#3dff8f',
    icon: '🏦',
    contact: 'Dott. Ferri',
    contactRole: 'CISO',
    intro:
      'Ogni giorno bloccchiamo 40.000 tentativi di attacco. Il nostro Red Team cerca qualcuno con la tua reputazione. Le regole di ingaggio sono strette: tutto documentato, niente improvvisazioni.',
    req: { level: 10, rep: 45 },
    salary: 70,
  },
  {
    id: 'nimbus',
    name: 'NimbusCloud',
    tagline: 'Cloud provider europeo. Migliaia di server, milioni di container.',
    jobTitle: 'Security Engineer',
    color: '#5ea8ff',
    icon: '☁️',
    contact: 'Yuki',
    contactRole: 'Head of Security',
    intro:
      'Qui la scala cambia tutto: un bug in un container può toccare mille clienti. Cerchiamo chi sa leggere log a colpo d\'occhio e pensare in modo sistemico. La tua certificazione web ci ha colpito.',
    req: { level: 15, rep: 65, cert: 'webpentest' },
    salary: 100,
  },
  {
    id: 'medlife',
    name: 'MedLife Hospital',
    tagline: 'Ospedale connesso. Qui la sicurezza salva vite, letteralmente.',
    jobTitle: 'Senior Security Engineer',
    color: '#ff6b9d',
    icon: '🏥',
    contact: 'Dott.ssa Conti',
    contactRole: 'Direttrice IT',
    intro:
      "Un ransomware ha bloccato il pronto soccorso di un ospedale vicino per tre giorni. Non voglio che succeda qui. Ho bisogno di qualcuno di senior, con etica di ferro: qui i dati sono cartelle cliniche.",
    req: { level: 20, rep: 80 },
    salary: 140,
  },
  {
    id: 'govcert',
    name: 'GovCERT',
    tagline: 'Il team nazionale di risposta agli incidenti informatici.',
    jobTitle: 'Incident Responder',
    color: '#ffd166',
    icon: '🛡️',
    contact: 'Col. Bianchi',
    contactRole: 'Direttore operazioni',
    intro:
      'Quando un attacco colpisce infrastrutture critiche, siamo noi a rispondere. Il tuo profilo è passato tre controlli. Benvenuto nella squadra: qui si lavora di forensics e sangue freddo.',
    req: { level: 26, rep: 95, cert: 'forensics' },
    salary: 190,
  },
  {
    id: 'nebula',
    name: 'Nebula Corp',
    tagline: 'Big tech. 2 miliardi di utenti. Bug bounty da capogiro.',
    jobTitle: 'Red Team Lead',
    color: '#c77dff',
    icon: '🌌',
    contact: 'Sam',
    contactRole: 'VP Security',
    intro:
      'Il nostro Red Team attacca i nostri stessi sistemi prima che lo facciano gli altri. Vogliamo che lo guidi tu. Sì, hai letto bene: Lead.',
    req: { level: 32, rep: 110 },
    salary: 260,
  },
  {
    id: 'orbit',
    name: 'ORBIT Space Agency',
    tagline: 'Satelliti, missioni spaziali, e un sacco di sistemi legacy.',
    jobTitle: 'Chief Security Officer',
    color: '#ffffff',
    icon: '🚀',
    contact: 'Dir. Amara Okafor',
    contactRole: 'Direttrice generale',
    intro:
      "Abbiamo satelliti lanciati nel 1998 che parlano ancora con protocolli inventati prima che tu nascessi. Sei la persona giusta per proteggere ciò che c'è là fuori. Benvenut* al vertice.",
    req: { level: 40, rep: 130, cert: 'elite' },
    salary: 400,
  },
];

export function companyById(id: string): Company {
  return COMPANIES.find((c) => c.id === id) ?? COMPANIES[0];
}

export function nextCompany(id: string): Company | undefined {
  const i = COMPANIES.findIndex((c) => c.id === id);
  return COMPANIES[i + 1];
}

// ===== Missioni storia =====
export const MISSIONS: MissionDef[] = [
  // --- Freelance / tutorial ---
  {
    id: 'fl_1',
    companyId: 'freelance',
    title: 'Primi passi nel terminale',
    contact: 'Zero',
    brief:
      'Ogni hacker inizia da qui: il terminale. Niente icone, niente mouse. Solo tu e la macchina. Ti ho preparato un laboratorio: trova il file con la FLAG e inviala con il comando submit.',
    specs: [{ type: 'terminal', difficulty: 1, opts: { objective: 'find_flag' } }],
    reward: { xp: 40, credits: 20, rep: 2 },
  },
  {
    id: 'fl_2',
    companyId: 'freelance',
    title: 'Messaggi nascosti',
    contact: 'Zero',
    brief:
      'Gli hacker non parlano mai in chiaro. Codifiche e cifrari sono il pane quotidiano. Ti mando tre messaggi: decodificali.',
    specs: [
      { type: 'cipher', difficulty: 1 },
      { type: 'cipher', difficulty: 1 },
      { type: 'binary', difficulty: 1 },
    ],
    reward: { xp: 60, credits: 30, rep: 2 },
  },
  {
    id: 'fl_3',
    companyId: 'freelance',
    title: 'Il patto del cappello bianco',
    contact: 'Zero',
    brief:
      "Prima di mandarti da un cliente vero, devo sapere che ragioni come un white hat. Ti presento una situazione: dimmi cosa faresti. Poi un po' di teoria.",
    specs: [
      { type: 'ethics', difficulty: 1 },
      { type: 'quiz', difficulty: 1 },
    ],
    reward: { xp: 60, credits: 30, rep: 4 },
    final: true,
  },

  // --- PizzaByte ---
  {
    id: 'pb_1',
    companyId: 'pizzabyte',
    title: 'La mail del corriere',
    contact: 'Gennaro',
    brief:
      'Gennaro ha ricevuto strane email "dal corriere" e non sa se cliccare. Aiutalo a riconoscere i tentativi di phishing prima che sia troppo tardi.',
    specs: [
      { type: 'phishing', difficulty: 1 },
      { type: 'phishing', difficulty: 1 },
      { type: 'quiz', difficulty: 1, opts: { skill: 'social' } },
    ],
    reward: { xp: 70, credits: 40, rep: 3 },
  },
  {
    id: 'pb_2',
    companyId: 'pizzabyte',
    title: 'Chi ha ordinato 400 margherite?',
    contact: 'Gennaro',
    brief:
      "Il server della pizzeria tiene un log degli accessi. Qualcuno ha fatto ordini falsi. Trova l'IP del colpevole nei log.",
    specs: [
      { type: 'logs', difficulty: 1 },
      { type: 'terminal', difficulty: 1, opts: { objective: 'grep_log' } },
    ],
    reward: { xp: 80, credits: 45, rep: 3 },
  },
  {
    id: 'pb_3',
    companyId: 'pizzabyte',
    title: 'Password "pizza123"',
    contact: 'Gennaro',
    brief:
      "Gennaro usa la stessa password ovunque: pizza123. Fagli capire perché è un problema e aiutalo a scegliere quelle giuste.",
    specs: [
      { type: 'password', difficulty: 1, opts: { mode: 'rank' } },
      { type: 'password', difficulty: 1, opts: { mode: 'crack' } },
    ],
    reward: { xp: 80, credits: 45, rep: 3 },
  },
  {
    id: 'pb_4',
    companyId: 'pizzabyte',
    title: 'Il form degli ordini',
    contact: 'Gennaro',
    brief:
      "Il cugino di Gennaro ha scritto il form di login del pannello ordini. Gennaro ti ha dato l'autorizzazione scritta per testarlo. Vediamo se regge.",
    specs: [
      { type: 'weblab', difficulty: 1, opts: { kind: 'sqli' } },
      { type: 'codereview', difficulty: 1 },
    ],
    reward: { xp: 100, credits: 60, rep: 5 },
    final: true,
  },

  // --- Liceo Turing ---
  {
    id: 'lt_1',
    companyId: 'liceo',
    title: 'Il server nello sgabuzzino',
    contact: 'Prof.ssa Rossi',
    brief:
      'Il server della scuola non lo tocca nessuno da anni. Entra (con autorizzazione), guardati intorno e trova i file nascosti che non dovrebbero esserci.',
    specs: [
      { type: 'terminal', difficulty: 2, opts: { objective: 'find_hidden' } },
      { type: 'terminal', difficulty: 2, opts: { objective: 'decode_file' } },
    ],
    reward: { xp: 110, credits: 60, rep: 4 },
  },
  {
    id: 'lt_2',
    companyId: 'liceo',
    title: 'Quelli della 4B',
    contact: 'Prof.ssa Rossi',
    brief:
      'Il preside accusa gli studenti. I log del registro elettronico diranno la verità. Analizzali con metodo.',
    specs: [
      { type: 'logs', difficulty: 2 },
      { type: 'logs', difficulty: 2 },
    ],
    reward: { xp: 110, credits: 60, rep: 4 },
  },
  {
    id: 'lt_3',
    companyId: 'liceo',
    title: 'Mappa della rete scolastica',
    contact: 'Prof.ssa Rossi',
    brief:
      'Nessuno sa cosa è collegato alla rete della scuola. Impara a leggere porte e servizi: è la base di ogni valutazione di sicurezza.',
    specs: [
      { type: 'network', difficulty: 2, opts: { sub: 'ports' } },
      { type: 'network', difficulty: 2, opts: { sub: 'nmap' } },
      { type: 'binary', difficulty: 2 },
    ],
    reward: { xp: 120, credits: 70, rep: 4 },
  },
  {
    id: 'lt_4',
    companyId: 'liceo',
    title: 'La bacheca degli avvisi',
    contact: 'Prof.ssa Rossi',
    brief:
      'La bacheca online della scuola permette commenti. Uno studente ha scritto che "può far apparire cose". Verifica se è vulnerabile a XSS e proponi la correzione.',
    specs: [
      { type: 'weblab', difficulty: 2, opts: { kind: 'xss' } },
      { type: 'codereview', difficulty: 2 },
      { type: 'ethics', difficulty: 2 },
    ],
    reward: { xp: 140, credits: 80, rep: 6 },
    final: true,
  },

  // --- ShopFast ---
  {
    id: 'sf_1',
    companyId: 'shopfast',
    title: 'Pentest: ricognizione',
    contact: 'Marta',
    brief:
      'Ogni pentest inizia con la ricognizione. Usa nmap sul server di staging (autorizzato) e trova il servizio che non dovrebbe essere esposto.',
    specs: [
      { type: 'terminal', difficulty: 3, opts: { objective: 'nmap' } },
      { type: 'network', difficulty: 3, opts: { sub: 'nmap' } },
    ],
    reward: { xp: 160, credits: 90, rep: 5 },
    requiresTool: 'nmap',
  },
  {
    id: 'sf_2',
    companyId: 'shopfast',
    title: 'Gli ordini degli altri',
    contact: 'Marta',
    brief:
      'Un cliente dice di aver visto per sbaglio l\'ordine di un altro utente. Verifica se la pagina ordini è vulnerabile a IDOR.',
    specs: [
      { type: 'weblab', difficulty: 3, opts: { kind: 'idor' } },
      { type: 'codereview', difficulty: 3 },
    ],
    reward: { xp: 170, credits: 90, rep: 5 },
  },
  {
    id: 'sf_3',
    companyId: 'shopfast',
    title: 'Il dipendente credulone',
    contact: 'Marta',
    brief:
      'Il reparto marketing clicca su tutto. Prepara un test di consapevolezza: riconosci i phishing più sofisticati e spiega i segnali.',
    specs: [
      { type: 'phishing', difficulty: 3 },
      { type: 'phishing', difficulty: 3 },
      { type: 'phishing', difficulty: 3 },
    ],
    reward: { xp: 170, credits: 90, rep: 5 },
  },
  {
    id: 'sf_4',
    companyId: 'shopfast',
    title: 'Accesso al server dei pagamenti',
    contact: 'Marta',
    brief:
      'Le credenziali SSH del server pagamenti sono salvate in chiaro da qualche parte. Trovale, connettiti e documenta il problema. Solo lettura, come da regole di ingaggio.',
    specs: [
      { type: 'terminal', difficulty: 3, opts: { objective: 'ssh' } },
      { type: 'cipher', difficulty: 3 },
      { type: 'ethics', difficulty: 3 },
    ],
    reward: { xp: 220, credits: 120, rep: 8 },
    final: true,
  },

  // --- BancaDigitale ---
  {
    id: 'bd_1',
    companyId: 'banca',
    title: 'Regole di ingaggio',
    contact: 'Dott. Ferri',
    brief:
      'In banca ogni test è tracciato. Dimostra di conoscere le regole del pentesting professionale e le basi legali.',
    specs: [
      { type: 'quiz', difficulty: 3 },
      { type: 'ethics', difficulty: 3 },
    ],
    reward: { xp: 200, credits: 110, rep: 6 },
  },
  {
    id: 'bd_2',
    companyId: 'banca',
    title: 'Brute force notturno',
    contact: 'Dott. Ferri',
    brief:
      'Ogni notte alle 3 qualcuno prova migliaia di password sul portale interno. Trova l\'IP, l\'utente colpito e il momento esatto dell\'accesso riuscito.',
    specs: [
      { type: 'logs', difficulty: 3 },
      { type: 'terminal', difficulty: 3, opts: { objective: 'count' } },
    ],
    reward: { xp: 210, credits: 110, rep: 6 },
  },
  {
    id: 'bd_3',
    companyId: 'banca',
    title: 'Hash rubati',
    contact: 'Dott. Ferri',
    brief:
      'Un vecchio backup con hash di password è finito online. Valuta quanto sono deboli e quali utenti devono cambiare password subito.',
    specs: [
      { type: 'password', difficulty: 3, opts: { mode: 'crack' } },
      { type: 'password', difficulty: 3, opts: { mode: 'crack' } },
      { type: 'cipher', difficulty: 3 },
    ],
    reward: { xp: 210, credits: 110, rep: 6 },
    requiresTool: 'hashcat',
  },
  {
    id: 'bd_4',
    companyId: 'banca',
    title: 'Traffico sospetto',
    contact: 'Dott. Ferri',
    brief:
      'Il SOC ha bisogno di occhi in più. Analizza il traffico in tempo reale e blocca i pacchetti malevoli prima che raggiungano il core banking.',
    specs: [
      { type: 'sniffer', difficulty: 3 },
      { type: 'network', difficulty: 3, opts: { sub: 'subnet' } },
    ],
    reward: { xp: 220, credits: 120, rep: 6 },
    requiresTool: 'wireshark',
  },
  {
    id: 'bd_5',
    companyId: 'banca',
    title: 'Audit del codice di trasferimento',
    contact: 'Dott. Ferri',
    brief:
      'Il modulo dei bonifici è stato riscritto. Prima del rilascio serve una code review di sicurezza. Trova ogni vulnerabilità.',
    specs: [
      { type: 'codereview', difficulty: 3 },
      { type: 'codereview', difficulty: 4 },
      { type: 'weblab', difficulty: 3, opts: { kind: 'traversal' } },
    ],
    reward: { xp: 280, credits: 150, rep: 10 },
    final: true,
  },

  // --- NimbusCloud ---
  {
    id: 'nc_1',
    companyId: 'nimbus',
    title: 'Mille container',
    contact: 'Yuki',
    brief:
      'Un container di un cliente si comporta in modo strano. Entra, analizza i processi e i file, e trova cosa è stato modificato.',
    specs: [
      { type: 'terminal', difficulty: 4, opts: { objective: 'find_flag' } },
      { type: 'terminal', difficulty: 4, opts: { objective: 'perm' } },
    ],
    reward: { xp: 260, credits: 140, rep: 6 },
  },
  {
    id: 'nc_2',
    companyId: 'nimbus',
    title: 'Log a scala',
    contact: 'Yuki',
    brief:
      'Milioni di righe al minuto. Serve occhio e metodo. Trova il pattern di attacco nascosto nel rumore.',
    specs: [
      { type: 'logs', difficulty: 4 },
      { type: 'logs', difficulty: 4 },
      { type: 'sniffer', difficulty: 4 },
    ],
    reward: { xp: 270, credits: 140, rep: 6 },
  },
  {
    id: 'nc_3',
    companyId: 'nimbus',
    title: 'La API dimenticata',
    contact: 'Yuki',
    brief:
      'Una vecchia API interna è ancora esposta. Testa tutte le vulnerabilità web che conosci e proponi le correzioni.',
    specs: [
      { type: 'weblab', difficulty: 4, opts: { kind: 'sqli' } },
      { type: 'weblab', difficulty: 4, opts: { kind: 'idor' } },
      { type: 'codereview', difficulty: 4 },
    ],
    reward: { xp: 280, credits: 150, rep: 7 },
  },
  {
    id: 'nc_4',
    companyId: 'nimbus',
    title: 'Chiavi cifrate',
    contact: 'Yuki',
    brief:
      'Un ex dipendente ha lasciato chiavi API cifrate con metodi "creativi". Recuperale prima che lo faccia qualcun altro, e ruotale.',
    specs: [
      { type: 'cipher', difficulty: 4 },
      { type: 'cipher', difficulty: 4 },
      { type: 'binary', difficulty: 4 },
      { type: 'ethics', difficulty: 4 },
    ],
    reward: { xp: 340, credits: 180, rep: 10 },
    final: true,
  },

  // --- MedLife ---
  {
    id: 'ml_1',
    companyId: 'medlife',
    title: 'Ransomware in arrivo',
    contact: 'Dott.ssa Conti',
    brief:
      'Il personale medico riceve email con allegati "referti". Alcune sono ransomware. Addestra il tuo occhio: qui un click sbagliato ferma un reparto.',
    specs: [
      { type: 'phishing', difficulty: 4 },
      { type: 'phishing', difficulty: 4 },
      { type: 'quiz', difficulty: 4, opts: { skill: 'social' } },
    ],
    reward: { xp: 300, credits: 160, rep: 7 },
  },
  {
    id: 'ml_2',
    companyId: 'medlife',
    title: 'Dispositivi medici in rete',
    contact: 'Dott.ssa Conti',
    brief:
      'Pompe di infusione, monitor, risonanze: tutto in rete, tutto vecchio. Mappa la rete e isola ciò che è vulnerabile.',
    specs: [
      { type: 'network', difficulty: 4, opts: { sub: 'nmap' } },
      { type: 'network', difficulty: 4, opts: { sub: 'subnet' } },
      { type: 'terminal', difficulty: 4, opts: { objective: 'nmap' } },
    ],
    reward: { xp: 310, credits: 160, rep: 7 },
  },
  {
    id: 'ml_3',
    companyId: 'medlife',
    title: 'Cartelle cliniche',
    contact: 'Dott.ssa Conti',
    brief:
      'Il portale pazienti mostra cartelle cliniche. Verifica ogni possibile via per accedere ai dati di altri pazienti. Zero tolleranza.',
    specs: [
      { type: 'weblab', difficulty: 4, opts: { kind: 'idor' } },
      { type: 'weblab', difficulty: 4, opts: { kind: 'traversal' } },
      { type: 'codereview', difficulty: 4 },
      { type: 'ethics', difficulty: 4 },
    ],
    reward: { xp: 380, credits: 200, rep: 12 },
    final: true,
  },

  // --- GovCERT ---
  {
    id: 'gc_1',
    companyId: 'govcert',
    title: 'Incidente in corso',
    contact: 'Col. Bianchi',
    brief:
      'Una centrale idrica segnala accessi anomali. Sei l\'incident responder di turno. Ricostruisci la timeline dell\'attacco dai log.',
    specs: [
      { type: 'logs', difficulty: 5 },
      { type: 'logs', difficulty: 5 },
      { type: 'terminal', difficulty: 5, opts: { objective: 'grep_log' } },
    ],
    reward: { xp: 380, credits: 200, rep: 8 },
  },
  {
    id: 'gc_2',
    companyId: 'govcert',
    title: 'Il server compromesso',
    contact: 'Col. Bianchi',
    brief:
      'Hai accesso forense a un server compromesso. Trova la backdoor, il file con permessi sbagliati e il messaggio lasciato dagli attaccanti.',
    specs: [
      { type: 'terminal', difficulty: 5, opts: { objective: 'perm' } },
      { type: 'terminal', difficulty: 5, opts: { objective: 'find_hidden' } },
      { type: 'cipher', difficulty: 5 },
    ],
    reward: { xp: 400, credits: 210, rep: 8 },
  },
  {
    id: 'gc_3',
    companyId: 'govcert',
    title: 'Difesa attiva',
    contact: 'Col. Bianchi',
    brief:
      'L\'attacco è ancora in corso. Filtra il traffico in tempo reale e proteggi la rete della centrale.',
    specs: [
      { type: 'sniffer', difficulty: 5 },
      { type: 'network', difficulty: 5, opts: { sub: 'ports' } },
      { type: 'ethics', difficulty: 5 },
    ],
    reward: { xp: 450, credits: 240, rep: 12 },
    final: true,
  },

  // --- Nebula ---
  {
    id: 'nb_1',
    companyId: 'nebula',
    title: 'Red Team: giorno 1',
    contact: 'Sam',
    brief:
      'Il tuo team deve trovare le falle prima dei criminali. Full scope, tutto autorizzato. Mostra di cosa sei capace.',
    specs: [
      { type: 'weblab', difficulty: 5, opts: { kind: 'sqli' } },
      { type: 'weblab', difficulty: 5, opts: { kind: 'xss' } },
      { type: 'codereview', difficulty: 5 },
    ],
    reward: { xp: 450, credits: 250, rep: 8 },
  },
  {
    id: 'nb_2',
    companyId: 'nebula',
    title: 'Catena di attacco',
    contact: 'Sam',
    brief:
      'Ricognizione, accesso, movimento laterale. Una catena completa su infrastruttura di test. Documenta ogni passo.',
    specs: [
      { type: 'terminal', difficulty: 5, opts: { objective: 'nmap' } },
      { type: 'terminal', difficulty: 5, opts: { objective: 'ssh' } },
      { type: 'password', difficulty: 5, opts: { mode: 'crack' } },
    ],
    reward: { xp: 480, credits: 260, rep: 8 },
  },
  {
    id: 'nb_3',
    companyId: 'nebula',
    title: 'Il briefing al board',
    contact: 'Sam',
    brief:
      'Il consiglio di amministrazione vuole capire. Dimostra padronanza totale della teoria e delle scelte etiche di un leader.',
    specs: [
      { type: 'quiz', difficulty: 5 },
      { type: 'quiz', difficulty: 5 },
      { type: 'ethics', difficulty: 5 },
    ],
    reward: { xp: 520, credits: 300, rep: 14 },
    final: true,
  },

  // --- ORBIT ---
  {
    id: 'ob_1',
    companyId: 'orbit',
    title: 'Protocolli del 1998',
    contact: 'Dir. Okafor',
    brief:
      'I satelliti legacy usano cifrature vecchie e formati binari strani. Decodifica la telemetria e trova l\'anomalia.',
    specs: [
      { type: 'cipher', difficulty: 5 },
      { type: 'binary', difficulty: 5 },
      { type: 'cipher', difficulty: 5 },
    ],
    reward: { xp: 550, credits: 320, rep: 8 },
  },
  {
    id: 'ob_2',
    companyId: 'orbit',
    title: 'Ground Control',
    contact: 'Dir. Okafor',
    brief:
      'La stazione di terra è sotto attacco. Analizza, difendi, rispondi. Tutto insieme. Sei il CSO.',
    specs: [
      { type: 'sniffer', difficulty: 5 },
      { type: 'logs', difficulty: 5 },
      { type: 'terminal', difficulty: 5, opts: { objective: 'ssh' } },
      { type: 'network', difficulty: 5, opts: { sub: 'nmap' } },
    ],
    reward: { xp: 650, credits: 380, rep: 10 },
  },
  {
    id: 'ob_3',
    companyId: 'orbit',
    title: 'Missione finale: Leggenda',
    contact: 'Dir. Okafor',
    brief:
      'Ogni competenza che hai imparato, in un\'unica missione. Se la completi, il tuo nome entra nella storia dei white hat.',
    specs: [
      { type: 'terminal', difficulty: 5, opts: { objective: 'perm' } },
      { type: 'weblab', difficulty: 5, opts: { kind: 'traversal' } },
      { type: 'phishing', difficulty: 5 },
      { type: 'codereview', difficulty: 5 },
      { type: 'ethics', difficulty: 5 },
    ],
    reward: { xp: 1000, credits: 600, rep: 20 },
    final: true,
  },
];

export function missionsFor(companyId: string): MissionDef[] {
  return MISSIONS.filter((m) => m.companyId === companyId);
}
