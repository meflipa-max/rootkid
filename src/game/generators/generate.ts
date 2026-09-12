import type {
  Challenge, ChallengeType, SkillId,
  TerminalChallenge, CipherChallenge, CodeReviewChallenge, PhishingChallenge,
  LogsChallenge, QuizChallenge, NetworkChallenge, BinaryChallenge, WebLabChallenge,
  EthicsChallenge, PasswordChallenge, SnifferChallenge, NetworkSub, WebLabKind,
} from '../types';
import { RNG, toyHash } from '../rng';
import { buildTerminalWorld } from '../terminal/fs';
import { CIPHER_SPECS } from '../content/ciphers';
import { CODE_SNIPPETS, VULN_TYPES } from '../content/codereview';
import { PHISH_TEMPLATES, GENERIC_CLUES } from '../content/phishing';
import { LOG_SCENARIOS } from '../content/logs';
import { QUIZ_BANK, pickQuiz } from '../content/quiz';
import { ETHICS_SCENARIOS } from '../content/ethics';
import { WEBLABS } from '../content/weblabs';

let counter = 0;
function uid(type: string): string {
  return `${type}_${Date.now().toString(36)}_${(counter++).toString(36)}`;
}

function near<T extends { d: number }>(pool: T[], d: number): T[] {
  let p = pool.filter((x) => Math.abs(x.d - d) <= 1);
  if (p.length === 0) p = pool;
  return p;
}

// ===== TERMINAL =====
export function genTerminal(r: RNG, d: number, opts?: Record<string, unknown>): TerminalChallenge {
  const objective = (opts?.objective as string) ?? 'find_flag';
  const world = buildTerminalWorld(r.int(1, 1e9), { objective, difficulty: d });
  const titles: Record<string, string> = {
    find_flag: 'Caccia alla flag',
    find_hidden: 'File nascosti',
    decode_file: 'File codificato',
    grep_log: 'Caccia nei log',
    count: 'Conta gli eventi',
    perm: 'Permessi sospetti',
    nmap: 'Ricognizione porte',
    ssh: 'Movimento laterale',
  };
  const hints: Record<string, string[]> = {
    find_flag: ['Usa "ls" per vedere i file, "cd cartella" per entrarci, "cat file" per leggerlo.', 'Controlla /tmp, /var/www e la tua home. Quando trovi ROOTKID{...}, usa "submit ROOTKID{...}".'],
    find_hidden: ['I file nascosti iniziano con "." e si vedono solo con "ls -a".', 'Esplora ogni cartella con "ls -a", poi "cat .nomefile".'],
    decode_file: ['Base64 si decodifica con "base64 -d nomefile".', 'Leggi prima il file con cat per vedere la stringa codificata.'],
    grep_log: ['Usa "grep FAILED /var/log/access.log" per filtrare le righe sospette.', 'L\'IP ripetuto tante volte accanto a FAILED è quello da inviare con submit.'],
    count: ['Usa "grep -c FAILED /var/log/auth.log" per contare le righe.', 'Il numero restituito da grep -c è la risposta.'],
    perm: ['Usa "ls -la" in ogni cartella (prova /tmp) per vedere i permessi.', 'Cerca permessi come -rwxrwxrwx: quel file contiene la flag. Leggilo con cat.'],
    nmap: ['Esegui "nmap <ip>" usando l\'IP indicato nell\'obiettivo.', 'Telnet(23), MySQL(3306) e Redis(6379) esposti sono pericolosi: invia la loro porta.'],
    ssh: ['Cerca un file di configurazione (cerca in ~/config) con "cat" per trovare la password SSH.', 'Connettiti con "ssh utente@ip" e inserisci la password trovata. La flag è nella home remota.'],
  };
  return {
    id: uid('term'),
    type: 'terminal',
    title: titles[objective] ?? 'Terminale',
    skill: objective === 'nmap' ? 'network' : objective === 'grep_log' || objective === 'count' ? 'forensics' : 'linux',
    difficulty: d,
    brief: world.objective,
    objective: world.objective,
    hosts: world.hosts,
    startHost: world.startHost,
    flag: world.flag,
    hints: hints[objective] ?? ['Esplora con ls, cd, cat.'],
    learn: 'Il terminale è lo strumento numero uno di ogni professionista della sicurezza. Comandi come ls, cat, grep e nmap sono il pane quotidiano: padroneggiarli ti rende autonomo su qualsiasi sistema Unix.',
    glossary: objective === 'nmap' ? ['ip', 'ssh'] : objective === 'grep_log' ? ['logs', 'bruteforce'] : ['linux', 'perms'],
  };
}

