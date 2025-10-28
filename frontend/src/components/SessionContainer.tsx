import React from 'react';
import UserInfo from './UserInfo';
import UsersList from './UsersList';
import ActivityFeed, { Message } from './ActivityFeed';
import { ConnectedUser } from '../modules/shared/hooks/useSocket';

interface SessionContainerProps {
  currentUser: ConnectedUser;
  users: ConnectedUser[];
  totalUsers: number;
  messages: Message[];
  onUpdateName: (newName: string) => void;
}

const SessionContainer: React.FC<SessionContainerProps> = ({
  currentUser,
  users,
  totalUsers,
  messages,
  onUpdateName
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
      />
      
      <ActivityFeed messages={messages} />
    </div>
  );
};

export default SessionContainer;