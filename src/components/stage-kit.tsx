import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Eye, ShieldAlert, User, Server, Building2, Cpu } from "lucide-react";

/* ----------------------------- timing helpers ----------------------------- */

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Normalised progress inside a sub-range of the scene. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Smoothstep easing. */
export const ease = (x: number) => x * x * (3 - 2 * x);
export const after = (t: number, x: number) => t >= x;

/* --------------------------------- atoms --------------------------------- */

export type Tone = "neutral" | "accent" | "ok" | "danger" | "muted";

const toneCls: Record<Tone, string> = {
  neutral: "border-line bg-surface text-ink",
  accent: "border-accent-line bg-accent-soft text-accent",
  ok: "border-ok/30 bg-ok-soft text-ok",
  danger: "border-danger/30 bg-danger-soft text-danger",
  muted: "border-line bg-sunken text-muted",
};

export function Label({ children }: { children: ReactNode }) {
  return <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{children}</span>;
}

export function Node({
  name,
  role,
  active,
  kind = "person",
}: {
  name: string;
  role: string;
  active?: boolean;
  kind?: "person" | "server" | "authority" | "machine";
}) {
  const Icon = kind === "server" ? Server : kind === "authority" ? Building2 : kind === "machine" ? Cpu : User;
  return (
    <div
      className={`character-node flex w-[78px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-all duration-300 sm:w-[96px] ${
        active ? "border-ink/25 bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.05)]" : "border-line bg-surface/50"
      }`}
    >
      <motion.span
        animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: "easeInOut" }}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${active ? "bg-ink text-canvas" : "bg-sunken text-muted"}`}
      >
        <Icon size={14} strokeWidth={1.8} />
      </motion.span>
      <span className="text-[12px] font-semibold leading-none tracking-tight">{name}</span>
      <span className="text-center text-[9px] uppercase leading-tight tracking-[0.1em] text-muted">{role}</span>
    </div>
  );
}

/**
 * The network link. The packet position is bound to scene progress, so
 * dragging the scrubber moves the packet exactly as a video frame would.
 */
export function Wire({
  t,
  packet,
  tone = "neutral",
  reverse,
  note,
  idle,
  copied,
}: {
  t: number;
  packet?: string;
  tone?: Tone;
  reverse?: boolean;
  note: string;
  idle?: boolean;
  /** Progress point at which the attacker takes a copy. */
  copied?: number;
}) {
  const travel = ease(seg(t, 0.08, 0.92));
  const x = reverse ? 92 - travel * 84 : 8 + travel * 84;
  const grabbed = copied !== undefined && travel >= copied;

  return (
    <div className="network-wire relative min-w-0 flex-1">
      <div className={`relative h-[46px] overflow-hidden rounded-lg border ${idle ? "border-dashed border-line" : "border-line"} bg-sunken/50`}>
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--color-line-strong)" strokeWidth="1.5" strokeDasharray="3 5" className={idle ? "" : "flowline"} />
        </svg>
        {packet && (
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-none"
            style={{ left: `${x}%` }}
          >
            <span className={`whitespace-nowrap rounded-md border px-2 py-1 font-mono text-[11px] shadow-[0_1px_3px_rgba(0,0,0,0.07)] ${toneCls[tone]}`}>
              {packet}
            </span>
          </div>
        )}
        {grabbed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-danger px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-canvas"
          >
            copied
          </motion.span>
        )}
      </div>
      <div className="mt-1 truncate text-center text-[10px] uppercase tracking-[0.11em] text-muted">{note}</div>
    </div>
  );
}

export function Attacker({
  mode,
  title,
  children,
}: {
  mode: "reads" | "blocked" | "tampers";
  title: string;
  children?: ReactNode;
}) {
  const hostile = mode !== "blocked";
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`attacker-card rounded-lg border px-3 py-2 ${hostile ? "border-danger/30 bg-danger-soft" : "border-line bg-surface"}`}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${hostile ? "bg-danger text-canvas" : "bg-sunken text-muted"}`}>
          {mode === "tampers" ? <ShieldAlert size={11} strokeWidth={2} /> : <Eye size={11} strokeWidth={2} />}
        </span>
        <span className="text-[12px] font-medium text-ink">Eliot</span>
        <span className={`text-[11px] ${hostile ? "text-danger" : "text-muted"}`}>{title}</span>
      </div>
      {children && <div className="mt-1.5">{children}</div>}
    </motion.div>
  );
}