// ===== CIPHER =====
export function genCipher(r: RNG, d: number): CipherChallenge {
  const spec = r.pick(near(CIPHER_SPECS, d));
  const { plaintext, ciphertext, key } = spec.gen(r);
  return {
    id: uid('ciph'),
    type: 'cipher',
    title: `Decifra: ${spec.methodLabel}`,
    skill: 'crypto',
    difficulty: d,
    brief: `Messaggio intercettato. Metodo: ${spec.methodLabel}${key ? ` (chiave: ${key})` : ''}. Decodifica il testo in chiaro.`,
    ciphertext,
    plaintext,
    method: spec.method,
    methodLabel: spec.methodLabel,
    key,
    hints: [
      `Metodo: ${spec.methodLabel}. ${spec.learn.split('.')[0]}.`,
      key ? `La chiave è: ${key}. Applicala per decifrare.` : 'Prova a ragionare sul metodo indicato nel titolo.',
    ],
    learn: spec.learn,
    glossary: spec.glossary,
  };
}

// ===== BINARY =====
export function genBinary(r: RNG, d: number): BinaryChallenge {
  const rounds = [];
  const n = d <= 2 ? 3 : 4;
  for (let i = 0; i < n; i++) {
    const mode = r.int(0, d <= 2 ? 1 : 2);
    if (mode === 0) {
      const v = r.int(d <= 2 ? 1 : 8, d <= 2 ? 31 : 255);
      rounds.push({ prompt: `Converti in BINARIO il numero decimale:`, from: 'decimale', to: 'binario', value: String(v), answer: v.toString(2) });
    } else if (mode === 1) {
      const v = r.int(d <= 2 ? 1 : 8, d <= 2 ? 31 : 255);
      rounds.push({ prompt: `Converti in DECIMALE il numero binario:`, from: 'binario', to: 'decimale', value: v.toString(2), answer: String(v) });
    } else {
      const v = r.int(32, 126);
      rounds.push({ prompt: `Quale CARATTERE ASCII corrisponde al codice decimale:`, from: 'ascii-dec', to: 'char', value: String(v), answer: String.fromCharCode(v) });
    }
  }
  return {
    id: uid('bin'),
    type: 'binary',
    title: 'Conversioni: binario & ASCII',
    skill: 'crypto',
    difficulty: d,
    brief: 'Gli hacker pensano in binario ed esadecimale. Completa le conversioni. (Suggerimento: 8 bit = 1 byte; i bit valgono 128-64-32-16-8-4-2-1)',
    rounds,
    hints: ['Ogni posizione binaria da destra vale 1,2,4,8,16,32,64,128. Somma dove c\'è un 1.', 'Per decimale→binario: dividi per 2 e annota i resti dal basso verso l\'alto. A=65, a=97, 0=48 in ASCII.'],
    learn: 'Il binario è il linguaggio delle macchine. 8 bit formano un byte, che può rappresentare un numero (0-255) o un carattere (tabella ASCII). Reverse engineering e analisi di protocolli richiedono questa fluidità.',
    glossary: ['hex', 'ascii'],
  };
}

