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
    console.log('🔄 Role change requested:', { targetUserId, newRole, sessionId, currentUserRole, isAdmin, socket: !!socket });
    
    if (!socket || !sessionId || currentUserRole !== UserRole.ADMIN) {
      console.log('❌ Role change blocked:', {
        noSocket: !socket,
        noSessionId: !sessionId,
        notAdmin: currentUserRole !== UserRole.ADMIN,
        currentRole: currentUserRole
      });
      return;
    }
    
    setChangingRole(targetUserId);
    
    const requestData = {
      userId: targetUserId,
      newRole,
      sessionId
    };
    
    console.log('📡 Emitting request-role-change:', requestData);
    socket.emit('request-role-change', requestData);

    // Reset changing state after a delay
    setTimeout(() => setChangingRole(null), 1000);
  };

  const isAdmin = currentUserRole === UserRole.ADMIN;

  return (
    <div className="users-section">
      <h3>Users ({totalUsers})</h3>
      <div className="users-list">
        {users.map((user) => (
          <div key={user.id} className={`user-item ${user.id === currentUserId ? 'current-user' : ''}`}>
            <span className="user-name">
              {user.name}
              {user.id === currentUserId && <span className="you-indicator"> (You)</span>}
            </span>
            <span 
              className="user-role-simple" 
              style={{ color: getRoleColor(user.role) }}
            >
              {getRoleIcon(user.role)}
            </span>
            
            {isAdmin && user.id !== currentUserId && (
              <select 
                value={user.role || UserRole.PLAYER}
                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                disabled={changingRole === user.id}
                className="role-selector-mini"
              >
                <option value={UserRole.ADMIN}>👑</option>
                <option value={UserRole.PLAYER}>🎯</option>
                <option value={UserRole.VIEWER}>👁️</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;