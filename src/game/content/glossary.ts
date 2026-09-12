import type { GlossaryEntry } from '../types';

export const GLOSSARY: GlossaryEntry[] = [
  { id: 'sqli', term: 'SQL Injection', skill: 'web', def: 'Inserire codice SQL in un input per manipolare le query del database. Si previene con le prepared statement (query parametrizzate).' },
  { id: 'prepared', term: 'Prepared Statement', skill: 'web', def: 'Query in cui i dati utente sono passati come parametri separati dal codice SQL, così non possono mai essere interpretati come comandi.' },
  { id: 'xss', term: 'XSS', skill: 'web', def: 'Cross-Site Scripting: iniettare script che verranno eseguiti nel browser di altri utenti. Si previene con output escaping e Content-Security-Policy.' },
  { id: 'escaping', term: 'Escaping', skill: 'code', def: 'Trasformare caratteri speciali (< > " \') in versioni sicure prima di mostrarli, così il browser non li interpreta come codice.' },
  { id: 'idor', term: 'IDOR', skill: 'web', def: 'Insecure Direct Object Reference: accedere a risorse altrui cambiando un identificatore (es. un ID nell\'URL) quando il server non verifica l\'autorizzazione.' },
  { id: 'traversal', term: 'Path Traversal', skill: 'web', def: 'Usare sequenze come ../ per uscire dalla cartella prevista e leggere file di sistema (es. ../../etc/passwd).' },
  { id: 'csrf', term: 'CSRF', skill: 'web', def: 'Cross-Site Request Forgery: far eseguire a un utente loggato un\'azione senza il suo consenso. Si previene con token anti-CSRF e cookie SameSite.' },
  { id: 'ssti', term: 'Template Injection', skill: 'web', def: 'Iniettare codice in un motore di template lato server (es. {{7*7}}), che può portare all\'esecuzione di codice.' },
  { id: 'nosqli', term: 'NoSQL Injection', skill: 'web', def: 'Come la SQL injection ma su database NoSQL (es. MongoDB): operatori come $ne possono bypassare l\'autenticazione.' },
  { id: 'jwt', term: 'JWT', skill: 'web', def: 'JSON Web Token: un token firmato che rappresenta l\'identità. Va sempre VERIFICATO (jwt.verify), non solo decodificato (jwt.decode).' },
  { id: 'cookie', term: 'Cookie di sessione', skill: 'web', def: 'Identifica un utente loggato. Va protetto con httpOnly (non leggibile da JS), secure (solo HTTPS) e SameSite.' },
  { id: 'openredirect', term: 'Open Redirect', skill: 'web', def: 'Un redirect che accetta URL arbitrari come destinazione, usabile per portare le vittime su siti malevoli sembrando legittimo.' },
  { id: 'webhook', term: 'Webhook', skill: 'web', def: 'Una chiamata HTTP che un servizio invia al tuo server per notificare eventi. Va sempre verificata la firma per evitare messaggi falsi.' },

  { id: 'base64', term: 'Base64', skill: 'crypto', def: 'Codifica (NON cifratura!) che rappresenta dati binari come testo. Reversibile da chiunque. Comando: base64 -d' },
  { id: 'encoding', term: 'Codifica vs Cifratura', skill: 'crypto', def: 'La codifica (Base64, hex) trasforma i dati in modo reversibile senza chiave. La cifratura protegge i dati con una chiave segreta.' },
  { id: 'caesar', term: 'Cifrario di Cesare', skill: 'crypto', def: 'Sposta ogni lettera di N posizioni. Solo 25 chiavi: si rompe provandole tutte (brute force).' },
  { id: 'rot13', term: 'ROT13', skill: 'crypto', def: 'Cifrario di Cesare con shift 13. Applicarlo due volte riporta all\'originale. Per nascondere spoiler, non per sicurezza.' },
  { id: 'atbash', term: 'Atbash', skill: 'crypto', def: 'Cifrario che specchia l\'alfabeto: A↔Z, B↔Y... Uno dei più antichi al mondo.' },
  { id: 'hex', term: 'Esadecimale', skill: 'crypto', def: 'Base 16 (0-9, A-F). Ogni coppia di cifre hex rappresenta un byte. 41 = "A" in ASCII.' },
  { id: 'ascii', term: 'ASCII', skill: 'crypto', def: 'Tabella che associa numeri a caratteri: 65=A, 97=a, 48=0. La base della rappresentazione del testo nei computer.' },
  { id: 'xor', term: 'XOR', skill: 'crypto', def: 'Operazione bit a bit reversibile: (A XOR K) XOR K = A. Base di molte cifrature; insicuro se la chiave si ripete.' },
  { id: 'otp', term: 'One-Time Pad', skill: 'crypto', def: 'L\'unica cifratura teoricamente inviolabile: chiave casuale lunga quanto il messaggio, usata una sola volta.' },
  { id: 'vigenere', term: 'Cifrario di Vigenère', skill: 'crypto', def: 'Cifrario polialfabetico con parola chiave: ogni lettera è spostata di una quantità diversa. Per secoli ritenuto indecifrabile.' },
  { id: 'morse', term: 'Codice Morse', skill: 'crypto', def: 'Rappresenta lettere con punti (.) e linee (-). Non è crittografia, ma utile nei CTF.' },
  { id: 'hash', term: 'Hash', skill: 'crypto', def: 'Funzione che produce un\'impronta di lunghezza fissa e NON reversibile. Le password si salvano come hash, mai in chiaro.' },
  { id: 'salt', term: 'Salt', skill: 'crypto', def: 'Dati casuali aggiunti a una password prima dell\'hash: due password uguali danno hash diversi, rendendo inutili le rainbow table.' },
  { id: 'frequency', term: 'Analisi delle frequenze', skill: 'crypto', def: 'Tecnica per rompere cifrari a sostituzione: le lettere più frequenti nel cifrato corrispondono alle più frequenti della lingua.' },
  { id: 'csprng', term: 'Random crittografico', skill: 'crypto', def: 'Math.random() è prevedibile. Per token e chiavi serve un generatore sicuro come crypto.randomBytes.' },
  { id: 'timing', term: 'Timing Attack', skill: 'crypto', def: 'Ricavare informazioni misurando i tempi di risposta. I confronti di segreti devono essere a tempo costante (compare_digest).' },

  { id: 'linux', term: 'Shell / Terminale', skill: 'linux', def: 'L\'interfaccia testuale per dare comandi al sistema. Il vero strumento di ogni hacker.' },
  { id: 'ssh', term: 'SSH', skill: 'network', def: 'Secure Shell: protocollo cifrato (porta 22) per accedere a macchine remote in modo sicuro. Sostituisce Telnet.' },
  { id: 'perms', term: 'Permessi Unix', skill: 'linux', def: 'rwx per proprietario, gruppo e altri. chmod li modifica. 777 = tutti possono tutto (pericoloso).' },
  { id: 'secrets', term: 'Gestione dei segreti', skill: 'code', def: 'Password e chiavi API non vanno mai nel codice: usa variabili d\'ambiente o un secret manager.' },
  { id: 'eval', term: 'eval()', skill: 'code', def: 'Esegue una stringa come codice. Con input utente è un\'iniezione garantita: da evitare sempre.' },
  { id: 'cmdi', term: 'Command Injection', skill: 'code', def: 'Iniettare comandi di sistema concatenando input non validato in una chiamata shell. Usa API con argomenti separati.' },
  { id: 'deser', term: 'Deserializzazione insicura', skill: 'code', def: 'Ricostruire oggetti da dati non fidati (es. pickle in Python) può eseguire codice arbitrario.' },
  { id: 'upload', term: 'Upload di file', skill: 'code', def: 'Gli upload vanno validati (estensione, tipo MIME, nome casuale) per evitare traversal ed esecuzione di file malevoli.' },

  { id: 'ip', term: 'Indirizzo IP', skill: 'network', def: 'Indirizzo numerico di un dispositivo in rete, es. 192.168.1.10.' },
  { id: 'useragent', term: 'User-Agent', skill: 'network', def: 'Stringa che identifica il browser/tool che fa la richiesta. "sqlmap" o "curl" nei log web spesso indicano tool automatici.' },
  { id: 'bruteforce', term: 'Brute Force', skill: 'network', def: 'Provare automaticamente molte combinazioni (password, chiavi) finché una funziona. Molti tentativi falliti nei log ne sono la firma.' },
  { id: 'c2', term: 'Command & Control (C2)', skill: 'forensics', def: 'Il server da cui un attaccante controlla le macchine compromesse. Traffico ripetuto verso IP ignoti su porte strane è un segnale.' },
  { id: 'firewall', term: 'Firewall', skill: 'network', def: 'Filtra il traffico di rete secondo regole (IP, porte, protocolli). ALLOW/DENY nei suoi log.' },

  { id: 'logs', term: 'Log', skill: 'forensics', def: 'Registri di eventi. La "scatola nera" di ogni sistema: raccontano chi ha fatto cosa e quando.' },
  { id: 'killchain', term: 'Kill Chain', skill: 'forensics', def: 'Le fasi di un attacco: ricognizione → accesso → escalation → persistenza → azione. Correlarle ricostruisce l\'incidente.' },
  { id: 'forensics', term: 'Digital Forensics', skill: 'forensics', def: 'L\'analisi di sistemi compromessi per capire cosa è successo, preservando le prove (chain of custody).' },
  { id: 'zeroday', term: 'Zero-Day', skill: 'forensics', def: 'Una vulnerabilità non ancora nota al produttore (quindi senza patch). Molto pericolosa e preziosa.' },
  { id: 'cert', term: 'CERT/CSIRT', skill: 'forensics', def: 'Team di risposta agli incidenti informatici. Fanno da intermediari nella disclosure e coordinano le emergenze.' },

  { id: 'disclosure', term: 'Responsible Disclosure', skill: 'social', def: 'Segnalare una vulnerabilità in privato al proprietario, dandogli tempo di correggere prima di renderla pubblica.' },
  { id: 'ethics', term: 'Etica hacker', skill: 'social', def: 'Il confine tra white hat e criminale è l\'autorizzazione e l\'intenzione di proteggere, non la tecnica usata.' },
  { id: 'law', term: 'Accesso abusivo', skill: 'social', def: 'In Italia (art. 615-ter c.p.) accedere a un sistema senza autorizzazione è reato, anche senza causare danni.' },
  { id: 'scope', term: 'Scope', skill: 'social', def: 'Il perimetro di ciò che sei autorizzato a testare. Uscirne, anche se tecnicamente possibile, è illegale.' },
  { id: 'roe', term: 'Rules of Engagement', skill: 'social', def: 'Il documento che definisce cosa, quando e come si può testare in un pentest.' },
  { id: 'authorization', term: 'Autorizzazione scritta', skill: 'social', def: 'Senza un contratto/autorizzazione formale, qualsiasi test di sicurezza è accesso abusivo. Sempre, senza eccezioni.' },
  { id: 'gdpr', term: 'GDPR', skill: 'social', def: 'Regolamento europeo sulla protezione dei dati personali. Impone minimizzazione, sicurezza e responsabilità nel trattamento.' },
  { id: 'minimization', term: 'Minimizzazione', skill: 'social', def: 'Raccogliere e conservare solo i dati strettamente necessari, per il tempo necessario. Meno dati = meno rischio.' },
  { id: 'ransomware', term: 'Ransomware', skill: 'forensics', def: 'Malware che cifra i file e chiede un riscatto. Pagare finanzia i criminali e non garantisce il recupero.' },
  { id: 'hackback', term: 'Hack Back', skill: 'social', def: 'Contrattaccare chi ti ha attaccato. Illegale e pericoloso: spesso colpisci vittime intermedie innocenti.' },

  { id: '2fa', term: '2FA / MFA', skill: 'social', def: 'Autenticazione a più fattori: qualcosa che sai (password) + qualcosa che hai (telefono). Ferma chi ruba solo la password.' },
  { id: 'phishing', term: 'Phishing', skill: 'social', def: 'Email/messaggi ingannevoli che imitano entità fidate per rubare credenziali o diffondere malware. Controlla sempre il dominio del mittente.' },
  { id: 'bec', term: 'Business Email Compromise', skill: 'social', def: 'Truffa in cui si impersona un dirigente per ordinare bonifici o gift card. Sfrutta urgenza e autorità.' },
];

export function glossaryById(id: string): GlossaryEntry | undefined {
  return GLOSSARY.find((g) => g.id === id);
}
