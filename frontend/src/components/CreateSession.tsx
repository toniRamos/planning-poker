import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

    const requestData = {
      name: formData.name,
      description: formData.description,
      createdBy: `creator-${Date.now()}`,
      creatorName: formData.creatorName,
      maxUsers: formData.maxUsers,
      settings: {
        allowSpectators: formData.allowSpectators,
        autoRevealCards: false,
        cardSet: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕']
      }
    };

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const result = await response.json();
      navigate(`/session/${result.data.id}?creator=${encodeURIComponent(formData.creatorName)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-root">
      <Link to="/" className="back-link">
        <Icon name={ICONS.arrowLeft} size={14} /> Back to home
      </Link>

      <div className="create-card">
        <div className="eyebrow">New session</div>
        <h1>Create a planning poker room</h1>
        <p className="subtitle">
          Set up a room for your team’s estimation meeting. You’ll enter as the admin and control the flow.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Session name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              id="name"
              name="name"
              className="input"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Sprint 23 refinement"
              required
              maxLength={100}
            />
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of what you’ll be estimating…"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="field">
            <label htmlFor="creatorName">Your name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              id="creatorName"
              name="creatorName"
              className="input"
              type="text"
              value={formData.creatorName}
              onChange={handleInputChange}
              placeholder="How your team will see you"
              required
              maxLength={50}
            />
            <div className="hint">You’ll join as <strong style={{ color: 'var(--fg)' }}>admin</strong>.</div>
          </div>

          <label className="checkbox-row" htmlFor="allowSpectators">
            <input
              id="allowSpectators"
              name="allowSpectators"
              type="checkbox"
              checked={formData.allowSpectators}
              onChange={handleInputChange}
            />
            <div>
              <div className="label">Allow spectators</div>
              <div className="desc">Non-voting observers can watch the session.</div>
            </div>
          </label>

          {error && (
            <div className="error-message">
              <Icon name={ICONS.xCircle} size={14} /> {error}
            </div>
          )}

          <div className="actions-row">
            <Link to="/" className="btn btn-ghost">Cancel</Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !formData.name.trim() || !formData.creatorName.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Creating…
                </>
              ) : (
                <>
                  <Icon name={ICONS.rocket} size={14} />
                  Create session
                </>
              )}
            </button>
          </div>
        </form>

        <div className="info-section">
          <h3><Icon name={ICONS.info} size={12} /> What happens next?</h3>
          <ul>
            <li><Icon name={ICONS.target} size={14} /> You enter directly as the <strong>Admin</strong> with full control.</li>
            <li><Icon name={ICONS.link} size={14} /> Share the session URL with your team.</li>
            <li><Icon name={ICONS.users} size={14} /> Teammates join as <strong>Players</strong> (vote) or <strong>Viewers</strong> (observe only).</li>
            <li><Icon name={ICONS.chart} size={14} /> As admin, you manage stories and reveal votes when ready.</li>
          </ul>

          <div className="role-info">
            <h4><Icon name={ICONS.mask} size={12} /> Roles</h4>
            <div className="role-cards">
              <div className="role-card admin">
                <div className="role-icon"><Icon name={ICONS.crown} size={18} /></div>
                <h5>Admin</h5>
                <p>Full control over the session, stories and reveals.</p>
              </div>
              <div className="role-card player">
                <div className="role-icon"><Icon name={ICONS.target} size={18} /></div>
                <h5>Player</h5>
                <p>Participates in voting and estimation.</p>
              </div>
              <div className="role-card viewer">
                <div className="role-icon"><Icon name={ICONS.eye} size={18} /></div>
                <h5>Viewer</h5>
                <p>Observes without voting privileges.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;
