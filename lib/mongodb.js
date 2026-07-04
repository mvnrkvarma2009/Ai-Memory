import { MongoClient } from 'mongodb';

// Lazy singleton \u2014 do NOT read env vars at module load time.
// Vercel imports every route during `next build` to collect page data,
// so throwing here (or attempting to connect) will kill the build.
let cached = global._mongoClient;

async function connect() {
  if (cached && cached.db) return cached;

  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL is not set');
  const dbName = process.env.DB_NAME || 'ai_memory';

  if (!cached) {
    const client = new MongoClient(uri, {});
    const promise = client.connect();
    cached = global._mongoClient = { client, promise, db: null };
  }
  const conn = await cached.promise;
  cached.db = conn.db(dbName);

  // Fire-and-forget index setup on first successful connection only.
  if (!cached.indexed) {
    cached.indexed = true;
    ensureIndexes(cached.db).catch((e) => console.error('Index setup failed:', e));
  }
  return cached;
}

export async function getDb() {
  const { db } = await connect();
  return db;
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {}),
    db.collection('users').createIndex({ user_id: 1 }).catch(() => {}),
    db.collection('user_sessions').createIndex({ session_token: 1 }).catch(() => {}),
    db.collection('memory_packages').createIndex({ user_id: 1, created_at: -1 }).catch(() => {}),
    db.collection('memory_packages').createIndex({ share_id: 1 }).catch(() => {}),
    db.collection('handoff_chats').createIndex({ user_id: 1, package_id: 1, updated_at: -1 }).catch(() => {}),
  ]);
}
