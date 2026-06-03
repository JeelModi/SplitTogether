// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import Login     from './components/Login';
import Register  from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);

  useEffect(function() {
    try {
      const saved = localStorage.getItem('splituser');
      if (saved) {
        const parsedUser = JSON.parse(saved);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          setPage('dashboard');
        }
      }
    } catch (err) {
      // Corrupted localStorage — clear it
      localStorage.removeItem('splituser');
    }
  }, []);

  function handleLoginSuccess(userData) {
    setUser(userData);
    setPage('dashboard');
  }

  function handleLogout() {
    localStorage.removeItem('splituser');
    setUser(null);
    setPage('login');
  }

  if (page === 'dashboard' && user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }
  if (page === 'register') {
    return <Register onSwitchToLogin={function() { setPage('login'); }} />;
  }
  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onSwitchToRegister={function() { setPage('register'); }}
    />
  );
}

export default App;