import React from 'react';
import UserInfo from './UserInfo';
import UsersList from './UsersList';
import ActivityFeed, { Message } from './ActivityFeed';
import { ConnectedUser } from '../modules/shared/hooks/useSocket';

import { Socket } from 'socket.io-client';

interface SessionContainerProps {
  currentUser: ConnectedUser;
  users: ConnectedUser[];
  totalUsers: number;
  messages: Message[];
  onUpdateName: (newName: string) => void;
  sessionId: string;
  socket?: Socket | null;
}

const SessionContainer: React.FC<SessionContainerProps> = ({
  currentUser,
  users,
  totalUsers,
  messages,
  onUpdateName,
  sessionId,
  socket
}) => {
  return (
    <div className="session-container">
      <UserInfo 
        currentUser={currentUser} 
        onUpdateName={onUpdateName}
      />
      
      <UsersList 
        users={users}
        totalUsers={totalUsers}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        sessionId={sessionId}
        socket={socket}
      />
      
      <ActivityFeed messages={messages} />
    </div>
  );
};

export default SessionContainer;