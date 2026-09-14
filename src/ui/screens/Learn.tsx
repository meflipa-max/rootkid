import React, { useMemo, useState } from 'react';
import type { SaveState } from '../../game/types';
import { COURSES, CERTS, levelFromXp, SKILLS } from '../../game/engine';
import { pickQuiz } from '../../game/content/quiz';
import { RNG, randomSeed } from '../../game/rng';
import { Modal } from '../components/common';
import type { Toast } from '../useGame';

interface QQ { q: string; options: string[]; answer: number; why?: string }

function QuizRun({ title, questions, pass, onFinish, onCancel }: { title: string; questions: QQ[]; pass: number; onFinish: (passed: boolean, correct: number) => void; onCancel: () => void }) {
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const q = questions[idx];
  const last = idx === questions.length - 1;

  function answer(i: number) {
    if (answered) return;
    setSel(i); setAnswered(true);
    if (i === q.answer) setCorrect((c) => c + 1);
  }
  function next() {
    if (last) onFinish(correct >= pass, correct);
    else { setIdx((i) => i + 1); setSel(null); setAnswered(false); }
  }

  return (
    <Modal wide onClose={undefined}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span className="tag">Domanda {idx + 1}/{questions.length} · ✓{correct}</span>
      </div>
      <p className="dim" style={{ fontSize: 12 }}>Serve {pass}/{questions.length} per superare. Nessun aiuto durante l'esame.</p>
      <div style={{ fontSize: 16, fontWeight: 600, margin: '12px 0' }}>{q.q}</div>
      {q.options.map((o, i) => {
        const cls = answered && i === q.answer ? 'correct' : answered && i === sel ? 'wrong' : sel === i ? 'sel' : '';
        return <button key={i} className={'opt ' + cls} disabled={answered} onClick={() => answer(i)}>{o}</button>;
      })}
      {answered && q.why && <div className="learn" style={{ marginTop: 8 }}><b>{sel === q.answer ? '✓' : '✗'}</b> {q.why}</div>}
      <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <button className="btn ghost sm" onClick={onCancel}>Abbandona</button>
        {answered && <button className="btn primary" onClick={next}>{last ? 'Vedi esito' : 'Prossima →'}</button>}
      </div>
    </Modal>
  );
}

