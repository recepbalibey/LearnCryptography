import { useState } from "react";
import { ArrowRight, Check, Plus, Minus } from "lucide-react";
import { LESSONS, CHAIN, COMPARISON, QUIZ, FAQ } from "../data/curriculum";

export function Header({ done, onJump }: { done: boolean[]; onJump: () => void }) {
  const count = done.filter(Boolean).length;
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <a href="#top" className="flex items-center gap-2 text-[15px] font-semibold tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.6" stroke="#f4f2ed" strokeWidth="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="#f4f2ed" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Cryptography, visually
        </a>
        <nav className="ml-auto hidden items-center gap-5 text-[13px] text-muted md:flex">
          <a href="#lessons" className="transition hover:text-ink">Lessons</a>
          <a href="#compare" className="transition hover:text-ink">Comparison</a>
          <a href="#quiz" className="transition hover:text-ink">Quiz</a>
        </nav>
        <span className="hidden font-mono text-[11px] text-muted sm:block">{count}/5 done</span>
        <button onClick={onJump} className="rounded-lg bg-ink px-3.5 py-1.5 text-[13px] font-medium text-canvas transition hover:opacity-90 active:scale-[0.98] focus-ring">
          Continue lesson
        </button>
      </div>
    </header>
  );
}

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section id="top" className="border-b border-line">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <p className="text-[12px] uppercase tracking-[0.14em] text-muted">Watch. Predict. Try. Explain.</p>
        <h1 className="mt-3 max-w-[20ch] text-[38px] font-semibold leading-[1.05] tighter sm:text-[54px]">
          Watch encryption work, step by step.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">
          Aida sends a message, Emma receives it, and Eliot sits on the line trying to read or change it. Watch a narrated scene, predict the result, change an input, then connect what you saw to real code.
        </p>
        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-muted">
          The keys, ciphertext, digests and signatures on screen are real. Your browser computes them with
          AES-GCM, RSA-OAEP, SHA-256 and ECDSA while the animation plays, and you can edit the inputs mid scene.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button onClick={onStart} className="flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14px] font-medium text-canvas transition hover:opacity-90 active:scale-[0.98] focus-ring">
            Start lesson 01
            <ArrowRight size={15} strokeWidth={2} />
          </button>
          <a href="#lessons" className="rounded-xl border border-line px-5 py-3 text-[14px] font-medium text-ink transition hover:bg-sunken focus-ring">
            See the five lessons
          </a>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 md:grid-cols-5">
          {CHAIN.map((c) => (
            <div key={c.num} className="bg-surface px-4 py-3.5">
              <div className="font-mono text-[11px] text-muted">{c.num}</div>
              <div className="mt-1 text-[13px] font-semibold tight">{c.title}</div>
              <div className="mt-0.5 text-[12px] text-ok">{c.gives}</div>
              <div className="mt-2 text-[11px] text-muted">then: {c.gap}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LessonRail({
  current,
  done,
  onPick,
}: {
  current: number;
  done: boolean[];
  onPick: (i: number) => void;
}) {
  return (
    <section id="lessons" className="mx-auto max-w-5xl scroll-mt-16 px-5 pt-12">
      <h2 className="text-[22px] font-semibold tighter">The chain</h2>
      <p className="mt-1 max-w-[70ch] text-[14px] text-muted">
        Start with shared keys, then explore public keys, hashes, signatures and trust. Each lesson includes an animation, an experiment and runnable code.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {LESSONS.map((l, i) => (
          <button
            key={l.id}
            onClick={() => onPick(i)}
            className={`rounded-xl border px-3.5 py-3 text-left transition focus-ring ${
              i === current ? "border-ink bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "border-line bg-surface/60 hover:border-line-strong hover:bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted">{l.num}</span>
              {done[i] && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ok">
                  <Check size={10} strokeWidth={3} className="text-canvas" />
                </span>
              )}
            </div>
            <div className="mt-1.5 text-[13px] font-semibold leading-tight tight">{l.title}</div>
            <div className="mt-1 text-[12px] leading-snug text-muted">{l.oneLine}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Comparison() {
  return (
    <section id="compare" className="mx-auto max-w-5xl scroll-mt-16 px-5 py-14">
      <h2 className="text-[22px] font-semibold tighter">All five side by side</h2>
      <p className="mt-1 text-[14px] text-muted">The distinctions people mix up most often.</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-muted">
              <th className="px-4 py-3 font-medium">Tool</th>
              <th className="px-4 py-3 font-medium">Keys</th>
              <th className="px-4 py-3 font-medium">Provides</th>
              <th className="px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3 font-medium">Remaining weakness</th>
              <th className="px-4 py-3 font-medium">Where you meet it</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((r) => (
              <tr key={r.name} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-ink-2">{r.keys}</td>
                <td className="px-4 py-3 text-ink-2">{r.does}</td>
                <td className="px-4 py-3 text-ink-2">{r.speed}</td>
                <td className="px-4 py-3 text-ink-2">{r.breaks}</td>
                <td className="px-4 py-3 text-muted">{r.real}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {[
          ["Encrypting", "Lock with the recipient's public key, open with their private key."],
          ["Signing", "Sign with your private key. Others verify the message and signature with your public key."],
          ["Hashing", "No key at all, and no way back. Recompute and compare."],
        ].map(([t, d]) => (
          <div key={t} className="bg-surface px-4 py-3.5">
            <div className="text-[13px] font-semibold tight">{t}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Recap() {
  return (
    <section className="border-y border-line bg-sunken/40">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-[22px] font-semibold tighter">How the ideas meet in TLS 1.3</h2>
        <p className="mt-1 max-w-[70ch] text-[14px] text-muted">A simplified view of a typical full handshake with server authentication. Key agreement and authentication have different jobs.</p>
        <ol className="mt-6 space-y-px overflow-hidden rounded-xl border border-line bg-line">
          {[
            ["Temporary keys agree a shared secret", "Ephemeral Diffie-Hellman key agreement derives secrets without sending them across the line."],
            ["The server presents its certificate chain", "The browser checks the domain, dates and chain to a trusted root."],
            ["The server signs the handshake", "Its certified key verifies this signature. It does not encrypt the traffic key."],
            ["Both sides check the handshake", "Hashes, key derivation and a keyed MAC bind the exchange together."],
            ["Authenticated encryption protects traffic", "AES-GCM or ChaCha20-Poly1305 hides data and rejects changed records. A bare hash is not enough."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4 bg-surface px-5 py-4">
              <span className="font-mono text-[12px] text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="text-[14px] font-medium tight">{t}</div>
                <div className="mt-0.5 text-[13px] text-muted">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Quiz() {
  const [picked, setPicked] = useState<(number | null)[]>(Array(QUIZ.length).fill(null));
  const [checked, setChecked] = useState(false);
  const score = picked.filter((p, i) => p === QUIZ[i].answer).length;
  const complete = picked.every((p) => p !== null);

  return (
    <section id="quiz" className="mx-auto max-w-5xl scroll-mt-16 px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tighter">Five questions, one per lesson</h2>
          <p className="mt-1 text-[14px] text-muted">Answers appear once you submit.</p>
        </div>
        {checked && <span className="font-mono text-[13px] text-ink">{score} of 5 correct</span>}
      </div>

      <div className="mt-5 space-y-2">
        {QUIZ.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-line bg-surface px-5 py-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-muted">{q.lesson}</span>
              <p className="text-[14px] font-medium tight">{q.q}</p>
            </div>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {q.options.map((op, oi) => {
                const sel = picked[qi] === oi;
                const right = checked && oi === q.answer;
                const wrong = checked && sel && oi !== q.answer;
                return (
                  <button
                    key={oi}
                    disabled={checked}
                    onClick={() => setPicked((p) => p.map((v, i) => (i === qi ? oi : v)))}
                    className={`rounded-lg border px-3 py-2 text-left text-[13px] transition focus-ring ${
                      right
                        ? "border-ok/40 bg-ok-soft text-ink"
                        : wrong
                          ? "border-danger/40 bg-danger-soft text-ink"
                          : sel
                            ? "border-ink bg-sunken text-ink"
                            : "border-line bg-surface text-ink-2 hover:border-line-strong"
                    }`}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
            {checked && <p className="mt-2 text-[13px] leading-relaxed text-muted">{q.explain}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!checked ? (
          <button
            disabled={!complete}
            onClick={() => setChecked(true)}
            className="rounded-lg bg-ink px-4 py-2.5 text-[13px] font-medium text-canvas transition hover:opacity-90 disabled:opacity-30 focus-ring"
          >
            {complete ? "Submit answers" : `${picked.filter((p) => p !== null).length} of 5 answered`}
          </button>
        ) : (
          <button
            onClick={() => {
              setPicked(Array(QUIZ.length).fill(null));
              setChecked(false);
            }}
            className="rounded-lg border border-line px-4 py-2.5 text-[13px] font-medium text-ink transition hover:bg-sunken focus-ring"
          >
            Reset
          </button>
        )}
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-5xl px-5 pb-16">
      <h2 className="text-[22px] font-semibold tighter">Common confusions</h2>
      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
        {FAQ.map((f, i) => (
          <div key={f.q} className="border-b border-line last:border-0">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left focus-ring">
              <span className="flex-1 text-[14px] font-medium tight">{f.q}</span>
              {open === i ? <Minus size={15} strokeWidth={2} className="text-muted" /> : <Plus size={15} strokeWidth={2} className="text-muted" />}
            </button>
            {open === i && <p className="max-w-[80ch] px-5 pb-4 text-[13px] leading-relaxed text-ink-2">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}


