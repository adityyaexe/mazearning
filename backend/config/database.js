// backend/config/database.js
const mongoose = require('mongoose');
require('dotenv').config();
const util = require('util');

/**
 * Connects to MongoDB using Mongoose.
 * @async
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  // Connection options
  const connOptions = {
    useNewUrlParser: true,         // Use new URL parser
    useUnifiedTopology: true,      // Use new server discovery and monitoring engine
  };

  try {
    // Disable buffering for faster queries
    mongoose.set('bufferCommands', false);
    // Allow mongoose to buffer initial model queries
    mongoose.set('bufferTimeoutMS', 30000);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, connOptions);

    console.log('✅ MongoDB connected successfully.');

    // Optional: Enable advanced logging (debug)
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, methodName, query, doc) => {
        // Don't log queries with passwords (for security)
        if (query.passwordHash) query.passwordHash = '***';
        console.log('\x1b[35m%s\x1b[0m', // Purple for Mongoose debug
          `MongoDB: ${collectionName}.${methodName}(${util.inspect(query, { depth: null, colors: true })})`);
      });
    }

    // Log connection events (optional)
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connection established to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose connection lost');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      await mongoose.connection.close(true);
      console.log('Mongoose connection closed through app termination.');
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ MongoDB connection failed!', err.message);
    // Give system time to flush logs (optional, but often helpful)
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(1);
  }
};

module.exports = connectDB;
