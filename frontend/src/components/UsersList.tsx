import React, { useState } from 'react';
import { ConnectedUser } from '../modules/shared/hooks/useSocket';
import { UserRole } from '../types/User';
import { Socket } from 'socket.io-client';

interface UsersListProps {
  users: ConnectedUser[];
  totalUsers: number;
  currentUserId?: string;
  currentUserRole?: UserRole;
  sessionId: string;
  socket?: Socket | null;
}

const UsersList: React.FC<UsersListProps> = ({ 
  users, 
  totalUsers, 
  currentUserId, 
  currentUserRole,
  sessionId,
  socket 
}) => {
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return '👑';
      case UserRole.PLAYER: return '🎯';
      case UserRole.VIEWER: return '👁️';
      default: return '👤';
    }
  };

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return '#dc3545';
      case UserRole.PLAYER: return '#28a745';
      case UserRole.VIEWER: return '#6c757d';
      default: return '#007bff';
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    if (!socket || !sessionId || currentUserRole !== UserRole.ADMIN) return;
    
    setChangingRole(targetUserId);
    
    socket.emit('change-user-role', {
      targetUserId,
      newRole,
      sessionId
    });

    // Reset changing state after a delay
    setTimeout(() => setChangingRole(null), 1000);
  };

  const isAdmin = currentUserRole === UserRole.ADMIN;

  return (
    <div className="users-section">
      <h3>Connected Users ({totalUsers})</h3>
      <div className="users-list">
        {users.map((user) => (
          <div key={user.id} className={`user-card ${user.id === currentUserId ? 'current-user' : ''}`}>
            <div className="user-info">
              <div className="user-header">
                <span className="user-name">{user.name}</span>
                {user.id === currentUserId && <span className="you-badge">You</span>}
              </div>
              
              <div className="user-role">
                <span 
                  className="role-badge" 
                  style={{ backgroundColor: getRoleColor(user.role) }}
                >
                  {getRoleIcon(user.role)} {user.role || 'player'}
                </span>
              </div>

              {isAdmin && user.id !== currentUserId && (
                <div className="role-controls">
                  <select 
                    value={user.role || UserRole.PLAYER}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={changingRole === user.id}
                    className="role-selector"
                  >
                    <option value={UserRole.ADMIN}>👑 Admin</option>
                    <option value={UserRole.PLAYER}>🎯 Player</option>
                    <option value={UserRole.VIEWER}>👁️ Viewer</option>
                  </select>
                </div>
              )}
              
              <span className="connection-time">
                Connected: {new Date(user.connectedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;