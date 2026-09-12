import { RNG } from '../rng';

export interface CipherSpec {
  method: string;
  methodLabel: string;
  d: number;
  learn: string;
  glossary: string[];
  // genera ciphertext e plaintext
  gen: (r: RNG) => { plaintext: string; ciphertext: string; key?: string };
}

const MESSAGES_EASY = [
  'CIAO MONDO',
  'TROVA LA FLAG',
  'ACCESSO NEGATO',
  'SISTEMA SICURO',
  'PASSWORD DEBOLE',
  'RETE PROTETTA',
  'HACK ETICO',
  'WHITE HAT WINS',
];
const MESSAGES_MID = [
  'IL SERVER E COMPROMESSO',
  'CAMBIA LA PASSWORD ORA',
  'BACKDOOR NEL SISTEMA',
  'CHIAVE SEGRETA TROVATA',
  'ATTACCO IN CORSO ATTENZIONE',
  'VULNERABILITA CRITICA',
];
const FLAGS = [
  'ROOTKID{base_camp}',
  'ROOTKID{crypto_101}',
  'ROOTKID{shift_happens}',
  'ROOTKID{xor_master}',
  'ROOTKID{decoded}',
  'ROOTKID{white_hat}',
];

function caesar(txt: string, shift: number): string {
  return txt.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65));
}
function atbash(txt: string): string {
  return txt.replace(/[A-Z]/g, (c) => String.fromCharCode(90 - (c.charCodeAt(0) - 65)));
}
function toBase64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}
function toHex(s: string): string {
  return Array.from(s)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}
function xorHex(s: string, key: string): string {
  return Array.from(s)
    .map((c, i) => (c.charCodeAt(0) ^ key.charCodeAt(i % key.length)).toString(16).padStart(2, '0'))
    .join('');
}
function vigenere(txt: string, key: string): string {
  let ki = 0;
  return txt.replace(/[A-Z]/g, (c) => {
    const k = key.charCodeAt(ki % key.length) - 65;
    ki++;
    return String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26) + 65);
  });
}
function morse(s: string): string {
  const M: Record<string, string> = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
    K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
    U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', ' ': '/',
  };
  return Array.from(s).map((c) => M[c] ?? c).join(' ');
}

