import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  totalUsers: number;
}

const Header: React.FC<HeaderProps> = ({ isConnected, totalUsers }) => {
  return (
    <header className="app-header">
      <h1>🃏 Planning Poker</h1>
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