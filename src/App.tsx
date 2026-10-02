import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Code2, Fingerprint, FlaskConical, KeyRound, Layers3, LockKeyhole, Menu, Moon, Sun, Play, ShieldCheck, Sparkles, X } from 'lucide-react';
import { LESSONS } from './data/curriculum';
import { Comparison, Recap, Quiz, Faq } from './components/sections';
import { Player } from './components/player';
import { PracticePanel } from './components/practice';
import logo from '../logo.png';
import { readRoute, routeSearch, type Activity as View, type LessonRoute } from './lib/navigation';

const STORAGE = 'crypto-lessons-progress';
const ICONS = [LockKeyhole, KeyRound, Fingerprint, ShieldCheck, BookOpen];
const COLORS = ['#b7a2ff', '#a9e7cb', '#ffd58e', '#ffacc8', '#9ac9ff'];
const THEME_STORAGE = 'cipher-theme';

export default function App() {
  const [initial] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      return {
        index: Number.isInteger(saved.index) ? Math.min(LESSONS.length - 1, Math.max(0, saved.index)) : 0,
        done: Array.isArray(saved.done) && saved.done.length === LESSONS.length ? saved.done.map((v: unknown) => v === true) : LESSONS.map(() => false),
      };
    } catch { return { index: 0, done: LESSONS.map(() => false) }; }
  });
  const [route, setRoute] = useState(() => readRoute(window.location.search, LESSONS, initial.index));
  const { index, view, library, scene } = route;
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [done, setDone] = useState<boolean[]>(initial.done);
  const [menu, setMenu] = useState(false);
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width:1024px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width:1024px)');
    const update = () => setDesktop(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); document.getElementById('open-lessons')?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menu]);
  const lesson = LESSONS[index];
  const count = done.filter(Boolean).length;
  const Icon = ICONS[index];

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify({ index, done })); } catch { /* Storage is optional. */ }
  }, [index, done]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_STORAGE, theme); } catch { /* Theme works without storage. */ }
  }, [theme]);

  useEffect(() => {
    // Give the first view a URL without adding an extra Back step.
    const initialRoute = readRoute(window.location.search, LESSONS, initial.index);
    history.replaceState(history.state, '', window.location.pathname + routeSearch(initialRoute, LESSONS) + window.location.hash);
    const restore = () => {
      window.dispatchEvent(new Event('lesson-pause'));
      setRoute(readRoute(window.location.search, LESSONS, initial.index));
      setMenu(false);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [initial.index]);

  const navigate = (next: LessonRoute, replace = false) => {
    window.dispatchEvent(new Event('lesson-pause'));
    if (routeSearch(next, LESSONS) !== routeSearch(route, LESSONS)) {
      history[replace ? 'replaceState' : 'pushState'](null, '', window.location.pathname + routeSearch(next, LESSONS));
      setRoute(next);
    }
    setMenu(false);
  };
  const pick = (i: number) => {
    navigate({ index: i, view: 'animation', library: false, scene: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const changeView = (next: View) => navigate({ ...route, view: next });
  const showLibrary = (next: boolean) => {
    navigate({ ...route, library: next });
    window.scrollTo({ top: 0 });
  };
  const markDone = useCallback(() => {
    setDone(d => d[index] ? d : d.map((v, i) => i === index ? true : v));
  }, [index]);

  return <div className="app-shell">
    <aside id="course-menu" inert={!desktop && !menu} className={`course-sidebar ${menu ? 'is-open' : ''}`} aria-label="Course navigation">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); showLibrary(false); }}>
        <img src={logo} alt="Cipher book and keyhole logo" />
        <span>CIPHER<span className="brand-subtitle">A LITTLE LESS MYSTERY.</span></span>
      </a>
      <button className="mobile-close icon-button" aria-label="Close lessons" onClick={() => setMenu(false)}><X size={20} /></button>
      <div className="course-label"><span>YOUR LEARNING PATH</span><span>5 LESSONS</span></div>
      <h2 className="course-title">Cryptography<br />starts here.</h2>
      <p className="sidebar-intro">Five ideas. Real experiments.<br />Zero magic.</p>
      <nav className="course-nav" aria-label="Lessons">
        {LESSONS.map((item, i) => {
          const ItemIcon = ICONS[i];
          return <button key={item.id} onClick={() => pick(i)} aria-current={!library && index === i ? 'step' : undefined} className={`lesson-link ${!library && index === i ? 'active' : ''}`} style={{ '--lesson-color': COLORS[i] } as React.CSSProperties}>
            <span className="lesson-icon"><ItemIcon size={18} /></span>
            <span className="lesson-link-copy"><span className="lesson-number">LESSON {item.num}</span><span>{item.title}</span></span>
            {done[i] ? <Check size={15} className="lesson-check" aria-label="Completed" /> : <ChevronRight size={15} className="lesson-chevron" />}
          </button>;
        })}
      </nav>
      <button className={`library-link ${library ? 'active' : ''}`} onClick={() => showLibrary(true)}><Layers3 size={17} /> The bigger picture <ArrowUpRight size={15} /></button>
      <div className="sidebar-bottom">
        <div className="progress-label"><span>Your progress</span><strong>{count}<span> / 5</span></strong></div>
        <div className="course-progress"><span style={{ width: `${count * 20}%` }} /></div>
        <p>Small steps. Big understanding.</p>
        <div className="maker-note"><span className="status-dot" /> MADE FOR CURIOUS MINDS</div>
      </div>
    </aside>
    {menu && <button aria-label="Close lesson menu" className="menu-backdrop" onClick={() => setMenu(false)} />}
    <main className="main-workspace">
      <header className="workspace-header">
        <button id="open-lessons" aria-expanded={menu} aria-controls="course-menu" className="mobile-menu icon-button" onClick={() => setMenu(true)} aria-label="Open lessons"><Menu size={20} /></button>
        <span className="mobile-brand"><img src={logo} alt="Cipher logo"/>CIPHER</span>
        <div className="header-crumb"><span>THE CRYPTO PLAYGROUND</span><ChevronRight size={13} /><strong>{library ? 'The bigger picture' : `Lesson ${lesson.num}`}</strong></div>
        <span className="header-note"><span className="status-dot" /> Learn by doing</span>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <button className="header-library" onClick={() => showLibrary(!library)}>{library ? 'Back to lesson' : 'Course guide'}<ArrowUpRight size={14} /></button>
      </header>
      <div className="workspace-content">
        {library ? <div className="resource-page">
          <div className="eyebrow"><Layers3 size={14} /> CONNECT THE DOTS</div><h1>The bigger picture<span>.</span></h1><p className="page-subtitle">See how the tools fit together, then test what you know.</p>
          <div className="resource-jumps"><a href="#compare">Compare the tools <ArrowRight size={15}/></a><a href="#quiz">Take the quiz <ArrowRight size={15}/></a></div>
          <Comparison /><Recap /><Quiz /><Faq />
        </div> : <>
          <div className="lesson-heading">
            <div><div className="eyebrow"><Sparkles size={14} /> CRACK THE IDEA. NOT JUST THE CODE.</div><h1>{lesson.title}<span>.</span></h1><p className="page-subtitle">{lesson.question}</p></div>
            <div className="lesson-heading-icon" style={{background:COLORS[index]}}><Icon size={34} strokeWidth={1.5} /></div>
          </div>
          <div className="learning-toolbar">
            <div className="learning-tabs" role="tablist" aria-label="Lesson activities">
              {([['animation', 'Animation', Play], ['theory', 'Theory', BookOpen], ['experiment', 'Try it', FlaskConical], ['code', 'Code', Code2]] as const).map(([id, label, TabIcon]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={view === id} aria-controls={`panel-${id}`} onClick={() => changeView(id)} onKeyDown={event => {
                const order: View[] = ['animation','theory','experiment','code'];
                const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
                if (!offset) return;
                event.preventDefault(); const next = order[(order.indexOf(id) + offset + 4) % 4]; changeView(next); document.getElementById(`tab-${next}`)?.focus();
              }} tabIndex={view === id ? 0 : -1}><TabIcon size={16} /><span>{label}</span></button>)}
            </div>
            <div className="lesson-switcher"><button onClick={() => pick(index - 1)} disabled={index === 0} aria-label="Previous lesson"><ArrowLeft size={16}/></button><span>Lesson <strong>{index + 1}</strong> of 5</span><button onClick={() => pick(index + 1)} disabled={index === 4} aria-label="Next lesson"><ArrowRight size={16}/></button></div>
          </div>
          <div id="panel-animation" role="tabpanel" aria-labelledby="tab-animation" hidden={view !== 'animation'}>
            <Player key={`player-${lesson.id}`} lesson={lesson} scene={scene} active={view === 'animation'} onSceneChange={(next, automatic) => navigate({ ...route, scene: next }, automatic)} onFinish={markDone} onPractice={() => changeView('experiment')} />
          </div>
          <div hidden={view === 'animation'} id={`panel-${view === 'animation' ? 'experiment' : view}`} role="tabpanel" aria-labelledby={`tab-${view === 'animation' ? 'experiment' : view}`}>
            <PracticePanel key={`practice-${lesson.id}`} lesson={lesson} onComplete={markDone} activeTab={view === 'animation' ? 'experiment' : view} />
          </div>
          <div className="lesson-footer"><div><span className="footer-spark"><Sparkles size={16}/></span><p><strong>{view === 'animation' ? 'Don’t just watch. Change something.' : 'Make the idea yours.'}</strong><span>{view === 'animation' ? 'Edit the live inputs, then open Try it to test your thinking.' : 'Predict the result before you run the experiment.'}</span></p></div><button className="next-lesson-link" onClick={() => index < 4 ? pick(index + 1) : showLibrary(true)}>{index < 4 ? <><span>UP NEXT</span>{LESSONS[index + 1].title}</> : <><span>YOU HAVE THE TOOLS</span>Test your knowledge</>}<ArrowRight size={18}/></button></div>
        </>}
      </div>
    </main>
  </div>;
}
