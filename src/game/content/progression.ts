import type { Tool, Course, Cert, Achievement } from '../types';

// ===== STRUMENTI (shop) =====
export const TOOLS: Tool[] = [
  { id: 'nmap', name: 'nmap', icon: '📡', cost: 80, reqLevel: 3, desc: 'Scanner di rete: trova host e porte aperte.', real: 'nmap è lo scanner di rete più usato al mondo. "nmap -sV target" rivela i servizi in ascolto.', perk: 'Sblocca le missioni di ricognizione e dà un hint extra nelle sfide di rete.' },
  { id: 'burp', name: 'Burp Proxy', icon: '🕷️', cost: 120, reqLevel: 5, desc: 'Intercetta e modifica il traffico web.', real: 'Burp Suite è lo strumento standard per il pentesting web: intercetta, modifica e rigioca le richieste HTTP.', perk: 'Evidenzia i parametri vulnerabili nelle sfide weblab.' },
  { id: 'hashcat', name: 'hashcat', icon: '🔓', cost: 150, reqLevel: 7, desc: 'Cracker di hash ad alte prestazioni.', real: 'hashcat usa la GPU per provare miliardi di password al secondo contro un hash rubato.', perk: 'Mostra più candidati nelle sfide di password cracking.' },
  { id: 'wireshark', name: 'Wireshark', icon: '🦈', cost: 150, reqLevel: 9, desc: 'Analizzatore di pacchetti di rete.', real: 'Wireshark cattura e mostra ogni pacchetto che attraversa la rete: indispensabile per capire cosa succede davvero.', perk: 'Sblocca le missioni con lo sniffer e rallenta leggermente il flusso di pacchetti.' },
  { id: 'metasploit', name: 'Metasploit', icon: '💥', cost: 250, reqLevel: 12, desc: 'Framework di exploit.', real: 'Metasploit raccoglie migliaia di exploit pronti. Usato dai red team per simulare attacchi reali.', perk: 'Dà un hint gratuito per missione nelle sfide di difficoltà 4+.' },
  { id: 'ida', name: 'Disassembler', icon: '🔬', cost: 300, reqLevel: 15, desc: 'Reverse engineering di binari.', real: 'I disassembler come Ghidra o IDA trasformano codice macchina in qualcosa di leggibile. Cuore del reverse engineering.', perk: 'Rende più leggibili le sfide binarie (mostra la conversione intermedia).' },
  { id: 'siem', name: 'SIEM Console', icon: '📊', cost: 350, reqLevel: 18, desc: 'Correlazione di log su larga scala.', real: 'Un SIEM (Splunk, Elastic) raccoglie log da tutta l\'azienda e li correla per rilevare attacchi. Il cervello di un SOC.', perk: 'Evidenzia automaticamente le righe di log sospette.' },
  { id: 'c2', name: 'C2 Framework', icon: '🎛️', cost: 500, reqLevel: 25, desc: 'Simulazione di comando e controllo (red team).', real: 'I framework C2 (es. Cobalt Strike, in contesti autorizzati) gestiscono le macchine compromesse durante un red team engagement.', perk: 'Bonus reputazione del +20% sulle missioni finali delle aziende.' },
];