export function Academy({ save, mutate, pushToast }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void; pushToast: (t: Omit<Toast, 'id'>) => void }) {
  const level = levelFromXp(save.xp);
  const [lesson, setLesson] = useState<string | null>(null); // course id being read
  const [exam, setExam] = useState<string | null>(null); // course id in exam

  const course = COURSES.find((c) => c.id === lesson) ?? COURSES.find((c) => c.id === exam);

  function buy(id: string) {
    const c = COURSES.find((x) => x.id === id)!;
    if (save.credits < c.cost || save.courses.includes(id) || level < c.minLevel) return;
    mutate((s) => { s.credits -= c.cost; });
    setLesson(id);
  }

  return (
    <div className="content">
      <div className="wrap">
        <h1 className="h1">🎓 Accademia</h1>
        <p className="sub">Studia la teoria: è ciò che trasforma uno script kiddie in un professionista. Ogni corso sblocca conoscenze usate nelle missioni.</p>
        <div className="chip credits-chip">💰 {save.credits} crediti</div>
        <div className="grid cols2">
          {COURSES.map((c) => {
            const owned = save.courses.includes(c.id);
            const skill = SKILLS.find((s) => s.id === c.skill)!;
            const canBuy = !owned && save.credits >= c.cost && level >= c.minLevel;
            return (
              <div className="card" key={c.id} style={{ borderLeft: `4px solid ${skill.color}` }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: 15 }}>{skill.icon} {c.title}</h3>
                  {owned && <span className="tag green">✓ completato</span>}
                </div>
                <div className="meta">{skill.name} · +{c.xp} XP al superamento</div>
                {!owned ? (
                  <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                    <span className="tag">💰 {c.cost} · Lv {c.minLevel}+</span>
                    <button className="btn sm primary" disabled={!canBuy} onClick={() => buy(c.id)}>
                      {level < c.minLevel ? `Serve Lv ${c.minLevel}` : save.credits < c.cost ? 'Crediti insuff.' : 'Iscriviti'}
                    </button>
                  </div>
                ) : (
                  <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn sm ghost" onClick={() => setLesson(c.id)}>Rileggi lezione</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {lesson && course && (
        <Modal wide onClose={() => setLesson(null)}>
          <h2>{course.title}</h2>
          {course.lesson.map((p, i) => (
            <p key={i} style={{ fontSize: 14.5, lineHeight: 1.6 }}>{p}</p>
          ))}
          <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            {save.courses.includes(course.id) ? (
              <button className="btn" onClick={() => setLesson(null)}>Chiudi</button>
            ) : (
              <button className="btn primary" onClick={() => { setExam(course.id); setLesson(null); }}>Fai il test finale →</button>
            )}
          </div>
        </Modal>
      )}

      {exam && course && (
        <QuizRun
          title={`Test: ${course.title}`}
          questions={course.quiz}
          pass={course.quiz.length}
          onCancel={() => setExam(null)}
          onFinish={(passed, correctN) => {
            setExam(null);
            if (passed) {
              mutate((s) => {
                if (!s.courses.includes(course.id)) s.courses.push(course.id);
                s.xp += course.xp;
                s.skills[course.skill] = Math.min(100, (s.skills[course.skill] ?? 0) + 10);
              });
              pushToast({ kind: 'info', icon: '🎓', title: 'Corso superato!', body: `${course.title} · +${course.xp} XP` });
            } else {
              pushToast({ kind: 'info', icon: '📕', title: 'Test non superato', body: `${correctN}/${course.quiz.length}. Rileggi e riprova (gratis).` });
              setLesson(course.id);
            }
          }}
        />
      )}
    </div>
  );
}

export function Certifications({ save, mutate, pushToast }: { save: SaveState; mutate: (fn: (s: SaveState) => void) => void; pushToast: (t: Omit<Toast, 'id'>) => void }) {
  const level = levelFromXp(save.xp);
  const [examCert, setExamCert] = useState<string | null>(null);
  const cert = CERTS.find((c) => c.id === examCert);

  const examQuestions = useMemo(() => {
    if (!cert) return [];
    const r = new RNG(randomSeed());
    const per = Math.ceil(cert.questions / cert.topics.length);
    let pool = cert.topics.flatMap((t) => pickQuiz(t, 3, per + 1, r));
    pool = r.shuffle(pool).slice(0, cert.questions);
    return pool.map((q) => ({ q: q.q, options: q.options, answer: q.answer, why: q.why }));
  }, [cert]);

  function startExam(id: string) {
    const c = CERTS.find((x) => x.id === id)!;
    if (save.credits < c.cost || save.certs.includes(id) || level < c.reqLevel) return;
    mutate((s) => { s.credits -= c.cost; });
    setExamCert(id);
  }

  return (
    <div className="content">
      <div className="wrap">
        <h1 className="h1">📜 Certificazioni</h1>
        <p className="sub">Gli esami ufficiali del mondo ROOTKID. Superarli sblocca le aziende più prestigiose. Costano crediti per tentativo: preparati bene!</p>
        <div className="chip credits-chip">💰 {save.credits} crediti</div>
        <div className="grid cols2">
          {CERTS.map((c) => {
            const owned = save.certs.includes(c.id);
            const canTry = !owned && save.credits >= c.cost && level >= c.reqLevel;
            return (
              <div className="card" key={c.id} style={{ borderLeft: '4px solid var(--yellow)' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3>{c.icon} {c.name}</h3>
                  {owned && <span className="tag green">✓ ottenuta</span>}
                </div>
                <p style={{ fontSize: 14, margin: '6px 0' }}>{c.desc}</p>
                <p className="dim" style={{ fontSize: 12 }}>🌍 {c.realWorld}</p>
                <div className="row" style={{ marginTop: 10 }}>
                  {c.topics.map((t) => <span className="tag" key={t}>{SKILLS.find((s) => s.id === t)?.icon}</span>)}
                </div>
                {!owned && (
                  <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                    <span className="tag">💰 {c.cost} · Lv {c.reqLevel}+ · {c.pass}/{c.questions}</span>
                    <button className="btn sm primary" disabled={!canTry} onClick={() => startExam(c.id)}>
                      {level < c.reqLevel ? `Serve Lv ${c.reqLevel}` : save.credits < c.cost ? 'Crediti insuff.' : 'Sostieni esame'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {cert && (
        <QuizRun
          title={`Esame: ${cert.name}`}
          questions={examQuestions}
          pass={cert.pass}
          onCancel={() => setExamCert(null)}
          onFinish={(_passed, correctN) => {
            const passed = correctN >= cert.pass;
            setExamCert(null);
            if (passed) {
              mutate((s) => {
                if (!s.certs.includes(cert.id)) s.certs.push(cert.id);
                s.reputation += 8;
                s.xp += 120;
              });
              pushToast({ kind: 'ach', icon: cert.icon, title: 'Certificazione ottenuta!', body: `${cert.name} · +8 rep` });
            } else {
              pushToast({ kind: 'info', icon: '❌', title: 'Esame non superato', body: `${correctN}/${cert.questions}. Studia di più e riprova.` });
            }
          }}
        />
      )}
    </div>
  );
}
