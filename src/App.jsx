import React from 'react';
import { ChatContainer } from './components/Chat/ChatContainer';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <main className="main-content">
        <ChatContainer />
      </main>
    </div>
  );
}

export default App;