// ===== CORSI (accademia) =====
export const COURSES: Course[] = [
  {
    id: 'c_linux1', skill: 'linux', title: 'Linux per hacker', cost: 40, minLevel: 1, xp: 50,
    lesson: [
      'Il terminale è la tua arma principale. Niente finestre, niente mouse: solo comandi che fanno esattamente ciò che chiedi.',
      'I comandi fondamentali: ls (lista file), cd (cambia cartella), pwd (dove sono), cat (mostra un file), grep (cerca testo). Aggiungi "-a" a ls per vedere i file nascosti (quelli che iniziano con ".").',
      'Tutto in Linux è un file, persino i dispositivi. I permessi (rwx) decidono chi può leggere, scrivere ed eseguire. L\'utente "root" può tutto: per questo è il bersaglio numero uno.',
    ],
    quiz: [
      { q: 'Quale comando mostra i file nascosti?', options: ['ls', 'ls -a', 'cat', 'cd'], answer: 1 },
      { q: 'Chi è root?', options: ['Un ospite', 'L\'amministratore con tutti i poteri', 'Un virus', 'Il primo file'], answer: 1 },
    ],
  },
  {
    id: 'c_web1', skill: 'web', title: 'Sicurezza Web: le basi', cost: 50, minLevel: 2, xp: 60,
    lesson: [
      'Il web funziona con richieste HTTP: il browser chiede, il server risponde. Ogni parametro che invii (URL, form, cookie) è un potenziale punto di attacco.',
      'La regola d\'oro: "mai fidarsi dell\'input dell\'utente". La SQL injection nasce proprio quando l\'input finisce dentro una query senza controlli. La difesa sono le prepared statement.',
      'L\'XSS inietta script nelle pagine viste da altri. La difesa è l\'escaping dell\'output e la Content-Security-Policy. Conosci la OWASP Top 10: è la mappa dei rischi web.',
    ],
    quiz: [
      { q: 'Come si previene la SQL injection?', options: ['Password lunghe', 'Prepared statement', 'HTTPS', 'Nascondere il DB'], answer: 1 },
      { q: 'L\'XSS esegue script...', options: ['Sul server', 'Nel browser di altri utenti', 'Nel database', 'Nel firewall'], answer: 1 },
    ],
  },
  {
    id: 'c_crypto1', skill: 'crypto', title: 'Crittografia 101', cost: 50, minLevel: 2, xp: 60,
    lesson: [
      'Attenzione alla differenza: CODIFICA (Base64, hex) è reversibile da chiunque e non protegge nulla. CIFRATURA usa una chiave segreta. HASH è un\'impronta non reversibile.',
      'Le password si salvano come hash + salt, mai in chiaro e mai con MD5 (troppo veloce da crackare). Si usano bcrypt, scrypt o Argon2.',
      'XOR è la base di molte cifrature: reversibile, ma insicuro se la chiave si ripete. Il one-time pad è l\'unico inviolabile, ma richiede chiavi enormi e usa-e-getta.',
    ],
    quiz: [
      { q: 'Base64 è...', options: ['Una cifratura sicura', 'Una codifica reversibile', 'Un hash', 'Una password'], answer: 1 },
      { q: 'Perché MD5 è sbagliato per le password?', options: ['È lento', 'È veloce da crackare', 'Non esiste', 'È a pagamento'], answer: 1 },
    ],
  },
  {
    id: 'c_net1', skill: 'network', title: 'Reti e protocolli', cost: 60, minLevel: 3, xp: 70,
    lesson: [
      'Ogni dispositivo in rete ha un indirizzo IP. Le porte identificano i servizi: 80 (HTTP), 443 (HTTPS), 22 (SSH), 53 (DNS). Impararle a memoria è fondamentale.',
      'nmap scansiona una rete per scoprire host e porte aperte: è il primo passo di ogni valutazione (solo su reti autorizzate!).',
      'La notazione /24 indica una rete di 256 indirizzi. La segmentazione di rete e il modello "zero trust" limitano i movimenti di un attaccante che è già entrato.',
    ],
    quiz: [
      { q: 'Quale porta usa SSH?', options: ['80', '443', '22', '53'], answer: 2 },
      { q: 'Cosa fa nmap?', options: ['Cifra file', 'Scansiona host e porte', 'Naviga il web', 'Crea mappe'], answer: 1 },
    ],
  },
  {
    id: 'c_social1', skill: 'social', title: 'Il fattore umano', cost: 60, minLevel: 3, xp: 70,
    lesson: [
      'Spesso l\'anello più debole non è il software, ma le persone. Il social engineering manipola la fiducia: phishing, pretexting, vishing.',
      'Per riconoscere un phishing: controlla il dominio del mittente (non il nome visualizzato!), diffida dell\'urgenza, non cliccare link sospetti, attenzione agli allegati che chiedono di "abilitare le macro".',
      'La difesa: 2FA ovunque, formazione continua, e la cultura del "nel dubbio, verifica con un secondo canale". Un CEO che chiede gift card via email? Quasi sempre una truffa BEC.',
    ],
    quiz: [
      { q: 'Cosa controlli per primo in un\'email sospetta?', options: ['Il logo', 'Il dominio del mittente', 'La lunghezza', 'L\'ora'], answer: 1 },
      { q: 'Un "CEO" che chiede gift card via email urgente è...', options: ['Normale', 'Una truffa BEC', 'Un test', 'Un premio'], answer: 1 },
    ],
  },
  {
    id: 'c_for1', skill: 'forensics', title: 'Leggere i log', cost: 70, minLevel: 4, xp: 80,
    lesson: [
      'I log sono la scatola nera: raccontano chi ha fatto cosa e quando. Saperli leggere distingue un incidente da un falso allarme.',
      'Firme da riconoscere: molti "Failed password" = brute force. " OR 1=1 nei log web = SQL injection. Traffico ripetuto verso IP ignoti = possibile C2.',
      'Nell\'incident response, costruisci la TIMELINE: correla eventi da fonti diverse per tempo, ricostruendo la kill chain. Preserva sempre le prove (hash, chain of custody).',
    ],
    quiz: [
      { q: 'Molti "Failed password" dallo stesso IP indicano...', options: ['Un aggiornamento', 'Un brute force', 'Niente', 'Un backup'], answer: 1 },
      { q: 'Cosa ricostruisci in un incidente?', options: ['Il budget', 'La timeline degli eventi', 'Il logo', 'Il menu'], answer: 1 },
    ],
  },
  {
    id: 'c_code1', skill: 'code', title: 'Secure Coding', cost: 80, minLevel: 5, xp: 90,
    lesson: [
      'Scrivere codice sicuro è più economico che correggerlo dopo un attacco. I principi: valida ogni input, fai escaping di ogni output, usa il minimo privilegio.',
      'Mai credenziali nel codice (usa variabili d\'ambiente). Mai eval() su input utente. Mai concatenare input in query SQL o comandi shell.',
      'Pensa "secure by default": la scelta più sicura dev\'essere quella automatica. E conosci le tue dipendenze (SBOM): una libreria compromessa infetta tutta l\'app.',
    ],
    quiz: [
      { q: 'Dove vanno le password/chiavi API?', options: ['Nel codice', 'Variabili d\'ambiente o secret manager', 'Nei commenti', 'Nel README'], answer: 1 },
      { q: 'Cos\'è il minimo privilegio?', options: ['Usare root', 'Solo i permessi necessari', 'Nessun permesso', 'Tutti i permessi'], answer: 1 },
    ],
  },
  {
    id: 'c_web2', skill: 'web', title: 'Web Avanzato', cost: 120, minLevel: 10, xp: 140,
    lesson: [
      'Oltre la Top 10: CSRF (azioni forzate su utenti loggati), SSRF (il server fa richieste interne per te), deserializzazione insicura, race condition.',
      'I JWT vanno VERIFICATI, non solo decodificati. L\'algoritmo "none" è una trappola classica. I cookie: httpOnly + secure + SameSite.',
      'Pensa in catene: una XSS che ruba un token + un IDOR = compromissione completa. I bug più gravi nascono combinando falle piccole.',
    ],
    quiz: [
      { q: 'Con un JWT devi sempre...', options: ['Solo decodificarlo', 'Verificarne la firma', 'Cifrarlo', 'Ignorarlo'], answer: 1 },
      { q: 'SSRF fa sì che...', options: ['L\'utente attacchi', 'Il server faccia richieste interne', 'Il DB si cancelli', 'Il cookie scada'], answer: 1 },
    ],
  },
];

