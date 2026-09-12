import type {
  SaveState, SkillId, ChallengeType, ChallengeResult, Mission, MissionDef,
  Challenge, InboxMsg,
} from './types';
import { RNG, hashString, todayKey, randomSeed } from './rng';
import { generateChallenge, ALL_TYPES } from './generators/generate';
import { COMPANIES, MISSIONS, companyById, nextCompany, missionsFor } from './content/companies';
import { ACHIEVEMENTS, TOOLS, COURSES, CERTS } from './content/progression';

export const SAVE_KEY = 'rootkid_save_v1';
export const SAVE_VERSION = 1;

export const SKILLS: { id: SkillId; name: string; icon: string; color: string }[] = [
  { id: 'linux', name: 'Linux & Terminale', icon: '🐧', color: '#ffd166' },
  { id: 'web', name: 'Sicurezza Web', icon: '🌐', color: '#b58cff' },
  { id: 'crypto', name: 'Crittografia', icon: '🔐', color: '#3dff8f' },
  { id: 'network', name: 'Reti', icon: '📡', color: '#33d1ff' },
  { id: 'forensics', name: 'Forensics', icon: '🔎', color: '#ff9e64' },
  { id: 'social', name: 'Social Eng. & Etica', icon: '🎭', color: '#ff6b9d' },
  { id: 'code', name: 'Secure Coding', icon: '💻', color: '#5ea8ff' },
];

// ===== LIVELLI =====
// XP necessaria per raggiungere il livello L (cumulativa)
export function xpForLevel(level: number): number {
  // crescita quadratica morbida
  return Math.floor(50 * (level - 1) + 25 * (level - 1) * (level - 1));
}
export function levelFromXp(xp: number): number {
  let lv = 1;
  while (xpForLevel(lv + 1) <= xp) lv++;
  return lv;
}
export function levelProgress(xp: number): { level: number; into: number; need: number; pct: number } {
  const level = levelFromXp(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - cur;
  const need = next - cur;
  return { level, into, need, pct: Math.max(0, Math.min(1, into / need)) };
}

export function rank(level: number): string {
  if (level >= 40) return 'Leggenda';
  if (level >= 32) return 'Red Team Lead';
  if (level >= 26) return 'Incident Responder';
  if (level >= 20) return 'Senior Engineer';
  if (level >= 15) return 'Security Engineer';
  if (level >= 10) return 'Penetration Tester';
  if (level >= 6) return 'Junior Pentester';
  if (level >= 3) return 'Security Assistant';
  if (level >= 2) return 'Apprendista';
  return 'Script Kiddie';
}

// ===== STATE =====
export function newSave(handle: string): SaveState {
  const skills = {} as Record<SkillId, number>;
  for (const s of SKILLS) skills[s.id] = 0;
  return {
    version: SAVE_VERSION,
    handle: handle || 'anon',
    createdAt: Date.now(),
    xp: 0,
    credits: 30,
    reputation: 0,
    ethics: 0,
    skills,
    companyId: 'freelance',
    completedMissions: [],
    missionsDone: 0,
    bountiesDone: 0,
    tools: [],
    certs: [],
    courses: [],
    achievements: [],
    glossary: [],
    daily: { date: '', done: false, score: 0 },
    streak: { count: 0, lastDate: '', best: 0 },
    stats: {
      byType: {},
      hintsUsed: 0,
      totalTimeMs: 0,
      challengesWon: 0,
      challengesPlayed: 0,
      bestBountyDifficulty: 0,
      blackHatChoices: 0,
      whiteHatChoices: 0,
      snifferBest: 0,
    },
    inbox: [
      {
        id: 'welcome',
        from: 'Zero (Mentore)',
        subject: 'Benvenuto. Iniziamo.',
        body: 'Ti ho notato. Hai la curiosità giusta, ma la curiosità senza etica è pericolosa.\n\nTi insegnerò a diventare un white hat: uno che usa queste abilità per PROTEGGERE, con il permesso di chi possiede i sistemi. In cambio, mi prometti una cosa: mai usare ciò che impari per fare del male.\n\nInizia dalle missioni qui a fianco. Ci vediamo nel terminale.\n\n— Zero',
        ts: Date.now(),
        read: false,
        kind: 'mentor',
      },
    ],
    settings: { sound: true, crt: true, bigFont: false },
    pledged: false,
  };
}

export function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveState;
    if (!data.version) return null;
    // migrazione leggera: assicura campi
    const base = newSave(data.handle);
    return { ...base, ...data, skills: { ...base.skills, ...data.skills }, stats: { ...base.stats, ...data.stats }, settings: { ...base.settings, ...data.settings } };
  } catch {
    return null;
  }
}

