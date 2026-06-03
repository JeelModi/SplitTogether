// frontend/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import DashboardHome from './DashboardHome';
import Groups        from './Groups';
import Expenses      from './Expenses';
import Balances      from './Balances';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [groups, setGroups]       = useState([]);

  useEffect(function() {
    if (activeTab === 'expenses') {
      fetchGroups();
    }
  }, [activeTab]);

  function fetchGroups() {
    fetch('http://localhost:5000/api/groups?userId=' + user.id)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.groups) setGroups(data.groups);
      })
      .catch(function(err) { console.error(err); });
  }

  // Tab config — easy to add more later
  const tabs = [
    { key: 'home',     label: 'Home'     },
    { key: 'groups',   label: 'Groups'   },
    { key: 'expenses', label: 'Expenses' },
    { key: 'balances', label: 'Balances' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>

    {/* ── Navbar ─────────────────────────────────────────────── */}
<nav
  className="navbar px-4 py-3"
  style={{
    background: '#2d3748', // Matches the teal theme of the app
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', // Subtle shadow
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  }}>
    <div className="d-flex flex-column justify-content-center">
      <span
        className="fw-bold text-white fs-4 lh-1"
        style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>
        SplitTogether
      </span>
      <span
        className="fw-light text-white-50" 
        style={{ 
          fontFamily: "'Montserrat Alternates', sans-serif",
          fontSize: '0.75rem', // Smaller for the subscript effect
          letterSpacing: '0.5px',
          marginTop: '4px'     // Spacing between brand and tagline
        }}>
        fair.sharing.made.easy
      </span>
    </div>
  <div className="d-flex align-items-center gap-3">
    {/* User info */}
    <div className="d-flex align-items-center gap-2">
      <div
        className="rounded-circle bg-white d-flex align-items-center justify-content-center fw-bold"
        style={{
          width: '36px', height: '36px',
          color: '#2d3748', // Text inside circle matches navbar
          fontSize: '16px'
        }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      <span className="text-white d-none d-md-inline fw-semibold">
        {user.name}
      </span>
    </div>

    {/* Logout Button */}
    <button
      className="btn btn-sm text-white"
      style={{ 
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
        border: '1px solid rgba(255, 255, 255, 0.4)',
        padding: '5px 15px'
      }}
      onClick={onLogout}
    >
      Logout
    </button>
  </div>
</nav>

      {/* ── Tab Bar ────────────────────────────────────────────── */}
      <div className="bg-white border-bottom shadow-sm">
        <div className="container">
          <ul className="nav nav-tabs border-0">
            {tabs.map(function(tab) {
              return (
                <li className="nav-item" key={tab.key}>
                  <button
                    className={`nav-link px-4 py-3 border-0 fw-semibold ${
                      activeTab === tab.key ? 'active' : ''
                    }`}
                    onClick={function() { setActiveTab(tab.key); }}
                    style={{
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '0.95rem'
                    }}
                  >
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      <div className="container py-4">

        {activeTab === 'home' && (
          <DashboardHome user={user} />
        )}

        {activeTab === 'groups' && (
          <Groups user={user} />
        )}

        {activeTab === 'expenses' && (
          <Expenses user={user} groups={groups} />
        )}

        {activeTab === 'balances' && (
          <Balances user={user} />
        )}

      </div>
    </div>
  );
}

export default Dashboard;