export const CIPHER_SPECS: CipherSpec[] = [
  {
    method: 'base64',
    methodLabel: 'Base64',
    d: 1,
    learn: 'Base64 non è crittografia! È solo una codifica: chiunque può decodificarla. Usa l\'alfabeto A-Z a-z 0-9 + / e la lunghezza è multipla di 4; a volte (non sempre) termina con uno o due "=" di padding. In un terminale: echo "..." | base64 -d',
    glossary: ['base64', 'encoding'],
    gen: (r) => {
      const pt = r.pick([...MESSAGES_EASY, ...FLAGS]);
      return { plaintext: pt, ciphertext: toBase64(pt) };
    },
  },
  {
    method: 'caesar',
    methodLabel: 'Cifrario di Cesare',
    d: 1,
    learn: 'Il cifrario di Cesare sposta ogni lettera di un numero fisso di posizioni. Con solo 25 chiavi, si rompe provando tutti gli spostamenti (brute force). Giulio Cesare usava uno shift di 3.',
    glossary: ['caesar', 'bruteforce'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_EASY);
      const shift = r.int(3, 23);
      return { plaintext: pt, ciphertext: caesar(pt, shift), key: `shift ${shift}` };
    },
  },
  {
    method: 'rot13',
    methodLabel: 'ROT13',
    d: 1,
    learn: 'ROT13 è un cifrario di Cesare con spostamento fisso di 13. Siccome 13+13=26, applicarlo due volte riporta al testo originale. Usato nei forum per nascondere spoiler, non per sicurezza.',
    glossary: ['rot13', 'caesar'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_EASY);
      return { plaintext: pt, ciphertext: caesar(pt, 13) };
    },
  },
  {
    method: 'hex',
    methodLabel: 'Esadecimale (ASCII)',
    d: 2,
    learn: 'Ogni coppia esadecimale rappresenta un byte = un carattere ASCII. 48=H, 65=e... Convertire hex → ASCII è un\'operazione base nella forensics e nel reverse engineering.',
    glossary: ['hex', 'ascii'],
    gen: (r) => {
      const pt = r.pick([...MESSAGES_EASY, ...FLAGS]);
      return { plaintext: pt, ciphertext: toHex(pt) };
    },
  },
  {
    method: 'atbash',
    methodLabel: 'Atbash',
    d: 2,
    learn: 'Atbash sostituisce ogni lettera con la sua "specchiata" nell\'alfabeto: A↔Z, B↔Y, C↔X... È uno dei cifrari più antichi, trovato anche nella Bibbia.',
    glossary: ['atbash'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_EASY);
      return { plaintext: pt, ciphertext: atbash(pt) };
    },
  },
  {
    method: 'morse',
    methodLabel: 'Codice Morse',
    d: 2,
    learn: 'Il codice Morse rappresenta le lettere con punti e linee. Non è crittografia, ma conoscerlo aiuta nei CTF. E=. T=- sono le più corte (lettere più frequenti).',
    glossary: ['morse'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_EASY);
      return { plaintext: pt, ciphertext: morse(pt) };
    },
  },
  {
    method: 'caesar',
    methodLabel: 'Cifrario di Cesare',
    d: 3,
    learn: 'Con messaggi più lunghi, l\'analisi delle frequenze aiuta: la lettera più comune in italiano è la "E" o la "A". Se una lettera appare spessissimo nel cifrato, probabilmente è una di quelle.',
    glossary: ['caesar', 'frequency'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_MID);
      const shift = r.int(4, 22);
      return { plaintext: pt, ciphertext: caesar(pt, shift), key: `shift ${shift}` };
    },
  },
  {
    method: 'base64',
    methodLabel: 'Base64 (doppio)',
    d: 3,
    learn: 'A volte i dati sono codificati più volte. Qui è Base64 applicato due volte: decodifica una volta, e se ottieni ancora Base64, decodifica di nuovo. Le "matrioske" sono comuni nei malware.',
    glossary: ['base64', 'encoding'],
    gen: (r) => {
      const pt = r.pick(FLAGS);
      return { plaintext: pt, ciphertext: toBase64(toBase64(pt)), key: 'doppio base64' };
    },
  },
  {
    method: 'xor',
    methodLabel: 'XOR a byte singolo',
    d: 4,
    learn: 'XOR è reversibile: (A XOR K) XOR K = A. Con una chiave di un solo byte ci sono 256 possibilità: si prova ognuna e si cerca quella che produce testo leggibile. Base dei CTF crypto.',
    glossary: ['xor', 'bruteforce'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_EASY);
      const key = String.fromCharCode(r.int(33, 126));
      return { plaintext: pt, ciphertext: xorHex(pt, key), key: `1 byte: 0x${key.charCodeAt(0).toString(16)}` };
    },
  },
  {
    method: 'vigenere',
    methodLabel: 'Cifrario di Vigenère',
    d: 4,
    learn: 'Vigenère usa una parola chiave: ogni lettera viene spostata di una quantità diversa. Per secoli fu ritenuto "indecifrabile". Qui ti diamo la chiave: applicala al contrario per decifrare.',
    glossary: ['vigenere'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_MID);
      const key = r.pick(['HACK', 'ZERO', 'ROOT', 'CODE']);
      return { plaintext: pt, ciphertext: vigenere(pt, key), key };
    },
  },
  {
    method: 'xor',
    methodLabel: 'XOR con chiave nota',
    d: 5,
    learn: 'Con una chiave ripetuta (tipo "KEY"), XOR protegge poco: se conosci o indovini parte del testo in chiaro, recuperi la chiave. Il one-time pad è sicuro solo con chiave casuale lunga quanto il messaggio, usata una volta.',
    glossary: ['xor', 'otp'],
    gen: (r) => {
      const pt = r.pick(FLAGS);
      const key = r.pick(['KEY', 'ORBIT', 'NEBULA']);
      return { plaintext: pt, ciphertext: xorHex(pt, key), key };
    },
  },
  {
    method: 'vigenere',
    methodLabel: 'Vigenère (telemetria)',
    d: 5,
    learn: "Sistemi legacy usano cifrari classici per retrocompatibilità. Riconoscere il metodo è metà del lavoro: il pattern (niente simboli, solo lettere, nessuna lettera ripetuta in modo ovvio) suggerisce una cifratura polialfabetica come Vigenère.",
    glossary: ['vigenere'],
    gen: (r) => {
      const pt = r.pick(MESSAGES_MID);
      const key = r.pick(['SATELLITE', 'GROUND', 'APOLLO']);
      return { plaintext: pt, ciphertext: vigenere(pt, key), key };
    },
  },
];

export const BINARY_ROUNDS = {
  easy: [
    { label: 'decimale', to: 'binario' },
    { label: 'binario', to: 'decimale' },
  ],
};
