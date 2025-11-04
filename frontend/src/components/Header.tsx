import React, { useState, useEffect } from 'react';
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
}

const Header: React.FC<HeaderProps> = ({ 
  isConnected, 
  totalUsers, 
  sessionName, 
  currentUserName,
  onToggleUsersPanel,
  showUsersPanel,
  onChangeName,
  onShareSession
}) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {onToggleUsersPanel && (
          <button 
            className={`users-menu-btn ${showUsersPanel ? 'active' : ''}`}
            onClick={onToggleUsersPanel}
            title="Toggle users panel"
          >
            👥
          </button>
        )}
        <div className="header-title">
          <h1>🃏 Planning Poker</h1>
          {sessionName && <span className="session-name">{sessionName}</span>}
        </div>
        {onShareSession && sessionName && (
          <button 
            className="share-button-header"
            onClick={onShareSession}
            title="Copy session URL to clipboard"
          >
            <span>🔗</span>
            <span>Share</span>
          </button>
        )}
      </div>
      <div className="connection-status">
        {currentUserName && (
          <div className="welcome-section">
            <span className="welcome-message">Welcome, {currentUserName}</span>
            <button 
              className="settings-btn" 
              onClick={onChangeName}
              title="Change name"
            >
              ⚙️
            </button>
          </div>
        )}
        
        {/* Dark Mode Toggle */}
        <div 
          className="dark-mode-toggle" 
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="toggle-icon sun-icon">☀️</span>
          <span className="toggle-icon moon-icon">🌙</span>
          <div className="toggle-slider"></div>
        </div>

        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <span className="user-count">👥 {totalUsers} users online</span>
      </div>
    </header>
  );
};

export default Header;