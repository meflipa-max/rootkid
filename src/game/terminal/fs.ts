import type { VNode, VHost } from '../types';
import { RNG } from '../rng';

export function dir(name: string, children: Record<string, VNode> = {}, extra: Partial<VNode> = {}): VNode {
  return { name, type: 'dir', children, perms: 'drwxr-xr-x', owner: 'root', ...extra };
}
export function file(name: string, content: string, extra: Partial<VNode> = {}): VNode {
  return { name, type: 'file', content, perms: '-rw-r--r--', owner: 'root', ...extra };
}

export function splitPath(p: string): string[] {
  return p.split('/').filter(Boolean);
}

export function resolvePath(cwd: string, arg: string): string {
  let base: string[];
  if (arg.startsWith('/')) base = [];
  else base = splitPath(cwd);
  for (const part of splitPath(arg)) {
    if (part === '.') continue;
    if (part === '..') base.pop();
    else base.push(part);
  }
  return '/' + base.join('/');
}

export function nodeAt(root: VNode, path: string): VNode | null {
  const parts = splitPath(path);
  let cur: VNode = root;
  for (const p of parts) {
    if (cur.type !== 'dir' || !cur.children || !cur.children[p]) return null;
    cur = cur.children[p];
  }
  return cur;
}

export function listDir(node: VNode, showHidden: boolean): VNode[] {
  if (node.type !== 'dir' || !node.children) return [];
  return Object.values(node.children)
    .filter((c) => showHidden || !c.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ====== GENERATORI DI HOST ======
const FIRST = ['mario', 'giulia', 'luca', 'sara', 'paolo', 'elena', 'marco', 'anna', 'davide', 'chiara'];
const WORDS = ['alpha', 'bravo', 'nebula', 'orbit', 'quasar', 'vortex', 'cipher', 'falcon', 'zenit', 'delta'];

export function randIp(r: RNG, subnet = '10.0.0'): string {
  return `${subnet}.${r.int(2, 254)}`;
}

export function makeFlag(r: RNG): string {
  const w = r.pick(['hidden', 'root', 'found', 'shell', 'access', 'deep', 'ghost', 'proxy', 'silent']);
  return `ROOTKID{${w}_${r.int(1000, 9999)}}`;
}

interface BuildOpts {
  objective: string;
  difficulty: number;
}

// Costruisce uno o più host con un obiettivo specifico. Ritorna { hosts, startHost, objective, flag, extra }
export function buildTerminalWorld(seed: number, opts: BuildOpts) {
  const r = new RNG(seed);
  const user = r.pick(FIRST);
  const hostname = `${r.pick(WORDS)}-srv`;
  const flag = makeFlag(r);
  const ip = randIp(r);

  let objectiveText = '';
  let extra: Record<string, unknown> = {};

  const home = dir(user, {
    'readme.txt': file('readme.txt', 'Benvenuto nel laboratorio ROOTKID.\nUsa i comandi per esplorare. Digita "help" per la lista.\nSuggerimento: i file nascosti iniziano con un punto.'),
  });
  const root = dir('/', {
    home: dir('home', { [user]: home }),
    etc: dir('etc', {
      passwd: file('passwd', `root:x:0:0:root:/root:/bin/bash\n${user}:x:1000:1000::/home/${user}:/bin/bash\nwww-data:x:33:33::/var/www:/usr/sbin/nologin`),
      hostname: file('hostname', hostname),
    }),
    var: dir('var', {
      log: dir('log', {}),
      www: dir('www', {}),
    }),
    tmp: dir('tmp', {}),
  });

  const hosts: VHost[] = [{ hostname, ip, user, root }];

  switch (opts.objective) {
    case 'find_flag': {
      const fnode = file('flag.txt', `La flag è:\n${flag}`);
      // Difficoltà 1 = tutorial: la flag è SEMPRE nella home, così bastano ls + cat + submit.
      // Da difficoltà 2 in su può essere in altre cartelle: bisogna esplorare (o usare find /).
      const loc = opts.difficulty <= 1 ? 'home' : r.pick(['home', 'var', 'tmp']);
      if (loc === 'home') home.children!['flag.txt'] = fnode;
      else if (loc === 'var') (root.children!.var.children!.www as VNode).children!['flag.txt'] = fnode;
      else root.children!.tmp.children!['flag.txt'] = fnode;
      objectiveText =
        loc === 'home'
          ? `Trova il file con la FLAG nella tua cartella. Prova "ls" per vedere i file, "cat flag.txt" per leggerlo, poi "submit ROOTKID{...}".`
          : `Trova il file che contiene la FLAG (formato ROOTKID{...}). Potrebbe non essere nella tua cartella: esplora con "ls" nelle varie cartelle, oppure "find /" per elencarle tutte. Poi invia con: submit ROOTKID{...}`;
      // distrattori
      home.children!['note.txt'] = file('note.txt', 'Ricorda di comprare il latte.\nLa password del wifi è sul frigo.');
      extra = { flag };
      break;
    }
    case 'find_hidden': {
      objectiveText = `Un file NASCOSTO contiene la flag. Usa "ls -a" per trovarlo, poi invialo con submit.`;
      home.children!['.secret.txt'] = file('.secret.txt', `Questo non doveva essere qui.\n${flag}`, { hidden: true });
      home.children!['documenti'] = dir('documenti', {
        'spesa.txt': file('spesa.txt', 'pane, latte'),
        '.backup': dir('.backup', { 'old.txt': file('old.txt', 'vecchi dati') }, { hidden: true }),
      });
      extra = { flag };
      break;
    }
    case 'decode_file': {
      const encoded = btoa(flag);
      objectiveText = `Il file /home/${user}/data.b64 contiene la flag codificata in Base64. Decodificala (es: "base64 -d data.b64") e inviala.`;
      home.children!['data.b64'] = file('data.b64', encoded);
      extra = { flag, encoded };
      break;
    }
    case 'grep_log': {
      const badIp = randIp(r, `${r.int(40, 200)}.${r.int(0, 255)}.${r.int(0, 255)}`);
      const logLines: string[] = [];
      for (let i = 0; i < 8; i++) logLines.push(`${randIp(r)} GET /index.html 200`);
      const hits = r.int(4, 7);
      for (let i = 0; i < hits; i++) logLines.push(`${badIp} POST /admin/login 401 FAILED`);
      objectiveText = `Nel file /var/log/access.log c'è un IP che ha fatto molti tentativi falliti (FAILED). Usa grep per trovarlo e invialo: submit ${badIp.replace(/\d+$/, 'X')} (l'IP esatto)`;
      (root.children!.var.children!.log as VNode).children!['access.log'] = file('access.log', r.shuffle(logLines).join('\n'));
      extra = { flag: badIp, hint: 'grep FAILED /var/log/access.log' };
      objectiveText = `Nel file /var/log/access.log un IP ha molti accessi "FAILED". Trovalo con grep e invialo con: submit <IP>`;
      break;
    }
    case 'count': {
      const word = 'FAILED';
      const n = r.int(6, 12);
      const logLines: string[] = [];
      for (let i = 0; i < n; i++) logLines.push(`${randIp(r)} login ${word}`);
      for (let i = 0; i < r.int(3, 6); i++) logLines.push(`${randIp(r)} login OK`);
      (root.children!.var.children!.log as VNode).children!['auth.log'] = file('auth.log', r.shuffle(logLines).join('\n'));
      objectiveText = `Quante righe contengono "FAILED" in /var/log/auth.log? Contale (prova: "grep -c FAILED ...") e invia il numero con submit.`;
      extra = { flag: String(n) };
      break;
    }
    case 'perm': {
      objectiveText = `Un file con permessi sospetti (world-writable, es. -rw-rw-rw-) nasconde una backdoor. Trovalo con "ls -la" nelle cartelle e leggi la flag al suo interno.`;
      (root.children!.tmp as VNode).children!['.backdoor.sh'] = file('.backdoor.sh', `#!/bin/bash\n# backdoor lasciata dall'attaccante\necho "${flag}"`, { perms: '-rwxrwxrwx', owner: 'www-data', hidden: true });
      (root.children!.var.children!.www as VNode).children!['index.php'] = file('index.php', '<?php echo "Benvenuto"; ?>', { perms: '-rw-r--r--' });
      extra = { flag };
      break;
    }
    case 'nmap': {
      const ports = [
        { port: 22, service: 'ssh', banner: 'OpenSSH 8.2' },
        { port: 80, service: 'http', banner: 'nginx 1.18' },
      ];
      const sneaky = r.pick([
        { port: 23, service: 'telnet', banner: 'telnetd (INSICURO!)' },
        { port: 3306, service: 'mysql', banner: 'MySQL 5.7 (esposto!)' },
        { port: 6379, service: 'redis', banner: 'Redis (senza password!)' },
      ]);
      ports.push(sneaky);
      hosts[0].ports = r.shuffle(ports);
      objectiveText = `Esegui "nmap ${ip}" per scansionare l'host. C'è un servizio che NON dovrebbe essere esposto. Invia la sua porta con: submit <porta>`;
      extra = { flag: String(sneaky.port), service: sneaky.service };
      break;
    }
    case 'ssh': {
      const pw = r.pick(['Estate2024!', 'Admin123#', `${r.pick(WORDS)}${r.int(10, 99)}!`]);
      const targetIp = randIp(r, '10.0.1');
      const targetHost = `db-${r.pick(WORDS)}`;
      objectiveText = `Le credenziali SSH del server pagamenti sono salvate in chiaro in un file di configurazione. Trovale, poi connettiti con "ssh ${user}@${targetIp}" usando quella password. La flag è nella home del server remoto.`;
      home.children!['config'] = dir('config', {
        'deploy.env': file('deploy.env', `# configurazione deploy (NON committare!)\nSSH_HOST=${targetIp}\nSSH_USER=${user}\nSSH_PASS=${pw}\nDB_NAME=payments`),
      });
      const targetRoot = dir('/', {
        home: dir('home', {
          [user]: dir(user, {
            'flag.txt': file('flag.txt', `Server pagamenti raggiunto.\n${flag}`),
            'payments.db': file('payments.db', '[database cifrato]'),
          }),
        }),
        etc: dir('etc', { hostname: file('hostname', targetHost) }),
      });
      hosts.push({ hostname: targetHost, ip: targetIp, user, root: targetRoot, sshPassword: pw });
      extra = { flag, sshPass: pw, targetIp };
      break;
    }
    default: {
      objectiveText = 'Esplora il sistema e trova la flag.';
      home.children!['flag.txt'] = file('flag.txt', flag);
      extra = { flag };
    }
  }

  return { hosts, startHost: hostname, objective: objectiveText, flag: String(extra.flag ?? flag), extra };
}
