import type { SkillId } from '../types';

export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
  why: string;
  skill: SkillId;
  d: number; // difficoltà 1-5
}

const Q = (skill: SkillId, d: number, q: string, options: string[], answer: number, why: string): QuizQ => ({
  skill,
  d,
  q,
  options,
  answer,
  why,
});

export const QUIZ_BANK: QuizQ[] = [
  // ===== ETICA / BASI =====
  Q('social', 1, 'Cosa distingue un white hat da un black hat?', ['Il sistema operativo che usa', 'Ha il permesso del proprietario del sistema', 'Usa strumenti più potenti', 'Lavora solo di notte'], 1, 'Il white hat attacca solo sistemi per cui ha autorizzazione esplicita e lo fa per migliorarne la sicurezza.'),
  Q('social', 1, "Trovi una vulnerabilità nel sito della tua scuola senza averla cercata. Cosa fai?", ['La sfrutto per cambiare i voti', 'La pubblico su TikTok', 'La segnalo in modo responsabile ai responsabili', 'La vendo online'], 2, 'Si chiama "responsible disclosure": segnalare in privato al proprietario, dandogli tempo di correggere.'),
  Q('social', 1, 'Cosa significa "CTF" nel mondo hacker?', ['Cyber Task Force', 'Capture The Flag', 'Code To Fix', 'Crack The Firewall'], 1, 'I CTF sono gare legali dove si risolvono sfide di sicurezza per trovare "flag". Ottimi per imparare!'),
  Q('social', 2, 'Cos\'è un "bug bounty"?', ['Una taglia su un hacker', 'Un programma che premia chi segnala vulnerabilità', 'Un virus che caccia altri virus', 'Un insetto informatico'], 1, 'Aziende come Google o Apple pagano ricercatori che trovano e segnalano bug in modo responsabile.'),
  Q('social', 2, 'Cosa sono le "regole di ingaggio" in un pentest?', ['Le regole del gioco di ruolo', 'Il documento che definisce cosa si può testare, quando e come', 'Le regole per assumere hacker', 'Un manuale di nmap'], 1, 'Le Rules of Engagement definiscono il perimetro autorizzato: uscirne significa commettere un reato.'),
  Q('social', 3, 'In Italia, accedere abusivamente a un sistema informatico è…', ['Legale se non fai danni', 'Un reato (art. 615-ter c.p.)', 'Legale se sei minorenne', 'Solo una multa'], 1, "L'art. 615-ter del codice penale punisce l'accesso abusivo anche senza causare danni. L'autorizzazione è tutto."),
  Q('social', 1, 'Cos\'è il social engineering?', ['Un software per social network', 'Manipolare le persone per ottenere informazioni o accessi', 'Ingegneria dei server social', 'Un tipo di firewall'], 1, "L'anello più debole è spesso l'essere umano: phishing, pretexting e baiting sono tecniche di social engineering."),
  Q('social', 2, 'Cos\'è il "pretexting"?', ['Scrivere codice prima di testarlo', 'Inventare uno scenario credibile per ingannare qualcuno', 'Un test di penetrazione', 'Un tipo di crittografia'], 1, 'Es: "Sono del reparto IT, mi serve la sua password per un aggiornamento". Un pretesto per ottenere fiducia.'),
  Q('social', 3, 'Cos\'è la "2FA" (autenticazione a due fattori)?', ['Due password diverse', 'Verificare identità con due elementi diversi (es. password + codice sul telefono)', 'Due account per sicurezza', 'Un firewall doppio'], 1, 'Qualcosa che sai (password) + qualcosa che hai (telefono). Anche se rubano la password, non entrano.'),
  Q('social', 3, 'Cos\'è il "tailgating" in sicurezza fisica?', ['Seguire un veicolo', 'Entrare in un\'area protetta seguendo qualcuno autorizzato', 'Copiare un badge', 'Guardare lo schermo altrui'], 1, 'Basta un sorriso e "tieni la porta!" per superare un controllo badge. Il social engineering non è solo digitale.'),
  Q('social', 4, 'Cos\'è lo "spear phishing"?', ['Phishing generico di massa', 'Phishing mirato a una persona specifica con informazioni personalizzate', 'Phishing via SMS', 'Phishing telefonico'], 1, 'Più è personalizzato, più è credibile. Lo spear phishing usa nome, ruolo, colleghi reali della vittima.'),
  Q('social', 4, 'Cos\'è il "vishing"?', ['Phishing via video', 'Phishing telefonico (voice)', 'Phishing via VPN', 'Virus + phishing'], 1, 'Voice phishing: telefonate che fingono di essere la banca o l\'assistenza tecnica.'),
  Q('social', 5, 'Cos\'è una "Business Email Compromise" (BEC)?', ['Un\'email aziendale con virus', 'Un attacco in cui si impersona un dirigente per far eseguire pagamenti', 'Un server email compromesso', 'Spam aziendale'], 1, 'BEC: "Sono il CEO, fai subito un bonifico a questo IBAN". Costa miliardi alle aziende ogni anno.'),
  Q('social', 5, 'Quale framework classifica tattiche e tecniche degli attaccanti reali?', ['OWASP Top 10', 'MITRE ATT&CK', 'ISO 9001', 'GDPR'], 1, 'MITRE ATT&CK è la "enciclopedia" delle tecniche di attacco osservate nel mondo reale, usata da difensori e red team.'),

  // ===== LINUX =====
  Q('linux', 1, 'Quale comando mostra la directory corrente?', ['ls', 'pwd', 'cd', 'dir'], 1, 'pwd = "print working directory".'),
  Q('linux', 1, 'Quale comando mostra anche i file nascosti?', ['ls -l', 'ls -a', 'ls -h', 'ls -r'], 1, 'In Linux i file che iniziano con "." sono nascosti. ls -a (all) li mostra.'),
  Q('linux', 1, 'Cosa fa "cat file.txt"?', ['Cancella il file', 'Mostra il contenuto del file', 'Crea un file', 'Rinomina il file'], 1, 'cat = concatenate, ma di solito si usa per stampare il contenuto di un file.'),
  Q('linux', 2, 'Cosa fa "grep -i errore log.txt"?', ['Cancella le righe con "errore"', 'Cerca "errore" ignorando maiuscole/minuscole', 'Conta i file', 'Installa grep'], 1, '-i = case insensitive. grep è il coltellino svizzero per cercare nei file.'),
  Q('linux', 2, 'Chi è l\'utente "root"?', ['Un utente ospite', 'L\'amministratore con tutti i poteri', 'Il primo utente creato', 'Un bot di sistema'], 1, 'root può fare tutto. Per questo ottenerlo ("get root") è l\'obiettivo di molti attacchi.'),
  Q('linux', 2, 'Cosa fa il comando "sudo"?', ['Spegne il PC', 'Esegue un comando con privilegi di amministratore', 'Cerca file', 'Cambia utente ospite'], 1, 'sudo = "superuser do". Serve per eseguire comandi che richiedono permessi elevati.'),
  Q('linux', 3, 'Cosa significano i permessi "rwxr-xr--"?', ['Tutti possono fare tutto', 'Proprietario: lettura/scrittura/esecuzione; gruppo: lettura/esecuzione; altri: solo lettura', 'Nessuno può leggere', 'Solo root può eseguire'], 1, 'I permessi sono in tre gruppi di tre: proprietario, gruppo, altri. r=read, w=write, x=execute.'),
  Q('linux', 3, 'Quale file contiene la lista degli utenti di sistema?', ['/etc/users', '/etc/passwd', '/home/list', '/var/users'], 1, '/etc/passwd contiene gli utenti (le password hashate sono in /etc/shadow, leggibile solo da root).'),
  Q('linux', 3, 'Cosa fa "chmod 777 file"?', ['Cancella il file', 'Dà tutti i permessi a tutti (pericoloso!)', 'Rende il file nascosto', 'Copia il file 777 volte'], 1, '777 = rwx per tutti. Quasi mai una buona idea: chiunque può modificare ed eseguire il file.'),
  Q('linux', 4, 'Cos\'è il bit SUID su un eseguibile?', ['Rende il file invisibile', 'Fa eseguire il programma con i permessi del proprietario (spesso root)', 'Blocca l\'esecuzione', 'Comprime il file'], 1, 'Un binario SUID root mal configurato è una via classica per la privilege escalation.'),
  Q('linux', 4, 'Cosa fa "find / -perm -4000 2>/dev/null"?', ['Trova file di 4000 byte', 'Trova tutti i file con bit SUID, nascondendo gli errori', 'Cancella file vecchi', 'Trova le porte aperte'], 1, "Un comando classico nell'enumerazione post-exploitation per trovare binari SUID."),
  Q('linux', 4, 'Cosa contiene /var/log/auth.log?', ['I log del browser', 'I tentativi di login e uso di sudo', 'La cronologia dei comandi', 'I file temporanei'], 1, 'auth.log registra login SSH, sudo e autenticazioni: il primo posto dove cercare un intruso.'),
  Q('linux', 5, 'Cos\'è un "reverse shell"?', ['Una shell con i comandi al contrario', 'Una connessione in cui la vittima si collega all\'attaccante fornendo una shell', 'Un terminale grafico', 'Un antivirus'], 1, "Aggira i firewall perché è la macchina interna a iniziare la connessione verso l'esterno."),
  Q('linux', 5, 'Cos\'è il file /etc/shadow?', ['La cache del sistema', 'Il file con gli hash delle password, leggibile solo da root', 'Un file di configurazione grafica', 'La lista dei gruppi'], 1, 'Se un attaccante legge /etc/shadow, può provare a crackare gli hash offline.'),

  // ===== WEB =====
  Q('web', 1, 'Cosa indica il lucchetto nel browser (HTTPS)?', ['Il sito è sicuramente onesto', 'La connessione è cifrata', 'Il sito è veloce', 'Non ci sono virus'], 1, 'HTTPS cifra il traffico, ma anche un sito di phishing può avere il lucchetto!'),
  Q('web', 2, 'Cos\'è la SQL injection?', ['Un modo per velocizzare i database', 'Inserire codice SQL in un input per manipolare le query', 'Un tipo di backup', 'Un linguaggio di programmazione'], 1, "Se l'input dell'utente finisce dentro la query senza controlli, l'attaccante può leggere o distruggere il database."),
  Q('web', 2, 'Cos\'è l\'XSS (Cross-Site Scripting)?', ['Un attacco che inietta script nelle pagine viste da altri utenti', 'Un protocollo di rete', 'Un tipo di cookie', 'Un framework CSS'], 0, 'Con XSS un attaccante può rubare cookie di sessione o eseguire azioni a nome della vittima.'),
  Q('web', 2, 'Come si previene la SQL injection?', ['Usando password lunghe', 'Usando query parametrizzate (prepared statements)', 'Usando HTTPS', 'Nascondendo il database'], 1, 'Le query parametrizzate separano codice e dati: l\'input non può mai diventare parte del comando SQL.'),
  Q('web', 3, 'Cos\'è un cookie di sessione?', ['Un file che rallenta il browser', 'Un token che identifica l\'utente loggato', 'Un virus', 'Una pubblicità'], 1, 'Chi ruba il cookie di sessione può impersonarti senza conoscere la password.'),
  Q('web', 3, 'Cos\'è IDOR?', ['Insecure Direct Object Reference: accedere a risorse altrui cambiando un ID nell\'URL', 'Un protocollo di rete', 'Un tipo di firewall', 'Un algoritmo di hash'], 0, 'Es: /ordine?id=100 → /ordine?id=101. Se vedi l\'ordine di un altro, il server non controlla l\'autorizzazione.'),
  Q('web', 3, 'Cos\'è il "path traversal"?', ['Navigare tra pagine web', 'Usare ../ per leggere file fuori dalla cartella prevista', 'Un tipo di routing', 'Un attacco DNS'], 1, 'Es: ?file=../../etc/passwd. Il server deve validare i percorsi richiesti.'),
  Q('web', 3, 'Cos\'è OWASP?', ['Un antivirus', 'Una fondazione che pubblica la Top 10 delle vulnerabilità web', 'Un browser', 'Un linguaggio'], 1, 'La OWASP Top 10 è la lista di riferimento dei rischi web più critici. Da conoscere a memoria.'),
  Q('web', 4, 'Cos\'è il CSRF?', ['Cross-Site Request Forgery: far eseguire azioni a un utente loggato senza che lo sappia', 'Un cifrario', 'Un tipo di XSS', 'Un header HTTP'], 0, 'Un link o form nascosto su un altro sito che fa un bonifico a tuo nome. Si previene con token anti-CSRF.'),
  Q('web', 4, 'Cosa fa l\'header "Content-Security-Policy"?', ['Comprime la pagina', 'Limita da dove possono essere caricati script e risorse, mitigando XSS', 'Cifra i cookie', 'Blocca i bot'], 1, 'CSP è una delle difese più efficaci contro XSS: se lo script non è da una fonte autorizzata, non viene eseguito.'),
  Q('web', 4, 'Cos\'è SSRF?', ['Server-Side Request Forgery: far fare al server richieste verso destinazioni interne', 'Un tipo di SQL injection', 'Un framework', 'Un algoritmo'], 0, 'Con SSRF si possono raggiungere servizi interni (es. metadata cloud) non esposti su Internet.'),
  Q('web', 5, 'Cos\'è un JWT e qual è un errore classico?', ['Un tipo di cookie; scadono troppo presto', 'JSON Web Token; accettare l\'algoritmo "none" senza verificare la firma', 'Java Web Toolkit; è lento', 'Un firewall; non filtra'], 1, 'Se il server accetta alg:none, un attaccante può forgiare token con qualsiasi ruolo.'),
  Q('web', 5, 'Cos\'è una "race condition" in una app web?', ['Una gara tra browser', 'Due richieste simultanee che sfruttano una finestra temporale nella logica (es. usare un coupon due volte)', 'Un errore di CSS', 'Un attacco DNS'], 1, 'Se il controllo "hai già usato il coupon?" e l\'uso non sono atomici, richieste parallele passano entrambe.'),

  // ===== CRYPTO =====
  Q('crypto', 1, 'Base64 è…', ['Una cifratura sicura', 'Una codifica (reversibile, senza chiave)', 'Un hash', 'Una password'], 1, 'Base64 non protegge nulla: chiunque può decodificarla. Serve solo a rappresentare dati binari come testo.'),
  Q('crypto', 1, 'Il cifrario di Cesare sposta ogni lettera di…', ['Un numero fisso di posizioni', 'Una posizione casuale', 'Non sposta nulla', 'Solo le vocali'], 0, 'Con solo 25 chiavi possibili, si rompe provandole tutte (brute force).'),
  Q('crypto', 2, 'Cos\'è ROT13?', ['Un cifrario di Cesare con spostamento 13', 'Un algoritmo di hash', 'Una codifica binaria', 'Un protocollo'], 0, 'Applicandolo due volte si torna al testo originale, perché 13+13=26 lettere.'),
  Q('crypto', 2, 'Cos\'è una funzione di hash?', ['Una cifratura reversibile', 'Una funzione che produce un\'impronta fissa non reversibile', 'Un modo per comprimere file', 'Una password'], 1, 'Da un hash non si torna al dato originale; per questo le password si salvano come hash.'),
  Q('crypto', 2, 'Perché MD5 non va usato per le password?', ['È troppo lento', 'È veloce da calcolare e ha collisioni note: facile da crackare', 'Non esiste più', 'È a pagamento'], 1, 'Un GPU calcola miliardi di MD5 al secondo. Per le password servono bcrypt, scrypt o Argon2.'),
  Q('crypto', 3, 'Cos\'è il "salt" nelle password?', ['Un tipo di cifratura', 'Dati casuali aggiunti prima dell\'hash per rendere inutili le rainbow table', 'Un sale minerale', 'Un algoritmo di compressione'], 1, 'Con il salt, due utenti con la stessa password hanno hash diversi.'),
  Q('crypto', 3, 'Cifratura simmetrica vs asimmetrica: la differenza?', ['Simmetrica usa una chiave, asimmetrica usa coppia pubblica/privata', 'Nessuna differenza', 'Asimmetrica è più veloce', 'Simmetrica non usa chiavi'], 0, 'AES è simmetrica (stessa chiave per cifrare e decifrare). RSA è asimmetrica (chiave pubblica per cifrare, privata per decifrare).'),
  Q('crypto', 3, 'Cos\'è AES?', ['Un algoritmo di hash', 'Uno standard di cifratura simmetrica usato ovunque', 'Un protocollo email', 'Un tipo di VPN'], 1, 'AES-256 è lo standard per cifrare dati: dischi, VPN, HTTPS.'),
  Q('crypto', 4, 'Cosa fa una "rainbow table"?', ['Colora i log', 'Tabella precalcolata di hash → password per crackare velocemente', 'Cifra file', 'Genera password'], 1, 'Il salt rende le rainbow table inutili, perché ogni hash dipende anche da dati casuali.'),
  Q('crypto', 4, 'Cos\'è un attacco "man in the middle"?', ['Un attacco fisico', 'Intercettare e alterare la comunicazione tra due parti', 'Un virus', 'Un attacco al database'], 1, 'HTTPS con certificati validi protegge dal MITM: verifica sempre il certificato.'),
  Q('crypto', 4, 'Cosa garantisce una firma digitale?', ['Che il messaggio è cifrato', 'Autenticità e integrità: chi l\'ha scritto e che non è stato alterato', 'Che il messaggio è breve', 'Che arriva veloce'], 1, 'La firma si crea con la chiave privata e si verifica con la pubblica.'),
  Q('crypto', 5, 'Cos\'è la "perfect forward secrecy"?', ['Cifratura perfetta', 'Chiavi di sessione temporanee: se rubano la chiave privata, le sessioni passate restano sicure', 'Un algoritmo di hash', 'Un certificato'], 1, 'TLS moderno usa Diffie-Hellman effimero per ottenere PFS.'),
  Q('crypto', 5, 'Perché XOR con una chiave riutilizzata è insicuro?', ['XOR è lento', 'XOR-ando due cifrati si ottiene lo XOR dei testi in chiaro, eliminando la chiave', 'XOR non esiste', 'Perché usa il binario'], 1, 'Il "one-time pad" è sicuro SOLO se la chiave è lunga quanto il messaggio e usata una sola volta.'),

  // ===== NETWORK =====
  Q('network', 1, 'Cos\'è un indirizzo IP?', ['Il nome di un sito', 'L\'indirizzo numerico di un dispositivo in rete', 'Una password', 'Un protocollo'], 1, 'Es: 192.168.1.10. Come il numero civico di casa, ma per computer.'),
  Q('network', 1, 'A cosa serve il DNS?', ['A cifrare il traffico', 'A tradurre nomi (google.com) in indirizzi IP', 'A bloccare virus', 'A creare reti Wi-Fi'], 1, 'Senza DNS dovresti ricordare 142.250.x.x invece di google.com.'),
  Q('network', 2, 'Quale porta usa HTTPS di default?', ['80', '443', '22', '21'], 1, 'HTTP → 80, HTTPS → 443, SSH → 22, FTP → 21. Da imparare a memoria!'),
  Q('network', 2, 'Quale porta usa SSH?', ['22', '23', '25', '53'], 0, 'SSH è la porta 22. Telnet (insicuro) è 23, SMTP 25, DNS 53.'),
  Q('network', 2, 'Cosa fa nmap?', ['Crea mappe geografiche', 'Scansiona reti per trovare host e porte aperte', 'Cifra file', 'Naviga siti web'], 1, 'nmap è lo strumento di ricognizione più famoso al mondo. Usalo solo su reti autorizzate!'),
  Q('network', 3, 'Cos\'è un firewall?', ['Un muro fisico', 'Un sistema che filtra il traffico di rete in base a regole', 'Un antivirus', 'Un router'], 1, 'Il firewall decide quali connessioni passano e quali no, in base a IP, porte e protocolli.'),
  Q('network', 3, 'Perché Telnet è insicuro?', ['È lento', 'Trasmette tutto (password incluse) in chiaro', 'Non esiste su Linux', 'Usa troppa banda'], 1, 'Chiunque intercetti il traffico legge la password. SSH lo ha sostituito perché cifra tutto.'),
  Q('network', 3, 'Cos\'è una VPN?', ['Una rete più veloce', 'Un tunnel cifrato tra il tuo dispositivo e un server', 'Un antivirus', 'Un tipo di Wi-Fi'], 1, 'Protegge il traffico su reti non fidate (es. Wi-Fi pubblico) e nasconde il tuo IP al sito visitato.'),
  Q('network', 3, 'Cosa significa 192.168.1.0/24?', ['Un singolo IP', 'Una rete con 256 indirizzi (da .0 a .255)', 'Una porta', 'Un dominio'], 1, '/24 = i primi 24 bit sono fissi, restano 8 bit per gli host: 2^8 = 256 indirizzi.'),
  Q('network', 4, 'Cos\'è l\'ARP spoofing?', ['Cambiare nome al PC', 'Ingannare la rete locale associando il proprio MAC all\'IP di un altro (es. il router)', 'Un attacco DNS', 'Un tipo di firewall'], 1, 'Permette attacchi man-in-the-middle nella rete locale. Difesa: ARP statico, Dynamic ARP Inspection.'),
  Q('network', 4, 'Cos\'è un attacco DDoS?', ['Un attacco al DNS', 'Sommergere un servizio con traffico da molte fonti per renderlo irraggiungibile', 'Un virus', 'Un attacco al database'], 1, 'Distributed Denial of Service: migliaia di macchine (botnet) attaccano insieme.'),
  Q('network', 4, 'A quale livello OSI lavora un router?', ['Livello 2 (Data Link)', 'Livello 3 (Network)', 'Livello 4 (Transport)', 'Livello 7 (Application)'], 1, 'Il router instrada pacchetti IP: livello 3. Lo switch lavora a livello 2 (MAC).'),
  Q('network', 5, 'Cos\'è la "segmentazione di rete"?', ['Tagliare i cavi', 'Dividere la rete in zone isolate per limitare i movimenti di un attaccante', 'Comprimere i pacchetti', 'Un tipo di VPN'], 1, 'Se i dispositivi medici sono in una VLAN separata, un PC infetto in reception non li raggiunge.'),
  Q('network', 5, 'Cos\'è "zero trust"?', ['Non fidarsi di nessun collega', 'Un modello dove nessuna connessione è fidata a priori, nemmeno dentro la rete interna', 'Un firewall gratuito', 'Un protocollo'], 1, '"Never trust, always verify": ogni accesso viene autenticato e autorizzato, ovunque provenga.'),

  // ===== FORENSICS =====
  Q('forensics', 1, 'Cos\'è un file di log?', ['Un file di legno', 'Un registro di eventi scritto da un sistema o applicazione', 'Un tipo di backup', 'Un virus'], 1, 'I log sono la "scatola nera": raccontano cosa è successo e quando.'),
  Q('forensics', 2, 'In un log, "Failed password for admin from 10.0.0.5" ripetuto 500 volte indica…', ['Un utente distratto', 'Un attacco brute force', 'Un aggiornamento', 'Niente di strano'], 1, 'Centinaia di tentativi falliti in poco tempo da un IP = qualcuno prova password automaticamente.'),
  Q('forensics', 2, 'Cosa vuol dire "timestamp"?', ['Un francobollo', 'Data e ora di un evento', 'Un tipo di hash', 'Una firma'], 1, 'Nella forensics la timeline è tutto: ogni evento va collocato nel tempo.'),
  Q('forensics', 3, 'Cos\'è un IOC (Indicator of Compromise)?', ['Un tipo di virus', 'Un indizio che un sistema è stato compromesso (IP, hash, dominio malevolo)', 'Un certificato', 'Un firewall'], 1, 'Gli IOC vengono condivisi tra aziende per riconoscere attacchi già visti altrove.'),
  Q('forensics', 3, 'Perché si calcola l\'hash di un disco prima di analizzarlo?', ['Per comprimerlo', 'Per dimostrare che le prove non sono state alterate (integrità)', 'Per cifrarlo', 'Per velocizzarlo'], 1, 'La "chain of custody": se l\'hash cambia, la prova non vale più in tribunale.'),
  Q('forensics', 3, 'Cos\'è un SIEM?', ['Un tipo di firewall', 'Un sistema che raccoglie e correla log da molte fonti per rilevare attacchi', 'Un antivirus', 'Un protocollo'], 1, 'Security Information and Event Management: il cervello di un SOC.'),
  Q('forensics', 4, 'Nel log web "GET /index.php?id=1\' OR 1=1--" cosa vedi?', ['Un errore di battitura', 'Un tentativo di SQL injection', 'Una richiesta normale', 'Un download'], 1, "L'apice e OR 1=1 sono la firma classica della SQL injection."),
  Q('forensics', 4, 'Cos\'è la "persistence" in un attacco?', ['Insistere con le password', 'Meccanismi per mantenere l\'accesso anche dopo un riavvio (cron, servizi, chiavi SSH)', 'Un tipo di backup', 'Un firewall'], 1, "Dopo l'intrusione, l'attaccante si assicura di poter tornare: cerca cron job e chiavi SSH sconosciute."),
  Q('forensics', 5, 'Cos\'è la "volatile memory" e perché è importante nella risposta agli incidenti?', ['La memoria del disco', 'La RAM: contiene processi, connessioni e chiavi che spariscono allo spegnimento', 'La cache del browser', 'Un backup'], 1, 'Prima di spegnere una macchina compromessa, si cattura la RAM: contiene prove che altrimenti si perdono.'),
  Q('forensics', 5, 'Cos\'è il "dwell time"?', ['Il tempo di boot', 'Il tempo tra la compromissione e la sua scoperta', 'Il tempo di scansione', 'La durata di un pentest'], 1, 'Spesso è di settimane o mesi. Ridurlo è l\'obiettivo di ogni SOC.'),

  // ===== CODE =====
  Q('code', 1, 'Perché non si scrivono le password nel codice sorgente?', ['Rallentano il programma', 'Chiunque veda il codice (o il repository) le legge', 'Non funzionano', 'Occupano spazio'], 1, 'Le credenziali vanno in variabili d\'ambiente o in un secret manager, mai nel codice.'),
  Q('code', 2, 'Cos\'è la validazione dell\'input?', ['Controllare che i dati in ingresso siano del formato atteso', 'Comprimere i dati', 'Cifrare i dati', 'Cancellare i dati'], 0, '"Never trust user input": ogni dato dall\'esterno va validato prima di usarlo.'),
  Q('code', 2, 'Cosa fa eval() in JavaScript e perché è pericoloso?', ['Valuta espressioni matematiche in sicurezza', 'Esegue una stringa come codice: con input utente è un\'iniezione garantita', 'Cifra stringhe', 'Niente'], 1, 'eval(userInput) = l\'utente può eseguire qualsiasi codice. Da evitare sempre.'),
  Q('code', 3, 'Cos\'è un "buffer overflow"?', ['Un download troppo grande', 'Scrivere più dati di quanti un buffer possa contenere, sovrascrivendo memoria adiacente', 'Un errore di rete', 'Un loop infinito'], 1, 'Classico in C/C++: può portare all\'esecuzione di codice arbitrario. Linguaggi moderni lo prevengono.'),
  Q('code', 3, 'Cos\'è "escaping" dell\'output?', ['Uscire dal programma', 'Trasformare caratteri speciali (< > " \') in entità sicure prima di mostrarli in HTML', 'Comprimere l\'output', 'Nascondere errori'], 1, 'Se mostri "<script>" senza escaping, il browser lo esegue: XSS. Con escaping diventa testo innocuo.'),
  Q('code', 3, 'Cos\'è la "dependency confusion" / supply chain attack?', ['Confondersi tra librerie', 'Compromettere una libreria usata da molti progetti per attaccarli tutti', 'Un errore di build', 'Un tipo di virus'], 1, 'Se un pacchetto npm popolare viene compromesso, migliaia di app ereditano il malware.'),
  Q('code', 4, 'Cos\'è il "principio del minimo privilegio"?', ['Usare sempre root', 'Dare a ogni componente solo i permessi strettamente necessari', 'Dare permessi a tutti', 'Non usare permessi'], 1, 'Se il server web gira come root, un bug diventa controllo totale. Come utente limitato, il danno è contenuto.'),
  Q('code', 4, 'Cos\'è la "deserializzazione insicura"?', ['Leggere file troppo grandi', 'Ricostruire oggetti da dati non fidati, permettendo esecuzione di codice', 'Un errore di JSON', 'Cifrare oggetti'], 1, 'Famosa in Java e PHP: un oggetto serializzato malevolo può eseguire codice al caricamento.'),
  Q('code', 5, 'Cos\'è il "secure by default"?', ['Password di default', 'Configurare i sistemi in modo che la scelta più sicura sia quella automatica', 'Un antivirus', 'Un framework'], 1, 'Es: HTTPS attivo di default, permessi minimi, funzioni pericolose disattivate a meno di scelta esplicita.'),
  Q('code', 5, 'Cos\'è uno "SBOM"?', ['Una bomba software', 'Software Bill of Materials: l\'elenco di tutte le dipendenze di un software', 'Un tipo di build', 'Un errore'], 1, 'Serve a sapere subito se sei esposto quando viene scoperta una vulnerabilità in una libreria.'),
];

export function pickQuiz(skill: SkillId | undefined, d: number, n: number, rng: { shuffle<T>(a: readonly T[]): T[] }): QuizQ[] {
  let pool = QUIZ_BANK.filter((q) => Math.abs(q.d - d) <= 1 && (!skill || q.skill === skill));
  if (pool.length < n) pool = QUIZ_BANK.filter((q) => !skill || q.skill === skill);
  if (pool.length < n) pool = QUIZ_BANK;
  return rng.shuffle(pool).slice(0, n);
}
