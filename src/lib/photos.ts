import { useEffect, useState } from 'react';

/**
 * Le foto dei piatti fatti al lavoro: stanno nel telefono (IndexedDB), non nel salvataggio JSON,
 * perché sarebbero troppo pesanti per localStorage. Vengono rimpicciolite prima di salvarle.
 */
const DB = 'core-a-core';
const STORE = 'photos';
let dbp: Promise<IDBDatabase> | null = null;

function db() {
  return (dbp ??= new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  }));
}

function run<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((ok, no) => {
        const req = f(d.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => ok(req.result as T);
        req.onerror = () => no(req.error);
      }),
  );
}

const bus = new EventTarget();

async function shrink(file: Blob, max = 720): Promise<Blob> {
  try {
    const img = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob((b) => ok(b ?? file), 'image/jpeg', 0.82));
  } catch {
    return file;
  }
}

export async function savePhoto(id: string, file: Blob) {
  const small = await shrink(file);
  await run('readwrite', (s) => s.put(small, id));
  bus.dispatchEvent(new Event(id));
}

export async function delPhoto(id: string) {
  await run('readwrite', (s) => s.delete(id));
  bus.dispatchEvent(new Event(id));
}

export const getPhoto = (id: string) => run<Blob | undefined>('readonly', (s) => s.get(id)).catch(() => undefined);

/** l'indirizzo della foto del piatto (o null), che si aggiorna quando la foto cambia */
export function usePhoto(id: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id || typeof indexedDB === 'undefined') return;
    let cur: string | null = null;
    let live = true;
    const load = () =>
      void getPhoto(id).then((b) => {
        if (!live) return;
        if (cur) URL.revokeObjectURL(cur);
        cur = b ? URL.createObjectURL(b) : null;
        setUrl(cur);
      });
    load();
    bus.addEventListener(id, load);
    return () => {
      live = false;
      bus.removeEventListener(id, load);
      if (cur) URL.revokeObjectURL(cur);
    };
  }, [id]);
  return url;
}
