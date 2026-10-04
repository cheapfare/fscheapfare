import { MongoClient } from 'mongodb';

const DEFAULT_URI = 'mongodb+srv://fscheapfare_db_user:ybeMQU3wr17PhQPK@fscheapfare.flu7jwt.mongodb.net/?retryWrites=true&w=majority&appName=FScheapfare';
const uri = process.env.MONGODB_URI || DEFAULT_URI;

let client = null;
let clientPromise = null;
let isConnected = false;

// Global cache for serverless environments (prevents connection exhaustion)
if (!global._mongoClientPromise && uri) {
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000
    });
    global._mongoClientPromise = client.connect()
      .then(c => {
        isConnected = true;
        console.log('[MongoDB] Connected successfully to Atlas cluster.');
        return c;
      })
      .catch(err => {
        console.warn('[MongoDB] Connection warning (will fallback to local store):', err.message);
        return null;
      });
  } catch (err) {
    console.warn('[MongoDB] Initialization error:', err.message);
  }
}

clientPromise = global._mongoClientPromise;

export async function getDb() {
  try {
    if (!clientPromise) return null;
    const connectedClient = await clientPromise;
    if (!connectedClient) return null;
    return connectedClient.db('fscheapfare');
  } catch (err) {
    console.warn('[MongoDB getDb Error]:', err.message);
    return null;
  }
}

export function isMongoConnected() {
  return isConnected;
}

export default {
  getDb,
  isMongoConnected
};
