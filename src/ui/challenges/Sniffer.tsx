import React, { useEffect, useRef, useState } from 'react';
import type { SnifferChallenge } from '../../game/types';
import { ChProps, useCh, Brief, Finish } from './frame';
import { RNG } from '../../game/rng';

interface Packet {
  id: number;
  x: number; // 0..1 across width
  y: number; // px from top within lane area
  speed: number;
  bad: boolean;
  label: string;
  gone: boolean;
}

const GOOD_PORTS = [80, 443, 8080, 22, 53];
const GOOD_SRC = () => `192.168.1.${Math.floor(Math.random() * 254) + 1}`;

export function Sniffer({ challenge, onDone, tools }: ChProps<SnifferChallenge>) {
  const { done, finish, start } = useCh(challenge);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(challenge.duration);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [flash, setFlash] = useState<'' | 'good' | 'bad'>('');

  const areaRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);
  const lastSpawn = useRef(0);
  const rng = useRef(new RNG(challenge.seed));
  const idSeq = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const startT = useRef(0);
  const hasWireshark = tools.includes('wireshark');
  const speedFactor = hasWireshark ? 0.82 : 1;

  function makePacket(): Packet {
    const r = rng.current;
    const bad = r.chance(0.42);
    let label: string;
    if (bad) {
      if (r.chance(0.5)) label = `${r.pick(challenge.badIps)}:${r.pick(challenge.badPorts)}`;
      else label = `${GOOD_SRC()}:${r.pick(challenge.badPorts)}`;
    } else {
      label = `${GOOD_SRC()}:${r.pick(GOOD_PORTS)}`;
    }
    const lane = r.int(0, 4);
    return {
      id: idSeq.current++,
      x: -0.08,
      y: 44 + lane * 46,
      speed: (0.16 + r.next() * 0.12 + challenge.difficulty * 0.02) * speedFactor,
      bad,
      label,
      gone: false,
    };
  }

  function begin() {
    setPhase('play');
    setScore(0); scoreRef.current = 0;
    setLives(3); livesRef.current = 3;
    setTime(challenge.duration);
    setPackets([]);
    startT.current = performance.now();
    lastSpawn.current = 0;
  }

  useEffect(() => {
    if (phase !== 'play') return;
    const loop = (t: number) => {
      const elapsed = (t - startT.current) / 1000;
      const remaining = Math.max(0, challenge.duration - elapsed);
      setTime(Math.ceil(remaining));

      const spawnInterval = Math.max(480, 1100 - challenge.difficulty * 90);
      if (t - lastSpawn.current > spawnInterval) {
        lastSpawn.current = t;
        setPackets((ps) => [...ps, makePacket()]);
      }

      setPackets((ps) => {
        const next: Packet[] = [];
        for (const p of ps) {
          if (p.gone) continue;
          const nx = p.x + p.speed * 0.016;
          if (nx > 1.05) {
            // uscito dallo schermo: se era bad, penalità
            if (p.bad) {
              livesRef.current -= 1;
              setLives(livesRef.current);
              setFlash('bad'); setTimeout(() => setFlash(''), 120);
            }
            continue;
          }
          next.push({ ...p, x: nx });
        }
        return next;
      });

      if (remaining <= 0 || livesRef.current <= 0) {
        endGame();
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function endGame() {
    cancelAnimationFrame(raf.current);
    setPhase('over');
    const finalScore = scoreRef.current;
    const win = finalScore >= challenge.target;
    finish(win, { perfect: win && finalScore >= challenge.target * 1.6, snifferScore: finalScore });
  }

  function hit(p: Packet) {
    if (phase !== 'play' || p.gone) return;
    setPackets((ps) => ps.map((x) => (x.id === p.id ? { ...x, gone: true } : x)));
    if (p.bad) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash('good'); setTimeout(() => setFlash(''), 100);
    } else {
      // bloccato traffico legittimo: penalità
      livesRef.current -= 1;
      setLives(livesRef.current);
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
      setFlash('bad'); setTimeout(() => setFlash(''), 120);
    }
  }

  return (
    <div className="chwrap" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Brief challenge={challenge} who="Difesa attiva" />
      <div className="sniffer" ref={areaRef} style={{ boxShadow: flash === 'bad' ? 'inset 0 0 60px rgba(255,92,92,0.4)' : flash === 'good' ? 'inset 0 0 40px rgba(61,255,143,0.25)' : undefined }}>
        <div className="hud2">
          <span>🎯 Punti: <b style={{ color: 'var(--green)' }}>{score}</b> / {challenge.target}</span>
          <span>{'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(Math.max(0, 3 - lives))}</span>
          <span>⏱️ {time}s</span>
        </div>

        {phase === 'ready' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 15, maxWidth: 420 }}>
              Blocca (clic) i pacchetti <span style={{ color: 'var(--red)' }}>ROSSI</span> (attacco: porte come {challenge.badPorts.slice(0, 3).join(', ')} o IP in blacklist).<br />
              Lascia passare i <span style={{ color: 'var(--green)' }}>VERDI</span> (traffico legittimo: 80/443/22).<br />
              <span className="dim">Ogni pacchetto malevolo sfuggito o legittimo bloccato = −1 vita.</span>
              {hasWireshark && <div className="tag green" style={{ marginTop: 8 }}>🦈 Wireshark: flusso rallentato</div>}
            </div>
            <button className="btn primary" onClick={begin}>▶ Avvia cattura</button>
          </div>
        )}

        {phase === 'play' &&
          packets.map((p) => (
            <div
              key={p.id}
              className={'packet ' + (p.bad ? 'bad' : 'good')}
              style={{ left: `${p.x * 100}%`, top: p.y }}
              onClick={() => hit(p)}
              onTouchStart={(e) => { e.preventDefault(); hit(p); }}
            >
              {p.bad ? '⚠ ' : '✓ '}{p.label}
            </div>
          ))}

        {phase === 'over' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ fontSize: 42 }}>{score >= challenge.target ? '🛡️' : '💥'}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{score} punti</div>
            <div className="dim">{score >= challenge.target ? 'Rete difesa!' : `Servivano ${challenge.target} punti`}</div>
          </div>
        )}
      </div>

      {done && (
        <Finish
          challenge={challenge}
          done={done}
          hintsUsed={0}
          extra={<div className="card" style={{ marginTop: 12 }}>Hai intercettato <b className="mono" style={{ color: 'var(--green)' }}>{score}</b> pacchetti malevoli.</div>}
          onContinue={() => onDone({ success: done.success, hintsUsed: 0, timeMs: Date.now() - start.current, perfect: done.perfect, snifferScore: done.snifferScore })}
        />
      )}
      {phase === 'over' && !done && null}
    </div>
  );
}
