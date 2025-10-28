import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header, JoinForm } from './';
import UsersList from './UsersList';
import UserInfo from './UserInfo';
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
  maxUsers: number;
  userStories: UserStory[];
  currentStoryId?: string;
  settings: {
    allowSpectators: boolean;
    autoRevealCards: boolean;
    cardSet: string[];
  };
}

const SessionView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [roleChangeNotification, setRoleChangeNotification] = useState<string | null>(null);
  const [showUsersPanel, setShowUsersPanel] = useState(false);
  
  // Check if user is creator (from URL params)
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
    messages
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
          if (response.status === 404) {
            throw new Error('Session not found');
          }
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

  // Function to refresh session data (for when stories are updated)
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

  // Auto-join creator when they access session directly
  useEffect(() => {
    if (creatorName && session && !currentUser && socket) {
      // Creator joins directly with admin role
      handleJoinSession(creatorName, UserRole.ADMIN);
    }
  }, [creatorName, session, currentUser, socket]);

  // Listen for role changes
  useEffect(() => {
    if (!socket) return;

    const handleRoleChanged = (data: { newRole: string; message: string }) => {
      console.log('Role changed:', data);
      // Force refresh of session data to update permissions
      refreshSession();
      // Show notification about role change
      setRoleChangeNotification(data.message);
      setTimeout(() => setRoleChangeNotification(null), 4000);
    };

    const handleRoleChangeSuccess = (data: { targetUser: any; message: string }) => {
      console.log('Role change success:', data);
      // Refresh session when admin changes someone's role
      refreshSession();
    };

    socket.on('role-changed', handleRoleChanged);
    socket.on('role-change-success', handleRoleChangeSuccess);

    return () => {
      socket.off('role-changed', handleRoleChanged);
      socket.off('role-change-success', handleRoleChangeSuccess);
    };
  }, [socket, refreshSession]);

  // Function to handle sharing session URL
  const handleShareSession = async () => {
    try {
      // Get the current URL without query parameters for a clean share link
      const sessionUrl = `${window.location.origin}/session/${sessionId}`;
      
      // Try to use the modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(sessionUrl);
      } else {
        // Fallback for older browsers or non-HTTPS contexts
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
      
      // Show notification
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 3000);
      
    } catch (err) {
      console.error('Failed to copy session URL:', err);
      // Fallback: at least show the URL in an alert
      alert(`Session URL: ${window.location.origin}/session/${sessionId}`);
    }
  };

  if (loading) {
    return (
      <div className="session-view-loading">
        <div className="loading-spinner">🔄</div>
        <h2>Loading Session...</h2>
        <p>Please wait while we fetch the session details</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-view-error">
        <div className="error-icon">❌</div>
        <h2>Session Not Available</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => window.history.back()} className="back-button">
            ← Go Back
          </button>
          <a href="/" className="home-button">
            🏠 Create New Session
          </a>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="session-view">
      {/* Copy notification */}
      {showCopyNotification && (
        <div className="copy-notification">
          ✅ Session URL copied to clipboard!
        </div>
      )}

      {/* Role change notification */}
      {roleChangeNotification && (
        <div className="role-change-notification">
          🎭 {roleChangeNotification}
        </div>
      )}
      
      <Header 
        isConnected={isConnected}
        totalUsers={totalUsers}
        sessionName={session.name}
        onToggleUsersPanel={() => setShowUsersPanel(!showUsersPanel)}
        showUsersPanel={showUsersPanel}
      />
      
      <main className="session-main">
        {!currentUser ? (
          <div className="join-section">
            <div className="session-info">
              <h2>{session.name}</h2>
              {session.description && (
                <p className="session-description">{session.description}</p>
              )}
              <div className="session-meta">
                <span className="session-creator">Created by {session.createdBy}</span>
                <span className="session-date">
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
                <span className="session-capacity">
                  {totalUsers}/{session.maxUsers} participants
                </span>
              </div>
            </div>
            
            <JoinForm 
              isConnected={isConnected}
              onJoin={(name, role) => handleJoinSession(name, role)}
              allowSpectators={session.settings.allowSpectators}
            />
          </div>
        ) : (
          <>
            <div className="session-header">
              <div className="session-title">
                <h2>{session.name}</h2>
                {session.description && (
                  <p className="session-description">{session.description}</p>
                )}
              </div>
              <div className="session-actions">
                <button 
                  className="share-button"
                  onClick={handleShareSession}
                  title="Copy session URL to clipboard"
                >
                  🔗 Share Session
                </button>
                <div className="session-id">
                  Session ID: <code>{sessionId}</code>
                </div>
              </div>
            </div>

            {currentUser && (
              <>
                <UserStoryManager
                  sessionId={sessionId!}
                  isCreator={currentUser.role === UserRole.ADMIN}
                  currentStoryId={session.currentStoryId}
                  onStoryChange={refreshSession}
                  socket={socket}
                />
                
                {/* Voting Panel */}
                <VotingPanel
                  sessionId={sessionId!}
                  currentUser={{
                    id: currentUser.socketId,
                    name: currentUser.name,
                    isSpectator: currentUser.role === UserRole.VIEWER
                  }}
                  currentStory={session.currentStoryId ? 
                    session.userStories.find(story => story.id === session.currentStoryId) || null : null
                  }
                  isCreator={currentUser.role === UserRole.ADMIN}
                  socket={socket}
                  onRevealVotes={refreshSession}
                />
                
                {/* User Sidebar */}
                <div className={`user-sidebar ${showUsersPanel ? 'open' : ''}`}>
                  <div className="sidebar-content">
                    <UserInfo 
                      currentUser={currentUser} 
                      onUpdateName={(newName) => {
                        if (socket) {
                          socket.emit('update-name', { sessionId, newName });
                        }
                      }}
                    />
                    <UsersList 
                      users={users} 
                      totalUsers={totalUsers}
                      currentUserId={currentUser?.id || ''}
                      currentUserRole={currentUser?.role}
                      sessionId={sessionId!}
                      socket={socket}
                    />
                  </div>
                </div>
                
                {/* Overlay for mobile */}
                {showUsersPanel && <div className="sidebar-overlay" onClick={() => setShowUsersPanel(false)} />}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SessionView;