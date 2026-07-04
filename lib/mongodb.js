import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ai_memory';

if (!uri) throw new Error('MONGO_URL is not set');

let cached = global._mongoClient;
if (!cached) {
  const client = new MongoClient(uri, {});
  cached = global._mongoClient = { client, promise: client.connect() };
}

export async function getDb() {
  await cached.promise;
  return cached.client.db(dbName);
}

export async function ensureIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {}),
    db.collection('users').createIndex({ user_id: 1 }).catch(() => {}),
    db.collection('user_sessions').createIndex({ session_token: 1 }).catch(() => {}),
    db.collection('memory_packages').createIndex({ user_id: 1, created_at: -1 }).catch(() => {}),
    db.collection('memory_packages').createIndex({ share_id: 1 }).catch(() => {}),
    db.collection('handoff_chats').createIndex({ user_id: 1, package_id: 1, updated_at: -1 }).catch(() => {}),
  ]);
}
ensureIndexes().catch((e) => console.error('Index setup failed:', e));
