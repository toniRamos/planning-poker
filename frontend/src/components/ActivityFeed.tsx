import React from 'react';

export interface Message {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'error' | 'success';
}

interface ActivityFeedProps {
  messages: Message[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ messages }) => {
  return (
    <div className="messages-section">
      <h3>Activity Feed</h3>
      <div className="messages-list">
        {messages.length === 0 ? (
          <p className="no-messages">No recent activity</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
              <span className="message-text">{message.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;