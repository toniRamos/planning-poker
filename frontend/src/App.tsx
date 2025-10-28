import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateSession from './components/CreateSession';
import SessionView from './components/SessionView';
import './App.css';

const HomePage: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Planning Poker</h1>
      </header>
      
      <main className="app-main">
        <div className="home-content">
          <div className="welcome-section">
            <h2>Collaborate with your team for better estimations</h2>
            <p>Create a planning poker session and share the link with your team members to start estimating user stories together.</p>
            <div className="action-buttons">
              <a href="/create-session" className="create-session-btn">
                🎯 Create New Session
              </a>
            </div>
          </div>
          
          <div className="features-section">
            <div className="feature">
              <div className="feature-icon">🃏</div>
              <h3>Interactive Cards</h3>
              <p>Use Fibonacci sequence cards for accurate estimations</p>
            </div>
            <div className="feature">
              <div className="feature-icon">👥</div>
              <h3>Real-time Collaboration</h3>
              <p>See team members join and participate in real-time</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔗</div>
              <h3>Easy Sharing</h3>
              <p>Share session links with your team instantly</p>
            </div>
          </div>
        </div>
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
