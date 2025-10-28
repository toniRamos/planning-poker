import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  totalUsers: number;
  sessionName?: string;
  onToggleUsersPanel?: () => void;
  showUsersPanel?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  isConnected, 
  totalUsers, 
  sessionName, 
  onToggleUsersPanel,
  showUsersPanel 
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
      </div>
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <span className="user-count">👥 {totalUsers} users online</span>
      </div>
    </header>
  );
};

export default Header;