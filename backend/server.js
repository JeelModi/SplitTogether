// backend/server.js
const http = require('http');
const url  = require('url');

const { sendResponse }  = require('./helpers/response');
const { connectDB }     = require('./db');
const authRoutes        = require('./routes/auth');
const groupRoutes       = require('./routes/groups');
const expenseRoutes     = require('./routes/expenses');

const PORT = 5000;
const HOST = 'localhost';

function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname  = parsedUrl.pathname;
  const method    = req.method;

  console.log(`➡️  [${method}] ${pathname}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    sendResponse(res, 200, {});
    return;
  }

  // Health check
  if (pathname === '/' && method === 'GET') {
    sendResponse(res, 200, {
      message: '✅ SplitTogether backend is running!',
      version: '1.0.0'
    });
    return;
  }

  // Route delegation with try-catch for unexpected errors
  try {
    if (pathname.startsWith('/api/auth')) {
      const handled = authRoutes(req, res, pathname);
      if (!handled) sendResponse(res, 404, { error: 'Auth route not found' });
      return;
    }

    if (pathname.startsWith('/api/groups')) {
      const handled = groupRoutes(req, res, pathname);
      if (!handled) sendResponse(res, 404, { error: 'Group route not found' });
      return;
    }

    if (pathname.startsWith('/api/expenses')) {
      const handled = expenseRoutes(req, res, pathname);
      if (!handled) sendResponse(res, 404, { error: 'Expense route not found' });
      return;
    }

    sendResponse(res, 404, { error: `Cannot ${method} ${pathname}` });

  } catch (err) {
    console.error('❌ Unhandled server error:', err.message);
    sendResponse(res, 500, { error: 'Internal server error' });
  }
}

// Connect DB first, then start server
connectDB(function(err, db) {
  if (err) {
    console.error('❌ Could not connect to MongoDB. Exiting.');
    process.exit(1);
    return;
  }

  const server = http.createServer(requestHandler);

  server.listen(PORT, HOST, function() {
    console.log('');
    console.log('🚀 ================================');
    console.log(`   SplitTogether Backend`);
    console.log(`   http://${HOST}:${PORT}`);
    console.log('   MongoDB: ✅ Connected');
    console.log('================================');
    console.log('');
  });

  server.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Kill the other process first.`);
    } else {
      console.error('❌ Server error:', err.message);
    }
  });

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', function() {
    console.log('\n🛑 Shutting down server...');
    server.close(function() {
      console.log('✅ Server closed.');
      process.exit(0);
    });
  });
});