// ===== CODE REVIEW =====
export function genCodeReview(r: RNG, d: number): CodeReviewChallenge {
  const snip = r.pick(near(CODE_SNIPPETS, d));
  const distractors = r.shuffle(VULN_TYPES.filter((v) => v !== snip.vulnType)).slice(0, 3);
  const options = r.shuffle([snip.vulnType, ...distractors]);
  return {
    id: uid('cr'),
    type: 'codereview',
    title: `Code review: ${snip.title}`,
    skill: 'code',
    difficulty: d,
    brief: `Rivedi questo codice ${snip.language}. 1) Clicca la riga vulnerabile. 2) Scegli il tipo di vulnerabilità.`,
    language: snip.language,
    lines: snip.lines,
    vulnLine: snip.vulnLine,
    vulnType: snip.vulnType,
    options,
    fix: snip.fix,
    hints: ['Cerca dove l\'input dell\'utente viene usato senza controlli, o dove ci sono segreti/comandi pericolosi.', `Il problema è di tipo "${snip.vulnType}". Guarda la riga dove questo può accadere.`],
    learn: `${snip.vulnType}. Correzione: ${snip.fix}`,
    glossary: snip.glossary,
  };
}

// ===== PHISHING =====
export function genPhishing(r: RNG, d: number): PhishingChallenge {
  const t = r.pick(near(PHISH_TEMPLATES, d));
  const clueOptions = r.shuffle([t.clue, ...r.sample(t.distractors, Math.min(2, t.distractors.length)), r.pick(GENERIC_CLUES)]);
  return {
    id: uid('phish'),
    type: 'phishing',
    title: 'Analisi email',
    skill: 'social',
    difficulty: d,
    brief: 'Esamina questa email. È un tentativo di phishing o è legittima? Poi indica l\'indizio decisivo.',
    email: {
      fromName: t.fromName,
      fromAddr: t.fromAddr,
      subject: t.subject,
      body: t.body,
      linkText: t.linkText,
      linkHref: t.linkHref,
      attachment: t.attachment,
      date: 'oggi, 09:' + String(r.int(10, 59)).padStart(2, '0'),
    },
    isPhishing: t.isPhishing,
    clue: t.clue,
    clueOptions,
    hints: ['Controlla il DOMINIO del mittente (la parte dopo @), non il nome visualizzato. Occhio a urgenza e richieste di dati.', t.isPhishing ? `È phishing. Indizio: ${t.clue.split(':')[0]}...` : 'Sembra legittima: mittente coerente e nessuna richiesta sospetta.'],
    learn: (t.isPhishing ? '⚠️ Questa era PHISHING. ' : '✓ Questa era LEGITTIMA. ') + t.clue + '. Regola d\'oro: verifica sempre il dominio reale del mittente e diffida di urgenza e richieste di credenziali.',
    glossary: ['phishing', 'social'],
  };
}

// ===== LOGS =====
export function genLogs(r: RNG, d: number): LogsChallenge {
  const sc = r.pick(near(LOG_SCENARIOS, d));
  const { lines, questions } = sc.build(r.int(1, 1e9));
  return {
    id: uid('log'),
    type: 'logs',
    title: `Analisi log: ${sc.filename}`,
    skill: 'forensics',
    difficulty: d,
    brief: sc.brief,
    filename: sc.filename,
    lines,
    questions,
    hints: ['Leggi ogni riga con attenzione: cerca pattern ripetuti (stesso IP, stesso errore).', 'Gli eventi anomali (FAILED ripetuti, caratteri strani, porte insolite) sono la chiave. Conta e confronta.'],
    learn: sc.learn,
    glossary: sc.glossary,
  };
}

// ===== QUIZ =====
export function genQuiz(r: RNG, d: number, opts?: Record<string, unknown>): QuizChallenge {
  const skill = opts?.skill as SkillId | undefined;
  const n = d <= 2 ? 3 : d <= 4 ? 4 : 5;
  const qs = pickQuiz(skill, d, n, r);
  return {
    id: uid('quiz'),
    type: 'quiz',
    title: 'Quiz di conoscenza',
    skill: skill ?? 'social',
    difficulty: d,
    brief: 'Rispondi alle domande. Ogni risposta corretta dimostra padronanza della teoria.',
    questions: qs.map((q) => ({ q: q.q, options: q.options, answer: q.answer, why: q.why })),
    hints: ['Rifletti su cosa hai imparato nei corsi dell\'accademia.', 'Elimina le risposte palesemente assurde, poi scegli la più precisa tecnicamente.'],
    learn: 'La teoria è ciò che distingue uno script kiddie (che copia comandi) da un professionista (che capisce perché funzionano). Ogni domanda qui è un concetto reale del mestiere.',
    glossary: qs.flatMap((q) => []),
  };
}