export function Box({
  label,
  tone = "neutral",
  children,
  className = "",
}: {
  label: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg border px-3 py-2 ${toneCls[tone]} ${className}`}>
      <Label>{label}</Label>
      <div className="mt-0.5 min-w-0">{children}</div>
    </div>
  );
}

/** Reveals text progressively, driven by scene progress. */
export function TypeOut({ text, reveal, className = "" }: { text: string; reveal: number; className?: string }) {
  const n = Math.floor(text.length * clamp01(reveal));
  const shown = text.slice(0, n);
  const done = n >= text.length;
  return (
    <span className={`font-mono text-[13px] text-ink ${className}`}>
      {shown || "\u00a0"}
      {!done && <span className="ml-px inline-block h-[13px] w-[6px] -translate-y-px bg-ink align-middle caret-blink" />}
    </span>
  );
}

/** Byte grid for real cryptographic output. */
export function HexPanel({
  hex,
  reveal = 1,
  rows = 4,
  perRow = 12,
  diffAgainst,
  label,
  tone = "neutral",
}: {
  hex: string;
  reveal?: number;
  rows?: number;
  perRow?: number;
  diffAgainst?: string;
  label?: string;
  tone?: Tone;
}) {
  const pairs = hex.match(/.{1,2}/g) ?? [];
  const cap = rows * perRow;
  const visible = Math.floor(Math.min(pairs.length, cap) * clamp01(reveal));
  const cells = pairs.slice(0, cap);
  const otherPairs = diffAgainst ? (diffAgainst.match(/.{1,2}/g) ?? []) : null;

  return (
    <div className={`rounded-lg border px-2.5 py-2 ${toneCls[tone]}`}>
      {label && <Label>{label}</Label>}
      <div className={`mt-1 grid gap-x-1.5 gap-y-0.5 font-mono text-[10.5px] leading-[1.35] sm:text-[11px]`} style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0,1fr))` }}>
        {cells.map((p, i) => {
          const shown = i < visible;
          const differs = otherPairs ? otherPairs[i] !== p : false;
          return (
            <span
              key={i}
              className={`text-center transition-colors duration-150 ${
                !shown ? "text-transparent" : differs ? "rounded bg-danger/15 text-danger" : "text-ink"
              }`}
            >
              {shown ? p : "00"}
            </span>
          );
        })}
      </div>
      {pairs.length > cap && <div className="mt-1 text-[10px] text-muted">+{pairs.length - cap} more bytes</div>}
    </div>
  );
}

export function Meter({ value, caption }: { value: number; caption: string }) {
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <motion.div className="h-full rounded-full bg-ink" animate={{ width: `${clamp01(value / 100) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted">{caption}</div>
    </div>
  );
}

export function Verdict({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] ${ok ? "border-ok/30 bg-ok-soft text-ink" : "border-danger/30 bg-danger-soft text-ink"}`}
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ok ? "bg-ok" : "bg-danger"}`}>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
          {ok ? (
            <path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="#f4f2ed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M2.2 2.2l5.6 5.6M7.8 2.2 2.2 7.8" stroke="#f4f2ed" strokeWidth="1.9" strokeLinecap="round" />
          )}
        </svg>
      </span>
      <span className="min-w-0">{children}</span>
    </motion.div>
  );
}

/** Animated padlock. The shackle closes as progress goes to 1. */
export function Padlock({ p, tone = "ink" }: { p: number; tone?: "ink" | "danger" | "ok" }) {
  const closed = clamp01(p);
  const color = tone === "danger" ? "var(--color-danger)" : tone === "ok" ? "var(--color-ok)" : "var(--color-ink)";
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none" aria-hidden>
      <motion.path
        d="M7 13V9a6 6 0 0 1 12 0v4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ x: closed * 6, opacity: 0.35 + closed * 0.65 }}
        transition={{ duration: 0.2 }}
      />
      <rect x="4" y="13" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.8" />
      <circle cx="13" cy="19.5" r="1.6" fill={color} />
    </svg>
  );
}

export function KeyTag({ label, kind }: { label: string; kind: "secret" | "private" | "public" }) {
  if (kind === "public") {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-dashed border-line-strong bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-2">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="5.5" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M8.5 8H14M12 8v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] text-canvas">
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="5.5" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M8.5 8H14M12 8v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      {label}
    </span>
  );
}

/** Interactive controls docked under the animation. */
export function Controls({ children }: { children: ReactNode }) {
  return (
    <div
      onFocusCapture={() => window.dispatchEvent(new CustomEvent("lesson-pause"))}
      className="live-inputs flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-surface px-4 py-2.5 sm:px-6"
    >
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Live inputs</span>
      {children}
    </div>
  );
}

export function Field({ label, value, onChange, width = "w-40", mono = true }: { label: string; value: string; onChange: (v: string) => void; width?: string; mono?: boolean }) {
  return (
    <label className="live-field flex items-center gap-2">
      <span className="text-[11px] text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${width} rounded-md border border-line bg-canvas px-2 py-1 text-[12px] ${mono ? "font-mono" : ""} text-ink outline-none transition focus:border-ink/40 focus-ring`}
      />
    </label>
  );
}

export function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition focus-ring ${on ? "border-danger/40 bg-danger-soft text-danger" : "border-line bg-canvas text-ink-2 hover:bg-sunken"}`}
    >
      {children}
    </button>
  );
}

export function Computing({ what }: { what: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
      <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-line-strong border-t-ink" />
      <span className="text-[12px] text-muted">{what}</span>
    </div>
  );
}

export function StageFrame({ children, controls }: { children: ReactNode; controls?: ReactNode }) {
  return (
    <div className="stage-frame flex w-full flex-col">
      <div className="flex min-h-[286px] flex-1 flex-col justify-center gap-3 px-4 py-4 sm:px-6">{children}</div>
      {controls}
    </div>
  );
}
