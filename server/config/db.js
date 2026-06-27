import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let mongod;
let connectionPromise = null;

const connectDB = async () => {
  // If a MongoDB URI is explicitly provided, connect directly (used in tests and production)
  if (process.env.MONGODB_URI) {
    console.log('Connecting to MongoDB via provided URI');
    return mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
    });
  }

  // For test environment without explicit URI, fallback to MONGO_URI_TEST
  if (process.env.NODE_ENV === 'test') {
    const mongoURI = process.env.MONGO_URI_TEST;
    if (!mongoURI) {
      throw new Error('MONGO_URI_TEST is not defined for test environment');
    }
    console.log('Connecting to MongoDB (test env)');
    return mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
    });
  }

  // Non-test environment: attempt in-memory MongoDB first
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      console.log('Connecting to MongoDB...');
      // Prefer in-memory MongoDB for development/testing when possible
      if (process.env.NODE_ENV !== 'production') {
        try {
          if (!mongod) {
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            mongod = await MongoMemoryServer.create({
              instance: { launchTimeoutMS: 90000 },
              binary: { resourceTimeout: 90000 },
            });
          }
          const uri = mongod.getUri();
          console.log('Using in-memory MongoDB for tests:', uri);
          await new Promise(resolve => setTimeout(resolve, 2000));
          mongoose.set('bufferTimeoutMS', 60000);
          const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 60000,
            connectTimeoutMS: 60000,
          });
          return conn;
        } catch (inmemErr) {
          console.warn('Failed to start in-memory MongoDB, falling back to MONGODB_URI. Error:', inmemErr.message || inmemErr);
        }
      }

      const mongoURI = process.env.MONGODB_URI;
      if (!mongoURI) {
        throw new Error('MONGODB_URI is not defined in your environment variables.');
      }
      console.log('Connecting to MongoDB Atlas/Local...');
      mongoose.set('bufferTimeoutMS', 60000);
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 60000,
        connectTimeoutMS: 60000,
      });
      await mongoose.connection.db.admin().ping();
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error('MongoDB connection error:', err);
      connectionPromise = null;
      if (process.env.NODE_ENV === 'development') {
        console.warn('Running in development mode without database connection.');
        return null;
      }
      process.exit(1);
    }
  })();

  return connectionPromise;
};

export default connectDB;

export async function stopInMemoryMongo() {
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  connectionPromise = null;
}
