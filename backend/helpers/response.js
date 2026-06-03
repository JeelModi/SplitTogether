// backend/helpers/response.js

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function getRequestBody(req, callback) {
  let body = '';

  req.on('data', function(chunk) {
    // Prevent extremely large payloads (basic security)
    if (body.length > 1e6) {
      req.destroy();
      callback(new Error('Request body too large'), null);
      return;
    }
    body += chunk.toString();
  });

  req.on('end', function() {
    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(null, parsed);
    } catch (err) {
      callback(new Error('Invalid JSON format'), null);
    }
  });

  req.on('error', function(err) {
    callback(err, null);
  });
}

module.exports = { sendResponse, getRequestBody };