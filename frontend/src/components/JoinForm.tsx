import React, { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onJoin(nameInput.trim(), selectedRole);
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
          <button type="submit" disabled={!isConnected || !nameInput.trim()}>
            {selectedRole === UserRole.PLAYER ? '🎯 Join as Player' : '👁️ Join as Viewer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinForm;