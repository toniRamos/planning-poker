import React, { useState } from 'react';

interface JoinFormProps {
  isConnected: boolean;
  onJoin: (name: string) => void;
  allowSpectators?: boolean;
  onJoinAsSpectator?: (name: string) => void;
}

const JoinForm: React.FC<JoinFormProps> = ({ isConnected, onJoin, allowSpectators, onJoinAsSpectator }) => {
  const [nameInput, setNameInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onJoin(nameInput.trim());
      setNameInput('');
    }
  };

  const handleSpectatorJoin = () => {
    if (nameInput.trim() && onJoinAsSpectator) {
      onJoinAsSpectator(nameInput.trim());
      setNameInput('');
    }
  };

  return (
    <div className="join-form-container">
      <h2>Join the Session</h2>
      <form onSubmit={handleSubmit} className="join-form">
        <div className="input-group">
          <label htmlFor="name">Enter your name:</label>
          <input
            id="name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name..."
            required
            maxLength={30}
          />
        </div>
        <div className="join-buttons">
          <button type="submit" disabled={!isConnected || !nameInput.trim()}>
            🎯 Join as Player
          </button>
          {allowSpectators && onJoinAsSpectator && (
            <button 
              type="button" 
              onClick={handleSpectatorJoin}
              disabled={!isConnected || !nameInput.trim()}
              className="spectator-button"
            >
              👁️ Join as Spectator
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default JoinForm;