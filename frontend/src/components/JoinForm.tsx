import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types/User';
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

  // Auto-focus the name input when connected
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
      // Reset joining state after a short delay (in case of error)
      setTimeout(() => setIsJoining(false), 2000);
    }
  };

  return (
    <div className="join-form-container">
      <h2>Join the Session</h2>
      
      {/* Connection status indicator */}
      <div className={`connection-badge ${isConnected ? 'connected' : 'connecting'}`}>
        {isConnected ? '🟢 Connected' : '🔄 Connecting...'}
      </div>
      
      <form onSubmit={handleSubmit} className="join-form">
        <div className="input-group">
          <label htmlFor="name">What's your name?</label>
          <input
            ref={inputRef}
            id="name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name..."
            required
            maxLength={30}
            disabled={!isConnected}
          />
        </div>

        {allowSpectators && (
          <div className="role-selection">
            <label>Choose your role:</label>
            <div className="role-options">
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value={UserRole.PLAYER}
                  checked={selectedRole === UserRole.PLAYER}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                />
                <span className="role-label">
                  🎯 <strong>Player</strong> - Can participate in voting
                </span>
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value={UserRole.VIEWER}
                  checked={selectedRole === UserRole.VIEWER}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                />
                <span className="role-label">
                  👁️ <strong>Viewer</strong> - Can observe without voting
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="join-buttons">
          <button 
            type="submit" 
            disabled={!isConnected || !nameInput.trim() || isJoining}
            className={isJoining ? 'loading' : ''}
          >
            {isJoining ? (
              <>
                <span className="spinner"></span>
                Joining...
              </>
            ) : (
              selectedRole === UserRole.PLAYER ? '🎯 Join as Player' : '👁️ Join as Viewer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinForm;