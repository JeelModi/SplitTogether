// frontend/src/components/Login.js
import React, { useState } from 'react';

function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage]   = useState('');
  const [msgType, setMsgType]   = useState('');
  const [loading, setLoading]   = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setMessage('Email and password are required!');
      setMsgType('danger');
      setLoading(false);
      return;
    }

    fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setLoading(false);
        if (data.error) {
          setMessage(data.error);
          setMsgType('danger');
        } else {
          localStorage.setItem('splituser', JSON.stringify(data.user));
          setMessage('Login successful!');
          setMsgType('success');
          setTimeout(function() { onLoginSuccess(data.user); }, 800);
        }
      })
      .catch(function() {
        setLoading(false);
        setMessage('❌ Cannot connect to server. Is backend running?');
        setMsgType('danger');
      });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 16px' }}>

        {/* Logo */}
        <div className="text-center mb-4">
          <h1
            className="fw-bold text-white"
            style={{ fontFamily: 'Montserrat Alternates', fontSize: '2.2rem' }}
          >
            SplitTogether
          </h1>
          <p className="text-white opacity-75">
            Split expenses with friends, effortlessly.
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-lg border-0">
          <div className="card-body p-4">

            <h5 className="fw-bold mb-4 text-center">Welcome Back</h5>

            {message && (
              <div className={`alert alert-${msgType} py-2`}>{message}</div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="mb-3">
                <label className="form-label fw-semibold text-muted">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control form-control-md"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-muted">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control form-control-md"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 btn-lg fw-semibold"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
              >
                {loading ? 'Logging in...' : 'Login →'}
              </button>

            </form>

            <hr className="my-4" />

            <div className="text-center">
              <span className="text-muted">Don't have an account? </span>
              <button
                className="btn btn-link p-0 fw-semibold"
                onClick={onSwitchToRegister}
              >
                Register here
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;