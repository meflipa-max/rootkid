import React, { useState } from 'react';
import type { SaveState, Item, Slot } from '../../game/types';
import { SLOTS, RARITY, itemDef, itemStats, computeStats, itemPower } from '../../game/content/items';

export function Inventory({ save, mutate }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void }) {
  const [filter, setFilter] = useState<Slot | 'tutti'>('tutti');
  const total = computeStats(save);
  const inv = save.inventory ?? [];

  function equip(it: Item) {
    const def = itemDef(it.defId);
    if (!def) return;
    mutate((s) => { s.equipped[def.slot] = it.id; });
  }
  function unequip(slot: Slot) {
    mutate((s) => { delete s.equipped[slot]; });
  }
  function drop(it: Item) {
    mutate((s) => {
      s.inventory = s.inventory.filter((x) => x.id !== it.id);
      for (const k of Object.keys(s.equipped) as Slot[]) if (s.equipped[k] === it.id) delete s.equipped[k];
    });
  }

  const shown = inv.filter((i) => filter === 'tutti' || itemDef(i.defId)?.slot === filter);
  const sorted = [...shown].sort((a, b) => itemPower(b) - itemPower(a));

  const statLine = (label: string, v: number, suffix = '') =>
    v ? <span className="tag green" key={label}>{label} +{v}{suffix}</span> : null;

  return (
    <div className="content">
      <div className="wrap">
        <h1 className="h1">🎒 Equipaggiamento</h1>
        <p className="sub">Gli oggetti che trovi sconfiggendo i boss ti rendono più forte davvero: più danno, più punti vita, più energia per le abilità.</p>

        {/* slot equipaggiati */}
        <div className="grid cols3" style={{ marginBottom: 14 }}>
          {SLOTS.map((sl) => {
            const id = save.equipped?.[sl.id];
            const it = id ? inv.find((x) => x.id === id) : undefined;
            const def = it ? itemDef(it.defId) : undefined;
            const rar = it ? RARITY[it.rarity] : undefined;
            return (
              <div className="panel" key={sl.id} style={{ borderColor: rar?.color }}>
                <div className="rpg-title" style={{ fontSize: 10.5 }}>{sl.icon} {sl.name}</div>
                {it && def ? (
                  <>
                    <div className="row" style={{ gap: 10, marginTop: 10 }}>
                      <div className="loot-icon" style={{ width: 44, height: 44, fontSize: 22, borderColor: rar!.color }}>{def.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: rar!.color, fontSize: 13.5 }}>{def.name}</div>
                        <div className="dim" style={{ fontSize: 11 }}>{rar!.name}</div>
                      </div>
                    </div>
                    <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => unequip(sl.id)}>Togli</button>
                  </>
                ) : (
                  <div className="dim" style={{ fontSize: 12.5, marginTop: 10 }}>Slot vuoto</div>
                )}
              </div>
            );
          })}
        </div>

        {/* riepilogo statistiche */}
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="rpg-title">Bonus totali</div>
          <div className="row" style={{ marginTop: 8 }}>
            {[
              statLine('Danno', total.dannoPct, '%'),
              statLine('PV max', total.pvMax),
              statLine('Energia', total.energia),
              statLine('XP', total.xpPct, '%'),
              statLine('Critico', total.critPct, '%'),
            ].filter(Boolean)}
            {!total.dannoPct && !total.pvMax && !total.energia && !total.xpPct && !total.critPct && (
              <span className="dim" style={{ fontSize: 13 }}>Nessun bonus: equipaggia qualcosa!</span>
            )}
          </div>
        </div>

        {/* zaino */}
        <div className="row" style={{ marginBottom: 10, gap: 6 }}>
          <span className="rpg-title" style={{ flex: 'none' }}>Zaino ({inv.length})</span>
          <button className={'btn sm ' + (filter === 'tutti' ? 'primary' : 'ghost')} onClick={() => setFilter('tutti')}>Tutti</button>
          {SLOTS.map((s) => (
            <button key={s.id} className={'btn sm ' + (filter === s.id ? 'primary' : 'ghost')} onClick={() => setFilter(s.id)}>{s.icon}</button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="empty">Lo zaino è vuoto. Sconfiggi i boss delle missioni per trovare oggetti!</div>
        ) : (
          <div className="grid cols2">
            {sorted.map((it) => {
              const def = itemDef(it.defId)!;
              const rar = RARITY[it.rarity];
              const st = itemStats(it);
              const isEquipped = save.equipped?.[def.slot] === it.id;
              return (
                <div className="card" key={it.id} style={{ borderColor: isEquipped ? rar.color : undefined }}>
                  <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <div className="loot-icon" style={{ width: 46, height: 46, fontSize: 23, borderColor: rar.color }}>{def.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ justifyContent: 'space-between', gap: 6 }}>
                        <b style={{ color: rar.color, fontSize: 14 }}>{def.name}</b>
                        {isEquipped && <span className="tag green">equipaggiato</span>}
                      </div>
                      <div className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{rar.name} · {def.slot}</div>
                      <div className="row" style={{ marginTop: 6, gap: 5 }}>
                        {st.dannoPct ? <span className="tag">+{st.dannoPct}% dmg</span> : null}
                        {st.pvMax ? <span className="tag">+{st.pvMax} PV</span> : null}
                        {st.energia ? <span className="tag">+{st.energia} ⚡</span> : null}
                        {st.xpPct ? <span className="tag">+{st.xpPct}% XP</span> : null}
                        {st.critPct ? <span className="tag">+{st.critPct}% crit</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
                    {!isEquipped && <button className="btn sm primary" onClick={() => equip(it)}>Equipaggia</button>}
                    <button className="btn sm ghost" onClick={() => drop(it)}>Butta</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
