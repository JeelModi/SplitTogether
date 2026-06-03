// frontend/src/components/DashboardHome.js
import React, { useState, useEffect } from 'react';

function DashboardHome({ user }) {
  const [summary, setSummary] = useState({
    totalOwed: 0, totalOwe: 0, totalGroups: 0, totalExpenses: 0
  });
  const [recentExpenses, setRecent] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(function() {
    fetchDashboard();
  }, []);

  function fetchDashboard() {
    setLoading(true);
    setError('');

    fetch('http://localhost:5000/api/expenses/dashboard?userId=' + user.id)
      .then(function(res) {
        if (!res.ok) throw new Error('Server returned ' + res.status);
        return res.json();
      })
      .then(function(data) {
        setLoading(false);
        if (data.error) { setError(data.error); return; }
        if (data.summary)        setSummary(data.summary);
        if (data.recentExpenses) setRecent(data.recentExpenses);
      })
      .catch(function(err) {
        setLoading(false);
        setError('Could not load dashboard. Is the backend running?');
        console.error(err);
      });
  }

  if (loading) {
    return <div className="text-center py-5 text-muted">Loading dashboard...</div>;
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Welcome Banner */}
      <div className="card border-0 mb-4"
        style={{ background:'#3490DC', borderRadius: '14px' }}>
        <div className="card-body py-4 px-4 text-white">
          <h4 className="fw-bold mb-1">Welcome back, {user.name}!</h4>
          <p className="mb-0 opacity-75">Here's your expense summary at a glance.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-6 col-md-3 mb-3">
          <div className="card shadow-sm text-center h-100"
          style={{ border: '1.5px solid #FFFFFF66', borderRadius: '12px' }}>
            <div className="card-body">
              <div style={{ fontSize: '1.8rem' }}></div>
              <h4 className="fw-bold text-primary mb-0">{summary.totalGroups}</h4>
              <small className="text-muted">Groups</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="card shadow-sm text-center h-100"
            style={{ border: '1.5px solid #FFFFFF66', borderRadius: '12px' }}>
            <div className="card-body">
              <div style={{ fontSize: '1.8rem' }}></div>
              <h4 className="fw-bold text-primary mb-0">{summary.totalExpenses}</h4>
              <small className="text-muted">Expenses</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="card shadow-sm text-center h-100"
            style={{ border: '1.5px solid #FFFFFF66', borderRadius: '12px' }}>
            <div className="card-body">
              <div style={{ fontSize: '1.8rem' }}></div>
              <h4 className="fw-bold text-success mb-0">₹{summary.totalOwed}</h4>
              <small className="text-muted">You'll receive</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="card shadow-sm text-center h-100"
            style={{ border: '1.5px solid #FFFFFF66', borderRadius: '12px' }}>
            <div className="card-body">
              <div style={{ fontSize: '1.8rem' }}></div>
              <h4 className="fw-bold text-danger mb-0">₹{summary.totalOwe}</h4>
              <small className="text-muted">You owe</small>
            </div>
          </div>
        </div>
      </div>

      {/* Net Balance */}
      {(summary.totalOwed > 0 || summary.totalOwe > 0) && (
        <div className={`alert ${summary.totalOwed >= summary.totalOwe ? 'alert-success' : 'alert-danger'} d-flex justify-content-between align-items-center mb-4`}>
          <span>
            <strong>Net Balance: </strong>
            {summary.totalOwed >= summary.totalOwe
              ? 'You are up by ₹' + (summary.totalOwed - summary.totalOwe).toFixed(2) +''
              : 'You owe ₹'       + (summary.totalOwe - summary.totalOwed).toFixed(2) + ' overall'
            }
          </span>
          <strong>₹{Math.abs(summary.totalOwed - summary.totalOwe).toFixed(2)}</strong>
        </div>
      )}

      {/* Recent Expenses */}
      <h6 className="fw-bold text-muted mb-3">🕐 RECENT EXPENSES</h6>

      {recentExpenses.length === 0 ? (
        <div className="text-center text-muted py-4">
          <p>No expenses yet. Go to <strong>Groups</strong> to get started!</p>
        </div>
      ) : (
        recentExpenses.map(function(expense) {
          const isPaidByMe = expense.paidBy === user.id;
          const perPerson  = (expense.amount / expense.splits.length).toFixed(2);
          return (
            <div className="card mb-2 shadow-sm border-0" key={expense._id}
              style={{ borderRadius: '12px' }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="fw-bold mb-0">🧾 {expense.description}</p>
                    <small className="text-muted">
                      <span className="badge bg-secondary me-2">{expense.groupName}</span>
                      Paid by{' '}
                      <strong className={isPaidByMe ? 'text-success' : 'text-primary'}>
                        {isPaidByMe ? 'You' : expense.paidByName}
                      </strong>
                      {' · '}{new Date(expense.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="text-end">
                    <p className="fw-bold mb-0">₹{expense.amount}</p>
                    <small className="text-muted">₹{perPerson}/person</small>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default DashboardHome;