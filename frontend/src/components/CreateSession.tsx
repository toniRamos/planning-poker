import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateSession.css';

interface SessionData {
  name: string;
  description: string;
  createdBy: string;
  maxUsers: number;
  allowSpectators: boolean;
}

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SessionData>({
    name: '',
    description: '',
    createdBy: '',
    maxUsers: 10,
    allowSpectators: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          createdBy: formData.createdBy,
          maxUsers: formData.maxUsers,
          settings: {
            allowSpectators: formData.allowSpectators,
            autoRevealCards: false,
            cardSet: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕']
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const result = await response.json();
      navigate(`/session/${result.data.id}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-session-container">
      <div className="create-session-card">
        <h1>🃏 Create Planning Poker Session</h1>
        <p className="subtitle">Set up a new session for your team's estimation meeting</p>

        <form onSubmit={handleSubmit} className="create-session-form">
          <div className="form-group">
            <label htmlFor="name">Session Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Sprint 23 Planning"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of what you'll be estimating..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="createdBy">Your Name *</label>
            <input
              id="createdBy"
              name="createdBy"
              type="text"
              value={formData.createdBy}
              onChange={handleInputChange}
              placeholder="Enter your name"
              required
              maxLength={50}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maxUsers">Max Participants</label>
              <input
                id="maxUsers"
                name="maxUsers"
                type="number"
                value={formData.maxUsers}
                onChange={handleInputChange}
                min={2}
                max={50}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  name="allowSpectators"
                  type="checkbox"
                  checked={formData.allowSpectators}
                  onChange={handleInputChange}
                />
                <span className="checkbox-label">Allow Spectators</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="create-button"
            disabled={isLoading || !formData.name.trim() || !formData.createdBy.trim()}
          >
            {isLoading ? '🔄 Creating...' : '🚀 Create Session'}
          </button>
        </form>

        <div className="info-section">
          <h3>What happens next?</h3>
          <ul>
            <li>📝 Your session will be created with a unique ID</li>
            <li>🔗 Share the session link with your team</li>
            <li>👥 Team members can join and start estimating</li>
            <li>⏱️ Sessions remain active until manually closed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;