// ===== NETWORK =====
const PORT_PAIRS = [
  { left: 'HTTP', right: '80' }, { left: 'HTTPS', right: '443' }, { left: 'SSH', right: '22' },
  { left: 'FTP', right: '21' }, { left: 'DNS', right: '53' }, { left: 'SMTP', right: '25' },
  { left: 'Telnet', right: '23' }, { left: 'MySQL', right: '3306' }, { left: 'RDP', right: '3389' },
  { left: 'Redis', right: '6379' },
];
const OSI_PAIRS = [
  { left: 'Router', right: 'L3 Network' }, { left: 'Switch', right: 'L2 Data Link' },
  { left: 'HTTP/DNS', right: 'L7 Application' }, { left: 'TCP/UDP', right: 'L4 Transport' },
  { left: 'Cavo/Wi-Fi', right: 'L1 Physical' },
];
export function genNetwork(r: RNG, d: number, opts?: Record<string, unknown>): NetworkChallenge {
  const sub = (opts?.sub as NetworkSub) ?? r.pick(['ports', 'nmap', 'subnet', 'osi'] as NetworkSub[]);
  const base: Omit<NetworkChallenge, 'sub'> = {
    id: uid('net'),
    type: 'network',
    title: 'Reti',
    skill: 'network',
    difficulty: d,
    brief: '',
    hints: [],
    learn: '',
    glossary: ['ip'],
  };
  if (sub === 'ports') {
    const n = d <= 2 ? 4 : 5;
    const pairs = r.sample(PORT_PAIRS, n);
    return { ...base, sub, title: 'Abbina porte e servizi', brief: 'Associa ogni servizio alla sua porta standard. Queste vanno sapute a memoria!', pairs, hints: ['HTTP=80, HTTPS=443, SSH=22.', 'FTP=21, DNS=53, SMTP=25, MySQL=3306.'], learn: 'Le porte standard identificano i servizi. Un professionista le riconosce al volo: vedere la 23 (Telnet) o la 3306 (MySQL) esposte è subito un campanello d\'allarme.', glossary: ['ip'] };
  }
  if (sub === 'osi') {
    const pairs = r.sample(OSI_PAIRS, d <= 3 ? 4 : 5);
    return { ...base, sub, title: 'Modello OSI', brief: 'Associa ogni dispositivo/protocollo al suo livello OSI.', pairs, hints: ['Il router instrada pacchetti IP: livello 3. Lo switch lavora coi MAC: livello 2.', 'HTTP e DNS sono applicazioni: livello 7. TCP/UDP: livello 4.'], learn: 'Il modello OSI a 7 livelli è la mappa mentale delle reti. Capire a quale livello avviene un attacco (ARP a L2, DNS a L7) guida la difesa.', glossary: ['ip'] };
  }
  if (sub === 'subnet') {
    const subnetQ = [
      { q: '192.168.1.0/24 contiene 256 indirizzi.', answer: true, why: '/24 lascia 8 bit per gli host: 2^8 = 256.' },
      { q: 'Un /25 contiene più indirizzi di un /24.', answer: false, why: 'Più alto è il numero dopo /, più piccola è la rete. /25 = 128, /24 = 256.' },
      { q: 'L\'indirizzo 10.0.0.0 è privato (non instradabile su Internet).', answer: true, why: '10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16 sono reti private (RFC 1918).' },
      { q: '255.255.255.0 è la subnet mask di un /24.', answer: true, why: '/24 = 24 bit a 1 = 255.255.255.0.' },
      { q: 'In una /24, l\'ultimo indirizzo (.255) è usabile per un host.', answer: false, why: '.255 è l\'indirizzo di broadcast, .0 è quello di rete: non si assegnano agli host.' },
    ];
    return { ...base, sub, title: 'Subnet & indirizzamento', brief: 'Vero o Falso sulle reti IP. La base per segmentare e difendere.', subnetQ: r.sample(subnetQ, d <= 3 ? 3 : 4), hints: ['/N indica quanti bit sono fissi per la rete. 32-N bit restano per gli host.', 'Reti private: 10.x, 172.16-31.x, 192.168.x. Broadcast e network address non si assegnano.'], learn: 'Il subnetting divide le reti in segmenti. La segmentazione isola i sistemi critici: un attaccante in una VLAN non raggiunge le altre.', glossary: ['ip'] };
  }
  // nmap
  const scans = [
    { lines: ['PORT     STATE  SERVICE', '22/tcp   open   ssh', '80/tcp   open   http', '23/tcp   open   telnet'], question: 'Quale porta rappresenta il rischio maggiore (protocollo in chiaro da dismettere)?', options: ['22 (ssh)', '80 (http)', '23 (telnet)', 'Nessuna'], answer: 2, why: 'Telnet (23) trasmette tutto in chiaro, password incluse. Va sostituito con SSH.' },
    { lines: ['PORT      STATE  SERVICE', '443/tcp   open   https', '3306/tcp  open   mysql', '22/tcp    open   ssh'], question: 'Quale servizio NON dovrebbe essere esposto su Internet?', options: ['443 (https)', '3306 (mysql)', '22 (ssh)', 'Tutti ok'], answer: 1, why: 'Un database MySQL (3306) esposto su Internet è un grave rischio: va dietro a un firewall o VPN.' },
    { lines: ['PORT      STATE  SERVICE', '80/tcp    open   http', '6379/tcp  open   redis', '8080/tcp  open   http-alt'], question: 'Qual è la porta più pericolosa qui?', options: ['80', '6379 (redis)', '8080', 'Nessuna'], answer: 1, why: 'Redis (6379) spesso gira senza autenticazione: esporlo permette accesso diretto ai dati.' },
  ];
  const scan = r.pick(scans);
  return { ...base, sub, title: 'Interpreta la scansione nmap', brief: 'Hai scansionato un host. Leggi il risultato e identifica il rischio.', scan, hints: ['Le porte "insicure per natura" (Telnet, DB esposti) sono sempre le prime da segnalare.', scan.why.split('.')[0] + '.'], learn: 'Dopo una scansione nmap, il pentester valuta OGNI porta aperta: è necessaria? È aggiornata? È esposta a chi non dovrebbe? ' + scan.why, glossary: ['ip', 'firewall'] };
}

