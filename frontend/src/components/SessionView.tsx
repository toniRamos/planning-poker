import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header, JoinForm } from './';
import UsersList from './UsersList';

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
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  
  // Konami Code state for admin override
  const [konamiSequence, setKonamiSequence] = useState<string[]>([]);
  const konamiCode = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  
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
    console.log('Auto-join useEffect triggered with:', {
      creatorName,
      sessionExists: !!session,
      currentUser: currentUser?.name || 'none',
      socketConnected: !!socket?.connected
    });
    
    if (creatorName && session && !currentUser && socket) {
      console.log(`🚀 Auto-joining creator ${creatorName} with ADMIN role`);
      handleJoinSession(creatorName, UserRole.ADMIN);
    } else {
      console.log('Auto-join conditions not met:', {
        hasCreatorName: !!creatorName,
        hasSession: !!session,
        hasCurrentUser: !!currentUser,
        hasSocket: !!socket
      });
    }
  }, [creatorName, session, currentUser, socket]);

  // Listen for role changes
  useEffect(() => {
    if (!socket) return;

    const handleRoleChanged = (data: { users: any[]; changedUser: { userId: string; newRole: string } }) => {
      console.log('Role changed:', data);
      // Force refresh of session data to update permissions
      refreshSession();
      // Show notification about role change
      setRoleChangeNotification(`User role changed to ${data.changedUser.newRole}`);
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

  // Konami Code listener for admin override
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        // Validate event and key property
        if (!event || !event.key || typeof event.key !== 'string') {
          console.warn('Invalid key event:', event);
          return;
        }

        // Only listen for arrow keys
        if (!event.key.startsWith('Arrow')) {
          setKonamiSequence([]); // Reset sequence on non-arrow key
          return;
        }

        console.log('Arrow key pressed:', event.key); // Debug log

        setKonamiSequence(prev => {
          const newSequence = [...prev, event.key];
          
          // Keep only the last 8 keys (length of konami code)
          if (newSequence.length > konamiCode.length) {
            newSequence.shift();
          }
          
          // Check if sequence matches konami code
          if (newSequence.length === konamiCode.length) {
            const matches = newSequence.every((key, index) => key === konamiCode[index]);
            
            console.log('Checking sequence:', newSequence, 'vs', konamiCode);
            
            if (matches) {
              console.log('🎮 Konami Code activated! Promoting to admin...');
              promoteToAdmin();
              return []; // Reset sequence after activation
            }
          }
          
          return newSequence;
        });
      } catch (error) {
        console.error('Error in Konami Code handler:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser, socket, sessionId]);

  // Function to promote current user to admin
  const promoteToAdmin = () => {
    if (!currentUser || !socket || !sessionId) {
      console.warn('Cannot promote to admin: missing requirements');
      return;
    }

    if (currentUser.role === UserRole.ADMIN) {
      console.log('User is already admin');
      setRoleChangeNotification('🎮 You are already an admin!');
      setTimeout(() => setRoleChangeNotification(null), 3000);
      return;
    }

    console.log('🎮 Promoting user to admin via Konami Code');
    
    // Emit admin promotion request
    socket.emit('konami-admin-promotion', {
      sessionId,
      userId: currentUser.id,
      userName: currentUser.name
    });

    setRoleChangeNotification('🎮 Konami Code activated! You are now admin! 👑');
    setTimeout(() => setRoleChangeNotification(null), 5000);
  };

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

  // Handle name change modal
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
        currentUserName={currentUser?.name}
        onToggleUsersPanel={() => setShowUsersPanel(!showUsersPanel)}
        showUsersPanel={showUsersPanel}
        onChangeName={handleOpenChangeNameModal}
      />

      {/* Change Name Modal */}
      {showChangeNameModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Change Your Name</h3>
              <button 
                className="close-btn"
                onClick={handleCloseChangeNameModal}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your new name"
                className="name-input"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitNameChange();
                  }
                  if (e.key === 'Escape') {
                    handleCloseChangeNameModal();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={handleCloseChangeNameModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitNameChange}
                disabled={!newName.trim()}
              >
                Change Name
              </button>
            </div>
          </div>
        </div>
      )}
      
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