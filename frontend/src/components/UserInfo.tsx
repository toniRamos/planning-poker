import React, { useState } from 'react';
import { ConnectedUser } from '../modules/shared/hooks/useSocket';

interface UserInfoProps {
  currentUser: ConnectedUser;
  onUpdateName: (newName: string) => void;
}

const UserInfo: React.FC<UserInfoProps> = ({ currentUser, onUpdateName }) => {
  const [showNameUpdate, setShowNameUpdate] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNameInput.trim()) {
      onUpdateName(newNameInput.trim());
      setNewNameInput('');
      setShowNameUpdate(false);
    }
  };

  return (
    <div className="user-info">
      <h2>Welcome, {currentUser.name}! 👋</h2>
      <div className="user-actions">
        {!showNameUpdate ? (
          <button onClick={() => setShowNameUpdate(true)} className="change-name-btn">
            Change Name
          </button>
        ) : (
          <form onSubmit={handleUpdateName} className="name-update-form">
            <input
              type="text"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
              placeholder="New name..."
              required
              maxLength={30}
              autoFocus
            />
            <button type="submit">Update</button>
            <button 
              type="button" 
              onClick={() => {
                setShowNameUpdate(false);
                setNewNameInput('');
              }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserInfo;