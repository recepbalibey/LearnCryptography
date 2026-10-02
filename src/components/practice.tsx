import { useRef, useState } from 'react';
import { Check, Code2, FlaskConical, BookOpen, Play, Copy } from 'lucide-react';
import type { Lesson } from '../data/curriculum';
import { PRACTICE, runExample } from '../data/practice';

export function PracticePanel({ lesson, onComplete, activeTab }: { lesson: Lesson; onComplete: () => void; activeTab?: 'theory' | 'experiment' | 'code' }) {
  const content = PRACTICE[lesson.id];
  const [localTab, setTab] = useState<'theory' | 'experiment' | 'code'>('experiment');
  const tab = activeTab ?? localTab;
  const [choice, setChoice] = useState<number | null>(null);
  const [input, setInput] = useState(content.input);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const running = useRef(false);
  const run = async () => {
    if (running.current) return;
    running.current = true;
    window.dispatchEvent(new Event('lesson-pause'));
    setBusy(true);
    try { setResult(JSON.stringify(await runExample(lesson.id, input), null, 2)); }
    catch (error) { setResult(error instanceof Error ? error.message : 'The example failed.'); }
    finally { running.current = false; setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(content.code); setCopied(true); setCopyError(''); }
    catch { setCopyError('Copy is unavailable here. Select the code to copy it.'); }
  };
  return <section className="practice-panel overflow-hidden rounded-2xl border border-line bg-surface" aria-label="Practice this lesson">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div><p className="text-[11px] uppercase tracking-[0.12em] text-accent">Make it stick</p><h2 className="mt-1 text-[20px] font-semibold">{tab === 'theory' ? 'Understand the idea.' : tab === 'experiment' ? 'Your turn to break things.' : 'Real code. Real results.'}</h2></div>
      <div hidden={Boolean(activeTab)} className="practice-local-tabs flex gap-1 rounded-lg bg-sunken p-1" role="group" aria-label="Learning sections">
        {([['theory', 'Theory', BookOpen], ['experiment', 'Try it', FlaskConical], ['code', 'Code', Code2]] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id} className={`focus-ring flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] ${tab === id ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`}><Icon size={14} />{label}</button>)}
      </div>
    </div>
    <div className="p-5 sm:p-6">
      {tab === 'theory' && <div className="space-y-5">
        <p className="max-w-[76ch] text-[15px] leading-relaxed text-ink-2">{content.idea}</p>
        <dl className="grid gap-3 sm:grid-cols-3">{content.terms.map(([term, definition]) => <div key={term} className="rounded-xl border border-line bg-canvas p-4"><dt className="text-[14px] font-semibold">{term}</dt><dd className="mt-1 text-[13px] leading-relaxed text-muted">{definition}</dd></div>)}</dl>
        <div className="rounded-xl border border-warn/25 bg-warn-soft p-4"><h3 className="text-[13px] font-semibold">Where the demo stops</h3><p className="mt-1 text-[13px] leading-relaxed text-ink-2">{content.caution}</p></div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">{content.sources.map(source => <a key={source.url} className="focus-ring text-accent underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
      </div>}
      {tab === 'experiment' && <div className="grid gap-6 md:grid-cols-2">
        <div><h3 className="text-[16px] font-semibold">{lesson.labTitle}</h3><p className="mt-1 text-[13px] text-muted">Open Animation to use the live controls. Come back here to check your prediction.</p><ol className="mt-4 space-y-3">{content.experiment.map((step, i) => <li key={step} className="flex gap-3 text-[14px] leading-relaxed text-ink-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[11px]">{i + 1}</span>{step}</li>)}</ol></div>
        <div className="rounded-xl border border-line bg-canvas p-4"><p className="text-[11px] uppercase tracking-[0.1em] text-muted">Predict before you check</p><h3 className="mt-2 text-[14px] font-semibold leading-relaxed">{content.question}</h3><div className="mt-3 space-y-2">{content.choices.map((text, i) => <button key={text} onClick={() => { setChoice(i); if (i === content.answer) onComplete(); }} aria-pressed={choice === i} className={`focus-ring w-full rounded-lg border px-3 py-2.5 text-left text-[13px] ${choice === i ? (i === content.answer ? 'border-ok bg-ok-soft' : 'border-danger bg-danger-soft') : 'border-line bg-surface hover:border-line-strong'}`}>{text}</button>)}</div>{choice !== null && <p role="status" className="mt-3 text-[13px] leading-relaxed text-ink-2"><strong>{choice === content.answer ? 'Correct. ' : 'Try again. '}</strong>{content.explanation}</p>}</div>
      </div>}
      {tab === 'code' && <div className="space-y-4">
        <p className="text-[14px] text-ink-2">Run this exact JavaScript in your browser. Change the input and compare the output. No server is needed.</p>
        <div className="flex flex-wrap items-end gap-3"><label className="flex w-full min-w-0 flex-col gap-1 text-[12px] text-muted sm:w-auto sm:flex-1">Input<input disabled={busy} value={input} maxLength={2000} onChange={event => { setInput(event.target.value); setResult(''); }} className="focus-ring w-full rounded-lg border border-line bg-canvas px-3 py-2 text-[14px] text-ink" /></label><button onClick={run} disabled={busy} className="focus-ring flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-canvas disabled:opacity-50"><Play size={14} />{busy ? 'Running...' : 'Run example'}</button><button onClick={copy} className="focus-ring flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px]">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy code'}</button></div>
        {copyError && <p role="status" className="text-[13px] text-danger">{copyError}</p>}
        <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-[12px] leading-relaxed text-canvas"><code>{content.code}</code></pre>
        <div className="rounded-xl border border-line bg-canvas p-4" aria-live="polite"><h3 className="text-[11px] uppercase tracking-[0.1em] text-muted">Output</h3><pre className="mt-2 whitespace-pre-wrap break-all text-[12px] leading-relaxed">{busy ? 'Computing...' : result || 'Run the example to see real results here.'}</pre></div>
        <p className="text-[12px] leading-relaxed text-muted">{content.caution}</p>
      </div>}
    </div>
  </section>;
}
