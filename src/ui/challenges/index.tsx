import React from 'react';
import type { Challenge, ChallengeResult } from '../../game/types';
import Terminal from './Terminal';
import { Cipher, Binary, Password } from './Crypto';
import { CodeReview, WebLab } from './Web';
import { Phishing, Logs } from './Inspect';
import { Quiz, Network, Ethics } from './Knowledge';
import { Sniffer } from './Sniffer';

export function ChallengeView({ challenge, onDone, tools }: { challenge: Challenge; onDone: (r: ChallengeResult) => void; tools: string[] }) {
  switch (challenge.type) {
    case 'terminal': return <Terminal challenge={challenge} onDone={onDone} tools={tools} />;
    case 'cipher': return <Cipher challenge={challenge} onDone={onDone} tools={tools} />;
    case 'binary': return <Binary challenge={challenge} onDone={onDone} tools={tools} />;
    case 'password': return <Password challenge={challenge} onDone={onDone} tools={tools} />;
    case 'codereview': return <CodeReview challenge={challenge} onDone={onDone} tools={tools} />;
    case 'weblab': return <WebLab challenge={challenge} onDone={onDone} tools={tools} />;
    case 'phishing': return <Phishing challenge={challenge} onDone={onDone} tools={tools} />;
    case 'logs': return <Logs challenge={challenge} onDone={onDone} tools={tools} />;
    case 'quiz': return <Quiz challenge={challenge} onDone={onDone} tools={tools} />;
    case 'network': return <Network challenge={challenge} onDone={onDone} tools={tools} />;
    case 'ethics': return <Ethics challenge={challenge} onDone={onDone} tools={tools} />;
    case 'sniffer': return <Sniffer challenge={challenge} onDone={onDone} tools={tools} />;
    default: return <div>Tipo di sfida sconosciuto.</div>;
  }
}

export const TYPE_META: Record<string, { label: string; icon: string; skill: string }> = {
  terminal: { label: 'Terminale', icon: '🖥️', skill: 'linux' },
  cipher: { label: 'Cifrari', icon: '🔐', skill: 'crypto' },
  binary: { label: 'Binario/ASCII', icon: '🔢', skill: 'crypto' },
  password: { label: 'Password', icon: '🔑', skill: 'crypto' },
  codereview: { label: 'Code Review', icon: '🔍', skill: 'code' },
  weblab: { label: 'Web Lab', icon: '🌐', skill: 'web' },
  phishing: { label: 'Phishing', icon: '🎣', skill: 'social' },
  logs: { label: 'Log Analysis', icon: '📄', skill: 'forensics' },
  quiz: { label: 'Quiz', icon: '❓', skill: 'social' },
  network: { label: 'Reti', icon: '📡', skill: 'network' },
  ethics: { label: 'Etica', icon: '⚖️', skill: 'social' },
  sniffer: { label: 'Packet Defense', icon: '🎯', skill: 'network' },
};
