import React, { useEffect, useState } from 'react';
import { ConnectedUser } from '../modules/shared/hooks/useSocket';
import { UserRole } from '../types/User';
import { Socket } from 'socket.io-client';
import { Icon, ICONS } from './Icons';
import Avatar from './Avatar';

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

const roleLabel = (role?: UserRole) => {
  switch (role) {
    case UserRole.ADMIN: return 'Admin';
    case UserRole.PLAYER: return 'Player';
    case UserRole.VIEWER: return 'Viewer';
    default: return '';
  }
};

const roleIcon = (role?: UserRole) => {
  switch (role) {
    case UserRole.ADMIN: return ICONS.crown;
    case UserRole.PLAYER: return ICONS.target;
    case UserRole.VIEWER: return ICONS.eye;
    default: return ICONS.user;
  }
};

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

  useEffect(() => {
    setVotedUsers(new Set());
  }, [currentStoryId, isEstimationActive]);

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
    const handleVotesRevealed = () => setVotedUsers(new Set());
    const handleVotingReset = () => setVotedUsers(new Set());

    socket.on('vote-submitted', handleVoteSubmitted);
    socket.on('votes-revealed', handleVotesRevealed);
    socket.on('voting-reset', handleVotingReset);

    return () => {
      socket.off('vote-submitted', handleVoteSubmitted);
      socket.off('votes-revealed', handleVotesRevealed);
      socket.off('voting-reset', handleVotingReset);
    };
  }, [socket, currentStoryId]);

  const isAdmin = currentUserRole === UserRole.ADMIN;

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    if (!socket || !sessionId || currentUserRole !== UserRole.ADMIN) return;
    setChangingRole(targetUserId);
    socket.emit('request-role-change', { userId: targetUserId, newRole, sessionId });
    setTimeout(() => setChangingRole(null), 1000);
  };

  const admins = users.filter(u => u.role === UserRole.ADMIN);
  const players = users.filter(u => u.role === UserRole.PLAYER);
  const viewers = users.filter(u => u.role === UserRole.VIEWER);
  const playersVoted = players.filter(p => votedUsers.has(p.id)).length;

  const renderRow = (user: ConnectedUser) => {
    const isMe = user.id === currentUserId;
    const showVote =
      isEstimationActive &&
      user.role === UserRole.PLAYER &&
      !!currentStoryId;
    const hasVoted = votedUsers.has(user.id);

    return (
      <div key={user.id} className={`participant-row${isMe ? ' current' : ''}`}>
        <Avatar name={user.name} online />
        <div className="name-col">
          <div className="name">
            {user.name}
            {isMe && (
              <span style={{ fontSize: 10.5, color: 'var(--fg-dim)', fontWeight: 400 }}>· you</span>
            )}
          </div>
          <div className="role">
            <Icon name={roleIcon(user.role)} size={11} />
            {roleLabel(user.role)}
          </div>
        </div>

        {showVote && (
          <div
            className={`vote-pill ${hasVoted ? 'voted' : 'waiting'}`}
            title={hasVoted ? 'Vote submitted' : 'Waiting for vote'}
          >
            {hasVoted ? '·' : '—'}
          </div>
        )}

        {isAdmin && !isMe && (
          <select
            className="role-select"
            value={user.role || UserRole.PLAYER}
            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
            disabled={changingRole === user.id}
            aria-label={`Change role for ${user.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.PLAYER}>Player</option>
            <option value={UserRole.VIEWER}>Viewer</option>
          </select>
        )}
      </div>
    );
  };

  return (
    <>
      {admins.length > 0 && (
        <>
          <div className="role-group-header">
            <span>
              <Icon name={ICONS.crown} size={11} /> Admins
            </span>
            <span className="count">{admins.length}</span>
          </div>
          {admins.map(renderRow)}
        </>
      )}

      {players.length > 0 && (
        <>
          <div className="role-group-header">
            <span>
              <Icon name={ICONS.target} size={11} /> Players
            </span>
            {isEstimationActive && currentStoryId ? (
              <span className="muted-count">{playersVoted}/{players.length} voted</span>
            ) : (
              <span className="count">{players.length}</span>
            )}
          </div>
          {players.map(renderRow)}
        </>
      )}

      {viewers.length > 0 && (
        <>
          <div className="role-group-header">
            <span>
              <Icon name={ICONS.eye} size={11} /> Viewers
            </span>
            <span className="count">{viewers.length}</span>
          </div>
          {viewers.map(renderRow)}
        </>
      )}

      {users.length === 0 && (
        <div className="story-empty">
          <div className="glyph"><Icon name={ICONS.users} size={18} /></div>
          <h4>No one here yet</h4>
          <p>Waiting for participants ({totalUsers})</p>
        </div>
      )}
    </>
  );
};

export default UsersList;
