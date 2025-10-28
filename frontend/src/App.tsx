import React from 'react';
import { useSocket } from './modules/shared/hooks';
import { Header, JoinForm, SessionContainer } from './components';
import './App.css';

const App: React.FC = () => {
  const {
    isConnected,
    users,
    totalUsers,
    currentUser,
    joinWithName,
    updateName,
    messages
  } = useSocket();

  return (
    <div className="app">
      <Header 
        isConnected={isConnected}
        totalUsers={totalUsers}
      />
      
      <main className="app-main">
        {!currentUser ? (
          <JoinForm 
            isConnected={isConnected}
            onJoin={joinWithName}
          />
        ) : (
          <SessionContainer
            currentUser={currentUser}
            users={users}
            totalUsers={totalUsers}
            messages={messages}
            onUpdateName={updateName}
          />
        )}
      </main>
    </div>
  );
};

export default App;
