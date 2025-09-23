import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
let mongod;

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
      // Prefer in-memory MongoDB for tests, but if downloading binaries fails
      // (common on some CI/Windows setups), fall back to MONGODB_URI.
        try {
          // mongodb-memory-server has known binary spawn/download issues on Windows
          if (process.platform === 'win32') {
            console.warn('Skipping in-memory MongoDB on Windows; falling back to MONGODB_URI');
            throw new Error('in-memory not supported on win32');
          }
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log('Using in-memory MongoDB for tests:', uri);
        // Increase server selection timeout during tests
        mongoose.set('bufferTimeoutMS', 30000);
        const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
        // No admin ping for in-memory server
        return conn;
      } catch (inmemErr) {
        console.warn('Failed to start in-memory MongoDB, falling back to MONGODB_URI. Error:', inmemErr.message || inmemErr);
        // continue to attempt connecting to MONGODB_URI below
      }
    }

    console.log('MongoDB URI:', process.env.MONGODB_URI);

  mongoose.set('bufferTimeoutMS', 30000);
  const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myconvertertool', { serverSelectionTimeoutMS: 30000 });

  // Test the connection
  await mongoose.connection.db.admin().ping();
  console.log(`MongoDB Connected: ${conn.connection.host}`);

  // Log the available collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Available collections:', collections.map(c => c.name));
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // During tests, avoid exiting the process so Jest can handle the error and report failures.
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
      throw err;
    }
    process.exit(1);
  }
};

export default connectDB;

export async function stopInMemoryMongo() {
  if (mongod) {
    await mongod.stop();
  }
}