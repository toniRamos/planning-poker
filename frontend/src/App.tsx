import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSocket } from './modules/shared/hooks';
import { Header, JoinForm, SessionContainer } from './components';
import CreateSession from './components/CreateSession';
import SessionView from './components/SessionView';
import './App.css';

const HomePage: React.FC = () => {
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
          <div className="home-content">
            <div className="welcome-section">
              <h1>Planning Poker</h1>
              <p>Collaborate with your team for better estimations</p>
              <div className="action-buttons">
                <a href="/create-session" className="create-session-btn">
                  🎯 Create New Session
                </a>
              </div>
            </div>
            <JoinForm 
              isConnected={isConnected}
              onJoin={joinWithName}
            />
          </div>
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

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-session" element={<CreateSession />} />
        <Route path="/session/:sessionId" element={<SessionView />} />
      </Routes>
    </Router>
  );
};

export default App;
