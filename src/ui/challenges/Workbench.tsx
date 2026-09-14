import React, { useState } from 'react';
import { TOOLS, ToolId, applyTool, caesarAll, toolForMethod } from '../../game/decoders';

// Banco di lavoro stile CyberChef: prendi il testo cifrato, scegli un'operazione, ottieni l'output.
export function Workbench({
  ciphertext,
  method,
  suggestedKey,
  onUseResult,
}: {
  ciphertext: string;
  method: string;
  suggestedKey?: string;
  onUseResult: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(ciphertext);
  const [tool, setTool] = useState<ToolId>(() => toolForMethod(method));
  const [key, setKey] = useState(suggestedKey ?? '');
  const [output, setOutput] = useState('');
  const [multi, setMulti] = useState<{ shift: number; text: string }[] | null>(null);

  const toolDef = TOOLS.find((t) => t.id === tool)!;

  function run() {
    if (toolDef.multi) {
      setMulti(caesarAll(input));
      setOutput('');
    } else {
      setMulti(null);
      setOutput(applyTool(tool, input, key));
    }
  }

  return (
    <div className="card" style={{ marginTop: 12, borderColor: open ? 'var(--purple)' : undefined }}>
      <button className="btn sm ghost" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen((o) => !o)}>
        🛠️ {open ? '▾' : '▸'} Banco di lavoro — strumenti di decodifica
      </button>
      {open && (
        <div className="fadein" style={{ marginTop: 12 }}>
          <div className="dim" style={{ fontSize: 12, marginBottom: 4 }}>1) Testo da decodificare (già compilato col cifrato — puoi modificarlo o incollare l'output per concatenare):</div>
          <textarea className="inp mono" style={{ minHeight: 54, resize: 'vertical' }} value={input} onChange={(e) => setInput(e.target.value)} />

          <div className="dim" style={{ fontSize: 12, margin: '10px 0 4px' }}>2) Scegli l'operazione:</div>
          <div className="row" style={{ gap: 8 }}>
            <select className="inp" style={{ maxWidth: 320 }} value={tool} onChange={(e) => setTool(e.target.value as ToolId)}>
              {TOOLS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {toolDef.needsKey && (
              <input className="inp mono" style={{ maxWidth: 160 }} placeholder={toolDef.keyLabel} value={key} onChange={(e) => setKey(e.target.value)} />
            )}
            <button className="btn primary sm" onClick={run}>Applica →</button>
          </div>

          {output && !toolDef.multi && (
            <div className="fadein" style={{ marginTop: 12 }}>
              <div className="dim" style={{ fontSize: 12, marginBottom: 4 }}>Risultato:</div>
              <div className="mono" style={{ background: '#05090d', border: '1px solid var(--green-dim)', borderRadius: 8, padding: 10, wordBreak: 'break-all', color: 'var(--green)' }}>{output}</div>
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn sm" onClick={() => setInput(output)}>⬆ Usa come nuovo input</button>
                <button className="btn sm primary" onClick={() => onUseResult(output)}>Usa come risposta</button>
              </div>
            </div>
          )}

          {multi && (
            <div className="fadein" style={{ marginTop: 12 }}>
              <div className="dim" style={{ fontSize: 12, marginBottom: 4 }}>Tutti gli spostamenti — trova quello leggibile e usalo:</div>
              <div className="mono" style={{ maxHeight: 220, overflowY: 'auto', background: '#05090d', border: '1px solid var(--border)', borderRadius: 8, padding: 8, fontSize: 12.5 }}>
                {multi.map((m) => (
                  <div key={m.shift} className="row" style={{ justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
                    <span style={{ wordBreak: 'break-all' }}><span className="dim">#{m.shift}</span> {m.text}</span>
                    <button className="btn sm ghost" style={{ flexShrink: 0 }} onClick={() => onUseResult(m.text)}>usa</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dim" style={{ fontSize: 11.5, marginTop: 10 }}>
            💡 Questo è esattamente ciò che fanno strumenti reali come <b>CyberChef</b>: riconosci il metodo, applichi la trasformazione, leggi il risultato.
          </div>
        </div>
      )}
    </div>
  );
}
