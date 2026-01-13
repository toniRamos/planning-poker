import React, { useState, useEffect } from 'react';
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
  socket?: any; // Socket instance to emit events
  sessionClosed?: boolean;
  onSessionClose?: () => void;
}

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
  const [newStory, setNewStory] = useState({
    title: '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    fetchUserStories();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUserStoryUpdated = (data: any) => {
      console.log('User story update received:', data);
      
      switch (data.action) {
        case 'added':
          setUserStories(prev => [...prev, data.userStory]);
          break;
        case 'updated':
          setUserStories(prev => prev.map(story => 
            story.id === data.userStory.id ? data.userStory : story
          ));
          break;
        case 'deleted':
          setUserStories(prev => prev.filter(story => story.id !== data.userStoryId));
          break;
        case 'reordered':
          setUserStories(data.userStories);
          break;
        default:
          // Refresh all stories for unknown actions
          fetchUserStories();
      }
    };

    const handleCurrentStoryChanged = (data: any) => {
      console.log('Current story changed:', data.currentStoryId);
      onStoryChange?.();
    };

    const handleStoryRevealed = (data: any) => {
      console.log('Story revealed:', data.userStory);
      setUserStories(prev => prev.map(story => 
        story.id === data.userStory.id ? { 
          ...story, 
          isRevealed: true,
          estimatedPoints: data.userStory.estimatedPoints 
        } : story
      ));
    };

    const handleRoleChanged = (data: any) => {
      console.log('Role changed, refreshing user story manager:', data);
      // Force re-render by refreshing user stories
      fetchUserStories(); // eslint-disable-line react-hooks/exhaustive-deps
      onStoryChange?.(); // Trigger parent refresh
    };

    const handleStoryScoreToggled = (data: any) => {
      console.log('Story score toggled:', data.userStory);
      setUserStories(prev => prev.map(story => 
        story.id === data.userStory.id ? { 
          ...story, 
          isScored: data.userStory.isScored,
          estimatedPoints: data.userStory.estimatedPoints 
        } : story
      ));
    };

    const handleVotingReset = (data: any) => {
      console.log('Voting reset for story:', data.userStoryId);
      setUserStories(prev => prev.map(story => 
        story.id === data.userStoryId ? { ...story, isRevealed: false, estimatedPoints: undefined } : story
      ));
      // Trigger parent refresh to update voting panel
      if (currentStoryId === data.userStoryId) {
        onStoryChange?.();
      }
    };

    const handleVotesRevealed = (data: any) => {
      console.log('Votes revealed in UserStoryManager:', data);
      if (data.userStory) {
        setUserStories(prev => prev.map(story => 
          story.id === data.userStory.id ? { 
            ...story, 
            isRevealed: true,
            estimatedPoints: data.userStory.estimatedPoints 
          } : story
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStory),
      });

      if (response.ok) {
        const addedStory = await response.json();
        setUserStories([...userStories, addedStory]);
        setNewStory({ title: '', tags: [] });
        setTagInput('');
        setShowAddForm(false);
        
        // Emit WebSocket event to notify other users
        if (socket) {
          socket.emit('user-story-added', {
            sessionId,
            userStory: addedStory
          });
        }
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
        method: 'PUT',
      });

      if (response.ok) {
        // Notify parent component to refresh session data
        onStoryChange?.();
        
        // Emit WebSocket event to notify other users
        if (socket) {
          socket.emit('current-story-changed', {
            sessionId,
            currentStoryId: storyId
          });
        }
      }
    } catch (error) {
      console.error('Error setting current story:', error);
    }
  };

  const revealCurrentStory = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/reveal`, {
        method: 'PUT',
      });

      if (response.ok) {
        await fetchUserStories(); // Refresh to get updated reveal status
        
        // Emit WebSocket event to notify other users
        if (socket && currentStoryId) {
          const currentStory = userStories.find(story => story.id === currentStoryId);
          if (currentStory) {
            socket.emit('story-revealed', {
              sessionId,
              userStory: { ...currentStory, isRevealed: true }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error revealing story:', error);
    }
  };

  const reorderStories = async (newOrder: UserStory[]) => {
    const userStoryOrders = newOrder.map((story, index) => ({
      id: story.id,
      order: index
    }));

    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userStoryOrders }),
      });

      if (response.ok) {
        setUserStories(newOrder);
        
        // Emit WebSocket event to notify other users
        if (socket) {
          socket.emit('user-stories-reordered', {
            sessionId,
            userStories: newOrder
          });
        }
      }
    } catch (error) {
      console.error('Error reordering stories:', error);
    }
  };

  const deleteUserStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${storyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUserStories(userStories.filter(story => story.id !== storyId));
        
        // Emit WebSocket event to notify other users
        if (socket) {
          socket.emit('user-story-deleted', {
            sessionId,
            userStoryId: storyId
          });
        }
      }
    } catch (error) {
      console.error('Error deleting user story:', error);
    }
  };

  const toggleUserStoryScore = async (storyId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${storyId}/toggle-score`, {
        method: 'PUT',
      });

      if (response.ok) {
        const updatedUserStory = await response.json();
        setUserStories(prev => prev.map(story => 
          story.id === storyId ? updatedUserStory : story
        ));
        
        // Emit WebSocket event to notify other users
        if (socket) {
          socket.emit('story-score-toggled', {
            sessionId,
            userStory: updatedUserStory
          });
        }
      }
    } catch (error) {
      console.error('Error toggling user story score:', error);
    }
  };

  const resetUserStoryVoting = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to re-estimate this story? All current votes will be deleted.')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-stories/${storyId}/reset-voting`, {
        method: 'PUT',
      });

      if (response.ok) {
        const updatedUserStory = await response.json();
        setUserStories(prev => prev.map(story => 
          story.id === storyId ? updatedUserStory : story
        ));
        
        // Emit WebSocket event to notify other users
        if (socket) {
          socket.emit('voting-reset', {
            sessionId,
            userStoryId: storyId
          });
        }

        // If this was the current story, refresh it
        if (currentStoryId === storyId) {
          onStoryChange?.();
        }
      }
    } catch (error) {
      console.error('Error resetting user story voting:', error);
    }
  };

  const closeSession = async () => {
    if (!window.confirm('Are you sure you want to close this session? This action cannot be undone and will lock the session permanently.')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/close`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Emit WebSocket event to notify other users
        if (socket) {
          socket.emit('session-closed', {
            sessionId
          });
        }

        onSessionClose?.();
      }
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) return;

    const newStories = [...userStories];
    const draggedStory = newStories[draggedItem];
    
    newStories.splice(draggedItem, 1);
    newStories.splice(dropIndex, 0, draggedStory);
    
    setDraggedItem(null);
    reorderStories(newStories);
  };

  return (
    <div className="user-story-manager">
      <div className="story-header">
        <h3>User Stories ({userStories.length})</h3>
        {isCreator && !sessionClosed && (
          <div className="story-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              + Add Story
            </button>
            <button 
              className="btn btn-danger"
              onClick={closeSession}
            >
              <Icon name={ICONS.lock} size={14} /> Close Session
            </button>
          </div>
        )}
        {sessionClosed && (
          <div className="session-closed-badge">
            <Icon name={ICONS.lock} size={14} /> Session Closed
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="add-story-form">
          <div className="form-group">
            <label>User Story URL *</label>
            <input
              type="text"
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              placeholder="https://jira.example.com/browse/PROJ-123"
              maxLength={500}
            />
          </div>
          
          <div className="form-group">
            <label>Tags (Optional)</label>
            <div className="tags-input-container">
              <div className="tags-list">
                {newStory.tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    {tag}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => {
                        const newTags = newStory.tags.filter((_, i) => i !== index);
                        setNewStory({ ...newStory, tags: newTags });
                      }}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="tag-input-wrapper">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      if (!newStory.tags.includes(tagInput.trim())) {
                        setNewStory({ ...newStory, tags: [...newStory.tags, tagInput.trim()] });
                      }
                      setTagInput('');
                    }
                  }}
                  placeholder="Type a tag and press Enter"
                  maxLength={50}
                />
                {tagInput.trim() && (
                  <button
                    type="button"
                    className="btn-add-tag"
                    onClick={() => {
                      if (!newStory.tags.includes(tagInput.trim())) {
                        setNewStory({ ...newStory, tags: [...newStory.tags, tagInput.trim()] });
                      }
                      setTagInput('');
                    }}
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
            <small className="form-hint">Examples: Epic-UserManagement, Backend, Frontend, Mobile, etc.</small>
          </div>
          
          <div className="form-actions">
            <button 
              className="btn btn-primary"
              onClick={addUserStory}
              disabled={isLoading || !newStory.title.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Story'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setNewStory({ title: '', tags: [] });
                setTagInput('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="stories-list">
        {userStories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name={ICONS.clipboard} size={48} /></div>
            <h4>No stories yet</h4>
            {isCreator ? (
              <>
                <p>Add your first user story to start estimating with your team.</p>
                <button 
                  className="btn btn-primary empty-state-cta"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add First Story
                </button>
              </>
            ) : (
              <p>Waiting for the admin to add stories...</p>
            )}
          </div>
        ) : (
          userStories.map((story, index) => (
            <div
              key={story.id}
              className={`story-item ${currentStoryId === story.id ? 'current' : ''} ${story.isScored ? 'scored' : ''}`}
              draggable={isCreator}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="story-content">
                <div className="story-header-item">
                  <span className="story-order">#{story.order + 1}</span>
                  <a 
                    href={story.title} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`story-title-link ${story.isScored ? 'scored' : ''}`}
                  >
                    {story.title}
                  </a>
                  {story.estimatedPoints && (
                    <span className="estimate-inline"><Icon name={ICONS.chart} size={12} /> {story.estimatedPoints} pts</span>
                  )}
                  {currentStoryId === story.id && (
                    <span className="current-badge">Current</span>
                  )}
                  {story.isScored && (
                    <span className="scored-badge"><Icon name={ICONS.checkCircle} size={12} /> Scored</span>
                  )}
                </div>
                
                {story.tags && story.tags.length > 0 && (
                  <div className="story-tags">
                    {story.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="story-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isCreator && !sessionClosed && (
                <div className="story-actions-item">
                  {currentStoryId !== story.id && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setCurrentStory(story.id)}
                    >
                      Estimate now
                    </button>
                  )}
                  {currentStoryId === story.id && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => resetUserStoryVoting(story.id)}
                      title="Reset votes and re-estimate this story"
                    >
                      <Icon name={ICONS.refresh} size={12} /> Re-estimate
                    </button>
                  )}
                  <button
                    className={`btn btn-sm ${story.isScored ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => toggleUserStoryScore(story.id)}
                    title={story.isScored ? 'Mark as not scored' : 'Mark as scored'}
                  >
                    <Icon name={story.isScored ? ICONS.checkCircle : ICONS.check} size={12} /> {story.isScored ? 'Scored' : 'Mark'}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteUserStory(story.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};