export function persist(s: SaveState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* storage pieno o bloccato: il gioco continua in memoria */
  }
}

export function wipeSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

// ===== MISSION BUILDING =====
const COMPANY_SKILL_HINT: Record<string, SkillId[]> = {
  pizzabyte: ['social', 'linux'],
  liceo: ['linux', 'forensics'],
  shopfast: ['web', 'network'],
  banca: ['forensics', 'crypto'],
  nimbus: ['web', 'linux'],
  medlife: ['social', 'web'],
  govcert: ['forensics', 'network'],
  nebula: ['web', 'linux'],
  orbit: ['crypto', 'network'],
};

export function buildMission(def: MissionDef, seed: number): Mission {
  const r = new RNG(seed);
  const challenges: Challenge[] = def.specs.map((spec) =>
    generateChallenge(spec.type, spec.difficulty, r.int(1, 1e9), spec.opts),
  );
  return { def, challenges, kind: 'story', seed };
}

// Missione "bounty" procedurale: tipi casuali, difficoltà scalata col livello
export function buildBounty(s: SaveState, seed: number): Mission {
  const r = new RNG(seed);
  const level = levelFromXp(s.xp);
  const baseD = Math.max(1, Math.min(5, Math.round(1 + level / 8)));
  const n = r.int(2, 3);
  const companyHint = COMPANY_SKILL_HINT[s.companyId] ?? [];
  const types = r.sample(ALL_TYPES.filter((t) => t !== 'ethics'), n);
  const challenges: Challenge[] = types.map((t) => {
    const d = Math.max(1, Math.min(5, baseD + r.int(-1, 1)));
    const opts = t === 'quiz' && r.chance(0.5) ? { skill: r.pick(companyHint.length ? companyHint : ['web']) } : undefined;
    return generateChallenge(t, d, r.int(1, 1e9), opts);
  });
  const avgD = challenges.reduce((a, c) => a + c.difficulty, 0) / challenges.length;
  const reward = {
    xp: Math.round(40 + avgD * 25 + level * 3),
    credits: Math.round(20 + avgD * 15),
    rep: Math.round(1 + avgD / 2),
  };
  const clients = ['StartupX', 'Studio Legale Bianchi', 'Panificio Aurora', 'Comune di Vallemare', 'FitClub', 'VetClinic', 'Autofficina Turbo', 'EcoEnergy', 'Libreria Pagina42', 'Caffè Centrale'];
  const def: MissionDef = {
    id: 'bounty_' + seed,
    companyId: s.companyId,
    title: `Contratto: ${r.pick(clients)}`,
    contact: 'Bug Bounty Platform',
    brief: 'Incarico extra da una piattaforma di bug bounty. Un cliente ha aperto un programma autorizzato: completa le sfide per incassare la taglia. Più sono difficili, più guadagni.',
    specs: [],
    reward,
  };
  return { def, challenges, kind: 'bounty', seed };
}

// Sfida giornaliera: deterministica per data
export function buildDaily(dateKey: string): Mission {
  const seed = hashString('daily-' + dateKey);
  const r = new RNG(seed);
  const types = r.sample(ALL_TYPES.filter((t) => t !== 'ethics'), 3);
  const challenges = types.map((t, i) => generateChallenge(t, 2 + i, r.int(1, 1e9)));
  const def: MissionDef = {
    id: 'daily_' + dateKey,
    companyId: 'freelance',
    title: 'Sfida Giornaliera',
    contact: 'ROOTKID Daily',
    brief: 'La sfida di oggi, uguale per tutti. Torna ogni giorno per mantenere la tua streak!',
    specs: [],
    reward: { xp: 120, credits: 60, rep: 3 },
  };
  return { def, challenges, kind: 'daily', seed };
}

// Sfida singola di allenamento per tipo
export function buildTraining(type: ChallengeType, d: number): Mission {
  const seed = randomSeed();
  const challenges = [generateChallenge(type, d, seed)];
  const def: MissionDef = {
    id: 'train_' + seed,
    companyId: 'freelance',
    title: 'Allenamento',
    contact: 'Dojo',
    brief: 'Allenamento libero. Nessuna pressione, impara al tuo ritmo. Ricompense ridotte.',
    specs: [],
    reward: { xp: Math.round(15 + d * 8), credits: Math.round(5 + d * 3), rep: 0 },
  };
  return { def, challenges, kind: 'training', seed };
}

// ===== MISSION AVAILABILITY =====
export function storyMissionsForCurrentCompany(s: SaveState): MissionDef[] {
  return missionsFor(s.companyId);
}

