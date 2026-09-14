// ===== Tipi fondamentali di ROOTKID =====

export type SkillId = 'linux' | 'web' | 'crypto' | 'network' | 'forensics' | 'social' | 'code';

export type ChallengeType =
  | 'terminal'
  | 'cipher'
  | 'codereview'
  | 'phishing'
  | 'logs'
  | 'quiz'
  | 'network'
  | 'binary'
  | 'weblab'
  | 'ethics'
  | 'password'
  | 'sniffer';

export interface ChallengeBase {
  id: string;
  type: ChallengeType;
  title: string;
  skill: SkillId;
  difficulty: number; // 1..5
  brief: string; // testo introduttivo
  hints: string[];
  learn: string; // spiegazione mostrata alla fine
  glossary: string[]; // id voci glossario sbloccate
}

// ---- Terminale ----
export interface VNode {
  name: string;
  type: 'dir' | 'file';
  content?: string;
  children?: Record<string, VNode>;
  perms?: string; // es. -rw-r--r--
  owner?: string;
  hidden?: boolean;
}

export interface VHost {
  hostname: string;
  ip: string;
  user: string;
  root: VNode;
  ports?: { port: number; service: string; banner?: string }[];
  sshPassword?: string;
}

export interface TerminalChallenge extends ChallengeBase {
  type: 'terminal';
  hosts: VHost[];
  startHost: string;
  objective: string;
  flag: string;
  allowedCommands?: string[];
}

// ---- Cifrari ----
export interface CipherChallenge extends ChallengeBase {
  type: 'cipher';
  ciphertext: string;
  plaintext: string;
  method: string;
  methodLabel: string;
  key?: string;
}

// ---- Code review ----
export interface CodeReviewChallenge extends ChallengeBase {
  type: 'codereview';
  language: string;
  lines: string[];
  vulnLine: number; // indice 0-based
  vulnType: string;
  options: string[]; // tipi di vulnerabilità tra cui scegliere
  fix: string;
}

// ---- Phishing ----
export interface PhishingChallenge extends ChallengeBase {
  type: 'phishing';
  email: {
    fromName: string;
    fromAddr: string;
    subject: string;
    body: string;
    linkText?: string;
    linkHref?: string;
    attachment?: string;
    date: string;
  };
  isPhishing: boolean;
  clue: string; // indizio corretto
  clueOptions: string[];
}

// ---- Log ----
export interface LogsChallenge extends ChallengeBase {
  type: 'logs';
  filename: string;
  lines: string[];
  questions: { q: string; answer: string; accept?: string[] }[];
}

// ---- Quiz ----
export interface QuizChallenge extends ChallengeBase {
  type: 'quiz';
  questions: { q: string; options: string[]; answer: number; why: string }[];
}

// ---- Reti ----
export type NetworkSub = 'ports' | 'nmap' | 'subnet' | 'osi';
export interface NetworkChallenge extends ChallengeBase {
  type: 'network';
  sub: NetworkSub;
  pairs?: { left: string; right: string }[];
  scan?: { lines: string[]; question: string; options: string[]; answer: number; why: string };
  subnetQ?: { q: string; answer: boolean; why: string }[];
}

// ---- Binario ----
export interface BinaryChallenge extends ChallengeBase {
  type: 'binary';
  rounds: { prompt: string; from: string; to: string; value: string; answer: string }[];
}

// ---- Web lab ----
export type WebLabKind = 'sqli' | 'xss' | 'idor' | 'traversal';
export interface WebLabChallenge extends ChallengeBase {
  type: 'weblab';
  kind: WebLabKind;
  site: string;
  fixOptions: { code: string; correct: boolean; why: string }[];
}

// ---- Etica ----
export interface EthicsChallenge extends ChallengeBase {
  type: 'ethics';
  scenario: string;
  choices: { text: string; kind: 'white' | 'grey' | 'black'; outcome: string }[];
}

