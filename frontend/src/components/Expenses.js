// frontend/src/components/Expenses.js
import React, { useState, useEffect } from 'react';

function Expenses({ user, groups }) {
  const [expenses, setExpenses]         = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(false);
  const [message, setMessage]           = useState('');
  const [msgType, setMsgType]           = useState('');

  // Form state
  const [selectedGroup, setSelectedGroup]   = useState('');
  const [description, setDescription]       = useState('');
  const [amount, setAmount]                 = useState('');
  const [paidBy, setPaidBy]                 = useState('');  
  const [groupMembers, setGroupMembers]     = useState([]);  

  // Filter tab state — '' means ALL
  const [filterGroup, setFilterGroup] = useState('');

  // Fetch expenses when filter changes
  useEffect(function() {
    if (filterGroup === '') {
      fetchAllExpenses();
    } else {
      fetchExpensesByGroup(filterGroup);
    }
  }, [filterGroup]);

  // ── When group is selected in FORM, fetch its members ──────────
  useEffect(function() {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup);
    } else {
      setGroupMembers([]);
      setPaidBy('');
    }
  }, [selectedGroup]);

  function fetchAllExpenses() {
    setFetching(true);
    fetch('http://localhost:5000/api/expenses/all?userId=' + user.id)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setFetching(false);
        setExpenses(data.expenses || []);
      })
      .catch(function(err) {
        setFetching(false);
        console.error('Fetch all expenses error:', err);
      });
  }

  function fetchExpensesByGroup(groupId) {
    setFetching(true);
    fetch('http://localhost:5000/api/expenses/' + groupId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setFetching(false);
        setExpenses(data.expenses || []);
      })
      .catch(function(err) {
        setFetching(false);
        console.error('Fetch expenses error:', err);
      });
  }

  // Fetch members of selected group for "Who Paid?" dropdown
  function fetchGroupMembers(groupId) {
    fetch('http://localhost:5000/api/groups/' + groupId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.members) {
          setGroupMembers(data.members);
          // Default paidBy to current user
          setPaidBy(user.id);
        }
      })
      .catch(function(err) {
        console.error('Fetch members error:', err);
      });
  }

  function handleAddExpense(e) {
    e.preventDefault();
    setMessage('');

    if (!selectedGroup) {
      setMessage('Please select a group!');
      setMsgType('danger');
      return;
    }
    if (!description.trim()) {
      setMessage('Description is required!');
      setMsgType('danger');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setMessage('Please enter a valid amount!');
      setMsgType('danger');
      return;
    }
    if (!paidBy) {
      setMessage('Please select who paid!');
      setMsgType('danger');
      return;
    }

    setLoading(true);

    fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId:     selectedGroup,
        description: description,
        amount:      Number(amount),
        paidBy:      paidBy          // ← selected from dropdown
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setLoading(false);
        if (data.error) {
          setMessage(data.error);
          setMsgType('danger');
        } else {
          setMessage('✅ Expense added!');
          setMsgType('success');
          // Reset form
          setDescription('');
          setAmount('');
          setPaidBy(user.id);
          setShowForm(false);
          // Refresh expenses list
          if (filterGroup === '') {
            fetchAllExpenses();
          } else {
            fetchExpensesByGroup(filterGroup);
          }
        }
      })
      .catch(function(err) {
        setLoading(false);
        setMessage('❌ Server error. Is backend running?');
        setMsgType('danger');
      });
  }

  // Get group name for display in "All" tab
  function getGroupName(groupId) {
    const found = groups.find(function(g) { return g._id === groupId; });
    return found ? found.name : '';
  }

  return (
    <div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">💸 Expenses</h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={function() {
            setShowForm(!showForm);
            setMessage('');
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Alert */}
      {message && (
        <div className={`alert alert-${msgType} py-2`}>{message}</div>
      )}

      {/* ── Add Expense Form ────────────────────────────────────── */}
      {showForm && (
        <div className="card mb-4 border-primary">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Add New Expense</h6>
            <form onSubmit={handleAddExpense}>

              {/* Select Group */}
              <div className="mb-3">
                <label className="form-label">Select Group</label>
                <select
                  className="form-select"
                  value={selectedGroup}
                  onChange={function(e) { setSelectedGroup(e.target.value); }}
                >
                  <option value="">-- Choose a group --</option>
                  {groups.map(function(group) {
                    return (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dinner, Hotel, Petrol"
                  value={description}
                  onChange={function(e) { setDescription(e.target.value); }}
                />
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="form-label">Total Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 1200"
                  min="1"
                  value={amount}
                  onChange={function(e) { setAmount(e.target.value); }}
                />
              </div>

              {/* ── Who Paid? Dropdown ── */}
              {groupMembers.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Who Paid? 💳
                  </label>
                  <select
                    className="form-select"
                    value={paidBy}
                    onChange={function(e) { setPaidBy(e.target.value); }}
                  >
                    <option value="">-- Select who paid --</option>
                    {groupMembers.map(function(member) {
                      return (
                        <option key={member.id} value={member.id}>
                          {member.name}
                          {member.id === user.id ? ' (You)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Split Preview */}
              {selectedGroup && amount && !isNaN(amount) && Number(amount) > 0 && (
                <div className="alert alert-info py-2 mb-3">
                  <small>
                    <strong>⚡ Split Preview: </strong>
                    {(function() {
                      const grp = groups.find(function(g) {
                        return g._id === selectedGroup;
                      });
                      const count = grp ? grp.members.length : 1;
                      const share = (Number(amount) / count).toFixed(2);
                      const payerName = groupMembers.find(function(m) {
                        return m.id === paidBy;
                      });
                      return (
                        <>
                          ₹{amount} ÷ {count} members = <strong>₹{share} each</strong>
                          {payerName && (
                            <span className="ms-2 text-success">
                              · Paid by <strong>{payerName.name}</strong>
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </small>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ── Group Filter Tabs ───────────────────────────────────── */}
      {groups.length > 0 && (
        <div className="mb-3">
          <label className="form-label fw-semibold">Filter by Group:</label>
          <div className="d-flex flex-wrap gap-2">

            {/* ALL tab */}
            <button
              className={`btn btn-sm ${filterGroup === '' ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={function() { setFilterGroup(''); }}
            >
              All
            </button>

            {/* Per-group tabs */}
            {groups.map(function(group) {
              return (
                <button
                  key={group._id}
                  className={`btn btn-sm ${filterGroup === group._id ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={function() { setFilterGroup(group._id); }}
                >
                  {group.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Expenses List ───────────────────────────────────────── */}
      {fetching ? (
        <div className="text-center py-4 text-muted">
          Loading expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center text-muted py-5">
          <p className="fs-5">No expenses yet!</p>
          <p>Click <strong>"+ Add Expense"</strong> to add one.</p>
        </div>
      ) : (
        <div>
          {expenses.map(function(expense) {
            const perPerson  = (expense.amount / expense.splits.length).toFixed(2);
            const isPaidByMe = expense.paidBy === user.id;

            return (
              <div className="card mb-3 shadow-sm" key={expense._id}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">

                    {/* Left */}
                    <div>
                      <h6 className="fw-bold mb-1">🧾 {expense.description}</h6>
                      <small className="text-muted">
                        Paid by{' '}
                        <strong className={isPaidByMe ? 'text-success' : 'text-primary'}>
                          {isPaidByMe ? 'You' : expense.paidByName}
                        </strong>
                        {/* Show group name in ALL tab */}
                        {filterGroup === '' && expense.groupName && (
                          <span className="badge bg-secondary ms-2">
                            {expense.groupName}
                          </span>
                        )}
                        {' · '}{expense.splits.length} members
                        {' · '}{new Date(expense.createdAt).toLocaleDateString()}
                      </small>
                    </div>

                    {/* Right */}
                    <div className="text-end">
                      <div className="fw-bold text-dark fs-5">
                        ₹{expense.amount}
                      </div>
                      <small className="text-muted">
                        ₹{perPerson}/person
                      </small>
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

export default Expenses;