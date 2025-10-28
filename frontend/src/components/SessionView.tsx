import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header, JoinForm, SessionContainer } from './';
import { useSocket } from '../modules/shared/hooks';
import './SessionView.css';

interface Session {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  maxUsers: number;
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

  const {
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
          throw new Error('Failed to load session');
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

  const handleJoinSession = (userName: string, isSpectator: boolean = false) => {
    joinWithName(userName, isSpectator);
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
      <Header 
        isConnected={isConnected}
        totalUsers={totalUsers}
        sessionName={session.name}
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
              onJoin={(name) => handleJoinSession(name, false)}
              allowSpectators={session.settings.allowSpectators}
              onJoinAsSpectator={session.settings.allowSpectators ? 
                (name) => handleJoinSession(name, true) : undefined}
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
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    // TODO: Show toast notification
                  }}
                >
                  🔗 Share Session
                </button>
                <div className="session-id">
                  Session ID: <code>{sessionId}</code>
                </div>
              </div>
            </div>

            {currentUser && (
              <SessionContainer
                currentUser={currentUser}
                users={users}
                totalUsers={totalUsers}
                messages={messages}
                onUpdateName={updateName}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SessionView;