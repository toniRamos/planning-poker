import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import JoinForm from './JoinForm';
import UsersList from './UsersList';
import { ParticipationSummary } from './ParticipationSummary';
import { Icon, ICONS } from './Icons';

import { UserStoryManager } from '../modules/shared/components/UserStoryManager';
import { VotingPanel } from '../modules/shared/components/VotingPanel';
import { useSocket } from '../modules/shared/hooks';
import { UserRole } from '../types/User';
import './SessionView.css';

interface UserStory {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  order: number;
  estimatedPoints?: string;
  isRevealed: boolean;
  createdAt: string;
}

interface Session {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  isClosed: boolean;
  maxUsers: number;
  userStories: UserStory[];
  currentStoryId?: string;
  reactionStats?: { [userId: string]: { [emoji: string]: number } };
  userAverages?: { [userId: string]: number };
  settings: {
    allowSpectators: boolean;
    autoRevealCards: boolean;
    cardSet: string[];
  };
}

interface SessionViewProps {
  onOpenTweaks?: () => void;
}

const SessionView: React.FC<SessionViewProps> = ({ onOpenTweaks }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [roleChangeNotification, setRoleChangeNotification] = useState<string | null>(null);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [newName, setNewName] = useState('');

  const [konamiSequence, setKonamiSequence] = useState<string[]>([]);
  const konamiCode = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  const urlParams = new URLSearchParams(window.location.search);
  const creatorName = urlParams.get('creator');

  const {
    socket,
    isConnected,
    users,
    totalUsers,
    currentUser,
    joinWithName,
    updateName,
  } = useSocket(sessionId);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Session not found');
          throw new Error('Failed to fetch session');
        }
        const result = await response.json();
        setSession(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const refreshSession = () => {
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}`)
        .then(response => response.json())
        .then(result => setSession(result.data))
        .catch(console.error);
    }
  };

  const handleJoinSession = (userName: string, role: UserRole = UserRole.PLAYER) => {
    joinWithName(userName, role);
  };

  useEffect(() => {
    if (creatorName && session && !currentUser && socket) {
      handleJoinSession(creatorName, UserRole.ADMIN);
    }
  }, [creatorName, session, currentUser, socket]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;

    const handleRoleChanged = (data: { users: any[]; changedUser: { userId: string; newRole: string } }) => {
      refreshSession();
      setRoleChangeNotification(`User role changed to ${data.changedUser.newRole}`);
      setTimeout(() => setRoleChangeNotification(null), 4000);
    };

    const handleRoleChangeSuccess = () => refreshSession();
    const handleSessionClosed = () => refreshSession();

    socket.on('role-changed', handleRoleChanged);
    socket.on('role-change-success', handleRoleChangeSuccess);
    socket.on('session-closed', handleSessionClosed);

    return () => {
      socket.off('role-changed', handleRoleChanged);
      socket.off('role-change-success', handleRoleChangeSuccess);
      socket.off('session-closed', handleSessionClosed);
    };
  }, [socket, refreshSession]); // eslint-disable-line react-hooks/exhaustive-deps

  // Konami Code admin override
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        if (!event || !event.key || typeof event.key !== 'string') return;
        if (!event.key.startsWith('Arrow')) { setKonamiSequence([]); return; }

        setKonamiSequence(prev => {
          const newSequence = [...prev, event.key];
          if (newSequence.length > konamiCode.length) newSequence.shift();
          if (newSequence.length === konamiCode.length) {
            const matches = newSequence.every((key, index) => key === konamiCode[index]);
            if (matches) {
              promoteToAdmin();
              return [];
            }
          }
          return newSequence;
        });
      } catch (error) {
        console.error('Error in Konami Code handler:', error);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, socket, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const promoteToAdmin = () => {
    if (!currentUser || !socket || !sessionId) return;
    if (currentUser.role === UserRole.ADMIN) {
      setRoleChangeNotification('🎮 You are already an admin!');
      setTimeout(() => setRoleChangeNotification(null), 3000);
      return;
    }
    socket.emit('konami-admin-promotion', {
      sessionId, userId: currentUser.id, userName: currentUser.name
    });
    setRoleChangeNotification('🎮 Konami Code activated! You are now admin 👑');
    setTimeout(() => setRoleChangeNotification(null), 5000);
  };

  const handleShareSession = async () => {
    try {
      const sessionUrl = `${window.location.origin}/session/${sessionId}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(sessionUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = sessionUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 3000);
    } catch (err) {
      console.error('Failed to copy session URL:', err);
      alert(`Session URL: ${window.location.origin}/session/${sessionId}`);
    }
  };

  const handleOpenChangeNameModal = () => {
    setNewName(currentUser?.name || '');
    setShowChangeNameModal(true);
  };
  const handleCloseChangeNameModal = () => {
    setShowChangeNameModal(false);
    setNewName('');
  };
  const handleSubmitNameChange = () => {
    if (!newName.trim()) return;
    updateName(newName.trim());
    setShowChangeNameModal(false);
    setNewName('');
  };

  if (loading) {
    return (
      <div className="app-root">
        <div className="centered-state">
          <div className="glyph"><Icon name={ICONS.loading} size={22} className="spin" /></div>
          <h2>Loading session…</h2>
          <p>Fetching session details</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-root">
        <div className="centered-state">
          <div className="glyph" style={{ background: 'color-mix(in oklch, var(--danger), transparent 88%)', color: 'var(--danger)', boxShadow: '0 0 0 1px color-mix(in oklch, var(--danger), transparent 70%)' }}>
            <Icon name={ICONS.warning} size={22} />
          </div>
          <h2>Session not available</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.history.back()} className="btn">
              <Icon name={ICONS.arrowLeft} size={14} /> Go back
            </button>
            <a href="/" className="btn btn-primary">
              <Icon name={ICONS.plus} size={14} /> Create new
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Closed session → full summary screen
  if (session.isClosed && currentUser) {
    return (
      <div className="app-root">
        <Header
          isConnected={isConnected}
          totalUsers={totalUsers}
          sessionName={session.name}
          currentUserName={currentUser?.name}
          onChangeName={handleOpenChangeNameModal}
          onShareSession={handleShareSession}
          onOpenTweaks={onOpenTweaks}
        />
        <ParticipationSummary
          session={session}
          users={users}
          reactionStats={session.reactionStats || {}}
          userAverages={session.userAverages || {}}
        />
      </div>
    );
  }

  return (
    <div className="app-root">
      {showCopyNotification && (
        <div className="toast">
          <Icon name={ICONS.check} size={14} /> Session link copied
        </div>
      )}
      {roleChangeNotification && (
        <div className="toast" style={{ background: 'var(--accent)', color: 'oklch(100% 0 0)' }}>
          <Icon name={ICONS.crown} size={14} /> {roleChangeNotification}
        </div>
      )}

      <Header
        isConnected={isConnected}
        totalUsers={totalUsers}
        sessionName={session.name}
        currentUserName={currentUser?.name}
        onToggleUsersPanel={() => setShowUsersPanel(!showUsersPanel)}
        showUsersPanel={showUsersPanel}
        onChangeName={currentUser ? handleOpenChangeNameModal : undefined}
        onShareSession={currentUser ? handleShareSession : undefined}
        onOpenTweaks={onOpenTweaks}
      />

      {showChangeNameModal && (
        <div className="modal-overlay" onClick={handleCloseChangeNameModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Change your name</h3>
                <div className="sub">This will update how others see you in the session.</div>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={handleCloseChangeNameModal}
                aria-label="Close"
              >
                <Icon name={ICONS.x} size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>New name</label>
                <input
                  type="text"
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Your new name"
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitNameChange();
                    if (e.key === 'Escape') handleCloseChangeNameModal();
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleCloseChangeNameModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitNameChange}
                disabled={!newName.trim()}
              >
                Change name
              </button>
            </div>
          </div>
        </div>
      )}

      {!currentUser ? (
        <div className="join-section">
          <div className="session-info">
            <div className="eyebrow">Joining</div>
            <h2>{session.name}</h2>
            {session.description && (
              <p className="session-description">{session.description}</p>
            )}
            <div className="session-meta">
              <span>Created by {session.createdBy}</span>
              <span>·</span>
              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span>{totalUsers}/{session.maxUsers} participants</span>
            </div>
          </div>
          <JoinForm
            isConnected={isConnected}
            onJoin={(name, role) => handleJoinSession(name, role)}
            allowSpectators={session.settings.allowSpectators}
          />
        </div>
      ) : (
        <div className="session-layout">
          {/* LEFT: Stories */}
          <aside className={`panel${showUsersPanel ? '' : ''}`}>
            <UserStoryManager
              sessionId={sessionId!}
              isCreator={currentUser.role === UserRole.ADMIN}
              currentStoryId={session.currentStoryId}
              onStoryChange={refreshSession}
              socket={socket}
              sessionClosed={session.isClosed}
              onSessionClose={refreshSession}
            />
          </aside>

          {/* CENTER: Stage (voting / reveal) */}
          <main>
            <VotingPanel
              sessionId={sessionId!}
              currentUser={{
                id: currentUser.socketId,
                name: currentUser.name,
                isSpectator: currentUser.role === UserRole.VIEWER
              }}
              currentStory={session.currentStoryId
                ? session.userStories.find(s => s.id === session.currentStoryId) || null
                : null}
              isCreator={currentUser.role === UserRole.ADMIN}
              socket={socket}
              onRevealVotes={refreshSession}
              sessionClosed={session.isClosed}
              onCopyLink={handleShareSession}
            />
          </main>

          {/* RIGHT: Participants */}
          <aside className={`panel right${showUsersPanel ? ' mobile-open' : ''}`}>
            <div className="panel-header">
              <h3>Participants <span className="count">{users.length}</span></h3>
              <span className="badge badge-success badge-dot" style={{ fontSize: 10, padding: '2px 8px' }}>
                Live
              </span>
            </div>
            <div className="panel-body">
              <UsersList
                users={users}
                totalUsers={totalUsers}
                currentUserId={currentUser?.id || ''}
                currentUserRole={currentUser?.role}
                sessionId={sessionId!}
                socket={socket}
                currentStoryId={session.currentStoryId}
                isEstimationActive={!!session.currentStoryId}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SessionView;
