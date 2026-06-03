// frontend/src/components/Balances.js
import React, { useState, useEffect } from 'react';

function Balances({ user }) {
  const [balances, setBalances]   = useState([]);
  const [summary, setSummary]     = useState({ totalOwed: 0, totalOwe: 0 });
  const [loading, setLoading]     = useState(false);

  useEffect(function() {
    fetchBalances();
  }, []);

  function fetchBalances() {
    setLoading(true);
    fetch('http://localhost:5000/api/expenses/balance?userId=' + user.id)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setLoading(false);
        if (data.balances) setBalances(data.balances);
        if (data.summary)  setSummary(data.summary);
      })
      .catch(function(err) {
        setLoading(false);
        console.error('Fetch balances error:', err);
      });
  }

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        Calculating balances...
      </div>
    );
  }

  return (
    <div>
      <h5 className="fw-bold mb-4">⚖️ Balances</h5>

      {/* ── Summary Cards ─────────────────────────────────────── */}
      <div className="row mb-4">

        {/* Total others owe me */}
        <div className="col-md-6 mb-3">
          <div className="card border-success shadow-sm">
            <div className="card-body text-center">
              <p className="text-muted mb-1">Others owe you</p>
              <h3 className="fw-bold text-success">
                ₹{summary.totalOwed}
              </h3>
            </div>
          </div>
        </div>

        {/* Total I owe others */}
        <div className="col-md-6 mb-3">
          <div className="card border-danger shadow-sm">
            <div className="card-body text-center">
              <p className="text-muted mb-1">You owe others</p>
              <h3 className="fw-bold text-danger">
                ₹{summary.totalOwe}
              </h3>
            </div>
          </div>
        </div>

      </div>

      {/* ── Net Balance ───────────────────────────────────────── */}
      {(summary.totalOwed > 0 || summary.totalOwe > 0) && (
        <div className={`alert ${
          summary.totalOwed >= summary.totalOwe ? 'alert-success' : 'alert-warning'
        } text-center mb-4`}>
          <strong>Net Balance: </strong>
          {summary.totalOwed >= summary.totalOwe ? (
            <span>
              You are up by ₹{(summary.totalOwed - summary.totalOwe).toFixed(2)} overall 
            </span>
          ) : (
            <span>
              You owe ₹{(summary.totalOwe - summary.totalOwed).toFixed(2)} overall 
            </span>
          )}
        </div>
      )}

      {/* ── Individual Balances ───────────────────────────────── */}
      {balances.length === 0 ? (
        <div className="text-center text-muted py-5">
          <p className="fs-5">All settled up! 🎉</p>
          <p>No pending balances found.</p>
        </div>
      ) : (
        <div>
          <h6 className="fw-semibold mb-3 text-muted">
            INDIVIDUAL BALANCES
          </h6>
          {balances.map(function(balance, index) {
            const isOwesMe = balance.type === 'owes_me';
            return (
              <div
                className="card mb-3 shadow-sm"
                key={index}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">

                    {/* Left: Name + message */}
                    <div className="d-flex align-items-center gap-3">
                      {/* Avatar circle */}
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white`}
                        style={{
                          width: '45px',
                          height: '45px',
                          fontSize: '18px',
                          backgroundColor: isOwesMe ? '#198754' : '#dc3545'
                        }}
                      >
                        {balance.userName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="fw-bold mb-0">{balance.userName}</p>
                        <small className={isOwesMe ? 'text-success' : 'text-danger'}>
                          {isOwesMe
                            ? balance.userName + ' owes you'
                            : 'You owe ' + balance.userName
                          }
                        </small>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-end">
                      <span className={`fw-bold fs-5 ${isOwesMe ? 'text-success' : 'text-danger'}`}>
                        {isOwesMe ? '+' : '-'}₹{Math.abs(balance.amount)}
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default Balances;