export function nextStoryMission(s: SaveState): MissionDef | null {
  const list = missionsFor(s.companyId);
  for (const m of list) {
    if (!s.completedMissions.includes(m.id)) return m;
  }
  return null;
}

export function companyCompleted(s: SaveState, companyId: string): boolean {
  return missionsFor(companyId).every((m) => s.completedMissions.includes(m.id));
}

export function canJoinCompany(s: SaveState, companyId: string): { ok: boolean; reason?: string } {
  const c = companyById(companyId);
  const level = levelFromXp(s.xp);
  if (level < c.req.level) return { ok: false, reason: `Serve livello ${c.req.level} (sei ${level})` };
  if (s.reputation < c.req.rep) return { ok: false, reason: `Serve reputazione ${c.req.rep} (hai ${s.reputation})` };
  if (c.req.cert && !s.certs.includes(c.req.cert)) {
    const cert = CERTS.find((x) => x.id === c.req.cert);
    return { ok: false, reason: `Serve la certificazione "${cert?.name ?? c.req.cert}"` };
  }
  return { ok: true };
}

// ===== REWARDS & PROGRESS =====
export interface ApplyResult {
  leveledUp: boolean;
  newLevel: number;
  newAchievements: string[];
  promoted?: string; // companyId nuovo
  glossaryUnlocked: string[];
}

const SKILL_BY_TYPE: Record<ChallengeType, SkillId> = {
  terminal: 'linux', cipher: 'crypto', codereview: 'code', phishing: 'social',
  logs: 'forensics', quiz: 'social', network: 'network', binary: 'crypto',
  weblab: 'web', ethics: 'social', password: 'crypto', sniffer: 'network',
};

export function recordChallenge(s: SaveState, ch: Challenge, res: ChallengeResult): string[] {
  const glossaryUnlocked: string[] = [];
  const t = ch.type;
  const bt = s.stats.byType[t] ?? { played: 0, won: 0, perfect: 0 };
  bt.played++;
  if (res.success) bt.won++;
  if (res.perfect) bt.perfect++;
  s.stats.byType[t] = bt;
  s.stats.challengesPlayed++;
  if (res.success) s.stats.challengesWon++;
  s.stats.hintsUsed += res.hintsUsed;
  s.stats.totalTimeMs += res.timeMs;

  // skill progress
  if (res.success) {
    const sk = SKILL_BY_TYPE[t];
    s.skills[sk] = Math.min(100, (s.skills[sk] ?? 0) + Math.round(3 + ch.difficulty * 1.5));
    // glossario
    for (const g of ch.glossary) {
      if (!s.glossary.includes(g)) { s.glossary.push(g); glossaryUnlocked.push(g); }
    }
  }
  // etica
  if (res.ethicsDelta) {
    s.ethics = Math.max(-50, Math.min(100, s.ethics + res.ethicsDelta));
    if (res.ethicsDelta > 0) s.stats.whiteHatChoices++;
    if (res.ethicsDelta < 0) s.stats.blackHatChoices++;
  }
  if (t === 'sniffer' && typeof res.snifferScore === 'number') {
    s.stats.snifferBest = Math.max(s.stats.snifferBest, res.snifferScore);
  }
  return glossaryUnlocked;
}

export function completeMission(s: SaveState, mission: Mission, allSuccess: boolean, totalHints: number): ApplyResult {
  const r: ApplyResult = { leveledUp: false, newLevel: levelFromXp(s.xp), newAchievements: [], glossaryUnlocked: [] };
  if (!allSuccess) return r;

  const beforeLevel = levelFromXp(s.xp);
  let { xp, credits, rep } = mission.def.reward;
  // bonus nessun hint
  if (totalHints === 0) { xp = Math.round(xp * 1.15); credits = Math.round(credits * 1.1); }
  // bonus strumento c2 sulle finali
  if (mission.def.final && s.tools.includes('c2')) rep = Math.round(rep * 1.2);

  s.xp += xp;
  s.credits += credits;
  s.reputation += rep;

  if (mission.kind === 'story') {
    if (!s.completedMissions.includes(mission.def.id)) s.completedMissions.push(mission.def.id);
    s.missionsDone++;
  } else if (mission.kind === 'bounty') {
    s.bountiesDone++;
    const maxD = Math.max(...mission.challenges.map((c) => c.difficulty));
    s.stats.bestBountyDifficulty = Math.max(s.stats.bestBountyDifficulty, maxD);
  } else if (mission.kind === 'daily') {
    s.daily.done = true;
  }

  const afterLevel = levelFromXp(s.xp);
  if (afterLevel > beforeLevel) { r.leveledUp = true; r.newLevel = afterLevel; }

  // promozione azienda
  if (mission.kind === 'story' && mission.def.final && companyCompleted(s, mission.def.companyId)) {
    const next = nextCompany(mission.def.companyId);
    if (next) {
      const can = canJoinCompany(s, next.id);
      // messaggio di offerta indipendentemente
      pushInbox(s, {
        from: `${next.contact} — ${next.name}`,
        subject: `Offerta di lavoro: ${next.jobTitle}`,
        body: next.intro + (can.ok ? '\n\nPuoi accettare subito dalla sezione Aziende.' : `\n\nRequisiti non ancora soddisfatti: ${can.reason}. Continua a crescere!`),
        kind: 'offer',
      });
    }
  }

  return r;
}

