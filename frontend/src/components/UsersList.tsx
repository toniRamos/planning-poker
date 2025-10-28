import React from 'react';
import { ConnectedUser } from '../modules/shared/hooks/useSocket';

interface UsersListProps {
  users: ConnectedUser[];
  totalUsers: number;
  currentUserId?: string;
}

const UsersList: React.FC<UsersListProps> = ({ users, totalUsers, currentUserId }) => {
  return (
    <div className="users-section">
      <h3>Connected Users ({totalUsers})</h3>
      <div className="users-list">
        {users.map((user) => (
          <div key={user.id} className={`user-card ${user.id === currentUserId ? 'current-user' : ''}`}>
            <span className="user-name">{user.name}</span>
            {user.id === currentUserId && <span className="you-badge">You</span>}
            <span className="connection-time">
              Connected: {new Date(user.connectedAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;