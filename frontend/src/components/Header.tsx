import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, ICONS } from './Icons';
import { applyTheme } from './TweaksPanel';
import './Header.css';

interface HeaderProps {
  isConnected: boolean;
  totalUsers: number;
  sessionName?: string;
  currentUserName?: string;
  onToggleUsersPanel?: () => void;
  showUsersPanel?: boolean;
  onChangeName?: () => void;
  onShareSession?: () => void;
  onOpenTweaks?: () => void;
}

type Theme = 'light' | 'dark';

const readTheme = (): Theme =>
  (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

const Header: React.FC<HeaderProps> = ({
  isConnected,
  totalUsers,
  sessionName,
  currentUserName,
  onToggleUsersPanel,
  showUsersPanel,
  onChangeName,
  onShareSession,
  onOpenTweaks,
}) => {
  const [theme, setTheme] = useState<Theme>(readTheme);

  // Keep icon in sync with external theme changes (TweaksPanel, Topbar, etc.)
  useEffect(() => {
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(prev => {
        const next = readTheme();
        return prev === next ? prev : next;
      });
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  return (
    <header className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" className="brand" aria-label="Planning Poker home">
          <div className="brand-mark">P</div>
          <span>Planning Poker</span>
        </Link>
        {sessionName && (
          <div className={`sess-name${isConnected ? '' : ' offline'}`} title={sessionName}>
            <span className="dot" />
            <span>{sessionName}</span>
            <span style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, marginLeft: 4 }}>
              · {totalUsers}
            </span>
          </div>
        )}
      </div>

      <div className="right">
        {currentUserName && (
          <div className="welcome-chip">
            <span>Hi, <strong>{currentUserName}</strong></span>
            {onChangeName && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={onChangeName}
                title="Change name"
                aria-label="Change name"
              >
                <Icon name={ICONS.edit} size={14} />
              </button>
            )}
          </div>
        )}

        {onShareSession && sessionName && (
          <button
            className="btn btn-sm"
            onClick={onShareSession}
            title="Copy session URL to clipboard"
          >
            <Icon name={ICONS.share} size={14} />
            <span>Share</span>
          </button>
        )}

        {onToggleUsersPanel && (
          <button
            className={`btn btn-ghost btn-icon${showUsersPanel ? ' active' : ''}`}
            onClick={onToggleUsersPanel}
            title="Toggle users panel"
            aria-label="Toggle users panel"
          >
            <Icon name={ICONS.users} size={16} />
          </button>
        )}

        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          <Icon name={theme === 'dark' ? ICONS.sun : ICONS.moon} size={16} />
        </button>

        {onOpenTweaks && (
          <button
            className="btn btn-ghost btn-icon"
            onClick={onOpenTweaks}
            title="Tweaks"
            aria-label="Open tweaks"
          >
            <Icon name={ICONS.sliders} size={16} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
