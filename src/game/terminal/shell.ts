import type { VHost, VNode } from '../types';
import { nodeAt, listDir, resolvePath } from './fs';

export interface ShellState {
  hosts: Record<string, VHost>;
  current: string; // hostname
  cwd: string; // path
  history: string[];
  env: Record<string, string>;
  submitted: string | null;
  flag: string;
  extra: Record<string, unknown>;
}

export interface ShellLine {
  text: string;
  kind: 'cmd' | 'out' | 'err' | 'ok' | 'info';
}

export function initShell(hosts: VHost[], startHost: string, flag: string, extra: Record<string, unknown>): ShellState {
  const map: Record<string, VHost> = {};
  for (const h of hosts) map[h.hostname] = h;
  const host = map[startHost];
  return {
    hosts: map,
    current: startHost,
    cwd: `/home/${host.user}`,
    history: [],
    env: {},
    submitted: null,
    flag,
    extra,
  };
}

function permString(node: VNode): string {
  return node.perms ?? (node.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
}

const HELP = `Comandi disponibili:
  ls [-a] [-l] [path]   elenca i file (-a: nascosti, -l: dettagli)
  cd <path>             cambia cartella (.. per salire)
  pwd                   mostra la cartella corrente
  cat <file>            mostra il contenuto di un file
  grep [-i][-c] <t> <f> cerca testo in un file
  base64 -d <file>      decodifica Base64
  find <path>           elenca ricorsivamente i file
  nmap <ip>             scansiona le porte di un host
  ssh <user>@<ip>       connessione remota (chiederà la password)
  whoami                mostra l'utente corrente
  clear                 pulisce lo schermo
  hint                  mostra un suggerimento
  submit <valore>       invia la risposta/flag per completare la missione`;

export interface ExecResult {
  lines: ShellLine[];
  state: ShellState;
  clear?: boolean;
  awaitPassword?: { user: string; ip: string };
  solved?: boolean;
}

export function execCommand(state: ShellState, raw: string, getHintFn?: () => string): ExecResult {
  const input = raw.trim();
  const host = state.hosts[state.current];
  const out: ShellLine[] = [];
  const s = { ...state, history: [...state.history, input] };
  if (!input) return { lines: out, state: s };

  const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const cmd = parts[0];
  const args = parts.slice(1).map((a) => a.replace(/^"|"$/g, ''));
  const flags = args.filter((a) => a.startsWith('-'));
  const pos = args.filter((a) => !a.startsWith('-'));
  const hasFlag = (f: string) => flags.some((x) => x.includes(f));

  const cwdNode = () => nodeAt(host.root, s.cwd);

  switch (cmd) {
    case 'help':
    case '?':
      out.push({ text: HELP, kind: 'info' });
      break;

    case 'pwd':
      out.push({ text: s.cwd, kind: 'out' });
      break;

    case 'whoami':
      out.push({ text: host.user, kind: 'out' });
      break;

    case 'hostname':
      out.push({ text: host.hostname, kind: 'out' });
      break;

    case 'clear':
    case 'cls':
      return { lines: [], state: s, clear: true };

    case 'ls': {
      const target = pos[0] ? resolvePath(s.cwd, pos[0]) : s.cwd;
      const node = nodeAt(host.root, target);
      if (!node) { out.push({ text: `ls: ${pos[0]}: file o directory non esistente`, kind: 'err' }); break; }
      if (node.type === 'file') { out.push({ text: node.name, kind: 'out' }); break; }
      const items = listDir(node, hasFlag('a'));
      if (hasFlag('l')) {
        for (const it of items) {
          const size = it.type === 'file' ? (it.content?.length ?? 0) : 4096;
          out.push({ text: `${permString(it)} ${(it.owner ?? 'root').padEnd(8)} ${String(size).padStart(6)} ${it.name}${it.type === 'dir' ? '/' : ''}`, kind: it.perms?.includes('rwxrwx') || it.perms === '-rw-rw-rw-' ? 'err' : 'out' });
        }
        if (items.length === 0) out.push({ text: '(vuota)', kind: 'out' });
      } else {
        out.push({ text: items.map((i) => i.name + (i.type === 'dir' ? '/' : '')).join('   ') || '(vuota)', kind: 'out' });
      }
      break;
    }

    case 'cd': {
      const target = resolvePath(s.cwd, pos[0] ?? `/home/${host.user}`);
      const node = nodeAt(host.root, target);
      if (!node) out.push({ text: `cd: ${pos[0]}: directory non esistente`, kind: 'err' });
      else if (node.type !== 'dir') out.push({ text: `cd: ${pos[0]}: non è una directory`, kind: 'err' });
      else s.cwd = target || '/';
      break;
    }

    case 'cat': {
      if (!pos[0]) { out.push({ text: 'cat: manca il nome del file', kind: 'err' }); break; }
      const node = nodeAt(host.root, resolvePath(s.cwd, pos[0]));
      if (!node) out.push({ text: `cat: ${pos[0]}: file non esistente`, kind: 'err' });
      else if (node.type === 'dir') out.push({ text: `cat: ${pos[0]}: è una directory`, kind: 'err' });
      else out.push({ text: node.content ?? '', kind: 'out' });
      break;
    }

    case 'grep': {
      const term = pos[0];
      const fileArg = pos[1];
      if (!term || !fileArg) { out.push({ text: 'uso: grep [-i][-c] <testo> <file>', kind: 'err' }); break; }
      const node = nodeAt(host.root, resolvePath(s.cwd, fileArg));
      if (!node || node.type !== 'file') { out.push({ text: `grep: ${fileArg}: file non valido`, kind: 'err' }); break; }
      const lines = (node.content ?? '').split('\n');
      const ci = hasFlag('i');
      const matched = lines.filter((l) => (ci ? l.toLowerCase().includes(term.toLowerCase()) : l.includes(term)));
      if (hasFlag('c')) out.push({ text: String(matched.length), kind: 'out' });
      else if (matched.length === 0) out.push({ text: '(nessuna corrispondenza)', kind: 'out' });
      else matched.forEach((l) => out.push({ text: l, kind: 'out' }));
      break;
    }

    case 'base64': {
      if (!hasFlag('d')) { out.push({ text: 'uso: base64 -d <file>', kind: 'err' }); break; }
      const node = nodeAt(host.root, resolvePath(s.cwd, pos[0] ?? ''));
      if (!node || node.type !== 'file') { out.push({ text: `base64: ${pos[0]}: file non valido`, kind: 'err' }); break; }
      try {
        out.push({ text: atob((node.content ?? '').trim()), kind: 'out' });
      } catch {
        out.push({ text: 'base64: input non valido', kind: 'err' });
      }
      break;
    }

    case 'find': {
      const start = pos[0] ? resolvePath(s.cwd, pos[0]) : s.cwd;
      const node = nodeAt(host.root, start);
      if (!node) { out.push({ text: `find: ${pos[0]}: non esiste`, kind: 'err' }); break; }
      const acc: string[] = [];
      const walk = (n: VNode, path: string) => {
        acc.push(path || '/');
        if (n.type === 'dir' && n.children) {
          for (const c of Object.values(n.children)) walk(c, path + '/' + c.name);
        }
      };
      walk(node, start === '/' ? '' : start);
      acc.forEach((p) => out.push({ text: p || '/', kind: 'out' }));
      break;
    }

    case 'nmap': {
      const ip = pos[0];
      const target = Object.values(s.hosts).find((h) => h.ip === ip);
      if (!ip) { out.push({ text: 'uso: nmap <ip>', kind: 'err' }); break; }
      out.push({ text: `Starting Nmap scan su ${ip} ...`, kind: 'info' });
      if (!target || !target.ports) {
        out.push({ text: `Host ${ip} sembra down o senza porte aperte.`, kind: 'out' });
        break;
      }
      out.push({ text: 'PORT      STATE  SERVICE   VERSION', kind: 'out' });
      for (const p of target.ports) {
        const danger = [23, 3306, 6379, 21].includes(p.port);
        out.push({ text: `${String(p.port + '/tcp').padEnd(9)} open   ${p.service.padEnd(9)} ${p.banner ?? ''}`, kind: danger ? 'err' : 'out' });
      }
      break;
    }

    case 'ssh': {
      const m = (pos[0] ?? '').match(/^([\w.-]+)@([\d.]+)$/);
      if (!m) { out.push({ text: 'uso: ssh <user>@<ip>', kind: 'err' }); break; }
      const [, , ip] = m;
      const target = Object.values(s.hosts).find((h) => h.ip === ip && h.sshPassword);
      if (!target) { out.push({ text: `ssh: connessione a ${ip} rifiutata o host sconosciuto`, kind: 'err' }); break; }
      out.push({ text: `${target.user}@${ip}'s password:`, kind: 'info' });
      return { lines: out, state: s, awaitPassword: { user: m[1], ip } };
    }

    case 'exit':
    case 'logout': {
      // torna all'host iniziale se connesso a remoto
      const firstHost = Object.values(s.hosts)[0];
      if (s.current !== firstHost.hostname) {
        s.current = firstHost.hostname;
        s.cwd = `/home/${firstHost.user}`;
        out.push({ text: 'Connessione chiusa.', kind: 'info' });
      } else {
        out.push({ text: 'Sei già sull\'host locale.', kind: 'out' });
      }
      break;
    }

    case 'hint': {
      out.push({ text: '💡 ' + (getHintFn ? getHintFn() : 'Esplora con ls, cd e cat.'), kind: 'info' });
      break;
    }

    case 'echo':
      out.push({ text: args.join(' '), kind: 'out' });
      break;

    case 'submit': {
      const val = pos.join(' ').trim();
      if (!val) { out.push({ text: 'uso: submit <valore>', kind: 'err' }); break; }
      s.submitted = val;
      if (val === s.flag || val.toLowerCase() === s.flag.toLowerCase()) {
        out.push({ text: `✓ Corretto! "${val}" è la risposta giusta.`, kind: 'ok' });
        return { lines: out, state: s, solved: true };
      }
      out.push({ text: `✗ "${val}" non è corretto. Continua a cercare.`, kind: 'err' });
      break;
    }

    default:
      out.push({ text: `${cmd}: comando non trovato. Digita "help" per la lista.`, kind: 'err' });
  }

  return { lines: out, state: s };
}

export function tryPassword(state: ShellState, user: string, ip: string, pw: string): ExecResult {
  const s = { ...state };
  const out: ShellLine[] = [];
  const target = Object.values(s.hosts).find((h) => h.ip === ip);
  if (target && target.sshPassword === pw && target.user === user) {
    s.current = target.hostname;
    s.cwd = `/home/${target.user}`;
    out.push({ text: `Benvenuto su ${target.hostname} (${ip}).`, kind: 'ok' });
    out.push({ text: `Ultimo accesso: oggi. Digita "ls" per iniziare.`, kind: 'info' });
    return { lines: out, state: s };
  }
  out.push({ text: 'Permission denied (password errata).', kind: 'err' });
  return { lines: out, state: s };
}

export function prompt(state: ShellState): string {
  const host = state.hosts[state.current];
  const short = state.cwd.replace(`/home/${host.user}`, '~');
  return `${host.user}@${host.hostname}:${short}$`;
}
