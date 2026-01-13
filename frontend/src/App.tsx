import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import CreateSession from './components/CreateSession';
import SessionView from './components/SessionView';
import { Icon, ICONS } from './components/Icons';
import './App.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionInput, setSessionInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const extractSessionId = (input: string): string => {
    // Handle full URLs like http://localhost:3000/session/abc123
    const urlMatch = input.match(/\/session\/([a-zA-Z0-9-]+)/);
    if (urlMatch) return urlMatch[1];
    
    // Handle just the session ID
    return input.trim();
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    
    const sessionId = extractSessionId(sessionInput);
    if (!sessionId) {
      setJoinError('Please enter a valid session URL or ID');
      return;
    }
    
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="app">
      <header className="app-header home-header">
        <h1><Icon name={ICONS.cards} size={32} className="brand-icon" /> Planning Poker</h1>
      </header>
      
      <main className="app-main">
        <div className="home-content">
          <div className="welcome-section">
            <h2>Estimate together, deliver better</h2>
            <p>Create a planning poker session and invite your team to estimate user stories in real-time with interactive cards.</p>
            
            <div className="home-actions">
              <a href="/create-session" className="create-session-btn">
                <Icon name={ICONS.sparkle} size={18} className="btn-icon" />
                <span>Create New Session</span>
              </a>
              
              <div className="divider">
                <span>or join existing</span>
              </div>
              
              <form onSubmit={handleJoinSession} className="join-session-form">
                <div className="join-input-wrapper">
                  <input
                    type="text"
                    value={sessionInput}
                    onChange={(e) => {
                      setSessionInput(e.target.value);
                      setJoinError('');
                    }}
                    placeholder="Paste session URL or ID..."
                    className="join-session-input"
                  />
                  <button 
                    type="submit" 
                    className="join-session-btn"
                    disabled={!sessionInput.trim()}
                  >
                    Join →
                  </button>
                </div>
                {joinError && <p className="join-error">{joinError}</p>}
              </form>
            </div>
          </div>
          
          <div className="features-section">
            <div className="feature">
              <div className="feature-icon"><Icon name={ICONS.cards} size={32} /></div>
              <h3>Interactive Cards</h3>
              <p>Fibonacci sequence cards with smooth animations for accurate estimations</p>
            </div>
            <div className="feature">
              <div className="feature-icon"><Icon name={ICONS.lightning} size={32} /></div>
              <h3>Real-time Sync</h3>
              <p>See votes appear instantly as your team makes their estimates</p>
            </div>
            <div className="feature">
              <div className="feature-icon"><Icon name={ICONS.mask} size={32} /></div>
              <h3>Fun Reactions</h3>
              <p>React with emojis that rain down the screen for everyone to see</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="home-footer">
        <p>Made for agile teams • Free & Open Source</p>
      </footer>
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