export function joinCompany(s: SaveState, companyId: string): boolean {
  const can = canJoinCompany(s, companyId);
  if (!can.ok) return false;
  s.companyId = companyId;
  const c = companyById(companyId);
  pushInbox(s, {
    from: `${c.contact} — ${c.name}`,
    subject: `Benvenuto nel team!`,
    body: `Sei ufficialmente ${c.jobTitle} in ${c.name}. ${c.intro.split('.')[0]}. Trovi le tue nuove missioni nella dashboard. In bocca al lupo!`,
    kind: 'story',
  });
  return true;
}

export function pushInbox(s: SaveState, msg: Omit<InboxMsg, 'id' | 'ts' | 'read'>) {
  s.inbox.unshift({ ...msg, id: 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), read: false });
  if (s.inbox.length > 40) s.inbox = s.inbox.slice(0, 40);
}

// ===== STREAK =====
export function updateStreakOnDaily(s: SaveState) {
  const today = todayKey();
  if (s.streak.lastDate === today) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = todayKey(y);
  if (s.streak.lastDate === yesterday) s.streak.count++;
  else s.streak.count = 1;
  s.streak.lastDate = today;
  s.streak.best = Math.max(s.streak.best, s.streak.count);
}

export function ensureDaily(s: SaveState) {
  const today = todayKey();
  if (s.daily.date !== today) {
    s.daily = { date: today, done: false, score: 0 };
  }
}

// ===== ACHIEVEMENTS =====
export function checkAchievements(s: SaveState): string[] {
  const unlocked: string[] = [];
  const level = levelFromXp(s.xp);
  const has = (id: string) => s.achievements.includes(id);
  const grant = (id: string, cond: boolean) => {
    if (cond && !has(id)) { s.achievements.push(id); unlocked.push(id); }
  };

  const terminalWon = s.stats.byType.terminal?.won ?? 0;
  const phishWon = s.stats.byType.phishing?.won ?? 0;
  const cipherWon = s.stats.byType.cipher?.won ?? 0;
  const crWon = s.stats.byType.codereview?.won ?? 0;
  const totalPerfect = Object.values(s.stats.byType).reduce((a, b) => a + (b?.perfect ?? 0), 0);

  grant('first_flag', terminalWon >= 1);
  grant('first_job', s.companyId !== 'freelance');
  grant('phish_master', phishWon >= 15);
  grant('crypto_cracker', cipherWon >= 15);
  grant('terminal_wizard', terminalWon >= 10);
  grant('code_auditor', crWon >= 15);
  grant('certified', s.certs.length >= 1);
  grant('all_certs', s.certs.length >= CERTS.length);
  grant('level10', level >= 10);
  grant('level25', level >= 25);
  grant('level40', level >= 40);
  grant('streak7', s.streak.best >= 7);
  grant('streak30', s.streak.best >= 30);
  grant('pure_white', s.stats.whiteHatChoices >= 20 && s.stats.blackHatChoices === 0);
  grant('rich', s.credits >= 2000);
  grant('toolbox', TOOLS.every((t) => s.tools.includes(t.id)));
  grant('scholar', COURSES.every((c) => s.courses.includes(c.id)));
  grant('endgame', s.companyId === 'orbit' && companyCompleted(s, 'orbit'));
  grant('sniffer_ace', s.stats.snifferBest >= 25);
  grant('perfectionist', totalPerfect >= 20);
  // no_hints: 10 vittorie perfette senza hint (approssimato con perfect che implica 0 hint)
  grant('no_hints', totalPerfect >= 10);

  if (unlocked.length) {
    for (const id of unlocked) {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (a) pushInbox(s, { from: 'ROOTKID', subject: `🏆 Obiettivo sbloccato: ${a.name}`, body: `${a.icon} ${a.name}\n${a.desc}`, kind: 'system' });
    }
  }
  return unlocked;
}

export { COMPANIES, MISSIONS, companyById, nextCompany, missionsFor, ALL_TYPES, TOOLS, COURSES, CERTS, ACHIEVEMENTS };