// ===== CERTIFICAZIONI (esami) =====
export const CERTS: Cert[] = [
  {
    id: 'fondamenti', name: 'Cyber Fundamentals', icon: '📜', reqLevel: 5, cost: 100, questions: 6, pass: 5,
    topics: ['linux', 'web', 'social', 'network'],
    desc: 'Le basi trasversali della sicurezza. Richiesta da ShopFast.',
    realWorld: 'Simile a certificazioni entry-level come CompTIA Security+ o la ISC2 CC: dimostrano che conosci i fondamentali.',
  },
  {
    id: 'webpentest', name: 'Web Pentest Pro', icon: '🏆', reqLevel: 12, cost: 200, questions: 7, pass: 6,
    topics: ['web', 'code'],
    desc: 'Padronanza delle vulnerabilità web e delle correzioni. Richiesta da NimbusCloud.',
    realWorld: 'Ispirata a certificazioni come eWPT o la parte web dell\'OSCP: focus su attacco e difesa delle applicazioni web.',
  },
  {
    id: 'forensics', name: 'Incident & Forensics', icon: '🔎', reqLevel: 22, cost: 300, questions: 8, pass: 6,
    topics: ['forensics', 'network', 'linux'],
    desc: 'Analisi di incidenti e digital forensics. Richiesta da GovCERT.',
    realWorld: 'Sulla scia di GCFA/GCIH (SANS): rispondere agli incidenti e analizzare sistemi compromessi.',
  },
  {
    id: 'elite', name: 'Offensive Security Elite', icon: '👑', reqLevel: 35, cost: 500, questions: 10, pass: 8,
    topics: ['linux', 'web', 'crypto', 'network', 'forensics', 'social', 'code'],
    desc: 'La certificazione definitiva. Tutte le competenze al massimo. Richiesta da ORBIT.',
    realWorld: 'Il nostro omaggio all\'OSCP: l\'esame pratico e temuto che dimostra padronanza completa dell\'offensive security.',
  },
];

