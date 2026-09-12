import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from '../game/types';
import { loadSave, persist, newSave, wipeSave, ensureDaily, checkAchievements } from '../game/engine';
import { ACHIEVEMENTS } from '../game/content/progression';

export interface Toast {
  id: number;
  kind: 'info' | 'lvl' | 'ach' | 'credit';
  icon: string;
  title: string;
  body?: string;
}

let toastSeq = 0;

export function useGame() {
  const [save, setSave] = useState<SaveState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const s = loadSave();
    if (s) {
      ensureDaily(s);
      setSave({ ...s });
      persist(s);
    }
  }, []);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.kind === 'ach' || t.kind === 'lvl' ? 5200 : 3400);
  }, []);

  // Applica una mutazione sullo stato (riceve una copia mutabile), poi persiste e controlla achievement
  const mutate = useCallback(
    (fn: (s: SaveState) => void, opts?: { silentAchievements?: boolean }) => {
      setSave((prev) => {
        if (!prev) return prev;
        const draft: SaveState = JSON.parse(JSON.stringify(prev));
        fn(draft);
        if (!opts?.silentAchievements) {
          const unlocked = checkAchievements(draft);
          if (unlocked.length) {
            for (const id of unlocked) {
              const a = ACHIEVEMENTS.find((x) => x.id === id);
              if (a) pushToast({ kind: 'ach', icon: a.icon, title: 'Obiettivo sbloccato!', body: a.name });
            }
          }
        }
        persist(draft);
        return draft;
      });
    },
    [pushToast],
  );

  const start = useCallback((handle: string) => {
    const s = newSave(handle);
    ensureDaily(s);
    persist(s);
    setSave(s);
  }, []);

  const reset = useCallback(() => {
    wipeSave();
    setSave(null);
    booted.current = true;
  }, []);

  return { save, setSave, mutate, start, reset, toasts, pushToast };
}