// ===== WEBLAB =====
export function genWebLab(r: RNG, d: number, opts?: Record<string, unknown>): WebLabChallenge {
  const kind = (opts?.kind as WebLabKind) ?? r.pick(['sqli', 'xss', 'idor', 'traversal'] as WebLabKind[]);
  const lab = WEBLABS[kind](r, d);
  return {
    id: uid('web'),
    type: 'weblab',
    title: lab.title,
    skill: 'web',
    difficulty: d,
    brief: lab.brief,
    kind,
    site: lab.site,
    fixOptions: lab.fixOptions,
    hints: lab.hints,
    learn: lab.learn,
    glossary: lab.glossary,
  };
}

// ===== ETHICS =====
export function genEthics(r: RNG, d: number): EthicsChallenge {
  const sc = r.pick(near(ETHICS_SCENARIOS, d));
  return {
    id: uid('eth'),
    type: 'ethics',
    title: 'Dilemma etico',
    skill: 'social',
    difficulty: d,
    brief: 'Non ci sono comandi qui, solo la tua bussola morale. Cosa fai?',
    scenario: sc.scenario,
    choices: r.shuffle(sc.choices),
    hints: ['Chiediti: ho l\'autorizzazione? Sto minimizzando i danni? Cosa farebbe un professionista?', 'La scelta "white" protegge le persone e rispetta le regole, anche quando è la più scomoda.'],
    learn: 'L\'etica non è un dettaglio: è ciò che separa un white hat da un criminale. Le aziende assumono chi sanno di poter fidare. La tua reputazione vale più di qualsiasi exploit.',
    glossary: sc.glossary,
  };
}