// ---- Password ----
export interface PasswordChallenge extends ChallengeBase {
  type: 'password';
  mode: 'rank' | 'crack';
  passwords?: { pw: string; score: number }[];
  hash?: string;
  candidates?: string[];
  answer?: string;
  ruleHint?: string;
}

// ---- Sniffer arcade ----
export interface SnifferChallenge extends ChallengeBase {
  type: 'sniffer';
  badIps: string[];
  badPorts: number[];
  duration: number;
  target: number;
  seed: number;
}

export type Challenge =
  | TerminalChallenge
  | CipherChallenge
  | CodeReviewChallenge
  | PhishingChallenge
  | LogsChallenge
  | QuizChallenge
  | NetworkChallenge
  | BinaryChallenge
  | WebLabChallenge
  | EthicsChallenge
  | PasswordChallenge
  | SnifferChallenge;

export interface ChallengeResult {
  success: boolean;
  hintsUsed: number;
  timeMs: number;
  ethicsDelta?: number;
  perfect?: boolean;
  snifferScore?: number;
}

// ---- Missioni ----
export interface MissionSpec {
  type: ChallengeType;
  difficulty: number;
  opts?: Record<string, unknown>;
}

export interface MissionDef {
  id: string;
  companyId: string;
  title: string;
  contact: string;
  brief: string;
  specs: MissionSpec[];
  reward: { xp: number; credits: number; rep: number };
  final?: boolean; // ultima missione dell'azienda
  requiresTool?: string;
}

export interface Mission {
  def: MissionDef;
  challenges: Challenge[];
  kind: 'story' | 'bounty' | 'daily' | 'exam' | 'training';
  seed: number;
}

export interface Company {
  id: string;
  name: string;
  tagline: string;
  jobTitle: string;
  color: string;
  icon: string;
  contact: string;
  contactRole: string;
  intro: string;
  req: { level: number; rep: number; cert?: string };
  salary: number; // credits per missione bonus
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
  real: string;
  perk: string;
  reqLevel: number;
}

export interface Course {
  id: string;
  skill: SkillId;
  title: string;
  cost: number;
  minLevel: number;
  lesson: string[]; // paragrafi
  quiz: { q: string; options: string[]; answer: number }[];
  xp: number;
}

export interface Cert {
  id: string;
  name: string;
  icon: string;
  desc: string;
  topics: SkillId[];
  questions: number;
  pass: number;
  cost: number;
  reqLevel: number;
  realWorld: string;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  secret?: boolean;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  def: string;
  skill: SkillId;
}

export interface InboxMsg {
  id: string;
  from: string;
  subject: string;
  body: string;
  ts: number;
  read: boolean;
  kind: 'story' | 'mentor' | 'system' | 'offer';
}

export interface SaveState {
  version: number;
  handle: string;
  createdAt: number;
  xp: number;
  credits: number;
  reputation: number;
  ethics: number;
  skills: Record<SkillId, number>;
  companyId: string;
  completedMissions: string[];
  missionsDone: number;
  bountiesDone: number;
  tools: string[];
  certs: string[];
  courses: string[];
  achievements: string[];
  glossary: string[];
  seenPrimers: string[]; // tipi di sfida per cui è già stata mostrata la spiegazione iniziale
  daily: { date: string; done: boolean; score: number };
  streak: { count: number; lastDate: string; best: number };
  stats: {
    byType: Partial<Record<ChallengeType, { played: number; won: number; perfect: number }>>;
    hintsUsed: number;
    totalTimeMs: number;
    challengesWon: number;
    challengesPlayed: number;
    bestBountyDifficulty: number;
    blackHatChoices: number;
    whiteHatChoices: number;
    snifferBest: number;
  };
  inbox: InboxMsg[];
  settings: { sound: boolean; crt: boolean; bigFont: boolean; calm: boolean };
  pledged: boolean;
}
