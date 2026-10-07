const mongoose = require('mongoose');

let memoryServer = null;
let isInMemoryStore = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/usermanagement';
  const useMemory = process.env.USE_MEMORY_DB || 'auto';

  if (useMemory === 'true') {
    return await connectMemoryDB();
  }

  try {
    console.log(`📡 Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ Connected to MongoDB successfully via Mongoose.');
    isInMemoryStore = false;
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB URI not reachable (${error.message}).`);
    await connectMemoryDB();
  }
};

const connectMemoryDB = async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const mongoUri = memoryServer.getUri();

    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to In-Memory MongoDB at: ${mongoUri}`);
    isInMemoryStore = false;
    return mongoUri;
  } catch (err) {
    console.warn(`⚠️ In-Memory Mongo Binary unavailable (${err.message}). Using High-Performance Memory Storage Driver.`);
    isInMemoryStore = true;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
};

const getIsInMemoryStore = () => isInMemoryStore;

module.exports = { connectDB, disconnectDB, getIsInMemoryStore };