// ===== PASSWORD =====
const WEAK_PW = ['123456', 'password', 'qwerty', 'pizza123', 'admin', '111111', 'iloveyou', 'letmein', 'abc123', 'dragon'];
const MID_PW = ['Estate2024', 'Mario1985', 'Napoli10!', 'Password1', 'Azienda2023', 'Giulia123!'];
const STRONG_PW = ['j7$Kp!2vXq@9mZ', 'correct-horse-battery-staple', 'Tr0ub4dour&3xplain', 'x9#Lm2$pQ7!wE4z', 'viola-tavolo-72-NUVOLA!'];

function pwScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (pw.length >= 16) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/[0-9]/.test(pw)) s += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) s += 1;
  const common = [...WEAK_PW, 'password', 'admin'].some((w) => pw.toLowerCase().includes(w.toLowerCase()));
  if (common) s = Math.min(s, 1);
  if (/^[0-9]+$/.test(pw)) s = Math.min(s, 1);
  return Math.min(5, s);
}

export function genPassword(r: RNG, d: number, opts?: Record<string, unknown>): PasswordChallenge {
  const mode = (opts?.mode as 'rank' | 'crack') ?? (d <= 1 ? 'rank' : r.pick(['rank', 'crack'] as const));
  const base: Omit<PasswordChallenge, 'mode'> = {
    id: uid('pw'),
    type: 'password',
    title: 'Password',
    skill: 'crypto',
    difficulty: d,
    brief: '',
    hints: [],
    learn: '',
    glossary: ['hash', 'salt'],
  };
  if (mode === 'rank') {
    // una password distinta da ciascuna fascia + una quarta a caso, così l'ordinamento ha sempre varietà di robustezza
    const chosen = [r.pick(WEAK_PW), r.pick(MID_PW), r.pick(STRONG_PW)];
    const extraPool = [...WEAK_PW, ...MID_PW, ...STRONG_PW].filter((p) => !chosen.includes(p));
    chosen.push(r.pick(extraPool));
    const passwords = r.shuffle(chosen).map((pw) => ({ pw, score: pwScore(pw) }));
    return { ...base, mode, title: 'Ordina per robustezza', brief: 'Trascina o usa le frecce per ordinare queste password dalla PIÙ DEBOLE (in alto) alla PIÙ FORTE (in basso).', passwords, hints: ['Lunghezza > complessità. Una frase lunga batte 8 caratteri complicati.', 'Le parole del dizionario, i nomi e le date sono deboli, anche con numeri aggiunti.'], learn: 'La robustezza di una password dipende soprattutto dalla LUNGHEZZA e dall\'imprevedibilità. "correct-horse-battery-staple" (4 parole casuali) è più forte di "Tr0ub4dor&3" ed è più facile da ricordare. Meglio ancora: un password manager + 2FA.', glossary: ['hash'] };
  }
  // crack: semplificato — associa hash a password dato un piccolo dizionario
  const answer = r.pick(d <= 2 ? WEAK_PW : d <= 4 ? [...WEAK_PW, ...MID_PW] : [...MID_PW, ...STRONG_PW]);
  const hash = toyHash(answer);
  const nCand = d <= 2 ? 4 : 6;
  const others = r.sample([...WEAK_PW, ...MID_PW, ...STRONG_PW].filter((p) => p !== answer), nCand - 1);
  const candidates = r.shuffle([answer, ...others]);
  return {
    ...base, mode, title: 'Cracking: trova la password', hash, candidates, answer,
    brief: `Hai rubato un hash da un backup: \n${hash}\nConfronta questo hash con quelli del tuo "dizionario" di password comuni. Quale password lo genera? (È così che funziona un attacco a dizionario: l'hash da solo non si "inverte", ma si provano password note finché l'hash combacia.)\n[Nota: qui l'hash è didattico e semplificato; nel mondo reale sono MD5, SHA-1/256, bcrypt o Argon2 e si usano strumenti come hashcat o John the Ripper.]`,
    ruleHint: 'Il gioco calcola l\'hash di ogni candidato: clicca quello il cui hash corrisponde.',
    hints: ['Gli attacchi reali (con hashcat/John) provano milioni di password al secondo da wordlist come rockyou.txt. Qui il dizionario è piccolo: prova i candidati.', `La password è una di quelle comuni/deboli. ${d <= 2 ? 'È tra le più usate al mondo.' : 'Contiene un anno o un nome.'}`],
    learn: 'Un hash NON si "decifra" (è a senso unico). Si craccano provando password candidate, calcolandone l\'hash e confrontando (attacco a dizionario/brute force). In pratica si usano hashcat o John the Ripper su hash reali (MD5, SHA-256, bcrypt…). Difesa: password lunghe e uniche + SALT per utente + algoritmi lenti come bcrypt, scrypt o Argon2, che rendono ogni tentativo costoso.',
    glossary: ['hash', 'salt'],
  };
}

