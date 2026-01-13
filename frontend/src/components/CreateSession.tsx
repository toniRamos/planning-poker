import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon, ICONS } from './Icons';
import './CreateSession.css';

interface SessionData {
  name: string;
  description: string;
  createdBy: string;
  creatorName: string;
  maxUsers: number;
  allowSpectators: boolean;
}

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SessionData>({
    name: '',
    description: '',
    createdBy: '',
    creatorName: '',
    maxUsers: 10,
    allowSpectators: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.focus();
  }, []);

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

    console.log('Form data:', formData);
    console.log('Submitting to:', '/api/sessions');

    const requestData = {
      name: formData.name,
      description: formData.description,
      createdBy: `creator-${Date.now()}`, // Unique ID for creator
      creatorName: formData.creatorName,
      maxUsers: formData.maxUsers,
      settings: {
        allowSpectators: formData.allowSpectators,
        autoRevealCards: false,
        cardSet: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕']
      }
    };

    console.log('Request payload:', requestData);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to create session');
      }

      const result = await response.json();
      console.log('Success response:', result);
      // Creator goes directly to session with admin role
      navigate(`/session/${result.data.id}?creator=${encodeURIComponent(formData.creatorName)}`);
      
    } catch (err) {
      console.error('Request error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-session-container">
      <Link to="/" className="back-link">
        <Icon name={ICONS.arrowLeft} size={16} /> Back to Home
      </Link>
      
      <div className="create-session-card">
        <h1><Icon name={ICONS.cards} size={32} className="title-icon" /> Create New Session</h1>
        <p className="subtitle">Set up a planning poker session for your team's estimation meeting</p>

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
            <label htmlFor="creatorName">Your Name *</label>
            <input
              id="creatorName"
              name="creatorName"
              type="text"
              value={formData.creatorName}
              onChange={handleInputChange}
              placeholder="Enter your name as session creator"
              required
              maxLength={50}
            />
          </div>

          {error && (
            <div className="error-message">
              <Icon name={ICONS.xCircle} size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`create-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !formData.name.trim() || !formData.creatorName.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating session...
              </>
            ) : (
              <>
                <Icon name={ICONS.rocket} size={18} className="btn-icon" />
                Create Session
              </>
            )}
          </button>
        </form>

        <div className="info-section">
          <h3><Icon name={ICONS.info} size={18} /> What happens next?</h3>
          <ul>
            <li><Icon name={ICONS.target} size={14} /> You'll enter directly as the <strong>Admin</strong> with full control</li>
            <li><Icon name={ICONS.link} size={14} /> Share the session URL with your team members</li>
            <li><Icon name={ICONS.users} size={14} /> Team members choose to join as <strong>Players</strong> (can vote) or <strong>Viewers</strong> (observe only)</li>
            <li><Icon name={ICONS.chart} size={14} /> As Admin, you manage user stories and control when votes are revealed</li>
          </ul>
          
          <div className="role-info">
            <h4><Icon name={ICONS.mask} size={18} /> Roles Explained:</h4>
            <div className="role-cards">
              <div className="role-card admin">
                <span className="role-icon"><Icon name={ICONS.crown} size={24} /></span>
                <div className="role-content">
                  <h5>Admin</h5>
                  <p>Full control over session, stories, and voting reveals</p>
                </div>
              </div>
              <div className="role-card player">
                <span className="role-icon"><Icon name={ICONS.target} size={24} /></span>
                <div className="role-content">
                  <h5>Player</h5>
                  <p>Participates in voting and estimation discussions</p>
                </div>
              </div>
              <div className="role-card viewer">
                <span className="role-icon"><Icon name={ICONS.eye} size={24} /></span>
                <div className="role-content">
                  <h5>Viewer</h5>
                  <p>Observes the session without voting privileges</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;