// Personaggi della Base: ognuno ha un volto, un ruolo e qualcosa da dire.

export interface Npc {
  id: string;
  name: string;
  role: string;
  color: string;
  palette: Record<string, string>; // per il ritratto pixel
  /** Battute la prima volta che ci parli */
  intro: string[];
  /** Battute nelle visite successive (se ne pesca una a caso) */
  idle: string[];
}

const skin = '#d8b28e';
const skin2 = '#c08a63';

export const NPCS: Record<string, Npc> = {
  zero: {
    id: 'zero',
    name: 'Zero',
    role: 'Il tuo mentore',
    color: '#3dff8f',
    palette: { H: '#1d2733', S: skin, E: '#3dff8f', M: '#8a5d43', A: '#25313f' },
    intro: [
      'Eccoti. Ti stavo aspettando.',
      "Questa è la Base: qui dentro non si fa nulla di illegale. Si studia, ci si allena, e si accettano solo incarichi autorizzati.",
      'Ricordati sempre la regola: la differenza tra te e un criminale non è la tecnica. È il permesso.',
    ],
    idle: [
      '"Un buon white hat legge più di quanto scrive."',
      '"Se non hai l\'autorizzazione scritta, non è un test: è un reato."',
      '"Quando ti blocchi, torna alle basi: cosa sto davvero guardando?"',
      '"Il terminale non ti giudica. Sbaglia pure, poi riprova."',
      '"Non esiste sistema sicuro al 100%. Esiste chi si è preparato meglio."',
    ],
  },
  rae: {
    id: 'rae',
    name: 'Rae',
    role: 'Coordinatrice contratti',
    color: '#33d1ff',
    palette: { H: '#6a3fa0', S: skin, E: '#33d1ff', M: '#8a5d43', A: '#1d3547' },
    intro: [
      'Tu devi essere il nuovo. Io smisto i contratti: tutti verificati, tutti con autorizzazione firmata.',
      'Guarda la bacheca quando vuoi. Se un cliente ha bisogno, lo trovi lì.',
    ],
    idle: [
      '"Il contratto principale è quello che fa crescere la tua carriera."',
      '"Le taglie extra pagano meno gloria ma più crediti. E si trovano oggetti."',
      '"Hai già fatto la sfida di oggi? Non spezzare la serie."',
    ],
  },
  prof: {
    id: 'prof',
    name: 'Prof. Turing',
    role: 'Accademia',
    color: '#ffd166',
    palette: { H: '#c9ccd1', S: skin2, E: '#ffd166', M: '#7a4d33', A: '#3a2f1c' },
    intro: [
      'Benvenuto in Accademia. Qui non si "smanetta": qui si capisce.',
      'Chi conosce la teoria sa perché un attacco funziona. Gli altri copiano comandi e basta.',
    ],
    idle: [
      '"Un corso studiato oggi è un quiz superato domani."',
      '"La OWASP Top 10 andrebbe saputa a memoria. Dico sul serio."',
      '"Vuoi un consiglio? Prima il corso, poi la certificazione."',
    ],
  },
  mercante: {
    id: 'mercante',
    name: 'Bit',
    role: 'Mercante di ferraglia',
    color: '#b58cff',
    palette: { H: '#8a4b2a', S: skin2, E: '#b58cff', M: '#6e3f2a', A: '#3b2a4a' },
    intro: [
      'Ehi! Strumenti, ferraglia, roba che funziona. Tutto legale, tutto con ricevuta.',
      'Un buon attrezzo non ti rende bravo. Ma ti fa risparmiare ore.',
    ],
    idle: [
      '"nmap è il primo che dovresti comprare. Fidati."',
      '"Ho appena ricevuto della roba nuova. Forse."',
      '"I crediti si fanno con le taglie, ragazzo."',
    ],
  },
  esaminatore: {
    id: 'esaminatore',
    name: 'Dott.ssa Vega',
    role: 'Commissione esami',
    color: '#ff6b9d',
    palette: { H: '#2b2b33', S: skin, E: '#ff6b9d', M: '#8a5d43', A: '#43202f' },
    intro: [
      'Sala esami. Qui si certificano le competenze, non le intenzioni.',
      'Gli esami costano e si possono fallire. Presentati quando sei pronto davvero.',
    ],
    idle: [
      '"Le certificazioni aprono le porte delle aziende serie."',
      '"Non ho fretta. Torna quando avrai studiato."',
      '"Ogni tentativo si paga. Preparati bene."',
    ],
  },
};

// Volto 12x12 usato per tutti i ritratti, variato dalla palette
export const FACE: string[] = [
  '............',
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..HSSSSSSH..',
  '..HSESSESH..',
  '..HSSSSSSH..',
  '..HSSMMSSH..',
  '..HSSSSSSH..',
  '...SSSSSS...',
  '..AAAAAAAA..',
  '.AAAAAAAAAA.',
  '.AAAAAAAAAA.',
];
