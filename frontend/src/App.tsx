import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import CreateSession from './components/CreateSession';
import SessionView from './components/SessionView';
import Card3D from './components/Card3D';
import TweaksPanel, { initTweaks, applyTheme } from './components/TweaksPanel';
import { Icon, ICONS } from './components/Icons';
import './App.css';

// Ensure tokens/theme are applied ASAP, before first render paints
initTweaks();

type Theme = 'dark' | 'light';

const Topbar: React.FC<{
  theme: Theme;
  onOpenTweaks: () => void;
  onToggleTheme: () => void;
}> = ({ theme, onOpenTweaks, onToggleTheme }) => {
  const goHome = () => { window.location.assign('/'); };

  return (
    <div className="topnav">
      <button className="brand" onClick={goHome} aria-label="Planning Poker home">
        <div className="brand-mark">P</div>
        <span>Planning Poker</span>
      </button>
      <div className="right">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          aria-label="Toggle theme"
        >
          <Icon name={theme === 'dark' ? ICONS.sun : ICONS.moon} size={16} />
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onOpenTweaks}
          title="Tweaks"
          aria-label="Open tweaks"
        >
          <Icon name={ICONS.sliders} size={16} />
        </button>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionInput, setSessionInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const extractSessionId = (input: string): string => {
    const urlMatch = input.match(/\/session\/([a-zA-Z0-9-]+)/);
    if (urlMatch) return urlMatch[1];
    return input.trim();
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    const sessionId = extractSessionId(sessionInput);
    if (!sessionId) {
      setJoinError('Please enter a valid session URL or ID');
      return;
    }
    navigate(`/session/${sessionId}`);
  };

  return (
    <section className="landing">
      <div>
        <div className="eyebrow">
          <Icon name={ICONS.sparkle} size={11} /> Agile estimation, done right
        </div>
        <h1>
          Estimate together,<br />
          <em>deliver better.</em>
        </h1>
        <p className="lede">
          Spin up a planning poker session and invite your team to score user stories in real time,
          with interactive cards, live reactions, and a clean, quiet interface that stays out of the way.
        </p>

        <div className="actions">
          <a href="/create-session" className="btn btn-primary btn-lg">
            <Icon name={ICONS.plus} size={16} />
            <span>Create session</span>
          </a>
        </div>

        <form onSubmit={handleJoinSession} className="join-inline" aria-label="Join by link or ID">
          <Icon name={ICONS.link} size={14} style={{ color: 'var(--fg-dim)', marginLeft: 8 }} />
          <input
            type="text"
            value={sessionInput}
            onChange={(e) => { setSessionInput(e.target.value); setJoinError(''); }}
            placeholder="Paste session URL or ID…"
          />
          <button type="submit" className="btn btn-sm" disabled={!sessionInput.trim()}>
            Join <Icon name={ICONS.arrowRight} size={12} />
          </button>
        </form>
        <div className="join-hint">or drop a link to join an existing room</div>
        {joinError && <div className="join-error">{joinError}</div>}
      </div>

      <div className="card-stack" aria-hidden="true">
        <div className="stack-card c1"><Card3D value="3" /></div>
        <div className="stack-card c2"><Card3D value="8" /></div>
        <div className="stack-card c3"><Card3D value="5" /></div>
        <div className="stack-card c4"><Card3D value="?" /></div>
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  );

  // Keep local theme state in sync with the DOM (e.g. when TweaksPanel changes it)
  useEffect(() => {
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      const current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      setTheme(prev => (prev === current ? prev : current));
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setTheme(next);
  };

  const openTweaks = () => setTweaksOpen(true);
  const closeTweaks = () => setTweaksOpen(false);

  const tweaksLauncher = !tweaksOpen && (
    <button
      className="tweaks-launcher"
      onClick={openTweaks}
      aria-label="Open tweaks"
      title="Tweaks"
    >
      <Icon name={ICONS.sliders} size={16} />
    </button>
  );

  const tweaks = (
    <>
      {tweaksLauncher}
      <TweaksPanel open={tweaksOpen} onClose={closeTweaks} />
    </>
  );

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <div className="app-root">
                <Topbar theme={theme} onOpenTweaks={openTweaks} onToggleTheme={toggleTheme} />
                <HomePage />
              </div>
              {tweaks}
            </>
          }
        />
        <Route
          path="/create-session"
          element={
            <>
              <div className="app-root">
                <Topbar theme={theme} onOpenTweaks={openTweaks} onToggleTheme={toggleTheme} />
                <CreateSession />
              </div>
              {tweaks}
            </>
          }
        />
        <Route
          path="/session/:sessionId"
          element={
            <>
              <SessionView onOpenTweaks={openTweaks} />
              {tweaks}
            </>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
