import React, { useEffect, useState } from 'react';
import { Icon, ICONS } from './Icons';

type StyleName = 'noir' | 'atelier' | 'arcade';
type Theme = 'dark' | 'light';
type Density = 'cozy' | 'compact';

const STYLE_KEY = 'pp-style';
const THEME_KEY = 'pp-theme';
const DENSITY_KEY = 'pp-density';

const readStyle = (): StyleName => {
  const v = localStorage.getItem(STYLE_KEY);
  return (v === 'atelier' || v === 'arcade' || v === 'noir') ? v : 'noir';
};
const readTheme = (): Theme => {
  // migrate legacy 'lightMode' key
  const legacy = localStorage.getItem('lightMode');
  if (legacy === 'true') return 'light';
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' ? 'light' : 'dark';
};
const readDensity = (): Density => {
  const v = localStorage.getItem(DENSITY_KEY);
  return v === 'compact' ? 'compact' : 'cozy';
};

export const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  // keep legacy class in sync for any leftover selectors
  if (theme === 'light') document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
  localStorage.setItem(THEME_KEY, theme);
  localStorage.setItem('lightMode', String(theme === 'light'));
};

export const applyStyle = (style: StyleName) => {
  document.documentElement.setAttribute('data-style', style);
  localStorage.setItem(STYLE_KEY, style);
};

export const applyDensity = (density: Density) => {
  document.documentElement.setAttribute('data-density', density);
  localStorage.setItem(DENSITY_KEY, density);
};

/** Attach current prefs to <html> as early as possible */
export const initTweaks = () => {
  applyStyle(readStyle());
  applyTheme(readTheme());
  applyDensity(readDensity());
};

interface TweaksPanelProps {
  open: boolean;
  onClose: () => void;
  onThemeChange?: (t: Theme) => void;
}

export const TweaksPanel: React.FC<TweaksPanelProps> = ({ open, onClose, onThemeChange }) => {
  const [style, setStyle] = useState<StyleName>(readStyle);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [density, setDensity] = useState<Density>(readDensity);

  useEffect(() => { applyStyle(style); }, [style]);
  useEffect(() => { applyTheme(theme); onThemeChange?.(theme); }, [theme]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { applyDensity(density); }, [density]);

  if (!open) return null;

  return (
    <div className="tweaks-panel" role="dialog" aria-label="Tweaks">
      <div className="tw-header">
        <h4>
          <Icon name={ICONS.sliders} size={12} /> Tweaks
        </h4>
        <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close tweaks">
          <Icon name={ICONS.x} size={14} />
        </button>
      </div>
      <div className="tw-body">
        <div className="tw-group">
          <div className="label">Style</div>
          <div className="tw-options three">
            <button className={`tw-option ${style === 'noir' ? 'active' : ''}`} onClick={() => setStyle('noir')}>Noir</button>
            <button className={`tw-option ${style === 'atelier' ? 'active' : ''}`} onClick={() => setStyle('atelier')}>Atelier</button>
            <button className={`tw-option ${style === 'arcade' ? 'active' : ''}`} onClick={() => setStyle('arcade')}>Arcade</button>
          </div>
        </div>

        <div className="tw-group">
          <div className="label">Theme</div>
          <div className="tw-options">
            <button className={`tw-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
            <button className={`tw-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Light</button>
          </div>
        </div>

        <div className="tw-group">
          <div className="label">Density</div>
          <div className="tw-options">
            <button className={`tw-option ${density === 'cozy' ? 'active' : ''}`} onClick={() => setDensity('cozy')}>Cozy</button>
            <button className={`tw-option ${density === 'compact' ? 'active' : ''}`} onClick={() => setDensity('compact')}>Compact</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweaksPanel;
