// backend/db.js
const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME   = 'splittogether';

let db     = null;
let client = null;

function connectDB(callback) {
  if (db) {
    callback(null, db);
    return;
  }

  console.log('🔌 Connecting to MongoDB...');

  MongoClient.connect(MONGO_URL)
    .then(function(c) {
      client = c;
      db     = client.db(DB_NAME);
      console.log('✅ MongoDB connected! Database:', DB_NAME);

      // Handle unexpected disconnection
      client.on('close', function() {
        console.warn('⚠️  MongoDB connection closed.');
        db = null;
      });

      callback(null, db);
    })
    .catch(function(err) {
      console.error('❌ MongoDB connection failed:', err.message);
      callback(err, null);
    });
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first!');
  }
  return db;
}

module.exports = { connectDB, getDB };