import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Lightbulb, Pause, Play, SlidersHorizontal } from 'lucide-react';
import type { Lesson } from '../data/curriculum';
import { STAGES } from './lessons';
import { subtleAvailable } from '../lib/webcrypto';

const sceneSeconds = (text: string) => Math.max(9, text.split(/\s+/).length / 2.4 + 1);

export function Player({ lesson, scene, active, onSceneChange, onFinish, onPractice }: { lesson: Lesson; scene: number; active: boolean; onSceneChange: (scene: number, automatic?: boolean) => void; onFinish: () => void; onPractice: () => void }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(active && subtleAvailable);
  const [speed, setSpeed] = useState(1);
  const manuallyPaused = useRef(false);
  const progress = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const count = lesson.scenes.length;
  const current = lesson.scenes[scene];
  const Stage = STAGES[lesson.id];
  const seconds = sceneSeconds(current.narration);

  const seek = useCallback((next: number) => {
    onSceneChange(Math.max(0, Math.min(count - 1, next)));
    progress.current = 0; setT(0);
    setPlaying(active && subtleAvailable && !manuallyPaused.current);
  }, [count, active, onSceneChange]);
  const toggle = () => {
    manuallyPaused.current = playing;
    if (!playing && progress.current >= 1) { progress.current = 0; setT(0); }
    setPlaying(!playing);
  };

  useEffect(() => {
    progress.current = 0; setT(0);
    setPlaying(active && subtleAvailable && !manuallyPaused.current);
  }, [scene, active]);

  useEffect(() => {
    if (!playing) return;
    let frame: number;
    let previous = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, progress.current + Math.min((now - previous) / 1000, .1) * speed / seconds);
      previous = now; progress.current = next; setT(next);
      if (next >= 1) {
        setPlaying(false);
        if (scene === count - 1) onFinish();
        onSceneChange((scene + 1) % count, true);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, seconds, scene, count, onFinish, onSceneChange]);

  useEffect(() => {
    const pause = () => setPlaying(false);
    const visibility = () => setPlaying(!document.hidden && active && subtleAvailable && !manuallyPaused.current);
    window.addEventListener('lesson-pause', pause); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('lesson-pause', pause); document.removeEventListener('visibilitychange', visibility); };
  }, [active]);

  return <div className="lesson-experience" data-lesson-player ref={root} tabIndex={0} aria-label={`${lesson.title} animation player`} onKeyDown={event => {
    const target = event.target as HTMLElement;
    if (target.closest('input,select,textarea,button,a') || target.isContentEditable) return;
    if (event.code === 'Space') { event.preventDefault(); toggle(); }
    if (event.code === 'ArrowRight') { event.preventDefault(); seek(scene + 1); }
    if (event.code === 'ArrowLeft') { event.preventDefault(); seek(scene - 1); }
  }}>
    <div className="scene-topbar">
      <div className="scene-location"><span className="scene-badge">{String(scene + 1).padStart(2,'0')}</span><div><span>SCENE {scene + 1} OF {count}</span><strong>{current.label}</strong></div></div>
      <div className="scene-actions"><button className="scene-back" disabled={scene === 0} onClick={() => seek(scene - 1)} aria-label="Previous scene"><ArrowLeft size={16}/></button><button className="scene-next" onClick={() => scene < count - 1 ? seek(scene + 1) : onPractice()}>{scene < count - 1 ? 'Next scene' : 'Try it yourself'}<ArrowRight size={16}/></button></div>
    </div>
    <button className="mobile-explanation-jump" onClick={() => root.current?.querySelector<HTMLElement>('.scene-guide')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}>Read this scene’s explanation below <span aria-hidden="true">↓</span></button>
    <div className="experience-grid">
      <div className="animation-panel">
        <div className="animation-meta"><span><span className="live-dot"/> INTERACTIVE SIMULATION</span><span>CHANGE THE INPUTS. SEE WHAT HAPPENS.</span></div>
        <div className="animation-canvas">
          {subtleAvailable ? <Stage scene={scene} t={t} /> : <div role="alert" className="crypto-alert">Open this website on localhost or HTTPS to run real cryptography.</div>}
        </div>
        <div className="playback-controls">
          <button className="play-button" onClick={toggle} aria-label={playing ? 'Pause animation' : 'Resume animation'} disabled={!subtleAvailable}>{playing ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}<span>{playing ? 'Pause' : 'Resume'}</span></button>
          <input type="range" aria-label="Scene progress" min={0} max={100} value={Math.round(t * 100)} onChange={event => { const value = Number(event.target.value) / 100; progress.current = value; setT(value); manuallyPaused.current = true; setPlaying(false); }} style={{ '--progress':`${t * 100}%` } as React.CSSProperties} />
          <span className="scene-progress-text">{Math.round(t * 100)}%</span>
          <label className="speed-select"><span className="sr-only">Animation speed</span><select value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value={.75}>0.75×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label>
        </div>
        <div className="playback-hint"><SlidersHorizontal size={12}/><span>Scenes play automatically and loop. Pause to read or experiment.</span></div>
      </div>
      <aside className="scene-guide" aria-label="Scene explanation">
        <div className="guide-label"><Lightbulb size={15}/><span>WHAT’S HAPPENING?</span></div>
        <h2>{current.label}<span>.</span></h2>
        <p className="scene-explanation">{current.narration}</p>
        <div className="takeaway"><span>THE IDEA TO KEEP</span><p>{current.caption}</p></div>
        <button className="guide-practice" onClick={onPractice}>Test this idea<ArrowUpRightIcon/></button>
      </aside>
    </div>
    <div className="scene-path" aria-label="Scenes">
      {lesson.scenes.map((item,i) => <button key={item.label} className={`${scene === i ? 'current' : ''} ${i < scene ? 'visited' : ''}`} aria-current={scene === i ? 'step' : undefined} onClick={() => seek(i)}><span>{i < scene ? <Check size={11}/> : String(i + 1).padStart(2,'0')}</span><strong>{item.label}</strong>{i < count - 1 && <ChevronRight size={12} className="path-arrow"/>}</button>)}
    </div>
  </div>;
}
function ArrowUpRightIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
