import type { ChallengeType } from '../types';

export interface PrimerExampleLine {
  t: string;
  cls?: 'cmd' | 'out' | 'ok' | 'dim';
}

export interface Primer {
  type: ChallengeType;
  icon: string;
  title: string;
  what: string; // cos'è, parole semplici, zero nozioni date per scontate
  how: string[]; // passi concreti per superare QUESTA sfida
  commands?: { cmd: string; desc: string }[]; // prontuario (soprattutto terminale)
  example?: { label: string; lines: PrimerExampleLine[] };
  realworld: string; // perché conta nel lavoro vero
}

export const PRIMERS: Record<ChallengeType, Primer> = {
  terminal: {
    type: 'terminal',
    icon: '🖥️',
    title: 'Il Terminale',
    what:
      'Il terminale è un modo per parlare col computer scrivendo comandi invece di usare il mouse. Scrivi un comando, premi Invio, e il computer risponde con del testo. È lo strumento numero uno di ogni hacker perché è veloce e potente. Non devi sapere niente a memoria: qui sotto hai tutti i comandi che ti servono.',
    how: [
      'Guarda cosa c\'è nella cartella dove sei: scrivi ls e premi Invio.',
      'Per leggere un file: cat nomefile (es. cat readme.txt).',
      'Per entrare in una cartella: cd nomecartella. Per tornare indietro: cd ..',
      'L\'obiettivo di solito è trovare una "flag" (un codice tipo ROOTKID{...}) dentro un file, e poi inviarla con: submit ROOTKID{...}',
      'Se ti blocchi, scrivi hint dentro il terminale per un aiuto, oppure help per la lista dei comandi.',
    ],
    commands: [
      { cmd: 'ls', desc: 'elenca i file nella cartella corrente' },
      { cmd: 'ls -a', desc: 'mostra anche i file nascosti (quelli che iniziano con .)' },
      { cmd: 'ls -la', desc: 'mostra file nascosti + dettagli e permessi' },
      { cmd: 'cd cartella', desc: 'entra in una cartella ( cd .. per uscire )' },
      { cmd: 'pwd', desc: 'dice in quale cartella ti trovi ora' },
      { cmd: 'cat file', desc: 'mostra il contenuto di un file' },
      { cmd: 'find /', desc: 'elenca TUTTI i file del sistema (utile se non sai dove cercare)' },
      { cmd: 'grep parola file', desc: 'cerca "parola" dentro un file' },
      { cmd: 'base64 -d file', desc: 'decodifica un file scritto in Base64' },
      { cmd: 'submit VALORE', desc: 'invia la risposta/flag per completare la missione' },
      { cmd: 'help', desc: 'mostra la lista dei comandi' },
      { cmd: 'hint', desc: 'ti dà un suggerimento sulla missione' },
    ],
    example: {
      label: 'Esempio: trovare e inviare una flag',
      lines: [
        { t: 'user@srv:~$ ls', cls: 'cmd' },
        { t: 'documenti/   flag.txt   note.txt', cls: 'out' },
        { t: 'user@srv:~$ cat flag.txt', cls: 'cmd' },
        { t: 'La flag è:', cls: 'out' },
        { t: 'ROOTKID{esempio_1234}', cls: 'out' },
        { t: 'user@srv:~$ submit ROOTKID{esempio_1234}', cls: 'cmd' },
        { t: '✓ Corretto!', cls: 'ok' },
      ],
    },
    realworld:
      'I professionisti della sicurezza vivono nel terminale: è così che si connettono ai server, cercano tracce di un attacco e usano i loro strumenti.',
  },

  cipher: {
    type: 'cipher',
    icon: '🔐',
    title: 'Cifrari e codifiche',
    what:
      'A volte i messaggi non sono in chiaro ma "mescolati" con un metodo. Se conosci il metodo, puoi rimetterli in ordine e leggerli. Attenzione: una CODIFICA (come Base64) si può sempre invertire da chiunque; una CIFRATURA usa una chiave segreta.',
    how: [
      'Il titolo della sfida ti dice SEMPRE il metodo usato (Base64, Cesare, XOR...). Non devi indovinarlo.',
      'Se c\'è una chiave, te la diamo noi accanto al testo cifrato.',
      'Non riesci a decodificare a mano (es. Base64 o hex)? Apri il "🛠️ Banco di lavoro" sotto il riquadro: scegli l\'operazione giusta e ti mostra il testo decodificato — poi premi "Usa come risposta".',
      'Scrivi (o incolla dal banco di lavoro) il testo "in chiaro" nel riquadro e premi Verifica.',
      'Ancora bloccato? Premi 💡 Suggerimento: spiega il procedimento passo-passo.',
    ],
    example: {
      label: 'Esempio: Base64',
      lines: [
        { t: 'Cifrato:  Q0lBTw==', cls: 'dim' },
        { t: 'Base64 usa lettere/numeri e spesso finisce con "=".', cls: 'dim' },
        { t: 'Decodificato →  CIAO', cls: 'ok' },
      ],
    },
    realworld:
      'Riconoscere e decodificare dati è quotidiano: token, configurazioni e malware spesso nascondono informazioni con queste tecniche.',
  },

  binary: {
    type: 'binary',
    icon: '🔢',
    title: 'Binario e ASCII',
    what:
      'I computer usano solo 0 e 1 (il "binario"). Ogni carattere che scrivi corrisponde a un numero (tabella ASCII): per esempio A = 65. Qui ti alleni a passare tra numeri normali, binario e caratteri.',
    how: [
      'Binario → decimale: ogni cifra da destra vale 1, 2, 4, 8, 16, 32, 64, 128. Somma i valori dove c\'è un 1. Es: 1011 = 8+0+2+1 = 11.',
      'Decimale → binario: dividi per 2 più volte e leggi i resti dal basso verso l\'alto.',
      'Codice ASCII → carattere: 65=A, 97=a, 48="0". Il suggerimento ti dà la tabellina.',
      'Compila tutte le caselle e premi Verifica.',
    ],
    example: {
      label: 'Esempio',
      lines: [
        { t: '1011 in decimale = 8+2+1 = 11', cls: 'ok' },
        { t: 'codice ASCII 65 = carattere A', cls: 'ok' },
      ],
    },
    realworld:
      'Capire binario ed esadecimale serve per analizzare file, protocolli di rete e programmi a basso livello (reverse engineering).',
  },

  password: {
    type: 'password',
    icon: '🔑',
    title: 'Password e hash',
    what:
      'Le password non andrebbero mai salvate "in chiaro": si salva un "hash", cioè un\'impronta illeggibile. Da un hash non si torna indietro, ma si può indovinare la password provandone tante e confrontando le impronte. Qui impari cosa rende una password forte e come funziona il "cracking".',
    how: [
      'Modalità "ordina": trascina/usa le frecce per mettere le password dalla più DEBOLE (in alto) alla più FORTE (in basso). Regola: più è LUNGA e imprevedibile, più è forte. Parole comuni, nomi e date sono deboli.',
      'Modalità "cracking": hai un hash rubato. Clicca "calcola hash" sui candidati e trova quello con la stessa impronta, poi scegli "questa".',
    ],
    example: {
      label: 'Robustezza (dalla più debole)',
      lines: [
        { t: 'pizza123          → debolissima (parola + numeri)', cls: 'dim' },
        { t: 'Napoli10!         → media', cls: 'dim' },
        { t: 'viola-tavolo-NUVOLA-72 → fortissima (lunga e casuale)', cls: 'ok' },
      ],
    },
    realworld:
      'Chi difende un sistema deve saper valutare la forza delle password e capire come gli attaccanti provano a "craccare" gli hash rubati.',
  },

  codereview: {
    type: 'codereview',
    icon: '🔍',
    title: 'Revisione del codice',
    what:
      'Molte falle di sicurezza nascono da errori nel codice. La "code review" è leggere il codice per trovare la riga sbagliata. Non devi saper programmare benissimo: devi riconoscere alcuni schemi pericolosi ricorrenti.',
    how: [
      '1) Clicca sulla RIGA che secondo te è pericolosa.',
      '2) Scegli tra le opzioni il TIPO di vulnerabilità.',
      'Cosa cercare: dati che arrivano dall\'utente (input, richieste) usati senza controlli; password o chiavi scritte nel codice; comandi/query costruiti "incollando" testo dell\'utente.',
      'Non conosci i tipi? Premi 💡 Suggerimento. Alla fine trovi sempre la spiegazione e la correzione giusta.',
    ],
    example: {
      label: 'Esempio: la riga incolla l\'input in una query',
      lines: [
        { t: 'query = "SELECT * FROM utenti WHERE nome=\'" + input + "\'"', cls: 'cmd' },
        { t: '↑ pericolosa: l\'utente può iniettare comandi SQL', cls: 'dim' },
        { t: 'Tipo: SQL Injection', cls: 'ok' },
      ],
    },
    realworld:
      'Le aziende pagano esperti per revisionare il codice prima del rilascio: trovare un bug qui costa mille volte meno che dopo un attacco.',
  },

  weblab: {
    type: 'weblab',
    icon: '🌐',
    title: 'Laboratorio Web',
    what:
      'I siti web ricevono dati da te (quello che scrivi nei campi, l\'indirizzo nell\'URL). Se il sito si fida troppo di quei dati, un attaccante può ingannarlo. Qui, in un ambiente di test sicuro, prima "sfrutti" la falla e poi scegli come correggerla.',
    how: [
      '1) Sfrutta: scrivi un "payload" (un input speciale) nel campo indicato. Ogni tipo ha il suo esempio classico scritto sotto il campo — puoi copiarlo.',
      'Non ci riesci? C\'è il pulsante per saltare l\'exploit (usa un aiuto) e passare comunque alla parte importante.',
      '2) Correggi: scegli tra le opzioni la soluzione corretta. Spesso la risposta giusta NON è "filtrare i caratteri cattivi", ma cambiare approccio (es. query parametrizzate, controllo dei permessi).',
    ],
    example: {
      label: 'Esempio: bypass di un login (SQL Injection)',
      lines: [
        { t: "Campo utente:  ' OR '1'='1", cls: 'cmd' },
        { t: 'La condizione diventa sempre vera → entri senza password', cls: 'dim' },
        { t: 'Correzione: query parametrizzate (prepared statement)', cls: 'ok' },
      ],
    },
    realworld:
      'Queste sono tra le vulnerabilità più diffuse al mondo (OWASP Top 10). Saperle trovare e correggere è il cuore del pentesting web.',
  },

  phishing: {
    type: 'phishing',
    icon: '🎣',
    title: 'Riconoscere il phishing',
    what:
      'Il phishing è un\'email (o messaggio) truffa che finge di venire da qualcuno di fidato — la banca, un corriere, un collega — per farti cliccare un link, aprire un allegato o dare i tuoi dati. Non serve nessuna abilità tecnica: serve occhio.',
    how: [
      'Guarda il DOMINIO del mittente: la parte dopo la @. È davvero quello ufficiale? Occhio ai trucchi (poste-italliane, amaz0n con lo zero, paypaI con la I).',
      'Diffida dell\'urgenza ("entro 24 ore o blocchiamo il conto") e delle richieste di password, carte o codici.',
      'Attenzione ad allegati strani (.html, .xlsm che chiede di "abilitare le macro").',
      'Decidi: è phishing o legittima? Poi scegli l\'indizio che lo dimostra.',
    ],
    example: {
      label: 'Esempio: indizio decisivo',
      lines: [
        { t: 'Da: servizio@poste-italliane-sicurezza.com', cls: 'dim' },
        { t: '"poste-italliane" scritto male + dominio non ufficiale', cls: 'dim' },
        { t: '→ È phishing', cls: 'ok' },
      ],
    },
    realworld:
      'Il 90% degli attacchi inizia con un\'email di phishing. Formare le persone a riconoscerle è una delle difese più efficaci in assoluto.',
  },

  logs: {
    type: 'logs',
    icon: '📄',
    title: 'Analisi dei log',
    what:
      'Ogni sistema tiene un "diario" (i log): righe di testo che dicono chi ha fatto cosa e quando. Quando succede un attacco, la verità è nei log. Il tuo compito è leggerli e rispondere a delle domande.',
    how: [
      'Leggi le righe con calma. Cerca cose che si RIPETONO (stesso indirizzo IP, stesso errore molte volte).',
      'Usa il campo "filtra" in alto per mostrare solo le righe con una parola (es. FAILED): è come il comando grep.',
      'Segnali d\'allarme: tanti "Failed password" = qualcuno prova a indovinare; caratteri strani come \' OR 1=1 = tentativo di attacco.',
      'Scrivi le risposte nelle caselle (di solito un IP, un nome utente o un numero) e invia.',
    ],
    example: {
      label: 'Esempio',
      lines: [
        { t: 'Failed password for admin from 45.9.12.3   (ripetuto 200 volte)', cls: 'dim' },
        { t: '→ attacco brute force dall\'IP 45.9.12.3', cls: 'ok' },
      ],
    },
    realworld:
      'Analizzare i log è il pane quotidiano di chi risponde agli incidenti: è così che si ricostruisce cosa è successo durante un attacco.',
  },

  quiz: {
    type: 'quiz',
    icon: '❓',
    title: 'Quiz di conoscenza',
    what:
      'Domande a risposta multipla sui concetti della sicurezza. Servono a fissare la teoria — quella che distingue chi capisce da chi copia comandi a caso.',
    how: [
      'Leggi la domanda e scegli la risposta che ti sembra giusta.',
      'Dopo ogni risposta vedi subito se era corretta E il perché: anche se sbagli, impari.',
      'Per passare basta rispondere bene alla maggior parte delle domande.',
      'Le nozioni vengono dai corsi dell\'Accademia e dalle spiegazioni delle altre sfide.',
    ],
    realworld:
      'Nei colloqui di lavoro e negli esami di certificazione la teoria conta: sapere il "perché" ti rende un vero professionista.',
  },

  network: {
    type: 'network',
    icon: '📡',
    title: 'Reti',
    what:
      'I computer parlano tra loro tramite la rete. Ogni computer ha un indirizzo (IP) e ogni servizio "ascolta" su una porta numerata (es. i siti web sulla 80/443). Conoscere porte e servizi è la base per capire cosa è esposto e cosa è a rischio.',
    how: [
      'Abbinamenti: seleziona una voce a sinistra, poi la corrispondente a destra.',
      'Vero/Falso: valuta l\'affermazione. Dopo vedi la spiegazione.',
      'Lettura scansione (nmap): guardi le porte aperte e scegli quale è più rischiosa.',
      'Porte da sapere: 80=HTTP, 443=HTTPS, 22=SSH, 21=FTP, 53=DNS, 25=SMTP, 23=Telnet(insicuro), 3306=MySQL.',
    ],
    example: {
      label: 'Esempio: porte pericolose',
      lines: [
        { t: '23/tcp  open  telnet', cls: 'dim' },
        { t: 'Telnet manda tutto in chiaro → va sostituito con SSH (22)', cls: 'ok' },
      ],
    },
    realworld:
      'Ogni valutazione di sicurezza inizia mappando la rete: quali macchine ci sono e quali porte/servizi espongono.',
  },

  ethics: {
    type: 'ethics',
    icon: '⚖️',
    title: 'Etica del white hat',
    what:
      'Qui non ci sono comandi: c\'è una situazione reale e devi scegliere come comportarti. È la parte più importante del gioco: ciò che distingue un white hat (buono) da un criminale non è la tecnica, ma l\'AUTORIZZAZIONE e l\'intenzione di proteggere.',
    how: [
      'Leggi lo scenario e scegli l\'azione che faresti.',
      'La scelta "giusta" (white) di solito è: ho il permesso? sto minimizzando i danni? proteggo le persone?',
      'Le scelte sbagliate abbassano il tuo punteggio Etica; quelle giuste lo alzano.',
      'Non c\'è trucco: ragiona come un professionista di cui ci si può fidare.',
    ],
    realworld:
      'Le aziende assumono chi sanno di poter fidare. Una sola scelta sbagliata può rovinare una carriera (e finire in tribunale): l\'etica è la tua reputazione.',
  },

  sniffer: {
    type: 'sniffer',
    icon: '🎯',
    title: 'Difesa attiva (Packet Defense)',
    what:
      'Un mini-gioco di riflessi. Sullo schermo scorrono dei "pacchetti" di rete: alcuni sono traffico normale, altri sono attacchi. Il tuo compito è bloccare solo quelli cattivi, come fa un sistema di difesa reale.',
    how: [
      'Clicca (tocca) i pacchetti ROSSI: sono attacchi (porte come 4444, 1337 o indirizzi in blacklist).',
      'NON toccare i pacchetti VERDI: è traffico legittimo (porte 80, 443, 22).',
      'Ogni pacchetto cattivo che sfugge, o buono bloccato per sbaglio, ti toglie una vita.',
      'Raggiungi il punteggio obiettivo prima che scada il tempo.',
    ],
    realworld:
      'I sistemi di prevenzione delle intrusioni (IPS) fanno esattamente questo, ma su milioni di pacchetti al secondo e in automatico.',
  },
};

export function getPrimer(type: ChallengeType): Primer {
  return PRIMERS[type];
}