// ===== SNIFFER =====
export function genSniffer(r: RNG, d: number): SnifferChallenge {
  const badIps = [`45.${r.int(0, 255)}.${r.int(0, 255)}.${r.int(1, 254)}`, `103.${r.int(0, 255)}.${r.int(0, 255)}.${r.int(1, 254)}`];
  return {
    id: uid('snif'),
    type: 'sniffer',
    title: 'Difesa attiva: Packet Filter',
    skill: 'network',
    difficulty: d,
    brief: 'I pacchetti scorrono in tempo reale. BLOCCA (clic) i pacchetti MALEVOLI (rossi: porte di attacco come 4444/1337 o IP in blacklist) e LASCIA PASSARE il traffico legittimo (verde: 80/443). Ogni errore costa punti!',
    badIps,
    badPorts: [4444, 1337, 31337, 6667, 23],
    duration: 30 + d * 5,
    target: 10 + d * 3,
    seed: r.int(1, 1e9),
    hints: ['I pacchetti ROSSI (porte di attacco/C2) vanno bloccati. I VERDI (web legittimo) vanno lasciati passare.', 'Non cliccare a caso: bloccare traffico legittimo è un errore quanto lasciar passare un attacco.'],
    learn: 'Un sistema di prevenzione delle intrusioni (IPS) fa esattamente questo su scala enorme: analizza ogni pacchetto e decide in millisecondi. Le regole si basano su IP malevoli noti, porte sospette e pattern di traffico.',
    glossary: ['firewall', 'c2'],
  };
}

// ===== DISPATCHER =====
export function generateChallenge(type: ChallengeType, d: number, seed: number, opts?: Record<string, unknown>): Challenge {
  const r = new RNG(seed);
  switch (type) {
    case 'terminal': return genTerminal(r, d, opts);
    case 'cipher': return genCipher(r, d);
    case 'binary': return genBinary(r, d);
    case 'codereview': return genCodeReview(r, d);
    case 'phishing': return genPhishing(r, d);
    case 'logs': return genLogs(r, d);
    case 'quiz': return genQuiz(r, d, opts);
    case 'network': return genNetwork(r, d, opts);
    case 'weblab': return genWebLab(r, d, opts);
    case 'ethics': return genEthics(r, d);
    case 'password': return genPassword(r, d, opts);
    case 'sniffer': return genSniffer(r, d);
    default: return genQuiz(r, d, opts);
  }
}

export const ALL_TYPES: ChallengeType[] = ['terminal', 'cipher', 'codereview', 'phishing', 'logs', 'quiz', 'network', 'binary', 'weblab', 'ethics', 'password', 'sniffer'];
