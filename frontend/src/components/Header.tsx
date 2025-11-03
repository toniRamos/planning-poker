import React from 'react';
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
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <span className="user-count">👥 {totalUsers} users online</span>
      </div>
    </header>
  );
};

export default Header;