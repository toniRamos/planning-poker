import React from 'react';
import { Icon, ICONS } from './Icons';
import Avatar from './Avatar';
import './ParticipationSummary.css';

interface User {
  id: string;
  socketId: string;
  name: string;
  role?: string;
}

interface ReactionStats {
  [userId: string]: { [emoji: string]: number };
}

interface UserAverages {
  [userId: string]: number;
}

interface Story {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedPoints?: string;
  isRevealed: boolean;
  tags?: string[];
  createdAt?: string;
}

interface SessionInfo {
  id: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  userStories?: Story[];
}

interface ParticipationSummaryProps {
  users: User[];
  reactionStats: ReactionStats;
  userAverages?: UserAverages;
  session?: SessionInfo;
}

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

const roleLabel = (role?: string) => {
  switch (role) {
    case 'admin': return 'Admin';
    case 'player': return 'Player';
    case 'viewer': return 'Viewer';
    default: return role || '—';
  }
};

export const ParticipationSummary: React.FC<ParticipationSummaryProps> = ({
  users,
  reactionStats,
  userAverages = {},
  session
}) => {
  const stories = session?.userStories || [];
  const estimatedStories = stories.filter(s => s.isRevealed && s.estimatedPoints != null);
  const totalPoints = estimatedStories.reduce((sum, s) => {
    const n = parseFloat(s.estimatedPoints || '');
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const totalReactions = Object.values(reactionStats).reduce((total, userReactions) => {
    return total + Object.values(userReactions).reduce((sum, count) => sum + count, 0);
  }, 0);

  const players = users.filter(u => u.role === 'player').length;
  const viewers = users.filter(u => u.role === 'viewer').length;

  const exportJson = () => {
    const data = {
      session,
      stories,
      participants: users,
      userAverages,
      reactionStats
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (session?.name || 'session') + '.json';
    a.click();
  };

  const getUserReactions = (userId: string) => {
    const userReactions = reactionStats[userId];
    if (!userReactions) return [];
    return Object.entries(userReactions)
      .map(([emoji, count]) => ({ emoji, count }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count);
  };

  return (
    <div className="summary-root">
      <div className="summary-hero">
        <div className="eyebrow">Session closed</div>
        <h1>{session?.name || 'Session summary'}</h1>
        <p>Recap of this estimation session: stories scored, votes cast, and how the team engaged.</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="label">Stories estimated</div>
          <div className="value">{estimatedStories.length}</div>
          <div className="sub">of {stories.length}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total points</div>
          <div className="value accent">{Math.round(totalPoints * 10) / 10}</div>
          <div className="sub">story points</div>
        </div>
        <div className="summary-card">
          <div className="label">Participants</div>
          <div className="value">{users.length}</div>
          <div className="sub">{players} players · {viewers} viewers</div>
        </div>
        <div className="summary-card">
          <div className="label">Reactions</div>
          <div className="value">{totalReactions}</div>
          <div className="sub">sent during the session</div>
        </div>
      </div>

      {stories.length > 0 && (
        <div className="summary-section">
          <h3><Icon name={ICONS.clipboard} size={12} /> Stories</h3>
          <div className="data-table">
            <div className="row head story-row">
              <div>Title</div>
              <div>Tags</div>
              <div style={{ textAlign: 'right' }}>Points</div>
            </div>
            {stories.map(st => (
              <div key={st.id} className="row story-row">
                <div className="story-name">
                  {isUrl(st.title) ? (
                    <a href={st.title} target="_blank" rel="noopener noreferrer">
                      {displayStoryTitle(st.title)}
                    </a>
                  ) : st.title}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {st.tags && st.tags.length > 0 ? (
                    st.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)
                  ) : (
                    <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>—</span>
                  )}
                </div>
                <div className="points">
                  {st.estimatedPoints != null ? st.estimatedPoints : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="summary-section">
        <h3><Icon name={ICONS.users} size={12} /> Participants</h3>
        <div className="data-table">
          <div className="row head pt-row">
            <div>Name</div>
            <div>Avg vote</div>
            <div>Reactions sent</div>
          </div>
          {users.map(user => {
            const userReactions = getUserReactions(user.socketId);
            const userAverage = userAverages[user.socketId];
            return (
              <div key={user.socketId} className="row pt-row">
                <div className="participant-info">
                  <Avatar name={user.name} size={28} />
                  <div className="name-box">
                    <div className="pname">{user.name}</div>
                    <div className="prole">{roleLabel(user.role)}</div>
                  </div>
                </div>
                <div className="avg">
                  {userAverage !== undefined ? Math.round(userAverage * 10) / 10 : '—'}
                </div>
                <div className="reactions-summary">
                  {userReactions.length > 0 ? (
                    userReactions.map(({ emoji, count }) => (
                      <span key={emoji} className="reaction-chip">
                        {emoji}<span className="count">×{count}</span>
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="summary-actions">
        <a href="/" className="btn btn-primary">
          <Icon name={ICONS.plus} size={14} /> New session
        </a>
        <button className="btn" onClick={exportJson}>
          <Icon name={ICONS.share} size={14} /> Export JSON
        </button>
      </div>
    </div>
  );
};
