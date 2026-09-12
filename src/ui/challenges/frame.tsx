import React, { useRef, useState } from 'react';
import type { Challenge, ChallengeResult } from '../../game/types';
import { Diff, HintPanel, Learn } from '../components/common';

export interface ChProps<T extends Challenge = Challenge> {
  challenge: T;
  onDone: (r: ChallengeResult) => void;
  tools: string[];
}

export function useCh(challenge: Challenge) {
  const [hintsUsed, setHints] = useState(0);
  const start = useRef(Date.now());
  const [done, setDone] = useState<null | { success: boolean; perfect: boolean; ethicsDelta?: number; snifferScore?: number }>(null);
  const useHint = () => setHints((h) => Math.min(challenge.hints.length, h + 1));
  const finish = (success: boolean, opts?: { perfect?: boolean; ethicsDelta?: number; snifferScore?: number }) =>
    setDone({ success, perfect: opts?.perfect ?? (success && hintsUsed === 0), ethicsDelta: opts?.ethicsDelta, snifferScore: opts?.snifferScore });
  return { hintsUsed, useHint, done, finish, start };
}

export function Brief({ challenge, who }: { challenge: Challenge; who?: string }) {
  return (
    <div className="brief">
      <div className="who">
        {who ?? 'Obiettivo'} · <Diff n={challenge.difficulty} />
      </div>
      {challenge.brief}
    </div>
  );
}

export function Finish({
  challenge,
  done,
  hintsUsed,
  onContinue,
  extra,
}: {
  challenge: Challenge;
  done: { success: boolean; perfect: boolean; ethicsDelta?: number; snifferScore?: number };
  hintsUsed: number;
  onContinue: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="fadein" style={{ marginTop: 16 }}>
      <div className={'result-banner ' + (done.success ? 'ok' : 'bad')}>
        {done.success ? (done.perfect ? '💎 Perfetto! Risolto senza errori né aiuti.' : '✓ Sfida superata!') : '✗ Sfida non superata — ma hai imparato qualcosa.'}
        {hintsUsed > 0 && done.success && <span className="dim" style={{ fontWeight: 400 }}> · {hintsUsed} suggerimento/i usati</span>}
      </div>
      {extra}
      <Learn text={challenge.learn} />
      <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={onContinue} autoFocus>
          Continua →
        </button>
      </div>
    </div>
  );
}

export function Hints({ challenge, hintsUsed, useHint, hidden }: { challenge: Challenge; hintsUsed: number; useHint: () => void; hidden?: boolean }) {
  if (hidden) return null;
  return <HintPanel hints={challenge.hints} used={hintsUsed} onUse={useHint} />;
}
