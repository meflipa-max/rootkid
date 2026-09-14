// Funzioni di decodifica per il "banco di lavoro" delle sfide sui cifrari.
// Sono gli stessi strumenti che un analista userebbe davvero (in CyberChef, xxd, base64 -d...).

export function b64decode(s: string): string {
  try {
    return decodeURIComponent(escape(atob(s.trim().replace(/\s+/g, ''))));
  } catch {
    return '(non è Base64 valido)';
  }
}

export function hexToText(s: string): string {
  const clean = s.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
  const pairs = clean.match(/.{1,2}/g);
  if (!pairs) return '(nessun byte esadecimale trovato)';
  try {
    return pairs.map((h) => String.fromCharCode(parseInt(h, 16))).join('');
  } catch {
    return '(hex non valido)';
  }
}

export function binToText(s: string): string {
  const groups = s.trim().split(/\s+/).filter(Boolean);
  // se è un unico blocco lungo, spezzalo in gruppi da 8
  const bytes = groups.length === 1 && groups[0].length > 8 ? groups[0].match(/.{1,8}/g) ?? [] : groups;
  if (!bytes.length || !bytes.every((b) => /^[01]+$/.test(b))) return '(inserisci numeri binari, es. 01001000)';
  return bytes.map((b) => String.fromCharCode(parseInt(b, 2))).join('');
}

export function caesar(s: string, k: number): string {
  return s.replace(/[A-Za-z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + (k % 26) + 26) % 26) + base);
  });
}

// Prova tutti i 26 spostamenti: uno sarà leggibile
export function caesarAll(s: string): { shift: number; text: string }[] {
  return Array.from({ length: 26 }, (_, k) => ({ shift: k, text: caesar(s, k) }));
}

export function rot13(s: string): string {
  return caesar(s, 13);
}

export function atbash(s: string): string {
  return s.replace(/[A-Za-z]/g, (c) => {
    if (c <= 'Z') return String.fromCharCode(90 - (c.charCodeAt(0) - 65));
    return String.fromCharCode(122 - (c.charCodeAt(0) - 97));
  });
}

const MORSE_REV: Record<string, string> = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G',
  '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N',
  '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U',
  '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y', '--..': 'Z',
};
export function morseToText(s: string): string {
  return s
    .trim()
    .split(/\s*\/\s*|\s{2,}/) // "/" o doppio spazio separa le parole
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((code) => MORSE_REV[code] ?? (code ? '?' : ''))
        .join(''),
    )
    .join(' ')
    .trim();
}

export function vigenere(s: string, key: string, decode: boolean): string {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k) return s;
  let ki = 0;
  return s.replace(/[A-Za-z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    const delta = decode ? 26 - shift : shift;
    return String.fromCharCode(((c.charCodeAt(0) - base + delta) % 26) + base);
  });
}

// XOR: ciphertext in hex, chiave come stringa (o singolo byte "0xNN"); ritorna il testo
export function xorHexWithKey(hex: string, key: string): string {
  const clean = hex.replace(/0x/gi, (m, off) => (off === 0 ? '0x' : '')).replace(/[^0-9a-fA-Fx]/g, '');
  // interpreta la chiave: "0x41" => singolo byte; altrimenti testo
  let keyBytes: number[];
  const m = key.trim().match(/^0x([0-9a-fA-F]{1,2})$/);
  if (m) keyBytes = [parseInt(m[1], 16)];
  else keyBytes = Array.from(key).map((c) => c.charCodeAt(0));
  const hexClean = hex.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
  const pairs = hexClean.match(/.{1,2}/g);
  if (!pairs || !keyBytes.length) return '(serve hex + una chiave, es. una parola o 0x41)';
  return pairs.map((h, i) => String.fromCharCode(parseInt(h, 16) ^ keyBytes[i % keyBytes.length])).join('');
}

export type ToolId =
  | 'base64'
  | 'hex'
  | 'bin'
  | 'rot13'
  | 'atbash'
  | 'morse'
  | 'caesarAll'
  | 'vigenere'
  | 'xor';

export const TOOLS: { id: ToolId; label: string; needsKey?: boolean; keyLabel?: string; multi?: boolean }[] = [
  { id: 'base64', label: 'Base64 → testo' },
  { id: 'hex', label: 'Esadecimale → testo' },
  { id: 'bin', label: 'Binario → testo' },
  { id: 'rot13', label: 'ROT13' },
  { id: 'atbash', label: 'Atbash' },
  { id: 'morse', label: 'Morse → testo' },
  { id: 'caesarAll', label: 'Cesare: prova tutti gli spostamenti', multi: true },
  { id: 'vigenere', label: 'Vigenère (con chiave)', needsKey: true, keyLabel: 'parola chiave' },
  { id: 'xor', label: 'XOR hex (con chiave)', needsKey: true, keyLabel: 'chiave (testo)' },
];

// Suggerisce lo strumento giusto dato il metodo della sfida
export function toolForMethod(method: string): ToolId {
  switch (method) {
    case 'base64': return 'base64';
    case 'hex': return 'hex';
    case 'rot13': return 'rot13';
    case 'atbash': return 'atbash';
    case 'morse': return 'morse';
    case 'caesar': return 'caesarAll';
    case 'vigenere': return 'vigenere';
    case 'xor': return 'xor';
    default: return 'base64';
  }
}

export function applyTool(id: ToolId, input: string, key: string): string {
  switch (id) {
    case 'base64': return b64decode(input);
    case 'hex': return hexToText(input);
    case 'bin': return binToText(input);
    case 'rot13': return rot13(input);
    case 'atbash': return atbash(input);
    case 'morse': return morseToText(input);
    case 'vigenere': return vigenere(input, key, true);
    case 'xor': return xorHexWithKey(input, key);
    default: return input;
  }
}
