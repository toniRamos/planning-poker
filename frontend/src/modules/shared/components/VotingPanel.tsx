import React, { useState, useEffect, useRef } from 'react';
import * as anime from 'animejs';
import './VotingPanel.css';

interface Vote {
  id: string;
  userId: string;
  userName: string;
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

const CARD_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
const REACTION_EMOJIS = ['💩', '👀', '💔', '💯',  '😍', '🔪', '🍆', '👍', '👎'];

// Función utilitaria para obtener la clase de color según el valor de la carta
const getCardValueClass = (value: string): string => {
  const normalizedValue = value;
  switch (normalizedValue) {
    case '0': return 'value-0';
    case '1': return 'value-1';
    case '2': return 'value-2';
    case '3': return 'value-3';
    case '5': return 'value-5';
    case '8': return 'value-8';
    case '13': return 'value-13';
    case '21': return 'value-21';
    case '?': return 'value-question';
    case '☕': return 'value-coffee';
    default: return 'value-question'; // Fallback para valores no reconocidos
  }
};

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
  const [autoRevealed, setAutoRevealed] = useState(false);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [reactionCount, setReactionCount] = useState(0);

  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const reactionCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentStory) {
      fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
      // DON'T reset votesRevealed from backend - only use WebSocket events
      setSelectedCard(null); // Clear visual selection when story changes
    } else {
      setVotes([]);
      setMyVote(null);
      setVotesRevealed(false);
      setSelectedCard(null); // Clear visual selection when no story
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
        setAutoRevealed(data.autoRevealed || false);
        setVotes(data.votes);
      }
    };

    const handleVotesCleared = () => {
      setVotes([]);
      setMyVote(null);
      setVotesRevealed(false);
      setAutoRevealed(false);
      setSelectedCard(null); // Clear visual selection
    };    const handleRoleChanged = (data: any) => {
      console.log('User role changed:', data);
      // Force re-render by clearing and refetching votes
      if (currentStory) {
        fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    };

    const handleVotingReset = (data: any) => {
      console.log('Voting reset for story:', data.userStoryId);
      // If this is the current story, clear all votes
      if (currentStory && currentStory.id === data.userStoryId) {
        setVotes([]);
        setMyVote(null);
        setVotesRevealed(false);
        setAutoRevealed(false);
      }
    };

    const handleReactionSent = (data: { emoji: string; userName: string }) => {
      console.log('Received reaction from', data.userName, ':', data.emoji);
      if (reactionsEnabled) {
        createFallingEmoji(data.emoji);
      }
    };

    const handleReactionsToggled = (data: { enabled: boolean }) => {
      setReactionsEnabled(data.enabled);
    };

    socket.on('vote-submitted', handleVoteSubmitted);
    socket.on('votes-revealed', handleVotesRevealed);
    socket.on('votes-cleared', handleVotesCleared);
    socket.on('voting-reset', handleVotingReset);
    socket.on('role-changed', handleRoleChanged);
    socket.on('reaction-sent', handleReactionSent);
    socket.on('reactions-toggled', handleReactionsToggled);

    return () => {
      socket.off('vote-submitted', handleVoteSubmitted);
      socket.off('votes-revealed', handleVotesRevealed);
      socket.off('votes-cleared', handleVotesCleared);
      socket.off('voting-reset', handleVotingReset);
      socket.off('role-changed', handleRoleChanged);
      socket.off('reaction-sent', handleReactionSent);
      socket.off('reactions-toggled', handleReactionsToggled);
    };
  }, [socket, currentStory?.id]);

  // Initialize card fan layout with hover animations
  useEffect(() => {
    if (!currentUser?.isSpectator && !isCreator && !votesRevealed && cardsRef.current.length > 0) {
      const totalCards = CARD_VALUES.length;
      const angleStep = 12; // Increased degrees between cards for better spacing
      const startAngle = -((totalCards - 1) * angleStep) / 2;
      const radius = 300; // Reduced radius for better positioning
      const verticalOffset = 50; // Additional vertical offset to separate cards better

      cardsRef.current.forEach((card, index) => {
        if (card) {
          const angle = startAngle + index * angleStep;
          const isSelected = selectedCard === index;
          
          // Calculate position in arc with improved spacing
          const radian = (angle * Math.PI) / 180;
          const x = Math.sin(radian) * radius;
          const y = (Math.cos(radian) * radius * 0.6) - radius + verticalOffset; // Reduced arc depth and added offset
          
          // Set initial position and rotation with better spacing
          const baseTransform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
          card.style.transform = isSelected ? `${baseTransform} translateY(-60px) scale(1.15)` : baseTransform;
          card.style.zIndex = String(isSelected ? 200 : 10 + index);
          
          // Force position to avoid overlap
          card.style.position = 'absolute';
          card.style.left = '50%';
          card.style.bottom = '20px';
          card.style.marginLeft = '-50px'; // Half of card width for centering

          // Store base transform for animations
          card.dataset.baseTransform = baseTransform;
          card.dataset.angle = String(angle);

          // Remove old listeners if any
          const oldMouseEnter = (card as any)._mouseEnterHandler;
          const oldMouseLeave = (card as any)._mouseLeaveHandler;
          if (oldMouseEnter) card.removeEventListener('mouseenter', oldMouseEnter);
          if (oldMouseLeave) card.removeEventListener('mouseleave', oldMouseLeave);

          // Mouse enter animation
          const handleMouseEnter = () => {
            if (selectedCard !== index) {
              anime.animate(card, {
                translateY: [0, -40],
                scale: [1, 1.05],
                duration: 400,
                easing: 'out-expo',
              });
              card.style.zIndex = '100';
            }
          };

          // Mouse leave animation
          const handleMouseLeave = () => {
            if (selectedCard !== index) {
              anime.animate(card, {
                translateY: [-40, 0],
                scale: [1.05, 1],
                duration: 400,
                easing: 'out-expo',
              });
              card.style.zIndex = String(index);
            }
          };

          // Store handlers for cleanup
          (card as any)._mouseEnterHandler = handleMouseEnter;
          (card as any)._mouseLeaveHandler = handleMouseLeave;

          card.addEventListener('mouseenter', handleMouseEnter);
          card.addEventListener('mouseleave', handleMouseLeave);
        }
      });

      // Cleanup function
      return () => {
        cardsRef.current.forEach(card => {
          if (card) {
            const mouseEnter = (card as any)._mouseEnterHandler;
            const mouseLeave = (card as any)._mouseLeaveHandler;
            if (mouseEnter) card.removeEventListener('mouseenter', mouseEnter);
            if (mouseLeave) card.removeEventListener('mouseleave', mouseLeave);
          }
        });
      };
    }
  }, [currentUser?.isSpectator, isCreator, votesRevealed, selectedCard]);

  const fetchVotes = async () => {
    if (!currentStory) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${currentStory.id}/votes`);
      if (response.ok) {
        const fetchedVotes = await response.json();
        console.log('Fetched votes:', fetchedVotes); // Debug line
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
          userName: currentUser.name,
          points: points
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMyVote(points);
        
        // Emit WebSocket event with auto-reveal information
        if (socket) {
          socket.emit('vote-submitted', {
            sessionId,
            vote: result.vote || result, // Support both new and old API response
            userId: currentUser.id,
            userName: currentUser.name,
            shouldAutoReveal: result.shouldAutoReveal,
            allVotes: result.allVotes
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
        setSelectedCard(null); // Clear visual selection

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

  const createFallingEmoji = (emoji: string) => {
    console.log('Creating falling emoji:', emoji);
    
    // Use body or main container to cover full screen
    const container = document.body;
    if (!container) {
      console.warn('Body container not found');
      return;
    }

    const emojiElement = document.createElement('div');
    emojiElement.textContent = emoji;
    emojiElement.className = 'falling-emoji-fullscreen';
    
    // Random horizontal position across full screen width
    const randomX = Math.random() * (window.innerWidth - 50);
    emojiElement.style.left = `${randomX}px`;
    
    container.appendChild(emojiElement);
    console.log('Emoji added to body, starting fullscreen animation');

    // Remove after animation completes
    setTimeout(() => {
      if (emojiElement.parentNode) {
        emojiElement.parentNode.removeChild(emojiElement);
        console.log('Emoji removed after fullscreen animation');
      }
    }, 4000);
  };

  const sendReaction = (emoji: string) => {
    if (!currentUser || !socket || !reactionsEnabled) return;

    console.log('Sending reaction:', emoji);

    // Create local falling animation immediately
    createFallingEmoji(emoji);

    // Update reaction counter with visual feedback
    setReactionCount(prev => prev + 1);
    
    // Reset counter after 3 seconds
    if (reactionCountTimeoutRef.current) {
      clearTimeout(reactionCountTimeoutRef.current);
    }
    reactionCountTimeoutRef.current = setTimeout(() => {
      setReactionCount(0);
    }, 3000);

    // Emit WebSocket event to others
    socket.emit('reaction-sent', {
      sessionId,
      emoji,
      userId: currentUser.id,
      userName: currentUser.name
    });
  };

  const toggleReactions = () => {
    if (!isCreator || !socket) return;

    const newState = !reactionsEnabled;
    setReactionsEnabled(newState);

    // Emit WebSocket event
    socket.emit('reactions-toggled', {
      sessionId,
      enabled: newState
    });
  };

  if (!currentStory) {
    return (
      <div className="voting-panel">
        <div className="no-story">
          <h3>🗳️ Voting</h3>
          <p>No story selected for estimation.</p>
          <p>The session creator needs to select a story to start voting.</p>
        </div>

        {/* Reactions Section - Always available */}
        {!currentUser?.isSpectator && reactionsEnabled && (
          <div className="reactions-section">
            <div className="reactions-header">
              <h4>React to the session:</h4>
              {reactionCount > 0 && (
                <div className="reaction-counter">
                  +{reactionCount} 🎉
                </div>
              )}
            </div>
            <div className="reaction-emojis">
              {REACTION_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  className="reaction-emoji"
                  onClick={(e) => {
                    // Visual feedback on click
                    const button = e.currentTarget;
                    button.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                      button.style.transform = '';
                    }, 150);
                    
                    sendReaction(emoji);
                  }}
                  title={`Send ${emoji} reaction - Click multiple times for more!`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Admin Controls - Always available */}
        {isCreator && (
          <div className="admin-controls">
            <button
              className={`btn btn-sm ${reactionsEnabled ? 'btn-warning' : 'btn-success'}`}
              onClick={toggleReactions}
              title={reactionsEnabled ? 'Disable reactions' : 'Enable reactions'}
            >
              {reactionsEnabled ? '🙊 Disable Reactions' : '😍 Enable Reactions'}
            </button>
          </div>
        )}
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
            {CARD_VALUES.map((value, index) => (
              <button
                key={value}
                ref={(el) => { cardsRef.current[index] = el; }}
                className={`voting-card ${myVote === value ? 'selected' : ''}`}
                data-value={value}
                onClick={() => {
                  setSelectedCard(index);
                  submitVote(value);
                }}
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

      {/* Reactions Section */}
      {!currentUser?.isSpectator && reactionsEnabled && (
        <div className="reactions-section">
          <div className="reactions-header">
            <h4>React to the session:</h4>
            {reactionCount > 0 && (
              <div className="reaction-counter">
                +{reactionCount} 🎉
              </div>
            )}
          </div>
          <div className="reaction-emojis">
            {REACTION_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                className="reaction-emoji"
                onClick={(e) => {
                  // Visual feedback on click
                  const button = e.currentTarget;
                  button.style.transform = 'scale(0.8)';
                  setTimeout(() => {
                    button.style.transform = '';
                  }, 150);
                  
                  sendReaction(emoji);
                }}
                title={`Send ${emoji} reaction - Click multiple times for more!`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admin Controls */}
      {isCreator && (
        <div className="admin-controls">
          <button
            className={`btn btn-sm ${reactionsEnabled ? 'btn-warning' : 'btn-success'}`}
            onClick={toggleReactions}
            title={reactionsEnabled ? 'Disable reactions' : 'Enable reactions'}
          >
            {reactionsEnabled ? '🙊 Disable Reactions' : '😍 Enable Reactions'}
          </button>
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
          {votes.map((vote, index) => {
            const isRevealed = vote.isRevealed || votesRevealed;
            const valueClass = isRevealed ? getCardValueClass(vote.points) : '';
            
            return (
              <div
                key={vote.id}
                className={`vote-card ${isRevealed ? 'revealed' : 'hidden'} ${valueClass}`}
              >
                {isRevealed ? vote.points : '?'}
                <div className="vote-user">{vote.userName?.trim() || 'Usuario'}</div>
              </div>
            );
          })}
        </div>
        
        <div className="vote-summary">
          {votes.length} vote{votes.length !== 1 ? 's' : ''} submitted
          {!votesRevealed && votes.length > 0 && (
            <div className="voters-list">
              <small>Voted: {votes.map(vote => vote.userName?.trim() || 'Usuario').join(', ')}</small>
            </div>
          )}
        </div>
      </div>

      {/* Results Section - ONLY shown to ALL users when votes are revealed */}
      {votesRevealed && votes.length > 0 && (
        <div className="vote-results">
          <h4>
            📊 Results:
            {autoRevealed && (
              <span className="auto-reveal-indicator" title="Votes revealed automatically when all players voted">
                {" "}⚡ Auto-revealed
              </span>
            )}
          </h4>
          
          {/* Unified Voting Metrics */}
          <div className="voting-metrics">
            <div className="metrics-summary">
              <span className="metric-item">
                📈 Total Votes: <strong>{votes.length}</strong>
              </span>
              {(() => {
                const numericVotes = votes
                  .map(vote => parseFloat(vote.points))
                  .filter(value => !isNaN(value));
                
                if (numericVotes.length > 0) {
                  const average = (numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length).toFixed(1);
                  return (
                    <span className="metric-item">
                      🎯 Average: <strong>{average} points</strong>
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          
          {/* Detailed Vote Breakdown */}
          <div className="results-breakdown">
            <h5>📋 Vote Distribution:</h5>
            <div className="results-summary">
              {(() => {
                const pointCounts = votes.reduce((acc: { [key: string]: number }, vote) => {
                  acc[vote.points] = (acc[vote.points] || 0) + 1;
                  return acc;
                }, {});
                
                return Object.entries(pointCounts)
                  .sort(([a], [b]) => {
                    // Sort numerically if both are numbers, otherwise alphabetically
                    const numA = parseFloat(a);
                    const numB = parseFloat(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                      return numA - numB;
                    }
                    return a.localeCompare(b);
                  })
                  .map(([points, count]) => (
                    <span key={points} className="result-item">
                      {points}: {count} vote{count !== 1 ? 's' : ''}
                    </span>
                  ));
              })()}
            </div>
          </div>
        </div>
      )}

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