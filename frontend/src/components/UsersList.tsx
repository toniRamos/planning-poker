import React, { useState, useEffect } from 'react';
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
  currentStoryId?: string;
  isEstimationActive?: boolean;
}

const UsersList: React.FC<UsersListProps> = ({ 
  users, 
  totalUsers, 
  currentUserId, 
  currentUserRole,
  sessionId,
  socket,
  currentStoryId,
  isEstimationActive
}) => {
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [votedUsers, setVotedUsers] = useState<Set<string>>(new Set());

  // Reset voted users when story changes or estimation starts/stops
  useEffect(() => {
    setVotedUsers(new Set());
  }, [currentStoryId, isEstimationActive]);

  // Listen for vote events
  useEffect(() => {
    if (!socket) return;

    const handleVoteSubmitted = (data: { userId: string; userName: string; userStoryId: string; hasVoted: boolean }) => {
      if (data.userStoryId === currentStoryId && data.hasVoted) {
        setVotedUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(data.userId);
          return newSet;
        });
      }
    };

    const handleVotesRevealed = () => {
      // Reset voting status when votes are revealed
      setVotedUsers(new Set());
    };

    const handleVotingReset = (data?: any) => {
      // Reset voting status when voting is reset (re-estimate)
      console.log('UsersList: Received voting-reset event', data);
      console.log('UsersList: Current voted users before reset:', votedUsers);
      setVotedUsers(new Set());
      console.log('UsersList: Voted users reset');
    };

    socket.on('vote-submitted', handleVoteSubmitted);
    socket.on('votes-revealed', handleVotesRevealed);
    socket.on('voting-reset', handleVotingReset);

    return () => {
      socket.off('vote-submitted', handleVoteSubmitted);
      socket.off('votes-revealed', handleVotesRevealed);
      socket.off('voting-reset', handleVotingReset);
    };
  }, [socket, currentStoryId]);

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

  const renderVotingStatus = (user: ConnectedUser) => {
    // Show voting status for players during active estimation (visible to everyone)
    if (!isEstimationActive || user.role !== UserRole.PLAYER || !currentStoryId) {
      return null;
    }

    const hasVoted = votedUsers.has(user.id);
    
    return (
      <div 
        className={`user-voting-status ${hasVoted ? 'voted' : 'not-voted'}`} 
        title={hasVoted ? 'Vote submitted' : 'Waiting for vote'}
      >
        <div className="voting-card-visual">
          <div className="card-inner">
            {hasVoted ? '✓' : '?'}
          </div>
        </div>
      </div>
    );
  };

  const renderUserItem = (user: ConnectedUser) => (
    <div key={user.id} className={`user-item ${user.id === currentUserId ? 'current-user' : ''}`}>
      <span className="user-name">
        {user.name}
        {user.id === currentUserId && <span className="you-indicator"> (You)</span>}
      </span>
      
      {renderVotingStatus(user)}
      
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
  );

  const isAdmin = currentUserRole === UserRole.ADMIN;
  
  // Separate users by role
  const admins = users.filter(user => user.role === UserRole.ADMIN);
  const players = users.filter(user => user.role === UserRole.PLAYER);
  const viewers = users.filter(user => user.role === UserRole.VIEWER);

  return (
    <div className="users-section">
      <h3>Users ({totalUsers})</h3>
      
      {admins.length > 0 && (
        <div className="role-section">
          <h4 className="role-header admin-header">
            � Admins ({admins.length})
          </h4>
          <div className="users-list">
            {admins.map(renderUserItem)}
          </div>
        </div>
      )}
      
      {players.length > 0 && (
        <div className="role-section">
          <h4 className="role-header player-header">
            🎯 Players ({players.length})
            {isEstimationActive && currentStoryId && (
              <span className="voting-summary">
                {votedUsers.size}/{players.length} voted
              </span>
            )}
          </h4>
          <div className="users-list">
            {players.map(renderUserItem)}
          </div>
        </div>
      )}
      
      {viewers.length > 0 && (
        <div className="role-section">
          <h4 className="role-header viewer-header">
            👁️ Viewers ({viewers.length})
          </h4>
          <div className="users-list">
            {viewers.map(renderUserItem)}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;