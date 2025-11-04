import React from 'react';
import './ParticipationSummary.css';

interface User {
  id: string;
  socketId: string;
  name: string;
  role?: string;
}

interface ReactionStats {
  [userId: string]: {
    [emoji: string]: number;
  };
}

interface UserAverages {
  [userId: string]: number;
}

interface ParticipationSummaryProps {
  users: User[];
  reactionStats: ReactionStats;
  userAverages?: UserAverages;
}

export const ParticipationSummary: React.FC<ParticipationSummaryProps> = ({
  users,
  reactionStats,
  userAverages = {}
}) => {
  // Calculate total reactions per user
  const getUserTotalReactions = (userId: string): number => {
    const userReactions = reactionStats[userId];
    if (!userReactions) return 0;
    return Object.values(userReactions).reduce((sum, count) => sum + count, 0);
  };

  // Get all reactions for a user
  const getUserReactions = (userId: string): { emoji: string; count: number }[] => {
    const userReactions = reactionStats[userId];
    if (!userReactions) return [];
    
    return Object.entries(userReactions)
      .map(([emoji, count]) => ({ emoji, count }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  // Calculate total reactions across all users
  const totalReactions = Object.values(reactionStats).reduce((total, userReactions) => {
    return total + Object.values(userReactions).reduce((sum, count) => sum + count, 0);
  }, 0);

  return (
    <div className="participation-summary">
      <div className="summary-header">
        <h3>📊 Session Summary</h3>
        <div className="summary-stats">
          <span className="stat-item">
            👥 {users.length} {users.length === 1 ? 'Participant' : 'Participants'}
          </span>
          <span className="stat-item">
            🎉 {totalReactions} {totalReactions === 1 ? 'Reaction' : 'Reactions'}
          </span>
        </div>
      </div>

      <div className="participants-list">
        <h4>Participants & Reactions</h4>
        <div className="participants-grid">
          {users.map((user) => {
            const userReactions = getUserReactions(user.socketId);
            const totalUserReactions = getUserTotalReactions(user.socketId);
            const userAverage = userAverages[user.socketId];
            
            return (
              <div key={user.socketId} className="participant-card">
                <div className="participant-header">
                  <span className="participant-name">{user.name}</span>
                  {user.role && <span className="participant-role">{user.role}</span>}
                </div>
                
                {/* Show average if available */}
                {userAverage !== undefined && (
                  <div className="participant-average">
                    📊 Average Vote: <strong>{userAverage}</strong>
                  </div>
                )}
                
                <div className="participant-reactions">
                  {userReactions.length > 0 ? (
                    <>
                      <div className="reactions-list">
                        {userReactions.map(({ emoji, count }) => (
                          <span key={emoji} className="reaction-item">
                            {emoji} <span className="reaction-count">×{count}</span>
                          </span>
                        ))}
                      </div>
                      <div className="total-reactions">
                        Total: {totalUserReactions}
                      </div>
                    </>
                  ) : (
                    <div className="no-reactions">No reactions</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
