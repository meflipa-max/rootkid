import { RNG } from '../rng';
import type { WebLabKind } from '../types';

interface LabData {
  title: string;
  brief: string;
  site: string; // descrizione della UI simulata / payload da inserire
  fixOptions: { code: string; correct: boolean; why: string }[];
  hints: string[];
  learn: string;
  glossary: string[];
}

// Ogni lab: l'utente prima "sfrutta" (inserisce/sceglie un payload) nell'UI, poi sceglie la correzione giusta.
export const WEBLABS: Record<WebLabKind, (r: RNG, d: number) => LabData> = {
  sqli: (r) => ({
    title: 'SQL Injection: bypass login',
    brief: 'Il form di login costruisce la query concatenando l\'input. Trova il payload che bypassa il controllo, poi scegli la correzione corretta.',
    site: "SELECT * FROM users WHERE user='[INPUT]' AND pass='[INPUT]'",
    fixOptions: r.shuffle([
      { code: "db.query('SELECT * FROM users WHERE user=? AND pass=?', [u, p])", correct: true, why: 'Prepared statement: i parametri non vengono mai interpretati come SQL. È LA soluzione.' },
      { code: "query = \"...WHERE user='\" + u.replace(\"'\", \"\") + \"'\"", correct: false, why: 'Rimuovere solo l\'apice è una blacklist fragile: esistono mille modi per aggirarla.' },
      { code: 'if (u.length < 20) { /* esegui query concatenata */ }', correct: false, why: 'Limitare la lunghezza non impedisce l\'injection: " or 1=1-- è cortissimo.' },
      { code: 'Nascondere i messaggi di errore SQL all\'utente', correct: false, why: 'Utile (blind SQLi più difficile) ma NON risolve: la query resta iniettabile.' },
    ]),
    hints: ['Payload classico: \' OR \'1\'=\'1  nel campo utente rende la condizione sempre vera.', 'La VERA difesa non filtra l\'input: separa codice e dati con le prepared statement.'],
    learn: 'La SQL injection nasce dal mischiare codice (la query) e dati (l\'input). Payload come \' OR 1=1-- rendono la condizione sempre vera. La soluzione definitiva sono le query parametrizzate (prepared statement): il database tratta l\'input solo come valore, mai come comando. Filtrare caratteri è una toppa fragile.',
    glossary: ['sqli', 'prepared'],
  }),
  xss: (r) => ({
    title: 'XSS: il campo commenti',
    brief: 'I commenti vengono inseriti nella pagina con innerHTML, senza escaping. Inserisci un payload che esegue codice, poi scegli la correzione.',
    site: 'div.innerHTML = "<b>" + nomeUtente + "</b>: " + commento;',
    fixOptions: r.shuffle([
      { code: 'div.textContent = nomeUtente + ": " + commento;', correct: true, why: 'textContent tratta tutto come testo: i tag non vengono mai eseguiti. Corretto.' },
      { code: 'commento = commento.replace("<script>", "")', correct: false, why: 'Blacklist fragile: <img onerror=...>, <svg onload=...> e maiuscole la aggirano.' },
      { code: 'Validare la lunghezza massima del commento', correct: false, why: 'Non c\'entra: un payload XSS può essere brevissimo.' },
      { code: 'Salvare i commenti in un database diverso', correct: false, why: 'Il problema è come li MOSTRI, non dove li salvi.' },
    ]),
    hints: ['Payload classico: <img src=x onerror=alert(1)> oppure <script>alert(document.cookie)</script>.', 'La difesa giusta non filtra i tag: usa textContent o un escaping completo dell\'output.'],
    learn: 'L\'XSS esegue script nel browser di altri utenti, spesso per rubare il cookie di sessione. Nasce quando inserisci input non fidato come HTML (innerHTML). La difesa: usa textContent, oppure fai escaping di < > " \' e applica una Content-Security-Policy. Le blacklist di tag sono sempre aggirabili.',
    glossary: ['xss', 'escaping'],
  }),
  idor: (r) => {
    const mine = r.int(100, 200);
    return {
      title: 'IDOR: ordini degli altri',
      brief: `Sei loggato e il tuo ordine è /ordine?id=${mine}. Prova a cambiare l'ID nell'URL per vedere l'ordine di un altro utente, poi scegli la correzione.`,
      site: `GET /api/ordine?id=${mine}   →   const o = await Ordine.findById(req.query.id)`,
      fixOptions: r.shuffle([
        { code: 'Ordine.findOne({ id: req.query.id, userId: req.user.id })', correct: true, why: 'Verifica che l\'ordine appartenga all\'utente loggato. È il controllo di autorizzazione mancante.' },
        { code: 'Usare ID casuali lunghi (UUID) invece di numeri sequenziali', correct: false, why: 'Rende più difficile INDOVINARE gli ID (security by obscurity), ma non impedisce l\'accesso se l\'ID trapela.' },
        { code: 'Nascondere l\'ID cifrandolo nel frontend', correct: false, why: 'Il controllo è lato client: aggirabile. L\'autorizzazione va fatta sul server.' },
        { code: 'Aggiungere un CAPTCHA alla pagina ordini', correct: false, why: 'Il CAPTCHA ferma i bot, non un utente che cambia un numero nell\'URL.' },
      ]),
      hints: [`Prova id=${mine + 1}, id=${mine - 1}...: se vedi ordini altrui, è vulnerabile.`, 'La difesa non è nascondere l\'ID: è VERIFICARE sul server che la risorsa sia tua.'],
      learn: 'IDOR = Insecure Direct Object Reference. Il server restituisce una risorsa in base a un ID senza controllare che appartenga a chi la chiede. La difesa è sempre un controllo di AUTORIZZAZIONE lato server (questa risorsa è dell\'utente loggato?). Usare UUID aiuta ma non basta: è "security by obscurity".',
      glossary: ['idor'],
    };
  },
  traversal: (r) => ({
    title: 'Path Traversal: leggi /etc/passwd',
    brief: 'Il download prende il nome file dalla query e lo concatena al percorso. Costruisci un payload per leggere un file di sistema, poi scegli la correzione.',
    site: 'sendFile("/var/www/docs/" + req.query.file)',
    fixOptions: r.shuffle([
      { code: 'const safe = path.basename(file); if (!allowList.includes(safe)) deny();', correct: true, why: 'basename rimuove i "../" e la allow-list limita ai file previsti. Corretto.' },
      { code: 'file = file.replace("../", "")', correct: false, why: 'Fragile: "....//" o "..%2f" aggirano la sostituzione singola.' },
      { code: 'Rendere i documenti di sola lettura (chmod 444)', correct: false, why: 'Il problema è leggere file FUORI cartella, non i permessi di scrittura.' },
      { code: 'Comprimere i file prima dell\'invio', correct: false, why: 'Irrilevante per la sicurezza del percorso.' },
    ]),
    hints: ['Payload: ?file=../../../../etc/passwd  risale le cartelle fino alla radice.', 'La difesa: normalizza il percorso (path.basename) e/o usa una allow-list di file consentiti.'],
    learn: 'Il path traversal usa ../ per uscire dalla cartella prevista e leggere file sensibili (/etc/passwd, config con segreti). La difesa: normalizza e valida il percorso richiesto (path.basename, controllo che resti dentro la cartella base) e preferisci una allow-list esplicita dei file scaricabili. Rimuovere "../" con una replace è aggirabile.',
    glossary: ['traversal'],
  }),
};
