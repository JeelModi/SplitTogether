// backend/routes/auth.js
const { sendResponse, getRequestBody } = require('../helpers/response');
const { getDB }  = require('../db');
const bcrypt     = require('bcryptjs');

function authRoutes(req, res, pathname) {

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    getRequestBody(req, function(err, body) {
      if (err) {
        sendResponse(res, 400, { error: 'Invalid request body' });
        return;
      }

      const { name, email, password } = body;

      if (!name || !name.trim()) {
        sendResponse(res, 400, { error: 'Name is required' });
        return;
      }
      if (!email || !email.trim()) {
        sendResponse(res, 400, { error: 'Email is required' });
        return;
      }
      // Basic email format check
      if (!email.includes('@') || !email.includes('.')) {
        sendResponse(res, 400, { error: 'Invalid email format' });
        return;
      }
      if (!password || password.length < 6) {
        sendResponse(res, 400, { error: 'Password must be at least 6 characters' });
        return;
      }

      const db = getDB();
      const usersCollection = db.collection('users');

      usersCollection.findOne({ email: email.toLowerCase().trim() })
        .then(function(existingUser) {
          if (existingUser) {
            sendResponse(res, 400, { error: 'Email already registered' });
            return null;
          }

          const salt           = bcrypt.genSaltSync(10);
          const hashedPassword = bcrypt.hashSync(password, salt);

          const newUser = {
            name:      name.trim(),
            email:     email.toLowerCase().trim(),
            password:  hashedPassword,
            createdAt: new Date()
          };

          return usersCollection.insertOne(newUser);
        })
        .then(function(result) {
          if (!result) return;
          sendResponse(res, 201, {
            message: '✅ Registered successfully!',
            userId:  result.insertedId
          });
        })
        .catch(function(err) {
          console.error('Register error:', err.message);
          sendResponse(res, 500, { error: 'Server error during registration' });
        });
    });
    return true;
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    getRequestBody(req, function(err, body) {
      if (err) {
        sendResponse(res, 400, { error: 'Invalid request body' });
        return;
      }

      const { email, password } = body;

      if (!email || !password) {
        sendResponse(res, 400, { error: 'Email and password are required' });
        return;
      }

      const db = getDB();
      const usersCollection = db.collection('users');

      usersCollection.findOne({ email: email.toLowerCase().trim() })
        .then(function(user) {
          if (!user) {
            sendResponse(res, 400, { error: 'Invalid email or password' });
            return;
          }

          const isMatch = bcrypt.compareSync(password, user.password);
          if (!isMatch) {
            sendResponse(res, 400, { error: 'Invalid email or password' });
            return;
          }

          sendResponse(res, 200, {
            message: '✅ Login successful!',
            user: {
              id:    user._id.toString(),
              name:  user.name,
              email: user.email
            }
          });
        })
        .catch(function(err) {
          console.error('Login error:', err.message);
          sendResponse(res, 500, { error: 'Server error during login' });
        });
    });
    return true;
  }

  return false;
}

module.exports = authRoutes;