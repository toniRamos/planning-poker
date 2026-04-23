import React, { useEffect, useRef, useState } from 'react';
import { Icon, ICONS } from '../../../components/Icons';
import Card3D from '../../../components/Card3D';
import Avatar from '../../../components/Avatar';
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
  tags?: string[];
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
  sessionClosed?: boolean;
  onCopyLink?: () => void;
}

const CARD_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
const REACTION_EMOJIS = ['💩', '👀', '💔', '💯', '😍', '🔪', '🍆', '👍', '👎'];

const isUrl = (s: string) => /^https?:\/\//i.test(s);
const displayStoryTitle = (raw: string): string => {
  if (!isUrl(raw)) return raw;
  try {
    const u = new URL(raw);
    const pathSegs = u.pathname.split('/').filter(Boolean);
    const last = pathSegs[pathSegs.length - 1];
    if (last) return `${u.hostname}${pathSegs.length ? '/' + last : ''}`;
    return u.hostname;
  } catch {
    return raw;
  }
};

export const VotingPanel: React.FC<VotingPanelProps> = ({
  sessionId,
  currentUser,
  currentStory,
  isCreator,
  socket,
  onRevealVotes,
  sessionClosed,
  onCopyLink
}) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [votesRevealed, setVotesRevealed] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(false);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [reactionCount, setReactionCount] = useState(0);
  const [flippingAll, setFlippingAll] = useState(false);
  const reactionCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentStory) {
      setVotesRevealed(false);
      setAutoRevealed(false);
      setMyVote(null);
      fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
    } else {
      setVotes([]);
      setMyVote(null);
      setVotesRevealed(false);
      setAutoRevealed(false);
    }
  }, [currentStory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (votesRevealed) {
      setFlippingAll(true);
      const id = setTimeout(() => setFlippingAll(false), 700);
      return () => clearTimeout(id);
    }
  }, [votesRevealed]);

  useEffect(() => {
    if (!socket) return;

    const handleVoteSubmitted = (data: any) => {
      if (data.userStoryId === currentStory?.id) fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
    };

    const handleVotesRevealed = (data: any) => {
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
    };

    const handleRoleChanged = () => {
      if (currentStory) fetchVotes(); // eslint-disable-line react-hooks/exhaustive-deps
    };

    const handleVotingReset = (data: any) => {
      if (currentStory && currentStory.id === data.userStoryId) {
        setVotes([]);
        setMyVote(null);
        setVotesRevealed(false);
        setAutoRevealed(false);
      }
    };

    const handleReactionSent = (data: { emoji: string; userName: string }) => {
      if (reactionsEnabled) createFallingEmoji(data.emoji);
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
  }, [socket, currentStory?.id, reactionsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVotes = async () => {
    if (!currentStory) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${currentStory.id}/votes`);
      if (response.ok) {
        const fetched = await response.json();
        setVotes(fetched);
        if (fetched.length > 0) {
          const allRevealed = fetched.every((v: Vote) => v.isRevealed);
          if (allRevealed && fetched[0].isRevealed) setVotesRevealed(true);
        }
        if (currentUser) {
          const userVote = fetched.find((v: Vote) => v.userId === currentUser.id);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, userName: currentUser.name, points })
      });
      if (response.ok) {
        const result = await response.json();
        setMyVote(points);
        if (socket) {
          socket.emit('vote-submitted', {
            sessionId,
            vote: result.vote || result,
            userId: currentUser.id,
            userName: currentUser.name,
            shouldAutoReveal: result.shouldAutoReveal,
            allVotes: result.allVotes
          });
        }
        await fetchVotes();
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
        method: 'PUT'
      });
      if (response.ok) {
        const result = await response.json();
        const revealed = result.votes || result;
        const userStory = result.userStory;
        setVotesRevealed(true);
        setVotes(revealed);
        if (socket) {
          socket.emit('votes-revealed', {
            sessionId,
            userStoryId: currentStory.id,
            votes: revealed,
            userStory
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
        method: 'DELETE'
      });
      if (response.ok) {
        setVotes([]);
        setMyVote(null);
        setVotesRevealed(false);
        if (socket) socket.emit('votes-cleared', { sessionId, userStoryId: currentStory.id });
      }
    } catch (error) {
      console.error('Error clearing votes:', error);
    }
  };

  const createFallingEmoji = (emoji: string) => {
    const container = document.body;
    if (!container) return;
    const el = document.createElement('div');
    el.textContent = emoji;
    el.className = 'falling-emoji-fullscreen';
    el.style.setProperty('--drift', `${Math.random() * 80 - 40}px`);
    const randomX = Math.random() * (window.innerWidth - 60);
    el.style.left = `${randomX}px`;
    container.appendChild(el);
    setTimeout(() => { el.parentNode && el.parentNode.removeChild(el); }, 3800);
  };

  const sendReaction = (emoji: string) => {
    if (!currentUser || !socket || !reactionsEnabled) return;
    createFallingEmoji(emoji);
    setReactionCount(prev => prev + 1);
    if (reactionCountTimeoutRef.current) clearTimeout(reactionCountTimeoutRef.current);
    reactionCountTimeoutRef.current = setTimeout(() => setReactionCount(0), 3000);
    socket.emit('reaction-sent', {
      sessionId, emoji, userId: currentUser.id, userName: currentUser.name
    });
  };

  const toggleReactions = () => {
    if (!isCreator || !socket) return;
    const next = !reactionsEnabled;
    setReactionsEnabled(next);
    socket.emit('reactions-toggled', { sessionId, enabled: next });
  };

  const votedCount = votes.length;
  const isViewer = !!currentUser?.isSpectator;

  // Metrics calculations
  const numericVotes = votes.map(v => parseFloat(v.points)).filter(n => !isNaN(n));
  const average = numericVotes.length ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) : null;
  const sorted = [...numericVotes].sort((a, b) => a - b);
  const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const consensus = votes.length > 0 && new Set(votes.map(v => v.points)).size === 1;
  const showDiscuss = votesRevealed && numericVotes.length >= 2 && (max - min) >= 5;

  // Distribution
  const counts: Record<string, number> = {};
  votes.forEach(v => { counts[v.points] = (counts[v.points] || 0) + 1; });
  const maxCount = Math.max(1, ...Object.values(counts));
  const distributionValues = Object.keys(counts).sort((a, b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return a.localeCompare(b);
  });

  // No story selected state
  if (!currentStory) {
    return (
      <div className="stage stage-panel">
        <div className="reveal-area">
          <div className="empty-stage">
            <div className="glyph"><Icon name={ICONS.cardDeck} size={22} /></div>
            <h3>Ready to vote</h3>
            <p>
              {isCreator
                ? 'Select a story from the left panel to start a round.'
                : 'Waiting for the admin to pick a story.'}
            </p>
          </div>
        </div>

        <div className="stage-footer">
          {!isViewer && reactionsEnabled && !sessionClosed ? (
            <div className="reactions-bar">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="reaction-btn"
                  onClick={() => sendReaction(emoji)}
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
              {reactionCount > 0 && (
                <span className="reaction-count-badge">
                  +{reactionCount} <Icon name={ICONS.confetti} size={11} />
                </span>
              )}
            </div>
          ) : <span />}
          {isCreator && (
            <button
              className={`btn btn-sm ${reactionsEnabled ? 'btn-warning' : 'btn-success'}`}
              onClick={toggleReactions}
            >
              <Icon name={reactionsEnabled ? ICONS.eyeSlash : ICONS.smiley} size={12} />
              {reactionsEnabled ? 'Disable reactions' : 'Enable reactions'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const titleAsUrl = isUrl(currentStory.title);

  return (
    <div className="stage stage-panel">
      <div className="stage-header">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eyebrow">
            {votesRevealed ? 'Revealed' : 'Estimating'}
            {!votesRevealed && ` · ${votedCount} vote${votedCount === 1 ? '' : 's'}`}
            {autoRevealed && votesRevealed && <> · <Icon name={ICONS.lightning} size={10} /> auto</>}
          </div>
          <h2>
            {titleAsUrl ? (
              <a href={currentStory.title} target="_blank" rel="noopener noreferrer">
                {displayStoryTitle(currentStory.title)}
              </a>
            ) : currentStory.title}
          </h2>
          {currentStory.description && <div className="desc">{currentStory.description}</div>}
          {currentStory.tags && currentStory.tags.length > 0 && (
            <div className="stage-meta">
              {currentStory.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
            </div>
          )}
        </div>

        <div className="actions">
          {onCopyLink && (
            <button className="btn btn-sm" onClick={onCopyLink}>
              <Icon name={ICONS.link} size={12} /> Copy link
            </button>
          )}
          {isCreator && !sessionClosed && (
            !votesRevealed ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={revealVotes}
                disabled={votedCount === 0}
              >
                <Icon name={ICONS.eye} size={12} /> Reveal votes
              </button>
            ) : (
              <button className="btn btn-sm" onClick={clearVotes}>
                <Icon name={ICONS.refresh} size={12} /> New round
              </button>
            )
          )}
        </div>
      </div>

      <div className="reveal-area">
        <div className="reveal-inner">
          {!votesRevealed ? (
            <>
              {!isViewer && !isCreator && !sessionClosed && (
                <div className="card-grid-wrap">
                  <div className="hint">
                    {myVote ? (
                      <>
                        <Icon name={ICONS.check} size={12} /> Voted — <strong>{myVote}</strong>
                      </>
                    ) : 'Pick your estimate'}
                    <div className="hint-sub">Tap a card. You can change your mind until reveal.</div>
                  </div>
                  <div className="card-grid">
                    {CARD_VALUES.map(v => (
                      <Card3D
                        key={v}
                        value={v}
                        selected={myVote === v}
                        onClick={() => !isLoading && submitVote(v)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {(isCreator || isViewer) && (
                <div className="empty-stage">
                  <div className="glyph"><Icon name={ICONS.hourglass} size={22} /></div>
                  <h3>{votedCount} vote{votedCount === 1 ? '' : 's'} in</h3>
                  <p>
                    {isCreator
                      ? 'Waiting for players. Reveal whenever you’re ready.'
                      : 'You’re observing. Votes will reveal once the admin decides.'}
                  </p>
                </div>
              )}

              {votes.length > 0 && !isCreator && !isViewer && (
                <div style={{ fontSize: 12.5, color: 'var(--fg-dim)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--fg-muted)' }}>{votedCount}</strong> submitted ·
                  <span style={{ marginLeft: 4 }}>{votes.map(v => v.userName?.trim() || 'User').join(', ')}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="reveal-grid">
                {votes.map((vote, idx) => (
                  <div
                    key={vote.id}
                    className="vote-card-wrap"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <Card3D value={vote.points} flipping={flippingAll} />
                    <div className="vote-user-name">{vote.userName?.trim() || 'User'}</div>
                  </div>
                ))}
              </div>

              <div className="metrics">
                <div className="metric">
                  <div className="label">Average</div>
                  <div className="value accent">
                    {average != null ? Math.round(average * 10) / 10 : '—'}
                  </div>
                  <div className="sub">points</div>
                </div>
                <div className="metric">
                  <div className="label">Median</div>
                  <div className="value">{median != null ? median : '—'}</div>
                </div>
                <div className="metric">
                  <div className="label">Spread</div>
                  <div className="value">
                    {min != null && max != null ? `${min}–${max}` : '—'}
                  </div>
                </div>
                <div className="metric">
                  <div className="label">Consensus</div>
                  <div className="value">{consensus ? '✓' : '—'}</div>
                  <div className="sub">{votes.length} votes</div>
                </div>
              </div>

              <div className="distribution">
                <div className="distribution-title">
                  <span>Distribution</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{votes.length} total</span>
                </div>
                {distributionValues.map(v => (
                  <div className="dist-row" key={v}>
                    <span className="val">{v}</span>
                    <div className="bar-wrap">
                      <div className="bar" style={{ width: `${(counts[v] / maxCount) * 100}%` }} />
                    </div>
                    <span className="count">{counts[v]}</span>
                  </div>
                ))}
              </div>

              {showDiscuss && (
                <div className="discuss-banner">
                  <div className="glyph"><Icon name={ICONS.sparkle} size={14} /></div>
                  <div className="copy">
                    <strong>Let's discuss</strong>
                    <span>Estimates are spread out. A brief discussion may help align.</span>
                  </div>
                  {isCreator && (
                    <button className="btn btn-sm" onClick={clearVotes}>
                      Re-estimate
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="stage-footer">
        {!isViewer && reactionsEnabled && !sessionClosed ? (
          <div className="reactions-bar">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="reaction-btn"
                onClick={() => sendReaction(emoji)}
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            {reactionCount > 0 && (
              <span className="reaction-count-badge">
                +{reactionCount} <Icon name={ICONS.confetti} size={11} />
              </span>
            )}
          </div>
        ) : <span />}

        {isCreator && !sessionClosed && (
          <button
            className={`btn btn-sm ${reactionsEnabled ? 'btn-warning' : 'btn-success'}`}
            onClick={toggleReactions}
          >
            <Icon name={reactionsEnabled ? ICONS.eyeSlash : ICONS.smiley} size={12} />
            {reactionsEnabled ? 'Disable reactions' : 'Enable reactions'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VotingPanel;
