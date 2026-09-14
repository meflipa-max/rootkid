import React, { useMemo, useState } from 'react';
import type { SaveState, Mission } from '../../game/types';
import { NPCS, Npc } from '../../game/content/npcs';
import { Dialogue, Choice, NpcPortrait } from '../components/Dialogue';
import { Avatar } from '../art/Avatar';
import {
  companyById, nextStoryMission, buildMission, buildBounty, buildDaily,
  levelFromXp, rank, canJoinCompany, COMPANIES, COURSES, CERTS, TOOLS,
} from '../../game/engine';
import { hashString, todayKey, randomSeed } from '../../game/rng';
import { RNG } from '../../game/rng';

export type HubDest = 'contracts' | 'academy' | 'certs' | 'shop' | 'map' | 'inventory' | 'inbox';

interface Spot {
  id: string;
  npc: Npc;
  place: string;
  icon: string;
  desc: string;
  badge?: number | '!' ;
}

export function Hub({
  save, mutate, onPlay, onGo,
}: {
  save: SaveState;
  mutate: (fn: (s: SaveState) => void) => void;
  onPlay: (m: Mission) => void;
  onGo: (d: HubDest) => void;
}) {
  const [talking, setTalking] = useState<{ id: string; lines: string[] } | null>(null);
  const level = levelFromXp(save.xp);
  const company = companyById(save.companyId);
  const next = nextStoryMission(save);
  const unread = save.inbox.filter((m) => !m.read).length;

  // qualcuno ti aspetta? (offerte di lavoro disponibili)
  const offerAvailable = COMPANIES.some(
    (c, i) => i > COMPANIES.findIndex((x) => x.id === save.companyId) && canJoinCompany(save, c.id).ok,
  );
  const canStudy = COURSES.some((c) => !save.courses.includes(c.id) && save.credits >= c.cost && level >= c.minLevel);
  const canExam = CERTS.some((c) => !save.certs.includes(c.id) && save.credits >= c.cost && level >= c.reqLevel);
  const canBuy = TOOLS.some((t) => !save.tools.includes(t.id) && save.credits >= t.cost && level >= t.reqLevel);

  const spots: Spot[] = [
    { id: 'zero', npc: NPCS.zero, place: 'Il divano di Zero', icon: '🛋️', desc: 'Il tuo mentore. Consigli, etica, e qualche storia.', badge: unread ? unread : undefined },
    { id: 'rae', npc: NPCS.rae, place: 'Bacheca dei contratti', icon: '📋', desc: 'Missioni, taglie e la sfida del giorno.', badge: next ? '!' : undefined },
    { id: 'prof', npc: NPCS.prof, place: 'Accademia', icon: '🎓', desc: 'Corsi teorici: la base di tutto.', badge: canStudy ? '!' : undefined },
    { id: 'mercante', npc: NPCS.mercante, place: 'Banco di Bit', icon: '🧰', desc: 'Strumenti del mestiere in vendita.', badge: canBuy ? '!' : undefined },
    { id: 'esaminatore', npc: NPCS.esaminatore, place: 'Sala esami', icon: '📜', desc: 'Certificazioni ufficiali.', badge: canExam ? '!' : undefined },
  ];

  const npc = talking ? NPCS[talking.id] : null;

  function open(id: string) {
    const n = NPCS[id];
    // decido le battute PRIMA di segnare l'incontro, altrimenti la presentazione
    // non verrebbe mai mostrata (il flag sarebbe già attivo al render successivo)
    const firstTime = !save.metNpcs?.includes(id);
    const r = new RNG(hashString(id + Date.now().toString()));
    const lines = firstTime ? n.intro : [r.pick(n.idle)];
    setTalking({ id, lines });
    if (firstTime) mutate((s) => { if (!s.metNpcs.includes(id)) s.metNpcs.push(id); });
  }
  function close() { setTalking(null); }
  function go(d: HubDest) { close(); onGo(d); }

  function choicesFor(id: string): Choice[] {
    switch (id) {
      case 'zero':
        return [
          { icon: '📬', label: 'Leggi la posta', hint: unread ? `${unread} non letti` : 'nessun messaggio nuovo', onPick: () => go('inbox') },
          { icon: '🗺️', label: 'Guarda la mappa della carriera', hint: offerAvailable ? 'hai un\'offerta di lavoro!' : `sei a ${company.name}`, onPick: () => go('map') },
          { icon: '🎒', label: 'Controlla l\'equipaggiamento', hint: `${save.inventory?.length ?? 0} oggetti nello zaino`, onPick: () => go('inventory') },
          { icon: '👋', label: 'Ci vediamo', onPick: close },
        ];
      case 'rae':
        return [
          {
            icon: '🎯',
            label: next ? `Contratto: ${next.title}` : 'Nessun contratto principale',
            hint: next ? `${next.specs.length} sfide · +${next.reward.xp} XP` : 'hai finito quelli di questo datore di lavoro',
            disabled: !next,
            onPick: () => { if (next) { close(); onPlay(buildMission(next, hashString(next.id) ^ (save.createdAt & 0xffff))); } },
          },
          { icon: '💰', label: 'Accetta una taglia', hint: 'contratto extra, sempre diverso · trovi oggetti', onPick: () => { close(); onPlay(buildBounty(save, randomSeed())); } },
          {
            icon: '📅',
            label: 'Sfida del giorno',
            hint: save.daily.done ? 'già completata oggi' : `serie: ${save.streak.count} 🔥`,
            onPick: () => { close(); onPlay(buildDaily(todayKey())); },
          },
          { icon: '📋', label: 'Vedi tutti i contratti', onPick: () => go('contracts') },
          { icon: '👋', label: 'Torno dopo', onPick: close },
        ];
      case 'prof':
        return [
          { icon: '🎓', label: 'Sfoglia i corsi', hint: `${save.courses.length}/${COURSES.length} completati`, onPick: () => go('academy') },
          { icon: '👋', label: 'Più tardi', onPick: close },
        ];
      case 'mercante':
        return [
          { icon: '🧰', label: 'Mostrami la merce', hint: `hai ${save.credits} crediti`, onPick: () => go('shop') },
          { icon: '🎒', label: 'Guarda il mio equipaggiamento', onPick: () => go('inventory') },
          { icon: '👋', label: 'Solo un giro', onPick: close },
        ];
      case 'esaminatore':
        return [
          { icon: '📜', label: 'Voglio sostenere un esame', hint: `${save.certs.length}/${CERTS.length} ottenute`, onPick: () => go('certs') },
          { icon: '👋', label: 'Non sono pronto', onPick: close },
        ];
      default:
        return [{ label: 'Chiudi', onPick: close }];
    }
  }

  return (
    <div className="content">
      <div className="wrap">
        {/* intestazione della base */}
        <div className="hub-head">
          <div className="portrait big"><Avatar level={level} px={4} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="rpg-title">La Base · {company.name}</div>
            <h1 className="h1" style={{ margin: '4px 0 2px', fontSize: 20 }}>{save.handle}</h1>
            <div className="dim" style={{ fontSize: 13 }}>{rank(level)} · Lv {level} · 💰 {save.credits} · ⭐ {save.reputation}</div>
          </div>
        </div>

        <p className="sub" style={{ marginTop: 14 }}>Parla con qualcuno per iniziare.</p>

        {/* la stanza */}
        <div className="hub-room">
          {spots.map((s) => (
            <button key={s.id} className="hub-spot" onClick={() => open(s.id)} style={{ borderColor: s.npc.color + '55' }}>
              {s.badge !== undefined && <span className="hub-badge">{s.badge}</span>}
              <div className="hub-spot-top">
                <NpcPortrait npc={s.npc} px={4} />
                <span className="hub-place-ic">{s.icon}</span>
              </div>
              <div className="hub-spot-name" style={{ color: s.npc.color }}>{s.npc.name}</div>
              <div className="hub-spot-place">{s.place}</div>
              <div className="hub-spot-desc">{s.desc}</div>
            </button>
          ))}
        </div>

        <div className="hub-floor">
          <div className="hub-you">
            <Avatar level={level} px={3} />
            <div className="hub-you-label">{save.handle}</div>
          </div>
        </div>
      </div>

      {npc && talking && <Dialogue npc={npc} lines={talking.lines} choices={choicesFor(npc.id)} onClose={close} />}
    </div>
  );
}
