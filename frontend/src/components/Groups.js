// frontend/src/components/Groups.js
import React, { useState, useEffect } from 'react';

function Groups({ user }) {
  const [groups, setGroups]       = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState('');
  const [msgType, setMsgType]     = useState('');

  // Form state
  const [groupName, setGroupName]       = useState('');
  const [memberEmails, setMemberEmails] = useState('');

  // Fetch groups when component loads
  useEffect(function() {
    fetchGroups();
  }, []);

  function fetchGroups() {
    fetch('http://localhost:5000/api/groups?userId=' + user.id)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.groups) {
          setGroups(data.groups);
        }
      })
      .catch(function(err) {
        console.error('Fetch groups error:', err);
      });
  }

  function handleCreateGroup(e) {
    e.preventDefault();
    setMessage('');

    if (!groupName.trim()) {
      setMessage('Group name is required!');
      setMsgType('danger');
      return;
    }

    if (!memberEmails.trim()) {
      setMessage('Add at least one member email!');
      setMsgType('danger');
      return;
    }

    // Convert comma-separated emails to array and clean them
    const emailArray = memberEmails
      .split(',')
      .map(function(e) { return e.trim(); })
      .filter(function(e) { return e !== ''; });

    setLoading(true);

    fetch('http://localhost:5000/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         groupName,
        memberEmails: emailArray,
        createdBy:    user.id
      })
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setLoading(false);
        if (data.error) {
          setMessage(data.error);
          setMsgType('danger');
        } else {
          setMessage('✅ Group created successfully!');
          setMsgType('success');
          setGroupName('');
          setMemberEmails('');
          setShowForm(false);
          fetchGroups(); // Refresh list
        }
      })
      .catch(function(err) {
        setLoading(false);
        setMessage('❌ Server error. Is backend running?');
        setMsgType('danger');
      });
  }

  function handleDeleteGroup(groupId, groupName) {
    const confirmed = window.confirm(
      'Are you sure you want to delete "' + groupName + '"?\nThis will also delete all its expenses!'
    );

    if (!confirmed) return;

    fetch('http://localhost:5000/api/groups/' + groupId, {
      method: 'DELETE'
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.error) {
          setMessage('Error: ' + data.error);
          setMsgType('danger');
        } else {
          setMessage('✅ Group deleted successfully!');
          setMsgType('success');
          fetchGroups(); // Refresh list
        }
      })
      .catch(function(err) {
        setMessage('❌ Server error. Is backend running?');
        setMsgType('danger');
      });
  }

  return (
    <div>
      {/* Header Row */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">👥 My Groups</h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={function() {
            setShowForm(!showForm);
            setMessage('');
          }}
        >
          {showForm ? '✕ Cancel' : '+ New Group'}
        </button>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`alert alert-${msgType} py-2`}>{message}</div>
      )}

      {/* Create Group Form */}
      {showForm && (
        <div className="card mb-4 border-primary">
          <div className="card-body">
            <h6 className="card-title fw-bold">Create New Group</h6>
            <form onSubmit={handleCreateGroup}>

              <div className="mb-3">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Goa Trip, Flat Mates"
                  value={groupName}
                  onChange={function(e) { setGroupName(e.target.value); }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Member Emails
                  <small className="text-muted ms-2">
                    (comma separated — must be registered users)
                  </small>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. raj@gmail.com, priya@gmail.com"
                  value={memberEmails}
                  onChange={function(e) { setMemberEmails(e.target.value); }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center text-muted py-5">
          <p className="fs-5">No groups yet!</p>
          <p>Click <strong>"+ New Group"</strong> to create one.</p>
        </div>
      ) : (
        <div className="row">
          {groups.map(function(group) {
            return (
              <div className="col-md-6 mb-3" key={group._id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">

                      {/* Group Info */}
                      <div>
                        <h6 className="card-title fw-bold mb-1">
                          🏠 {group.name}
                        </h6>
                        <p className="text-muted mb-1">
                          <small>👥 {group.members.length} member(s)</small>
                        </p>
                        <p className="text-muted mb-0">
                          <small>
                            📅 {new Date(group.createdAt).toLocaleDateString()}
                          </small>
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={function() {
                          handleDeleteGroup(group._id, group.name);
                        }}
                        title="Delete Group"
                      >
                        Delete
                      </button>

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

export default Groups;