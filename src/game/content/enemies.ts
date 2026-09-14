import type { Mission, ChallengeType } from '../types';

export interface Boss {
  name: string;
  title: string;
  color: string;
  sigil: string; // emoji/rune al centro della creatura
  shape: 'blob' | 'shard' | 'serpent' | 'core';
  eyes: number;
  taunt: string;
}

// Nemesi di ogni datore di lavoro: il "mostro" dietro al contratto
const COMPANY_BOSS: Record<string, Boss> = {
  freelance: {
    name: 'Il Dubbio', title: 'guardiano dei principianti', color: '#8b95a5', sigil: '❔', shape: 'blob', eyes: 2,
    taunt: '"Non ci capirai mai niente. Meglio lasciar perdere, no?"',
  },
  pizzabyte: {
    name: 'Il Cugino Sviluppatore', title: 'autore del sito "tanto funziona"', color: '#ffb347', sigil: '🍕', shape: 'blob', eyes: 2,
    taunt: '"L\'ho fatto in una sera, è sicurissimo. Fidati."',
  },
  liceo: {
    name: 'Il Server dello Sgabuzzino', title: 'acceso dal 2009, mai aggiornato', color: '#33d1ff', shape: 'core', sigil: '🗄️', eyes: 3,
    taunt: '"Nessuno mi tocca da quindici anni. Nessuno."',
  },
  shopfast: {
    name: 'Il Carrello Fantasma', title: 'ordina al posto tuo', color: '#b58cff', shape: 'shard', sigil: '🛒', eyes: 2,
    taunt: '"Ho già i dati di tutti i tuoi clienti. Vuoi vedere?"',
  },
  banca: {
    name: 'Il Mietitore di Credenziali', title: 'prova password tutta la notte', color: '#3dff8f', shape: 'serpent', sigil: '🔑', eyes: 3,
    taunt: '"Diecimila tentativi al secondo. Prima o poi indovino."',
  },
  nimbus: {
    name: 'Idra dei Container', title: 'per ogni falla chiusa, due si aprono', color: '#5ea8ff', shape: 'serpent', sigil: '☁️', eyes: 4,
    taunt: '"Sono in mille macchine contemporaneamente. Da quale inizi?"',
  },
  medlife: {
    name: 'Il Ransomware Pallido', title: 'cifra reparti interi', color: '#ff6b9d', shape: 'shard', sigil: '🔒', eyes: 2,
    taunt: '"Ho i vostri dati. Quanto valgono le cartelle dei pazienti?"',
  },
  govcert: {
    name: 'Il Fantasma della Centrale', title: 'annidato nei sistemi critici', color: '#ffd166', shape: 'core', sigil: '⚡', eyes: 3,
    taunt: '"Sono dentro da tre mesi e non ve ne siete accorti."',
  },
  nebula: {
    name: "L'Ombra del Red Team", title: 'sa tutto quello che sai tu', color: '#c77dff', shape: 'blob', sigil: '🌌', eyes: 4,
    taunt: '"Conosco le tue tecniche. Le ho insegnate io."',
  },
  orbit: {
    name: 'Il Satellite Silente', title: 'in orbita dal 1998, ora non risponde', color: '#ffffff', shape: 'core', sigil: '🛰️', eyes: 5,
    taunt: '"Là fuori nessuno può sentirti fare il debug."',
  },
};

// Daemon generici per contratti procedurali / allenamento
const DAEMONS: Boss[] = [
  { name: 'Daemon del Terminale', title: 'vive nelle shell', color: '#ffd166', sigil: '🖥️', shape: 'core', eyes: 2, taunt: '"Senza mouse sei perso."' },
  { name: 'Sfinge Cifrata', title: 'parla solo per enigmi', color: '#3dff8f', sigil: '🔐', shape: 'shard', eyes: 3, taunt: '"Deciframi, se ne sei capace."' },
  { name: 'Bug Mutante', title: 'si nasconde in una riga', color: '#5ea8ff', sigil: '🐛', shape: 'blob', eyes: 4, taunt: '"Sono in produzione da mesi. Trovami."' },
  { name: 'Spettro Phisher', title: 'indossa la faccia degli altri', color: '#ff6b9d', sigil: '🎣', shape: 'serpent', eyes: 2, taunt: '"Clicca qui. Ti fidi di me, vero?"' },
  { name: 'Eco nei Log', title: 'lascia tracce e sparisce', color: '#ff9e64', sigil: '📄', shape: 'core', eyes: 3, taunt: '"Diecimila righe. Buona fortuna."' },
  { name: 'Idra di Rete', title: 'mille porte, una aperta', color: '#33d1ff', sigil: '📡', shape: 'serpent', eyes: 4, taunt: '"Quale porta ho lasciato aperta?"' },
  { name: 'Golem Binario', title: 'pensa solo in 0 e 1', color: '#b58cff', sigil: '🔢', shape: 'shard', eyes: 2, taunt: '"01000010 01101111 01101111."' },
  { name: 'Cerbero delle Password', title: 'custodisce gli hash', color: '#3dff8f', sigil: '🔑', shape: 'blob', eyes: 3, taunt: '"password123. Scommetto che funziona ancora."' },
  { name: 'Aracne del Web', title: 'tesse form vulnerabili', color: '#c77dff', sigil: '🕸️', shape: 'shard', eyes: 4, taunt: '"Ogni campo di input è un filo della mia tela."' },
];

const SPECIAL: Record<string, Boss> = {
  daily: { name: 'Prova del Giorno', title: 'cambia ogni 24 ore', color: '#ffd166', sigil: '📅', shape: 'core', eyes: 3, taunt: '"Torna domani. Sarò diverso."' },
  training: { name: 'Manichino da Addestramento', title: 'non morde', color: '#7f95a5', sigil: '🥋', shape: 'blob', eyes: 2, taunt: '"Colpisci pure. Sono qui per questo."' },
};

export function bossFor(mission: Mission): Boss {
  if (mission.kind === 'daily') return SPECIAL.daily;
  if (mission.kind === 'training') return SPECIAL.training;
  if (mission.kind === 'story') {
    return COMPANY_BOSS[mission.def.companyId] ?? DAEMONS[0];
  }
  // bounty: daemon scelto in modo stabile dal seed della missione
  return DAEMONS[Math.abs(mission.seed) % DAEMONS.length];
}

// Nome del "colpo" in base al tipo di sfida: dà sapore al combattimento
export const ATTACK_NAME: Record<ChallengeType, string> = {
  terminal: 'Shell Strike',
  cipher: 'Decifrazione',
  binary: 'Bit Crush',
  password: 'Frantuma-Hash',
  codereview: 'Occhio del Revisore',
  weblab: 'Patch Perforante',
  phishing: 'Sguardo che Smaschera',
  logs: 'Lettura delle Tracce',
  quiz: 'Colpo di Sapere',
  network: 'Scansione Tagliente',
  ethics: 'Luce del Cappello Bianco',
  sniffer: 'Filtro di Pacchetti',
};
