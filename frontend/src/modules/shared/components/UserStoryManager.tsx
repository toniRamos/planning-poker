import React, { useEffect, useRef, useState } from 'react';
import { Icon, ICONS } from '../../../components/Icons';
import './UserStoryManager.css';

interface UserStory {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  tags?: string[];
  order: number;
  estimatedPoints?: string;
  isRevealed: boolean;
  isScored: boolean;
  createdAt: string;
}

interface UserStoryManagerProps {
  sessionId: string;
  isCreator: boolean;
  currentStoryId?: string;
  onStoryChange?: () => void;
  socket?: any;
  sessionClosed?: boolean;
  onSessionClose?: () => void;
}

const isUrl = (s: string): boolean => /^https?:\/\//i.test(s);

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

export const UserStoryManager: React.FC<UserStoryManagerProps> = ({
  sessionId,
  isCreator,
  currentStoryId,
  onStoryChange,
  socket,
  sessionClosed = false,
  onSessionClose
}) => {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStory, setNewStory] = useState<{ title: string; tags: string[] }>({ title: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchUserStories();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showAddForm) titleInputRef.current?.focus();
  }, [showAddForm]);

  useEffect(() => {
    if (!socket) return;

    const handleUserStoryUpdated = (data: any) => {
      switch (data.action) {
        case 'added':
          setUserStories(prev => [...prev, data.userStory]);
          break;
        case 'updated':
          setUserStories(prev => prev.map(s => s.id === data.userStory.id ? data.userStory : s));
          break;
        case 'deleted':
          setUserStories(prev => prev.filter(s => s.id !== data.userStoryId));
          break;
        case 'reordered':
          setUserStories(data.userStories);
          break;
        default:
          fetchUserStories();
      }
    };

    const handleCurrentStoryChanged = () => onStoryChange?.();

    const handleStoryRevealed = (data: any) => {
      setUserStories(prev => prev.map(s =>
        s.id === data.userStory.id ? { ...s, isRevealed: true, estimatedPoints: data.userStory.estimatedPoints } : s
      ));
    };

    const handleRoleChanged = () => {
      fetchUserStories();
      onStoryChange?.();
    };

    const handleStoryScoreToggled = (data: any) => {
      setUserStories(prev => prev.map(s =>
        s.id === data.userStory.id ? { ...s, isScored: data.userStory.isScored, estimatedPoints: data.userStory.estimatedPoints } : s
      ));
    };

    const handleVotingReset = (data: any) => {
      setUserStories(prev => prev.map(s =>
        s.id === data.userStoryId ? { ...s, isRevealed: false, estimatedPoints: undefined } : s
      ));
      if (currentStoryId === data.userStoryId) onStoryChange?.();
    };

    const handleVotesRevealed = (data: any) => {
      if (data.userStory) {
        setUserStories(prev => prev.map(s =>
          s.id === data.userStory.id ? { ...s, isRevealed: true, estimatedPoints: data.userStory.estimatedPoints } : s
        ));
      }
    };

    socket.on('user-story-updated', handleUserStoryUpdated);
    socket.on('current-story-changed', handleCurrentStoryChanged);
    socket.on('story-revealed', handleStoryRevealed);
    socket.on('story-score-toggled', handleStoryScoreToggled);
    socket.on('voting-reset', handleVotingReset);
    socket.on('votes-revealed', handleVotesRevealed);
    socket.on('role-changed', handleRoleChanged);

    return () => {
      socket.off('user-story-updated', handleUserStoryUpdated);
      socket.off('current-story-changed', handleCurrentStoryChanged);
      socket.off('story-revealed', handleStoryRevealed);
      socket.off('story-score-toggled', handleStoryScoreToggled);
      socket.off('voting-reset', handleVotingReset);
      socket.off('votes-revealed', handleVotesRevealed);
      socket.off('role-changed', handleRoleChanged);
    };
  }, [socket, onStoryChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserStories = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories`);
      if (response.ok) {
        const stories = await response.json();
        setUserStories(stories);
      }
    } catch (error) {
      console.error('Error fetching user stories:', error);
    }
  };

  const addUserStory = async () => {
    if (!newStory.title.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStory)
      });
      if (response.ok) {
        const added = await response.json();
        setUserStories(prev => [...prev, added]);
        setNewStory({ title: '', tags: [] });
        setTagInput('');
        setShowAddForm(false);
        if (socket) socket.emit('user-story-added', { sessionId, userStory: added });
      }
    } catch (error) {
      console.error('Error adding user story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentStory = async (storyId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${storyId}/set-current`, {
        method: 'PUT'
      });
      if (response.ok) {
        onStoryChange?.();
        if (socket) socket.emit('current-story-changed', { sessionId, currentStoryId: storyId });
      }
    } catch (error) {
      console.error('Error setting current story:', error);
    }
  };

  const reorderStories = async (newOrder: UserStory[]) => {
    const userStoryOrders = newOrder.map((story, index) => ({ id: story.id, order: index }));
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStoryOrders })
      });
      if (response.ok) {
        setUserStories(newOrder);
        if (socket) socket.emit('user-stories-reordered', { sessionId, userStories: newOrder });
      }
    } catch (error) {
      console.error('Error reordering stories:', error);
    }
  };

  const deleteUserStory = async (storyId: string) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${storyId}`, { method: 'DELETE' });
      if (response.ok) {
        setUserStories(prev => prev.filter(s => s.id !== storyId));
        if (socket) socket.emit('user-story-deleted', { sessionId, userStoryId: storyId });
      }
    } catch (error) {
      console.error('Error deleting user story:', error);
    }
  };

  const toggleUserStoryScore = async (storyId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${storyId}/toggle-score`, {
        method: 'PUT'
      });
      if (response.ok) {
        const updated = await response.json();
        setUserStories(prev => prev.map(s => s.id === storyId ? updated : s));
        if (socket) socket.emit('story-score-toggled', { sessionId, userStory: updated });
      }
    } catch (error) {
      console.error('Error toggling user story score:', error);
    }
  };

  const resetUserStoryVoting = async (storyId: string) => {
    if (!window.confirm('Re-estimate this story? All current votes will be deleted.')) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${storyId}/reset-voting`, {
        method: 'PUT'
      });
      if (response.ok) {
        const updated = await response.json();
        setUserStories(prev => prev.map(s => s.id === storyId ? updated : s));
        if (socket) socket.emit('voting-reset', { sessionId, userStoryId: storyId });
        if (currentStoryId === storyId) onStoryChange?.();
      }
    } catch (error) {
      console.error('Error resetting user story voting:', error);
    }
  };

  const closeSession = async () => {
    if (!window.confirm('Close this session? This action cannot be undone and will lock the session permanently.')) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}/close`, { method: 'PUT' });
      if (response.ok) {
        if (socket) socket.emit('session-closed', { sessionId });
        onSessionClose?.();
      }
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const handleDragStart = (index: number) => setDraggedItem(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;
    const next = [...userStories];
    const moved = next[draggedItem];
    next.splice(draggedItem, 1);
    next.splice(dropIndex, 0, moved);
    setDraggedItem(null);
    reorderStories(next);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!newStory.tags.includes(t)) setNewStory({ ...newStory, tags: [...newStory.tags, t] });
    setTagInput('');
  };

  return (
    <>
      <div className="panel-header">
        <h3>
          Stories <span className="count">{userStories.length}</span>
        </h3>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {sessionClosed ? (
            <span className="badge badge-danger badge-dot">
              <Icon name={ICONS.lock} size={11} /> Closed
            </span>
          ) : (
            isCreator && (
              <>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setShowAddForm(true)}
                  title="Add story"
                  aria-label="Add story"
                >
                  <Icon name={ICONS.plus} size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-danger"
                  onClick={closeSession}
                  title="Close session"
                  aria-label="Close session"
                >
                  <Icon name={ICONS.lock} size={14} />
                </button>
              </>
            )
          )}
        </div>
      </div>

      <div className="panel-body">
        {showAddForm && (
          <div className="story-inline-form">
            <input
              ref={titleInputRef}
              type="text"
              className="input"
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              placeholder="Story URL or title…"
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStory.title.trim()) { e.preventDefault(); addUserStory(); }
                if (e.key === 'Escape') setShowAddForm(false);
              }}
            />
            {newStory.tags.length > 0 && (
              <div className="tags-chips">
                {newStory.tags.map((tag, i) => (
                  <span key={i} className="tag-chip">
                    #{tag}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => setNewStory({ ...newStory, tags: newStory.tags.filter((_, idx) => idx !== i) })}
                      aria-label="Remove tag"
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              className="input"
              style={{ fontSize: 12.5 }}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag and press Enter (optional)"
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); addTag(); }
              }}
            />
            <div className="inline-actions">
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => { setShowAddForm(false); setNewStory({ title: '', tags: [] }); setTagInput(''); }}
              >Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={addUserStory}
                disabled={isLoading || !newStory.title.trim()}
              >
                {isLoading ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {userStories.length === 0 && !showAddForm ? (
          <div className="story-empty">
            <div className="glyph"><Icon name={ICONS.clipboard} size={18} /></div>
            <h4>No stories yet</h4>
            <p>{isCreator ? 'Add your first story to start estimating.' : 'Waiting for admin to add stories…'}</p>
          </div>
        ) : (
          <>
            {userStories.map((story, index) => {
              const isCurrent = currentStoryId === story.id;
              const titleAsUrl = isUrl(story.title);
              return (
                <div
                  key={story.id}
                  className={`story-item ${isCurrent ? 'current' : ''}`}
                  draggable={isCreator && !sessionClosed}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => {
                    if (isCreator && !sessionClosed && !isCurrent) setCurrentStory(story.id);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div className="title">
                      <span style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, marginRight: 6 }}>
                        #{story.order + 1}
                      </span>
                      {titleAsUrl ? (
                        <a
                          href={story.title}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {displayStoryTitle(story.title)}
                        </a>
                      ) : story.title}
                    </div>
                    {story.estimatedPoints != null && (
                      <div className="points-chip">{story.estimatedPoints}</div>
                    )}
                  </div>

                  {story.tags && story.tags.length > 0 && (
                    <div className="tags">
                      {story.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="meta">
                    {story.isRevealed ? (
                      <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name={ICONS.check} size={11} /> Estimated
                      </span>
                    ) : isCurrent ? (
                      <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                        Estimating
                      </span>
                    ) : (
                      <span>Pending</span>
                    )}
                    {story.isScored && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name={ICONS.checkCircle} size={11} style={{ color: 'var(--success)' }} /> Scored
                      </span>
                    )}
                  </div>

                  {isCreator && !sessionClosed && (
                    <div
                      className="row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isCurrent && (
                        <button
                          className="btn btn-sm"
                          onClick={() => setCurrentStory(story.id)}
                        >
                          <Icon name={ICONS.caretRight} size={11} /> Estimate
                        </button>
                      )}
                      {isCurrent && (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => resetUserStoryVoting(story.id)}
                          title="Reset votes"
                        >
                          <Icon name={ICONS.refresh} size={11} /> Reset
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${story.isScored ? 'btn-success' : ''}`}
                        onClick={() => toggleUserStoryScore(story.id)}
                        title={story.isScored ? 'Mark as not scored' : 'Mark as scored'}
                      >
                        <Icon name={story.isScored ? ICONS.checkCircle : ICONS.check} size={11} />
                        {story.isScored ? 'Scored' : 'Mark'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteUserStory(story.id)}
                        title="Delete story"
                      >
                        <Icon name={ICONS.trash} size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isCreator && !sessionClosed && !showAddForm && (
              <button className="add-story-btn" onClick={() => setShowAddForm(true)}>
                <Icon name={ICONS.plus} size={12} /> Add story
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
};
