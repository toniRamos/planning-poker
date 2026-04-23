import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types/User';
import { Icon, ICONS } from './Icons';
import './JoinForm.css';

interface JoinFormProps {
  isConnected: boolean;
  onJoin: (name: string, role: UserRole) => void;
  allowSpectators?: boolean;
}

const JoinForm: React.FC<JoinFormProps> = ({ isConnected, onJoin, allowSpectators }) => {
  const [nameInput, setNameInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.PLAYER);
  const [isJoining, setIsJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isConnected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isConnected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim() && !isJoining) {
      setIsJoining(true);
      onJoin(nameInput.trim(), selectedRole);
      setTimeout(() => setIsJoining(false), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="join-card">
      <div className={`connection-badge ${isConnected ? 'connected' : 'connecting'}`}>
        <Icon
          name={isConnected ? ICONS.connected : ICONS.loading}
          size={12}
          className={isConnected ? '' : 'spin'}
        />
        {isConnected ? 'Connected' : 'Connecting…'}
      </div>

      <div className="field">
        <label htmlFor="join-name">Your name</label>
        <input
          ref={inputRef}
          id="join-name"
          className="input"
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Enter your name…"
          required
          maxLength={30}
          disabled={!isConnected}
        />
      </div>

      {allowSpectators && (
        <div className="field">
          <label>Join as</label>
          <div className="tw-options">
            <button
              type="button"
              className={`tw-option ${selectedRole === UserRole.PLAYER ? 'active' : ''}`}
              onClick={() => setSelectedRole(UserRole.PLAYER)}
            >
              <Icon name={ICONS.target} size={12} /> Player
            </button>
            <button
              type="button"
              className={`tw-option ${selectedRole === UserRole.VIEWER ? 'active' : ''}`}
              onClick={() => setSelectedRole(UserRole.VIEWER)}
            >
              <Icon name={ICONS.eye} size={12} /> Viewer
            </button>
          </div>
          <div className="hint">
            {selectedRole === UserRole.PLAYER
              ? 'Players submit estimates during voting rounds.'
              : 'Viewers observe the session but don’t vote.'}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={!isConnected || !nameInput.trim() || isJoining}
        style={{ justifyContent: 'center' }}
      >
        {isJoining ? (
          <>
            <span className="spinner" />
            Joining…
          </>
        ) : (
          <>
            <Icon
              name={selectedRole === UserRole.PLAYER ? ICONS.target : ICONS.eye}
              size={14}
            />
            {selectedRole === UserRole.PLAYER ? 'Join as player' : 'Join as viewer'}
          </>
        )}
      </button>
    </form>
  );
};

export default JoinForm;