// ===== ACHIEVEMENT =====
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_flag', name: 'Prima Flag', icon: '🚩', desc: 'Trova la tua prima flag nel terminale.' },
  { id: 'first_job', name: 'Assunto!', icon: '💼', desc: 'Vieni assunto dalla tua prima azienda.' },
  { id: 'no_hints', name: 'A mente fredda', icon: '🧊', desc: 'Completa 10 sfide senza usare hint.' },
  { id: 'phish_master', name: 'Occhio di Falco', icon: '🦅', desc: 'Riconosci 15 email di phishing correttamente.' },
  { id: 'crypto_cracker', name: 'Rompicifrari', icon: '🔐', desc: 'Decifra 15 messaggi cifrati.' },
  { id: 'terminal_wizard', name: 'Mago del Terminale', icon: '🧙', desc: 'Completa 10 sfide nel terminale.' },
  { id: 'code_auditor', name: 'Revisore di Codice', icon: '🔍', desc: 'Trova 15 vulnerabilità nelle code review.' },
  { id: 'certified', name: 'Certificato', icon: '📜', desc: 'Ottieni la tua prima certificazione.' },
  { id: 'all_certs', name: 'Collezionista di Titoli', icon: '👑', desc: 'Ottieni tutte le certificazioni.' },
  { id: 'level10', name: 'Professionista', icon: '⭐', desc: 'Raggiungi il livello 10.' },
  { id: 'level25', name: 'Esperto', icon: '🌟', desc: 'Raggiungi il livello 25.' },
  { id: 'level40', name: 'Leggenda', icon: '💫', desc: 'Raggiungi il livello 40.' },
  { id: 'streak7', name: 'Costante', icon: '🔥', desc: 'Mantieni una streak di 7 giorni.' },
  { id: 'streak30', name: 'Inarrestabile', icon: '☄️', desc: 'Mantieni una streak di 30 giorni.' },
  { id: 'pure_white', name: 'Cappello Immacolato', icon: '🕊️', desc: 'Fai 20 scelte etiche "white hat" senza mai scegliere "black hat".' },
  { id: 'rich', name: 'Ben Pagato', icon: '💰', desc: 'Accumula 2000 crediti.' },
  { id: 'toolbox', name: 'Arsenale Completo', icon: '🧰', desc: 'Compra tutti gli strumenti.' },
  { id: 'scholar', name: 'Secchione', icon: '🎓', desc: 'Completa tutti i corsi dell\'accademia.' },
  { id: 'endgame', name: 'Chief Security Officer', icon: '🚀', desc: 'Raggiungi e completa ORBIT Space Agency.' },
  { id: 'sniffer_ace', name: 'Asso del Packet', icon: '🎯', desc: 'Fai 25+ punti in una partita allo sniffer.' },
  { id: 'daily10', name: 'Abitudinario', icon: '📅', desc: 'Completa 10 sfide giornaliere.' },
  { id: 'perfectionist', name: 'Perfezionista', icon: '💎', desc: 'Completa 20 sfide in modo perfetto (senza errori né hint).' },
];
