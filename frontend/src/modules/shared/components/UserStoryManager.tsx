import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import './UserStoryManager.css';

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

interface UserStoryManagerProps {
  sessionId: string;
  isCreator: boolean;
  currentStoryId?: string;
  onStoryChange?: () => void;
  socket?: any; // Socket instance to emit events
}

export const UserStoryManager: React.FC<UserStoryManagerProps> = ({
  sessionId,
  isCreator,
  currentStoryId,
  onStoryChange,
  socket
}) => {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    acceptanceCriteria: ''
  });
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
        story.id === data.userStory.id ? { ...story, isRevealed: true } : story
      ));
    };

    socket.on('user-story-updated', handleUserStoryUpdated);
    socket.on('current-story-changed', handleCurrentStoryChanged);
    socket.on('story-revealed', handleStoryRevealed);

    return () => {
      socket.off('user-story-updated', handleUserStoryUpdated);
      socket.off('current-story-changed', handleCurrentStoryChanged);
      socket.off('story-revealed', handleStoryRevealed);
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
        setNewStory({ title: '', description: '', acceptanceCriteria: '' });
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
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta historia?')) return;

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
        <h3>Historias de Usuario ({userStories.length})</h3>
        {isCreator && (
          <div className="story-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              + Agregar Historia
            </button>
            {currentStoryId && (
              <button 
                className="btn btn-secondary"
                onClick={revealCurrentStory}
              >
                Revelar Estimaciones
              </button>
            )}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="add-story-form">
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              placeholder="Como usuario quiero..."
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={newStory.description}
              onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
              placeholder="Descripción detallada de la funcionalidad"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Criterios de Aceptación</label>
            <textarea
              value={newStory.acceptanceCriteria}
              onChange={(e) => setNewStory({ ...newStory, acceptanceCriteria: e.target.value })}
              placeholder="- Criterio 1&#10;- Criterio 2&#10;- Criterio 3"
              rows={4}
            />
          </div>
          <div className="form-actions">
            <button 
              className="btn btn-primary"
              onClick={addUserStory}
              disabled={isLoading || !newStory.title.trim()}
            >
              {isLoading ? 'Agregando...' : 'Agregar Historia'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setNewStory({ title: '', description: '', acceptanceCriteria: '' });
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="stories-list">
        {userStories.length === 0 ? (
          <div className="empty-state">
            <p>No hay historias de usuario aún.</p>
            {isCreator && (
              <p>Agrega historias para empezar a estimar.</p>
            )}
          </div>
        ) : (
          userStories.map((story, index) => (
            <div
              key={story.id}
              className={`story-item ${currentStoryId === story.id ? 'current' : ''}`}
              draggable={isCreator}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="story-content">
                <div className="story-header-item">
                  <span className="story-order">#{story.order + 1}</span>
                  <h4 className="story-title">{story.title}</h4>
                  {currentStoryId === story.id && (
                    <span className="current-badge">Actual</span>
                  )}
                </div>
                
                {story.description && (
                  <p className="story-description">{story.description}</p>
                )}
                
                {story.acceptanceCriteria && (
                  <div className="acceptance-criteria">
                    <strong>Criterios de Aceptación:</strong>
                    <pre>{story.acceptanceCriteria}</pre>
                  </div>
                )}
                
                {story.estimatedPoints && story.isRevealed && (
                  <div className="story-estimate">
                    <span className="estimate-badge">{story.estimatedPoints}</span>
                  </div>
                )}
              </div>

              {isCreator && (
                <div className="story-actions-item">
                  {currentStoryId !== story.id && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setCurrentStory(story.id)}
                    >
                      Estimar Ahora
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteUserStory(story.id)}
                  >
                    Eliminar
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