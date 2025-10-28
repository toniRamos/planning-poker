import React, { useState, useEffect } from 'react';
import './VotingPanel.css';

interface Vote {
  id: string;
  userId: string;
  userStoryId: string;
  sessionId: string;
  points: string;
  isRevealed: boolean;
  createdAt: string;
  updatedAt: string;
}

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

interface VotingPanelProps {
  sessionId: string;
  currentUser: { id: string; name: string; isSpectator: boolean } | null;
  currentStory: UserStory | null;
  isCreator: boolean;
  socket?: any;
  onRevealVotes?: () => void;
}

const CARD_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];

export const VotingPanel: React.FC<VotingPanelProps> = ({
  sessionId,
  currentUser,
  currentStory,
  isCreator,
  socket,
  onRevealVotes
}) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [votesRevealed, setVotesRevealed] = useState(false);

  useEffect(() => {
    if (currentStory) {
      fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
      setVotesRevealed(currentStory.isRevealed);
    } else {
      setVotes([]);
      setMyVote(null);
      setVotesRevealed(false);
    }
  }, [currentStory]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket listeners for real-time voting updates
  useEffect(() => {
    if (!socket) return;

    const handleVoteSubmitted = (data: any) => {
      console.log('Vote submitted:', data);
      if (data.userStoryId === currentStory?.id) {
        fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    };

    const handleVotesRevealed = (data: any) => {
      console.log('Votes revealed:', data);
      if (data.userStoryId === currentStory?.id) {
        setVotesRevealed(true);
        setVotes(data.votes);
      }
    };

    const handleVotesCleared = (data: any) => {
      console.log('Votes cleared:', data);
      if (data.userStoryId === currentStory?.id) {
        setVotes([]);
        setMyVote(null);
        setVotesRevealed(false);
      }
    };

    const handleRoleChanged = (data: any) => {
      console.log('User role changed:', data);
      // Force re-render by clearing and refetching votes
      if (currentStory) {
        fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    };

    socket.on('vote-submitted', handleVoteSubmitted);
    socket.on('votes-revealed', handleVotesRevealed);
    socket.on('votes-cleared', handleVotesCleared);
    socket.on('role-changed', handleRoleChanged);

    return () => {
      socket.off('vote-submitted', handleVoteSubmitted);
      socket.off('votes-revealed', handleVotesRevealed);
      socket.off('votes-cleared', handleVotesCleared);
      socket.off('role-changed', handleRoleChanged);
    };
  }, [socket, currentStory?.id]);

  const fetchVotes = async () => {
    if (!currentStory) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${currentStory.id}/votes`);
      if (response.ok) {
        const fetchedVotes = await response.json();
        setVotes(fetchedVotes);
        
        // Find my vote
        if (currentUser) {
          const userVote = fetchedVotes.find((vote: Vote) => vote.userId === currentUser.id);
          setMyVote(userVote?.points || null);
        }
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const submitVote = async (points: string) => {
    if (!currentUser || !currentStory || currentUser.isSpectator || isCreator) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${currentStory.id}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          points: points
        }),
      });

      if (response.ok) {
        const vote = await response.json();
        setMyVote(points);
        
        // Emit WebSocket event
        if (socket) {
          socket.emit('vote-submitted', {
            sessionId,
            vote,
            userId: currentUser.id
          });
        }

        await fetchVotes(); // Refresh votes
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const revealVotes = async () => {
    if (!currentStory) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${currentStory.id}/votes/reveal`, {
        method: 'PUT',
      });

      if (response.ok) {
        const revealedVotes = await response.json();
        setVotesRevealed(true);
        setVotes(revealedVotes);

        // Emit WebSocket event
        if (socket) {
          socket.emit('votes-revealed', {
            sessionId,
            userStoryId: currentStory.id,
            votes: revealedVotes
          });
        }

        onRevealVotes?.();
      }
    } catch (error) {
      console.error('Error revealing votes:', error);
    }
  };

  const clearVotes = async () => {
    if (!currentStory) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${currentStory.id}/votes`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVotes([]);
        setMyVote(null);
        setVotesRevealed(false);

        // Emit WebSocket event
        if (socket) {
          socket.emit('votes-cleared', {
            sessionId,
            userStoryId: currentStory.id
          });
        }
      }
    } catch (error) {
      console.error('Error clearing votes:', error);
    }
  };

  if (!currentStory) {
    return (
      <div className="voting-panel">
        <div className="no-story">
          <h3>🗳️ Voting</h3>
          <p>No story selected for estimation.</p>
          <p>The session creator needs to select a story to start voting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-panel">
      <div className="voting-header">
        <h3>🗳️ Estimating Story</h3>
        <div className="current-story">
          <h4>{currentStory.title}</h4>
          {currentStory.description && (
            <p className="story-description">{currentStory.description}</p>
          )}
        </div>
      </div>

      {/* Voting Cards */}
      {!currentUser?.isSpectator && !isCreator && !votesRevealed && (
        <div className="voting-section">
          <h4>Select your estimate:</h4>
          <div className="voting-cards">
            {CARD_VALUES.map((value) => (
              <button
                key={value}
                className={`voting-card ${myVote === value ? 'selected' : ''}`}
                onClick={() => submitVote(value)}
                disabled={isLoading}
              >
                {value}
              </button>
            ))}
          </div>
          
          {myVote && (
            <div className="my-vote">
              ✅ Your vote: <span className="vote-value">{myVote}</span>
            </div>
          )}
        </div>
      )}

      {/* Information messages for non-voters */}
      {currentUser?.isSpectator && !votesRevealed && (
        <div className="voting-info">
          <p>👁️ You are observing as a <strong>Viewer</strong> - you cannot vote</p>
        </div>
      )}

      {isCreator && !votesRevealed && (
        <div className="voting-info">
          <p>👑 You are the <strong>Admin</strong> - you manage voting but cannot vote yourself</p>
        </div>
      )}

      {/* Vote Status */}
      <div className="vote-status">
        <h4>Voting Status</h4>
        <div className="vote-cards">
          {votes.map((vote, index) => (
            <div
              key={vote.id}
              className={`vote-card ${vote.isRevealed || votesRevealed ? 'revealed' : 'hidden'}`}
            >
              {vote.isRevealed || votesRevealed ? vote.points : '?'}
              <div className="vote-user">Player {index + 1}</div>
            </div>
          ))}
        </div>
        
        <div className="vote-summary">
          {votes.length} vote{votes.length !== 1 ? 's' : ''} submitted
        </div>
      </div>

      {/* Reveal/Clear Actions */}
      {votes.length > 0 && (
        <div className="voting-actions">
          {!votesRevealed ? (
            isCreator ? (
              <button
                className="btn btn-primary reveal-btn"
                onClick={revealVotes}
              >
                🔍 Reveal Votes
              </button>
            ) : (
              <div className="voting-message">
                <p>Esperando a que el creador revele los votos...</p>
              </div>
            )
          ) : (
            <div className="revealed-actions">
              <div className="vote-results">
                <h4>📊 Results:</h4>
                <div className="results-summary">
                  {(() => {
                    const pointCounts = votes.reduce((acc: { [key: string]: number }, vote) => {
                      acc[vote.points] = (acc[vote.points] || 0) + 1;
                      return acc;
                    }, {});
                    
                    return Object.entries(pointCounts).map(([points, count]) => (
                      <span key={points} className="result-item">
                        {points}: {count} vote{count !== 1 ? 's' : ''}
                      </span>
                    ));
                  })()}
                </div>
              </div>
              
              {isCreator ? (
                <button
                  className="btn btn-secondary clear-btn"
                  onClick={clearVotes}
                >
                  🗑️ New Vote
                </button>
              ) : (
                <div className="voting-message">
                  <p>Solo el creador puede iniciar una nueva votación</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};